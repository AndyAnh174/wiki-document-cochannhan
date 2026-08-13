import "server-only"

import { getCatalogRecords, resolveLooseItemImage } from "@/lib/catalog"

export type KillerMoveGuide = {
  id: string
  name: string
  image?: string
  category: string
  summary: string
  slots: Array<{
    position: number
    itemId: string
    itemName: string
    image?: string
  }>
}

export type RefinementGuide = {
  id: string
  name: string
  summary: string
  outputId: string
  outputName: string
  outputImage?: string
  rank?: string
  ingredients: Array<{
    position: number
    slotNumber: number
    rawText: string
    displayText: string
    stagePercent: number
    image?: string
  }>
}

function readStagePercent(rawText: string) {
  const match = rawText.match(/(?:đạt|dat)\s*(\d{1,3})\s*%/iu)
  return match ? Number(match[1]) : 0
}

const slotWords: Record<string, number> = {
  một: 1,
  hai: 2,
  ba: 3,
  bốn: 4,
  năm: 5,
  sáu: 6,
  bảy: 7,
  tảy: 7,
  tám: 8,
}

function readSlotNumber(rawText: string, fallback: number) {
  const word = rawText.trim().match(/^(Một|Hai|Ba|Bốn|Năm|Sáu|Bảy|Tảy|Tám)\b/iu)?.[1]
  return word ? slotWords[word.toLocaleLowerCase("vi")] : fallback
}

function cleanIngredientText(rawText: string) {
  return rawText
    .replace(/^(Một|Hai|Ba|Bốn|Năm|Sáu|Bảy|Tảy|Tám)\s*:?\s*/iu, "")
    .replace(/\s*\([^)]*(?:tiến độ|tien do)[^)]*\)\s*/giu, "")
    .trim()
}

export function getKillerMoveGuides(): KillerMoveGuide[] {
  const guById = new Map(getCatalogRecords("gu").map((gu) => [gu.id, gu]))

  return getCatalogRecords("killer-moves").map((move) => ({
    id: move.id,
    name: move.name,
    image: move.image,
    category: move.category,
    summary: move.summary,
    slots: (move.slots ?? [])
      .map((slot) => ({
        position: Number(slot.position),
        itemId: slot.itemId,
        itemName: slot.itemName,
        image:
          guById.get(slot.itemId)?.image ??
          resolveLooseItemImage(slot.itemId, slot.itemName),
      }))
      .sort((a, b) => a.position - b.position),
  }))
}

export function getRefinementGuides(): RefinementGuide[] {
  const recipes = new Map<string, RefinementGuide>()

  for (const gu of getCatalogRecords("gu")) {
    for (const recipe of gu.recipes ?? []) {
      const current = recipes.get(recipe.id)
      if (current && current.ingredients.length >= recipe.ingredients.length)
        continue

      recipes.set(recipe.id, {
        id: recipe.id,
        name: recipe.name,
        summary: recipe.summary,
        outputId: gu.id,
        outputName: gu.name,
        outputImage: gu.image,
        rank: gu.rank,
        ingredients: recipe.ingredients.map((rawText, index) => {
          const displayText = cleanIngredientText(rawText)
          return {
            position: index + 1,
            slotNumber: readSlotNumber(rawText, index + 1),
            rawText,
            displayText,
            stagePercent: readStagePercent(rawText),
            image: resolveLooseItemImage("", displayText),
          }
        }),
      })
    }
  }

  return [...recipes.values()].sort((a, b) =>
    a.outputName.localeCompare(b.outputName, "vi")
  )
}
