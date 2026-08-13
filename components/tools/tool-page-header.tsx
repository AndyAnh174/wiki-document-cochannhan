import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function ToolPageHeader({
  eyebrow,
  title,
  description,
  count,
}: {
  eyebrow: string
  title: string
  description: string
  count?: string
}) {
  return (
    <header className="flex flex-col gap-5">
      <Button variant="ghost" className="w-fit" render={<Link href="/" />}>
        <ArrowLeftIcon data-icon="inline-start" /> Trang chủ
      </Button>
      <div>
        <div className="mb-4 flex flex-wrap gap-2">
          <Badge>{eyebrow}</Badge>
          {count ? <Badge variant="outline">{count}</Badge> : null}
        </div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          {description}
        </p>
      </div>
    </header>
  )
}
