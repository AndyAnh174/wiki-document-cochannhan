import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { DatabaseIcon } from "lucide-react"

import { CatalogBrowser } from "@/components/catalog-browser"
import { CatalogNav } from "@/components/catalog-nav"
import { Badge } from "@/components/ui/badge"
import { catalogDefinitions } from "@/lib/catalog"
import { listCatalog } from "@/lib/catalog-repository"
import { catalogKinds, type CatalogKind } from "@/lib/catalog-types"

type PageProps = { params: Promise<{ kind: string }> }

function isKind(value: string): value is CatalogKind {
  return catalogKinds.includes(value as CatalogKind)
}

export function generateStaticParams() {
  return catalogKinds.map((kind) => ({ kind }))
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { kind } = await params
  if (!isKind(kind)) return {}
  return {
    title: catalogDefinitions[kind].title,
    description: catalogDefinitions[kind].description,
  }
}

export default async function CatalogPage({ params }: PageProps) {
  const { kind } = await params
  if (!isKind(kind)) notFound()
  const definition = catalogDefinitions[kind]
  const { records, source } = await listCatalog(kind)
  const listItems = records.map(
    ({ id, name, image, category, rank, summary }) => ({
      kind,
      id,
      name,
      image,
      category,
      rank,
      summary,
    })
  )

  return (
    <main
      id="catalog"
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-12"
    >
      <header className="flex flex-col gap-5">
        <CatalogNav active={kind} />
        <div>
          <Badge variant="outline" className="mb-4">
            <DatabaseIcon data-icon="inline-start" /> Kho dữ liệu đã liên kết
          </Badge>
          <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-5xl">
            {definition.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            {definition.description}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {records.length.toLocaleString("vi-VN")} mục được trích trực tiếp từ
            source và wiki của mod.
            {source === "supabase"
              ? " Đang phục vụ từ Supabase."
              : " Đang dùng dữ liệu local dự phòng."}
          </p>
        </div>
      </header>
      <CatalogBrowser items={listItems} />
    </main>
  )
}
