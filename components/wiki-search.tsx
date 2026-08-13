"use client"

import * as React from "react"
import Link from "next/link"
import { SearchIcon } from "lucide-react"

import type { WikiNavItem } from "@/lib/wiki"
import { Input } from "@/components/ui/input"

export function WikiSearch({ items }: { items: WikiNavItem[] }) {
  const [query, setQuery] = React.useState("")
  const normalized = query.trim().toLocaleLowerCase("vi")
  const results = normalized
    ? items
        .filter((item) =>
          `${item.label} ${item.description} ${item.title}`
            .toLocaleLowerCase("vi")
            .includes(normalized)
        )
        .slice(0, 8)
    : []

  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Tìm Cổ, Sát chiêu, lệnh..."
        aria-label="Tìm kiếm trong wiki"
        className="pl-9"
      />
      {normalized ? (
        <div className="absolute top-full right-0 left-0 mt-2 overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-lg ring-1 ring-border">
          {results.length ? (
            <div className="flex flex-col p-1">
              {results.map((item) => (
                <Link
                  key={item.slug}
                  href={`/${item.slug}`}
                  onClick={() => setQuery("")}
                  className="flex flex-col gap-0.5 rounded-md px-3 py-2 hover:bg-accent"
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {item.description}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="p-4 text-sm text-muted-foreground">
              Không tìm thấy tài liệu phù hợp.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
