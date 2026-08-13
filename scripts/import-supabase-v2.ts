import fs from "node:fs"
import path from "node:path"
import { createHash } from "node:crypto"
import { createClient } from "@supabase/supabase-js"

import type {
  CatalogKind,
  CatalogRecipe,
  CatalogRecord,
} from "../lib/catalog-types"

const url = process.env.SUPABASE_IMPORT_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error("Thiếu SUPABASE_IMPORT_URL hoặc SUPABASE_SERVICE_ROLE_KEY")
}

const client = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const catalogPath = path.join(process.cwd(), "data", "catalog.generated.json")
const wikiPath = path.join(process.cwd(), "..", "wiki", "minecraft-wiki.json")
const catalogSource = fs.readFileSync(catalogPath, "utf8")
const catalogs = JSON.parse(catalogSource) as Record<
  CatalogKind,
  CatalogRecord[]
>
const sourceVersion = createHash("sha256")
  .update(catalogSource)
  .digest("hex")
  .slice(0, 16)

type EntryIdRow = {
  id: number
  kind: CatalogKind
  source_id: string
}

type RecipeIdRow = {
  id: number
  source_id: string
}

async function loadAllEntryIds() {
  const rows: EntryIdRow[] = []
  const pageSize = 1000

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from("catalog_entries")
      .select("id,kind,source_id")
      .order("id")
      .range(from, from + pageSize - 1)
    if (error) throw error

    const page = (data ?? []) as EntryIdRow[]
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}

function chunks<T>(items: T[], size = 300) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size)
  )
}

async function insertChunks(table: string, rows: object[]) {
  for (const batch of chunks(rows)) {
    const { error } = await client.from(table).insert(batch)
    if (error) throw error
  }
}

async function upsertChunks(table: string, rows: object[], onConflict: string) {
  for (const batch of chunks(rows)) {
    const { error } = await client.from(table).upsert(batch, { onConflict })
    if (error) throw error
  }
}

async function deleteByIds(table: string, column: string, ids: number[]) {
  for (const batch of chunks(ids)) {
    const { error } = await client.from(table).delete().in(column, batch)
    if (error) throw error
  }
}

function recipeMatch(recipeId: string, entryId: string) {
  if (recipeId.startsWith(entryId)) {
    return { match_method: "source-id-prefix", confidence: 100 }
  }

  const recipeBase = recipeId.replace(/(?:_?gu)?_?gu_?fang$/i, "")
  if (entryId.startsWith(recipeBase)) {
    return { match_method: "source-id-prefix", confidence: 90 }
  }

  return { match_method: "name-heuristic", confidence: 50 }
}

const { data: run, error: runError } = await client
  .from("content_import_runs")
  .insert({
    source_name: "decompile-src + minecraft-wiki.json",
    source_version: sourceVersion,
    status: "running",
  })
  .select("id")
  .single()

if (runError) throw runError

