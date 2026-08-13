import "server-only"

import fs from "node:fs"
import path from "node:path"

import type {
  CatalogDefinition,
  CatalogKind,
  CatalogRecord,
  CatalogRecipe,
} from "@/lib/catalog-types"
import { getChapters } from "@/lib/wiki"

const sourceRoot = path.join(
  process.cwd(),
  "..",
  "decompile-src",
  "assets",
  "guzhenren"
)
const langPath = path.join(sourceRoot, "lang", "en_us.json")
const modelRoot = path.join(sourceRoot, "models", "item")
const textureRoot = path.join(sourceRoot, "textures")
const javaRoot = path.join(process.cwd(), "..", "decompile-src", "net", "guzhenren")
const entitySourceRoot = path.join(javaRoot, "entity")
const effectSourceRoot = path.join(javaRoot, "potion")
const entityRegistryPath = path.join(javaRoot, "init", "GuzhenrenModEntities.java")
const generatedCatalogPath = path.join(process.cwd(), "data", "catalog.generated.json")

export const catalogDefinitions: Record<CatalogKind, CatalogDefinition> = {
  gu: {
    kind: "gu",
    title: "Bách khoa Cổ trùng",
    shortTitle: "Cổ trùng",
    description:
      "Thông tin từng con Cổ, phẩm cấp, lưu phái, công dụng, thức ăn và Cổ phương liên quan.",
  },
  "killer-moves": {
    kind: "killer-moves",
    title: "Sát chiêu",
    shortTitle: "Sát chiêu",
    description:
      "Danh mục Sát chiêu, Cổ quyển và sơ đồ đặt từng Cổ trùng vào đúng ô.",
  },
  equipment: {
    kind: "equipment",
    title: "Trang bị & bộ giáp",
    shortTitle: "Trang bị",
    description:
      "Tra cứu vị trí mặc, hệ số độ bền và class của từng mảnh trang bị.",
  },
  effects: {
    kind: "effects",
    title: "Hiệu ứng trạng thái",
    shortTitle: "Hiệu ứng",
    description:
      "347 buff, debuff, hồi chiêu và hiệu ứng nội bộ đã đăng ký trong mod.",
  },
  creatures: {
    kind: "creatures",
    title: "Sinh vật & nơi xuất hiện",
    shortTitle: "Sinh vật",
    description:
      "Tên thực thể, biome, trọng số và kích thước đàn lấy từ biome modifier.",
  },
}

let langCache: Record<string, string> | undefined
const catalogCache = new Map<CatalogKind, CatalogRecord[]>()
let generatedCatalogCache: Partial<Record<CatalogKind, CatalogRecord[]>> | undefined
const imageCache = new Map<string, string | undefined>()
let looseModelIndex: Map<string, string> | undefined
let localizedItemIndex: Array<[string, string]> | undefined
let generatedItemImageById: Map<string, string> | undefined
let generatedItemImagesByName: Array<[string, string]> | undefined
const generatedDisplayImageCache = new Map<string, string | undefined>()

function getLang() {
  langCache ??= JSON.parse(fs.readFileSync(langPath, "utf8")) as Record<
    string,
    string
  >
  return langCache
}

