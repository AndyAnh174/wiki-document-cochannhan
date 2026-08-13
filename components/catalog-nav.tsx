import Link from "next/link"

import { Button } from "@/components/ui/button"
import { catalogDefinitions } from "@/lib/catalog"
import type { CatalogKind } from "@/lib/catalog-types"

export function CatalogNav({ active }: { active: CatalogKind }) {
  return (
    <nav aria-label="Các kho dữ liệu" className="flex flex-wrap gap-2">
      {Object.values(catalogDefinitions).map((item) => (
        <Button
          key={item.kind}
          size="sm"
          variant={item.kind === active ? "default" : "outline"}
          render={<Link href={`/catalog/${item.kind}`} />}
        >
          {item.shortTitle}
        </Button>
      ))}
    </nav>
  )
}
