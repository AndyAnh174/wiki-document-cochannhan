import "server-only"

import { cache } from "react"

import { createPublicSupabaseClient } from "@/lib/supabase/server"

export type FaqEntry = {
  id: number
  question: string
  answer: string
  category: string
  sort_order: number
  faq_media: Array<{
    id: number
    object_path: string
    alt_text: string
    sort_order: number
  }>
}

export const listPublishedFaq = cache(async function listPublishedFaq() {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return [] as FaqEntry[]

  const { data, error } = await supabase
    .from("faq_entries")
    .select("id,question,answer,category,sort_order,faq_media(id,object_path,alt_text,sort_order)")
    .eq("is_published", true)
    .order("sort_order")
    .order("id")

  if (error) return [] as FaqEntry[]
  return ((data ?? []) as FaqEntry[]).map((entry) => ({
    ...entry,
    faq_media: [...entry.faq_media].sort(
      (left, right) => left.sort_order - right.sort_order || left.id - right.id
    ),
  }))
})