function clean(value = "") {
  return value
    .replace(/§[0-9a-fk-or]/gi, "")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/[`*]/g, "")
    .trim()
}

function normalize(value: string) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
}

function itemDescriptions(id: string) {
  const lang = getLang()
  const prefix = `item.guzhenren.${id}.description_`
  return Object.entries(lang)
    .filter(([key]) => key.startsWith(prefix))
    .sort(
      ([a], [b]) =>
        Number(a.slice(prefix.length)) - Number(b.slice(prefix.length))
    )
    .map(([, value]) => clean(value))
    .filter(Boolean)
}

function publicTexturePath(texture: string) {
  const match = texture.match(
    /^guzhenren:(item|mob_effect|entities|entity)\/(.+)$/
  )
  if (!match) return undefined
  const [, folder, relative] = match
  const diskPath = path.join(textureRoot, folder, `${relative}.png`)
  if (!fs.existsSync(diskPath)) return undefined
  return `/mod-assets/catalog/${folder}/${relative.replaceAll("\\", "/")}.png`
}

function resolveItemImage(id: string, depth = 0): string | undefined {
  if (imageCache.has(id)) return imageCache.get(id)
  if (depth > 3) return undefined

  const modelPath = path.join(modelRoot, `${id}.json`)
  if (!fs.existsSync(modelPath)) {
    imageCache.set(id, undefined)
    return undefined
  }

  try {
    const model = JSON.parse(fs.readFileSync(modelPath, "utf8")) as {
      parent?: string
      textures?: Record<string, string>
    }
    const texture = model.textures?.layer0 ?? model.textures?.particle
    const image = texture ? publicTexturePath(texture) : undefined
    if (image) {
      imageCache.set(id, image)
      return image
    }
    const parent = model.parent?.match(/^guzhenren:item\/(.+)$/)?.[1]
    const inherited = parent ? resolveItemImage(parent, depth + 1) : undefined
    imageCache.set(id, inherited)
    return inherited
  } catch {
    imageCache.set(id, undefined)
    return undefined
  }
}

export function resolveLooseItemImage(identifier: string, displayText = "") {
  const directId = identifier.replace(/^guzhenren:/, "")
  const generatedGu = generatedCatalogCache?.gu ?? []
  if (generatedGu.length && !generatedItemImageById) {
    generatedItemImageById = new Map(
      generatedGu.flatMap((item) =>
        item.image ? [[normalize(item.id), item.image] as [string, string]] : []
      )
    )
    generatedItemImagesByName = generatedGu
      .flatMap((item) =>
        item.image ? [[normalize(item.name), item.image] as [string, string]] : []
      )
      .filter(([name]) => name.length >= 6)
      .sort((a, b) => b[0].length - a[0].length)
  }

  const generatedDirect = generatedItemImageById?.get(normalize(directId))
  if (generatedDirect) return generatedDirect

  if (displayText) {
    const normalizedText = normalize(displayText)
    if (generatedDisplayImageCache.has(normalizedText))
      return generatedDisplayImageCache.get(normalizedText)
    const generatedLocalized = generatedItemImagesByName?.find(([name]) =>
      normalizedText.includes(name)
    )?.[1]
    if (generatedLocalized) {
      generatedDisplayImageCache.set(normalizedText, generatedLocalized)
      return generatedLocalized
    }
  }

  if (!fs.existsSync(modelRoot)) {
    if (displayText)
      generatedDisplayImageCache.set(normalize(displayText), undefined)
    return undefined
  }

  const direct = resolveItemImage(directId)
  if (direct) return direct

  looseModelIndex ??= new Map(
    fs
      .readdirSync(modelRoot)
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.slice(0, -5))
      .map((id) => [normalize(id), id])
  )
  const modelId = looseModelIndex.get(normalize(directId))
  if (modelId) {
    const image = resolveItemImage(modelId)
    if (image) return image
  }

  if (!displayText) return undefined
  localizedItemIndex ??= Object.entries(getLang())
    .map(([key, value]) => {
      const id = key.match(/^item\.guzhenren\.([^.]+)$/)?.[1]
      return id ? ([normalize(value), id] as [string, string]) : undefined
    })
    .filter((item): item is [string, string] => Boolean(item?.[0]))
    .sort((a, b) => b[0].length - a[0].length)

  const normalizedText = normalize(displayText)
  const localizedId = localizedItemIndex.find(
    ([name]) => name.length >= 6 && normalizedText.includes(name)
  )?.[1]
  return localizedId ? resolveItemImage(localizedId) : undefined
}

function splitTableRow(line: string) {
  return line.replace(/^\|/, "").replace(/\|$/, "").split("|").map(clean)
}

function markdownTable(chapterTitle: string, headerIncludes: string) {
  const chapter = getChapters().find((item) => item.title === chapterTitle)
  if (!chapter) return [] as string[][]
  const start = chapter.content.findIndex(
    (line) => line.startsWith("|") && line.includes(headerIncludes)
  )
  if (start < 0) return [] as string[][]
  const rows: string[][] = []
  for (let index = start + 2; index < chapter.content.length; index += 1) {
    const line = chapter.content[index]
    if (!line.startsWith("|")) break
    rows.push(splitTableRow(line))
  }
  return rows
}

function readSource(filePath: string) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : ""
}

function formatStat(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(3)))
}

function effectSourceDetails(implementation: string) {
  const source = readSource(path.join(effectSourceRoot, `${implementation}.java`))
  const category = source.match(/MobEffectCategory\.([A-Z_]+)/)?.[1] ?? "NEUTRAL"
  const categoryLabel = {
    BENEFICIAL: "Có lợi",
    HARMFUL: "Có hại",
    NEUTRAL: "Trung tính",
  }[category] ?? "Trung tính"
  const procedures = [...source.matchAll(/net\.guzhenren\.procedures\.([A-Za-z0-9_]+)Procedure/g)]
    .map((match) => match[1])
    .filter((name, index, all) => all.indexOf(name) === index)
  const appliesEveryTick = /shouldApplyEffectTickThisTick[\s\S]*?return true;/.test(source)
  const modifierMatches = [...source.matchAll(
    /addAttributeModifier\(Attributes\.([A-Z_]+),[\s\S]*?,\s*(-?[\d.]+),\s*AttributeModifier\.Operation\.([A-Z_]+)/g
  )]
  const modifiers = modifierMatches.map((match) => ({
    attribute: match[1],
    value: Number(match[2]),
    operation: match[3],
  }))
  return { categoryLabel, procedures, appliesEveryTick, modifiers, hasSource: Boolean(source) }
}

const effectAttributeLabels: Record<string, string> = {
  MAX_HEALTH: "máu tối đa",
  ARMOR: "giáp",
  ATTACK_DAMAGE: "sát thương",
  ATTACK_SPEED: "tốc độ đánh",
  MOVEMENT_SPEED: "tốc độ di chuyển",
  KNOCKBACK_RESISTANCE: "kháng hất văng",
  LUCK: "may mắn",
}

function effectMechanicDescription(implementation: string) {
  const mechanics = effectSourceDetails(implementation)
  const details: string[] = []
  if (mechanics.appliesEveryTick) {
    details.push("Logic của hiệu ứng được chạy ở mỗi tick khi trạng thái còn thời gian.")
  }
  if (mechanics.modifiers.length) {
    details.push(
      `Trực tiếp thay đổi ${mechanics.modifiers.map((modifier) => {
        const label = effectAttributeLabels[modifier.attribute] ?? modifier.attribute.toLowerCase()
        const sign = modifier.value > 0 ? "+" : ""
        return `${label} ${sign}${formatStat(modifier.value)} (${modifier.operation.toLowerCase()})`
      }).join(", ")}.`
    )
  }
  if (mechanics.procedures.length) {
    details.push(
      `Tác dụng thực tế được xử lý bởi ${mechanics.procedures.length} procedure của mod${mechanics.appliesEveryTick ? " trong lúc hiệu ứng hoạt động" : " khi hiệu ứng được kích hoạt"}.`
    )
  }
  if (!details.length) {
    details.push(
      "Class hiệu ứng không tự gây sát thương hay đổi chỉ số; nó đóng vai trò cờ trạng thái để kỹ năng và procedure khác của mod kiểm tra."
    )
  }
  return { ...mechanics, details }
}

type EntitySourceInfo = { className: string; mobCategory: string }
let entitySourceIndex: Map<string, EntitySourceInfo> | undefined

function getEntitySourceIndex() {
  if (entitySourceIndex) return entitySourceIndex
  entitySourceIndex = new Map()
  const registry = readSource(entityRegistryPath)
  const pattern = /register\("([^"]+)",\s*EntityType\.Builder\.of\(([A-Za-z0-9_]+)::new,\s*\(MobCategory\)MobCategory\.([A-Z_]+)/g
  for (const match of registry.matchAll(pattern)) {
    entitySourceIndex.set(match[1], { className: match[2], mobCategory: match[3] })
  }
  return entitySourceIndex
}

const entityAttributeLabels: Record<string, string> = {
  MAX_HEALTH: "Máu tối đa",
  ATTACK_DAMAGE: "Sát thương",
  ARMOR: "Giáp",
  ARMOR_TOUGHNESS: "Độ cứng giáp",
  MOVEMENT_SPEED: "Tốc độ di chuyển",
  FOLLOW_RANGE: "Tầm phát hiện",
  KNOCKBACK_RESISTANCE: "Kháng hất văng",
  ATTACK_KNOCKBACK: "Lực hất văng",
  ATTACK_SPEED: "Tốc độ đánh",
  FLYING_SPEED: "Tốc độ bay",
  STEP_HEIGHT: "Độ cao bước",
}

function entitySourceDetails(id: string) {
  const definition = getEntitySourceIndex().get(id)
  if (!definition) return undefined
  const source = readSource(path.join(entitySourceRoot, `${definition.className}.java`))
  const stats = new Map<string, number>()
  for (const match of source.matchAll(/Attributes\.([A-Z_]+),\s*(-?[\d.]+)/g)) {
    if (!stats.has(match[1])) stats.set(match[1], Number(match[2]))
  }
  const goals = new Set([...source.matchAll(/new\s+([A-Za-z0-9_]+Goal)\s*\(/g)].map((match) => match[1]))
  const behaviors: string[] = []
  if (goals.has("MeleeAttackGoal")) behaviors.push("chiến đấu cận chiến")
  if (goals.has("RangedAttackGoal")) behaviors.push("tấn công tầm xa")
  if (goals.has("NearestAttackableTargetGoal")) behaviors.push("chủ động chọn mục tiêu gần")
  if (goals.has("FollowOwnerGoal")) behaviors.push("đi theo chủ sau khi thuần hóa")
  if (goals.has("RandomStrollGoal") || goals.has("WaterAvoidingRandomStrollGoal")) behaviors.push("đi lang thang")
  if (goals.has("PanicGoal")) behaviors.push("bỏ chạy khi gặp nguy hiểm")
  if (goals.has("FloatGoal")) behaviors.push("có thể nổi khi ở trong nước")
  const typeLabel = {
    MONSTER: "sinh vật thù địch",
    CREATURE: "sinh vật tự nhiên",
    AMBIENT: "sinh vật môi trường",
    WATER_CREATURE: "sinh vật dưới nước",
    WATER_AMBIENT: "sinh vật nước nhỏ",
    MISC: "thực thể đặc biệt",
  }[definition.mobCategory] ?? "sinh vật"
  return { definition, stats, behaviors, typeLabel }
}

function getRecipes(): CatalogRecipe[] {
  const lang = getLang()
  return Object.entries(lang)
    .filter(
      ([key, value]) =>
        /^item\.guzhenren\.[^.]+$/.test(key) &&
        /Cổ Phương/i.test(value) &&
        !/Tàn Phương/i.test(value)
    )
    .map(([key, name]) => {
      const id = key.slice("item.guzhenren.".length)
      const lines = itemDescriptions(id)
      return {
        id,
        name: clean(name),
        summary: lines[0] ?? "Cổ phương hoàn chỉnh",
        ingredients: lines
          .slice(1)
          .filter((line) => !/^Vật liệu cần thiết:?$/i.test(line)),
      }
    })
    .filter((recipe) => recipe.ingredients.length > 0)
}

function guCatalog(): CatalogRecord[] {
  const lang = getLang()
  const recipes = getRecipes()
  return Object.entries(lang)
    .filter(([key, value]) => {
      if (!/^item\.guzhenren\.[^.]+$/.test(key) || !/Cổ$/i.test(value))
        return false
      if (
        /(Chưa luyện hóa|Cổ Phương|Tàn Phương|Cổ quyển|Cổ tài|Cổ sư)/i.test(
          value
        )
      )
        return false
      return Boolean(lang[`${key}.description_0`])
    })
    .map<CatalogRecord>(([key, rawName]) => {
      const id = key.slice("item.guzhenren.".length)
      const lines = itemDescriptions(id)
      const rankLine = lines.find((line) => /chuyển số:/i.test(line))
      const pathLine = lines.find((line) => /lưu phái:/i.test(line))
      const foodLine = lines.find((line) => /thức ăn:/i.test(line))
      const rank = rankLine?.replace(/^.*chuyển số:\s*/i, "")
      const school =
        pathLine?.replace(/^.*lưu phái:\s*/i, "") ?? "Chưa phân loại"
      const details = lines.filter(
        (line) => line !== rankLine && line !== pathLine && line !== foodLine
      )
      const usage = details
        .find((line) => /công dụng:/i.test(line))
        ?.replace(/^.*công dụng:\s*/i, "")
      const nameKey = normalize(rawName)
      const matchedRecipes = recipes.filter((recipe) => {
        if (
          recipe.id.startsWith(id) ||
          id.startsWith(recipe.id.replace(/(?:_?gu)?_?gu_?fang$/i, ""))
        )
          return true
        return (
          nameKey.length > 4 &&
          normalize(`${recipe.name} ${recipe.summary}`).includes(nameKey)
        )
      })
      return {
        kind: "gu" as const,
        id,
        name: clean(rawName),
        image: resolveItemImage(id),
        category: school,
        rank,
        summary: usage ?? details[0] ?? "Cổ trùng đã đăng ký trong mod.",
        attributes: [
          ["ID", `guzhenren:${id}`],
          ["Chuyển số", rank ?? "Không ghi rõ"],
          ["Lưu phái", school],
          [
            "Thức ăn",
            foodLine?.replace(/^.*thức ăn:\s*/i, "") ?? "Không ghi rõ",
          ],
        ],
        details,
        recipes: matchedRecipes.slice(0, 16),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, "vi"))
}

function killerMoveCatalog(): CatalogRecord[] {
  const rows = markdownTable("sat-chieu-catalog.md", "Cổ quyển ID")
  const positionRows = markdownTable("sat-chieu-vi-tri.md", "Ô 11: Cổ quyển")
  const dictionary = new Map(
    markdownTable("sat-chieu-vi-tri.md", "Tên trong game").map((row) => [
      row[0],
      row[1],
    ])
  )

  return rows.map(([name, rawId, inGameName, tooltip]) => {
    const id = rawId.replace(/^guzhenren:/, "")
    const positions = positionRows.find(
      (row) => normalize(row[0]) === normalize(name)
    )
    const slots = (positions?.slice(2, 12) ?? [])
      .map((itemId, index) => ({
        position: String(index + 1),
        itemId,
        itemName: dictionary.get(itemId) ?? itemId,
      }))
      .filter((slot) => slot.itemId && slot.itemId !== "—")
    const category = inGameName.match(/^(.+?đạo)/i)?.[1] ?? "Sát chiêu"
    return {
      kind: "killer-moves",
      id,
      name,
      image: resolveItemImage(id),
      category,
      summary: tooltip || "Sát chiêu đã được code hỗ trợ.",
      attributes: [
        ["Cổ quyển", `guzhenren:${id}`],
        ["Tên trong game", inGameName],
        ["Số Cổ cần đặt", String(slots.length)],
      ],
      details: tooltip ? [tooltip] : [],
      slots,
    }
  })
}

function equipmentCatalog(): CatalogRecord[] {
  return markdownTable("equipment-sets.md", "Class/bộ").map(
    ([id, name, slot, itemClass, coefficient, durability]) => ({
      kind: "equipment",
      id,
      name,
      image: resolveItemImage(id),
      category: slot || "Khác",
      summary: `${itemClass || "Trang bị"} · độ bền ${durability || "không rõ"}`,
      attributes: [
        ["ID", `guzhenren:${id}`],
        ["Vị trí mặc", slot],
        ["Class / bộ", itemClass],
        ["Hệ số", coefficient],
        ["Độ bền", durability],
      ],
      details: [],
    })
  )
}

function effectCatalog(): CatalogRecord[] {
  const notes = new Map<string, string>()
  for (const header of ["Tên tiếng Việt", "Nguồn cổ", "Mô tả"]) {
    for (const row of markdownTable("mob-effects.md", header)) {
      if (row[0] && row.at(-1)) {
        for (const id of row[0].split("/").map((value) => value.trim())) {
          notes.set(id, row.at(-1)!)
        }
      }
    }
  }
  return markdownTable("mob-effects.md", "Class implementation").map(
    ([id, name, implementation]) => {
      const imagePath = path.join(textureRoot, "mob_effect", `${id}.png`)
      const mechanics = effectMechanicDescription(implementation)
      const note = notes.get(id)
      const mechanicSummary = mechanics.appliesEveryTick
        ? "Kích hoạt logic liên tục mỗi tick trong thời gian hiệu ứng tồn tại."
        : mechanics.modifiers.length
          ? mechanics.details[0]
          : "Được dùng làm trạng thái để các kỹ năng và procedure của mod nhận biết."
      return {
        kind: "effects",
        id,
        name,
        image: fs.existsSync(imagePath)
          ? `/mod-assets/catalog/mob_effect/${id}.png`
          : undefined,
        category: note?.includes("Cooldown")
          ? "Hồi chiêu"
          : mechanics.categoryLabel,
        summary: note ? `${note}. ${mechanicSummary}` : mechanicSummary,
        attributes: [
          ["ID", `guzhenren:${id}`],
          ["Loại", mechanics.categoryLabel],
          ["Tần suất", mechanics.appliesEveryTick ? "Mỗi tick" : "Theo sự kiện/kỹ năng"],
          ["Implementation", implementation],
        ],
        details: [
          ...(note ? [`Công dụng: ${note}.`] : []),
          ...mechanics.details,
          ...(mechanics.procedures.length
            ? [`Procedure liên quan: ${mechanics.procedures.join(", ")}.`]
            : []),
        ],
      }
    }
  )
}

function findEntityImage(id: string) {
  for (const folder of ["entities", "entity"] as const) {
    const direct = path.join(textureRoot, folder, `${id}.png`)
    if (fs.existsSync(direct)) return `/mod-assets/catalog/${folder}/${id}.png`
  }
  return undefined
}

function creatureCatalog(): CatalogRecord[] {
  const grouped = new Map<string, string[][]>()
  for (const row of markdownTable("bestiary-spawns.md", "Entity ID")) {
    const id = row[1].replace(/^guzhenren:/, "")
    grouped.set(id, [...(grouped.get(id) ?? []), row])
  }
  return [...grouped.entries()].map(([id, rows]) => {
    const [, entityId, name] = rows[0]
    const source = entitySourceDetails(id)
    const biomes = [
      ...new Set(
        rows.flatMap((row) => row[3].split(",").map((biome) => biome.trim()))
      ),
    ]
    const health = source?.stats.get("MAX_HEALTH")
    const damage = source?.stats.get("ATTACK_DAMAGE")
    const armor = source?.stats.get("ARMOR")
    const combatSummary = [
      health !== undefined ? `${formatStat(health)} HP` : undefined,
      damage !== undefined ? `${formatStat(damage)} sát thương` : undefined,
      armor !== undefined ? `${formatStat(armor)} giáp` : undefined,
    ].filter(Boolean).join(", ")
    const spawnSummary = `Xuất hiện tại ${biomes.slice(0, 3).join(", ")}${biomes.length > 3 ? ` và ${biomes.length - 3} biome khác` : ""}.`
    const statAttributes = source
      ? [...source.stats.entries()]
          .filter(([attribute]) => entityAttributeLabels[attribute])
          .map<[string, string]>(([attribute, value]) => [
            entityAttributeLabels[attribute],
            attribute === "MAX_HEALTH"
              ? `${formatStat(value)} HP (${formatStat(value / 2)} tim)`
              : formatStat(value),
          ])
      : []
    return {
      kind: "creatures",
      id,
      name,
      image: findEntityImage(id) ?? resolveItemImage(`${id}_spawn_egg`),
      category: biomes.includes("Mọi biome")
        ? "Mọi biome"
        : biomes[0] || "Chưa rõ",
      summary: `${source ? `${source.typeLabel.charAt(0).toUpperCase()}${source.typeLabel.slice(1)}` : "Sinh vật"}${combatSummary ? ` có ${combatSummary}` : ""}. ${spawnSummary}`,
      attributes: [
        ["Entity ID", entityId],
        ...(source ? [["Phân loại", source.typeLabel] as [string, string]] : []),
        ...statAttributes,
        ["Biome", biomes.join(", ")],
        ["Trọng số", [...new Set(rows.map((row) => row[4]))].join(", ")],
        ["Kích thước đàn", [...new Set(rows.map((row) => row[5]))].join(", ")],
      ],
      details: [
        ...(health !== undefined
          ? [`Chỉ số sinh tồn: ${formatStat(health)} HP, tương đương ${formatStat(health / 2)} tim Minecraft${armor !== undefined ? `; ${formatStat(armor)} điểm giáp` : ""}.`]
          : ["Source entity không khai báo MAX_HEALTH riêng; trò chơi dùng chỉ số kế thừa từ lớp cha."]),
        ...(source?.behaviors.length
          ? [`Hành vi AI: ${source.behaviors.join(", ")}.`]
          : ["Không tìm thấy goal AI tiêu chuẩn trong class entity; hành vi có thể do procedure riêng điều khiển."]),
        ...rows.map(
          (row) => `${row[3]} · trọng số ${row[4]} · đàn ${row[5]}`
        ),
      ],
    }
  })
}

export function getCatalogRecords(kind: CatalogKind) {
  if (process.env.REBUILD_CATALOG !== "1" && fs.existsSync(generatedCatalogPath)) {
    generatedCatalogCache ??= JSON.parse(fs.readFileSync(generatedCatalogPath, "utf8")) as Record<CatalogKind, CatalogRecord[]>
    return generatedCatalogCache[kind] ?? []
  }
  if (!catalogCache.has(kind)) {
    const records =
      kind === "gu"
        ? guCatalog()
        : kind === "killer-moves"
          ? killerMoveCatalog()
          : kind === "equipment"
            ? equipmentCatalog()
            : kind === "effects"
              ? effectCatalog()
              : creatureCatalog()
    catalogCache.set(kind, records)
  }
  return catalogCache.get(kind)!
}

export function getCatalogRecord(kind: CatalogKind, id: string) {
  return getCatalogRecords(kind).find((record) => record.id === id)
}
