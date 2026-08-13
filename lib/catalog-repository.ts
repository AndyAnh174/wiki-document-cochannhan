import "server-only"

import type {
  CatalogKind,
  CatalogRecord,
  CatalogRecipe,
  CatalogSlot,
} from "@/lib/catalog-types"
import { getCatalogRecord, getCatalogRecords } from "@/lib/catalog"
import { createPublicSupabaseClient } from "@/lib/supabase/server"

type CatalogRow = {
  id: number
  kind: CatalogKind
  source_id: string
  name: string
  image_path: string | null
  category: string
  rank: string | null
  summary: string
  attributes: Array<[string, string]>
  details: string[]
}

type RecipeOutputRow = {
  confidence: number
  recipes:
    | {
        source_id: string
        name: string
        summary: string
        recipe_components: Array<{ position: number; raw_text: string }>
      }
    | Array<{
        source_id: string
        name: string
        summary: string
        recipe_components: Array<{ position: number; raw_text: string }>
      }>
    | null
}

function rowToRecord(row: CatalogRow): CatalogRecord {
  return {
    kind: row.kind,
    id: row.source_id,
    name: row.name,
    image: row.image_path ?? undefined,
    category: row.category,
    rank: row.rank ?? undefined,
    summary: row.summary,
    attributes: row.attributes,
    details: row.details,
  }
}

export async function listCatalog(kind: CatalogKind) {
  const supabase = createPublicSupabaseClient()
  if (!supabase)
    return { records: getCatalogRecords(kind), source: "local" as const }

  const rows: CatalogRow[] = []
  const pageSize = 1000
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("catalog_entries")
      .select(
        "id,kind,source_id,name,image_path,category,rank,summary,attributes,details"
      )
      .eq("kind", kind)
      .order("name")
      .order("id")
      .range(from, from + pageSize - 1)

    if (error)
      return { records: getCatalogRecords(kind), source: "local" as const }
    const page = (data ?? []) as CatalogRow[]
    rows.push(...page)
    if (page.length < pageSize) break
  }

  if (!rows.length)
    return { records: getCatalogRecords(kind), source: "local" as const }
  return {
    records: rows.map(rowToRecord),
    source: "supabase" as const,
  }
}

export async function findCatalogRecord(kind: CatalogKind, sourceId: string) {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return getCatalogRecord(kind, sourceId)

  const { data, error } = await supabase
    .from("catalog_entries")
    .select(
      "id,kind,source_id,name,image_path,category,rank,summary,attributes,details"
    )
    .eq("kind", kind)
    .eq("source_id", sourceId)
    .maybeSingle()

  if (error || !data) return getCatalogRecord(kind, sourceId)
  const record = rowToRecord(data as CatalogRow)

  if (kind === "gu") {
    const { data: outputRows } = await supabase
      .from("recipe_outputs")
      .select(
        "confidence,recipes!inner(source_id,name,summary,recipe_components(position,raw_text))"
      )
      .eq("entry_id", data.id)
      .order("confidence", { ascending: false })

    record.recipes = ((outputRows ?? []) as unknown as RecipeOutputRow[])
      .map<CatalogRecipe | null>((output) => {
        const recipe = Array.isArray(output.recipes)
          ? output.recipes[0]
          : output.recipes
        if (!recipe) return null

        return {
          id: recipe.source_id,
          name: recipe.name,
          summary: recipe.summary,
          ingredients: [...recipe.recipe_components]
            .sort((a, b) => a.position - b.position)
            .map((component) => component.raw_text),
        }
      })
      .filter((recipe): recipe is CatalogRecipe => recipe !== null)
  }

  if (kind === "killer-moves") {
    const { data: slots } = await supabase
      .from("killer_move_slots")
      .select("position,item_source_id,item_name")
      .eq("killer_move_id", data.id)
      .order("position")
    record.slots = (slots ?? []).map<CatalogSlot>((slot) => ({
      position: String(slot.position),
      itemId: slot.item_source_id,
      itemName: slot.item_name,
    }))
  }

  return record
}
