import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BookOpenIcon } from "lucide-react"

import { WikiMarkdown } from "@/components/wiki-markdown"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getWikiNavigation } from "@/lib/wiki"
import { findWikiChapter } from "@/lib/wiki-repository"
import { withBasePath } from "@/lib/base-path"

type PageProps = { params: Promise<{ slug: string }> }

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const chapter = await findWikiChapter(slug)
  if (!chapter) return {}
  return {
    title: chapter.title.replace(/^\d+\s*-\s*/, ""),
    description: `Hướng dẫn ${chapter.title.replace(/^\d+\s*-\s*/, "")} trong mod Minecraft Cổ Chân Nhân.`,
  }
}

export default async function WikiChapterPage({ params }: PageProps) {
  const { slug } = await params
  const chapter = await findWikiChapter(slug)
  if (!chapter) notFound()

  const meta = getWikiNavigation().find((item) => item.slug === slug)
  const cleanTitle = chapter.title.replace(/^\d+\s*-\s*/, "")

  return (
    <main className="relative mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <Breadcrumb className="mb-8">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>
              Trang chủ
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{cleanTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="relative mb-10 overflow-hidden rounded-2xl border bg-card px-6 py-8 shadow-sm sm:px-10">
        <div className="absolute inset-y-0 right-0 w-52 bg-gradient-to-l from-primary/10 to-transparent" />
        <Image
          src={withBasePath("/mod-assets/items/ai-biet-ly-gu.png")!}
          alt=""
          width={96}
          height={96}
          className="pixel-art absolute right-5 -bottom-2 size-24 object-contain opacity-20 sm:right-10 sm:opacity-40"
        />
        <div className="relative max-w-3xl">
          <Badge
            variant="outline"
            className="mb-4 border-primary/25 bg-background/60 text-primary"
          >
            <BookOpenIcon data-icon="inline-start" />{" "}
            {meta?.category ?? "Cẩm nang"}
          </Badge>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            {cleanTitle}
          </h1>
          {meta?.description ? (
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
              {meta.description}
            </p>
          ) : null}
        </div>
      </header>

      <WikiMarkdown content={chapter.content} />
    </main>
  )
}
