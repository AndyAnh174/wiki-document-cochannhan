"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { BugIcon, SearchXIcon } from "lucide-react"

import type { CatalogListItem } from "@/lib/catalog-types"
import { withBasePath } from "@/lib/base-path"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PAGE_SIZE = 36

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
}

export function CatalogBrowser({ items }: { items: CatalogListItem[] }) {
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState("all")
  const [page, setPage] = React.useState(1)

  const categories = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items)
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40)
  }, [items])

  const filtered = React.useMemo(() => {
    const needle = normalize(query.trim())
    return items.filter((item) => {
      const matchesCategory = category === "all" || item.category === category
      const matchesQuery =
        !needle ||
        normalize(
          `${item.name} ${item.id} ${item.summary} ${item.rank ?? ""}`
        ).includes(needle)
      return matchesCategory && matchesQuery
    })
  }, [category, items, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function changePage(nextPage: number) {
    setPage(Math.max(1, Math.min(pageCount, nextPage)))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(1)
          }}
          placeholder="Tìm theo tên, ID hoặc công dụng..."
          aria-label="Tìm trong danh mục"
          className="sm:flex-1"
        />
        <Select
          value={category}
          onValueChange={(value) => {
            setCategory(value ?? "all")
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Tất cả phân loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Tất cả phân loại</SelectItem>
              {categories.map(([name, count]) => (
                <SelectItem key={name} value={name}>
                  {name} ({count})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>Tìm thấy {filtered.length.toLocaleString("vi-VN")} mục</span>
        <span>
          Trang {currentPage}/{pageCount}
        </span>
      </div>

      {visible.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <Card
              key={item.id}
              className="group relative min-h-44 overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
            >
              <CardHeader className="flex-row items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-xl border bg-muted/50">
                  {item.image ? (
                    <Image
                      src={withBasePath(item.image)!}
                      alt={`Ảnh ${item.name}`}
                      width={52}
                      height={52}
                      className="pixel-art size-13 object-contain transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <BugIcon className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{item.category}</Badge>
                    {item.rank ? (
                      <Badge variant="outline">{item.rank}</Badge>
                    ) : null}
                  </div>
                  <CardTitle className="font-serif text-lg leading-6">
                    <Link
                      href={`/catalog/${item.kind}/${encodeURIComponent(item.id)}`}
                      className="after:absolute after:inset-0"
                    >
                      {item.name}
                    </Link>
                  </CardTitle>
                  <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                    {item.id}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 leading-6">
                  {item.summary}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon />
            </EmptyMedia>
            <EmptyTitle>Không tìm thấy kết quả</EmptyTitle>
            <EmptyDescription>
              Thử đổi từ khóa hoặc chọn lại phân loại.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {pageCount > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#catalog"
                text="Trước"
                aria-disabled={currentPage === 1}
                onClick={(event) => {
                  event.preventDefault()
                  changePage(currentPage - 1)
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-sm text-muted-foreground">
                {currentPage} / {pageCount}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#catalog"
                text="Sau"
                aria-disabled={currentPage === pageCount}
                onClick={(event) => {
                  event.preventDefault()
                  changePage(currentPage + 1)
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
