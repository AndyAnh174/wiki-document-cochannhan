import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"

import type { CatalogKind, CatalogRecord } from "../lib/catalog-types"

const url = process.env.SUPABASE_IMPORT_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) throw new Error("Thiếu SUPABASE_IMPORT_URL hoặc SUPABASE_SERVICE_ROLE_KEY")

const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const catalogs = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalog.generated.json"), "utf8")) as Record<CatalogKind, CatalogRecord[]>

function chunks<T>(items: T[], size = 200) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size))
}

for (const [kind, records] of Object.entries(catalogs) as Array<[CatalogKind, CatalogRecord[]]>) {
  const rows = records.map((record) => ({
    kind,
    source_id: record.id,
    name: record.name,
    image_path: record.image ?? null,
    category: record.category,
    rank: record.rank ?? null,
    summary: record.summary,
    attributes: record.attributes,
    details: record.details,
  }))
  for (const batch of chunks(rows)) {
    const { error } = await client.from("catalog_entries").upsert(batch, { onConflict: "kind,source_id" })
    if (error) throw error
  }
  console.log(`Đã nhập ${rows.length} mục ${kind}`)
}

const { data: guRows, error: guRowsError } = await client.from("catalog_entries").select("id,source_id").eq("kind", "gu")
if (guRowsError) throw guRowsError
const guIds = new Map((guRows ?? []).map((row) => [row.source_id, row.id]))

for (const record of catalogs.gu) {
  const guEntryId = guIds.get(record.id)
  if (!guEntryId || !record.recipes?.length) continue
  for (let recipeIndex = 0; recipeIndex < record.recipes.length; recipeIndex += 1) {
    const recipe = record.recipes[recipeIndex]
    const { data: recipeRow, error } = await client
      .from("gu_recipes")
      .upsert({ gu_entry_id: guEntryId, source_id: recipe.id, name: recipe.name, summary: recipe.summary, sort_order: recipeIndex }, { onConflict: "gu_entry_id,source_id" })
      .select("id")
      .single()
    if (error) throw error
    if (recipe.ingredients.length) {
      const ingredients = recipe.ingredients.map((description, index) => ({ recipe_id: recipeRow.id, position: index + 1, description }))
      const { error: ingredientError } = await client.from("recipe_ingredients").upsert(ingredients, { onConflict: "recipe_id,position" })
      if (ingredientError) throw ingredientError
    }
  }
}

const { data: moveRows, error: moveRowsError } = await client.from("catalog_entries").select("id,source_id").eq("kind", "killer-moves")
if (moveRowsError) throw moveRowsError
const moveIds = new Map((moveRows ?? []).map((row) => [row.source_id, row.id]))
for (const record of catalogs["killer-moves"]) {
  const killerMoveId = moveIds.get(record.id)
  if (!killerMoveId || !record.slots?.length) continue
  const slots = record.slots.map((slot) => ({ killer_move_id: killerMoveId, position: Number(slot.position), item_source_id: slot.itemId, item_name: slot.itemName }))
  const { error } = await client.from("killer_move_slots").upsert(slots, { onConflict: "killer_move_id,position" })
  if (error) throw error
}

const wiki = JSON.parse(fs.readFileSync(path.join(process.cwd(), "..", "wiki", "minecraft-wiki.json"), "utf8")) as Array<{ chapter_index: number; title: string; content: string[] }>
const wikiRows = wiki.map((chapter) => ({
  slug: chapter.title.replace(/\.md$/i, ""),
  title: chapter.title,
  category: "Tài liệu",
  description: `Chương ${chapter.title}`,
  content: chapter.content.join("\n"),
  chapter_index: chapter.chapter_index,
}))
for (const batch of chunks(wikiRows, 20)) {
  const { error } = await client.from("wiki_chapters").upsert(batch, { onConflict: "slug" })
  if (error) throw error
}

console.log(`Đã nhập ${wikiRows.length} chương wiki và toàn bộ quan hệ chi tiết.`)