try {
  const allRecords = Object.values(catalogs).flat()
  const entryRows = allRecords.map((record) => ({
    kind: record.kind,
    source_id: record.id,
    slug: record.id,
    name: record.name,
    image_path: record.image ?? null,
    category: record.category,
    rank: record.rank ?? null,
    summary: record.summary,
    attributes: record.attributes,
    details: record.details,
    is_published: true,
    published_at: new Date().toISOString(),
  }))
  await upsertChunks("catalog_entries", entryRows, "kind,source_id")

  const storedEntries = await loadAllEntryIds()

  const entryIds = new Map(
    storedEntries.map((entry) => [`${entry.kind}:${entry.source_id}`, entry.id])
  )
  const importedEntryIds = allRecords
    .map((record) => entryIds.get(`${record.kind}:${record.id}`))
    .filter((id): id is number => id !== undefined)

  await deleteByIds("catalog_entry_attributes", "entry_id", importedEntryIds)
  await deleteByIds("catalog_entry_sections", "entry_id", importedEntryIds)
  await deleteByIds("catalog_media", "entry_id", importedEntryIds)

  await insertChunks(
    "catalog_entry_attributes",
    allRecords.flatMap((record) => {
      const entryId = entryIds.get(`${record.kind}:${record.id}`)
      if (!entryId) return []
      return record.attributes.map(([label, value], sortOrder) => ({
        entry_id: entryId,
        label,
        value,
        sort_order: sortOrder,
      }))
    })
  )
  await insertChunks(
    "catalog_entry_sections",
    allRecords.flatMap((record) => {
      const entryId = entryIds.get(`${record.kind}:${record.id}`)
      if (!entryId) return []
      return record.details.map((body, sortOrder) => ({
        entry_id: entryId,
        heading: null,
        body,
        sort_order: sortOrder,
      }))
    })
  )
  await insertChunks(
    "catalog_media",
    allRecords.flatMap((record) => {
      const entryId = entryIds.get(`${record.kind}:${record.id}`)
      if (!entryId || !record.image) return []
      return [
        {
          entry_id: entryId,
          media_type: "image",
          path: record.image,
          alt_text: record.name,
          is_primary: true,
          sort_order: 0,
        },
      ]
    })
  )

  const uniqueRecipes = new Map<string, CatalogRecipe>()
  for (const record of catalogs.gu) {
    for (const recipe of record.recipes ?? []) {
      const existing = uniqueRecipes.get(recipe.id)
      if (existing && JSON.stringify(existing) !== JSON.stringify(recipe)) {
        throw new Error(`Cổ phương ${recipe.id} có nhiều nội dung khác nhau`)
      }
      uniqueRecipes.set(recipe.id, recipe)
    }
  }

  await upsertChunks(
    "recipes",
    [...uniqueRecipes.values()].map((recipe) => ({
      source_id: recipe.id,
      name: recipe.name,
      summary: recipe.summary,
    })),
    "source_id"
  )

  const { data: storedRecipes, error: recipeIdError } = await client
    .from("recipes")
    .select("id,source_id")
    .limit(2000)
  if (recipeIdError) throw recipeIdError
  const recipeIds = new Map(
    ((storedRecipes ?? []) as RecipeIdRow[]).map((recipe) => [
      recipe.source_id,
      recipe.id,
    ])
  )

  await deleteByIds(
    "recipe_outputs",
    "entry_id",
    catalogs.gu
      .map((record) => entryIds.get(`gu:${record.id}`))
      .filter((id): id is number => id !== undefined)
  )
  await deleteByIds(
    "recipe_components",
    "recipe_id",
    [...uniqueRecipes.keys()]
      .map((sourceId) => recipeIds.get(sourceId))
      .filter((id): id is number => id !== undefined)
  )

  const outputRows = new Map<string, object>()
  for (const record of catalogs.gu) {
    const entryId = entryIds.get(`gu:${record.id}`)
    if (!entryId) continue
    for (const recipe of record.recipes ?? []) {
      const recipeId = recipeIds.get(recipe.id)
      if (!recipeId) continue
      outputRows.set(`${recipeId}:${entryId}`, {
        recipe_id: recipeId,
        entry_id: entryId,
        is_primary: false,
        ...recipeMatch(recipe.id, record.id),
      })
    }
  }
  await insertChunks("recipe_outputs", [...outputRows.values()])

  await insertChunks(
    "recipe_components",
    [...uniqueRecipes.values()].flatMap((recipe) => {
      const recipeId = recipeIds.get(recipe.id)
      if (!recipeId) return []
      return recipe.ingredients.map((rawText, index) => ({
        recipe_id: recipeId,
        position: index + 1,
        raw_text: rawText,
      }))
    })
  )

  const guEntryIds = new Map(
    storedEntries
      .filter((entry) => entry.kind === "gu")
      .map((entry) => [entry.source_id, entry.id])
  )
  const moveEntryIds = catalogs["killer-moves"]
    .map((record) => entryIds.get(`killer-moves:${record.id}`))
    .filter((id): id is number => id !== undefined)
  await deleteByIds("killer_move_slots", "killer_move_id", moveEntryIds)
  await insertChunks(
    "killer_move_slots",
    catalogs["killer-moves"].flatMap((record) => {
      const moveId = entryIds.get(`killer-moves:${record.id}`)
      if (!moveId) return []
      return (record.slots ?? []).map((slot) => ({
        killer_move_id: moveId,
        position: Number(slot.position),
        item_source_id: slot.itemId,
        item_name: slot.itemName,
        item_entry_id: guEntryIds.get(slot.itemId) ?? null,
      }))
    })
  )

  const wiki = JSON.parse(fs.readFileSync(wikiPath, "utf8")) as Array<{
    chapter_index: number
    title: string
    content: string[]
  }>
  await upsertChunks(
    "wiki_chapters",
    wiki.map((chapter) => ({
      slug: chapter.title.replace(/\.md$/i, ""),
      title: chapter.title,
      category: "Tài liệu",
      description: `Chương ${chapter.title}`,
      content: chapter.content.join("\n"),
      chapter_index: chapter.chapter_index,
      is_published: true,
    })),
    "slug"
  )

  const stats = {
    entries: allRecords.length,
    recipes: uniqueRecipes.size,
    recipe_outputs: outputRows.size,
    recipe_components: [...uniqueRecipes.values()].reduce(
      (total, recipe) => total + recipe.ingredients.length,
      0
    ),
    killer_move_slots: catalogs["killer-moves"].reduce(
      (total, record) => total + (record.slots?.length ?? 0),
      0
    ),
    wiki_chapters: wiki.length,
  }
  const { error: finishError } = await client
    .from("content_import_runs")
    .update({
      status: "succeeded",
      stats,
      finished_at: new Date().toISOString(),
    })
    .eq("id", run.id)
  if (finishError) throw finishError

  console.log(`Đã nhập schema v2: ${JSON.stringify(stats)}`)
} catch (error) {
  await client
    .from("content_import_runs")
    .update({
      status: "failed",
      error_message: error instanceof Error ? error.message : String(error),
      finished_at: new Date().toISOString(),
    })
    .eq("id", run.id)
  throw error
}
