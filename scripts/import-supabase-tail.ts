import fs from "node:fs"
import path from "node:path"
import { createClient } from "@supabase/supabase-js"

import type { CatalogKind, CatalogRecord } from "../lib/catalog-types"

const url = process.env.SUPABASE_IMPORT_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) throw new Error("Thiếu cấu hình import Supabase")

const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
const catalogs = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "catalog.generated.json"), "utf8")) as Record<CatalogKind, CatalogRecord[]>

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
console.log("Đã nhập vị trí Sát chiêu")

const wiki = JSON.parse(fs.readFileSync(path.join(process.cwd(), "..", "wiki", "minecraft-wiki.json"), "utf8")) as Array<{ chapter_index: number; title: string; content: string[] }>
const wikiRows = wiki.map((chapter) => ({
  slug: chapter.title.replace(/\.md$/i, ""),
  title: chapter.title,
  category: "Tài liệu",
  description: `Chương ${chapter.title}`,
  content: chapter.content.join("\n"),
  chapter_index: chapter.chapter_index,
}))
for (let index = 0; index < wikiRows.length; index += 5) {
  const { error } = await client.from("wiki_chapters").upsert(wikiRows.slice(index, index + 5), { onConflict: "slug" })
  if (error) throw error
}
console.log(`Đã nhập ${wikiRows.length} chương wiki`)
