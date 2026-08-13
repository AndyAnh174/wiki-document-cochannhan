import "server-only"

import { cache } from "react"

import { getChapter, type WikiChapter } from "@/lib/wiki"
import { createPublicSupabaseClient } from "@/lib/supabase/server"

type WikiChapterRow = {
  chapter_index: number
  title: string
  content: string
}

export const findWikiChapter = cache(async function findWikiChapter(
  slug: string
): Promise<WikiChapter | undefined> {
  const supabase = createPublicSupabaseClient()
  if (!supabase) return getChapter(slug)

  const { data, error } = await supabase
    .from("wiki_chapters")
    .select("chapter_index,title,content")
    .eq("slug", slug)
    .maybeSingle()

  if (error || !data) return getChapter(slug)
  const row = data as WikiChapterRow
  return {
    chapter_index: row.chapter_index,
    title: row.title,
    content: row.content.split("\n"),
  }
})
