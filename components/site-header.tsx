import Link from "next/link"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { WikiAiChat } from "@/components/chat/wiki-ai-chat"
import { ThemeToggle } from "@/components/theme-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />
      <Link href="/" className="text-sm font-medium">
        Cổ Chân Nhân Wiki
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <WikiAiChat />
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Nhấn D để đổi nền
        </span>
        <ThemeToggle />
      </div>
    </header>
  )
}
