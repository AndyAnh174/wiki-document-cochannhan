export const catalogKinds = [
  "gu",
  "killer-moves",
  "equipment",
  "effects",
  "creatures",
] as const

export type CatalogKind = (typeof catalogKinds)[number]

export type CatalogRecipe = {
  id: string
  name: string
  summary: string
  ingredients: string[]
}

export type CatalogSlot = {
  position: string
  itemId: string
  itemName: string
}

export type CatalogRecord = {
  kind: CatalogKind
  id: string
  name: string
  image?: string
  category: string
  rank?: string
  summary: string
  attributes: Array<[string, string]>
  details: string[]
  recipes?: CatalogRecipe[]
  slots?: CatalogSlot[]
}

export type CatalogListItem = Pick<
  CatalogRecord,
  "kind" | "id" | "name" | "image" | "category" | "rank" | "summary"
>

export type CatalogDefinition = {
  kind: CatalogKind
  title: string
  shortTitle: string
  description: string
}
