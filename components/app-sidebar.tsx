"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpenTextIcon,
  BugIcon,
  CalculatorIcon,
  DatabaseIcon,
  FlaskConicalIcon,
  GhostIcon,
  ShieldIcon,
  SwordsIcon,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { WikiSearch } from "@/components/wiki-search"
import { withBasePath } from "@/lib/base-path"

type WikiNavItem = {
  title: string
  slug: string
  category: string
  label: string
  description: string
}

const categoryOrder = [
  "Bắt đầu",
  "Cổ đạo",
  "Sát chiêu",
  "Tu hành",
  "Tra cứu",
  "Thế giới",
  "Lệnh",
  "Hệ thống",
  "Tài liệu gốc",
  "Khác",
] as const

const catalogLinks = [
  ["Cổ trùng", "/catalog/gu", BugIcon],
  ["Sát chiêu", "/catalog/killer-moves", SwordsIcon],
  ["Trang bị", "/catalog/equipment", ShieldIcon],
  ["Hiệu ứng", "/catalog/effects", FlaskConicalIcon],
  ["Sinh vật", "/catalog/creatures", GhostIcon],
] as const

const toolLinks = [
  ["Xếp Cổ sát chiêu", "/tools/sat-chieu", SwordsIcon],
  ["Luyện Cổ theo Cổ phương", "/tools/luyen-co", FlaskConicalIcon],
  ["Máy tính Đạo ngân", "/tools/dao-ngan", CalculatorIcon],
] as const

export function AppSidebar({ items }: { items: WikiNavItem[] }) {
  const pathname = usePathname()
  const groups = categoryOrder
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length)

  return (
    <Sidebar variant="inset" collapsible="offcanvas">
      <SidebarHeader className="gap-3 border-b border-sidebar-border p-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
            <Image src={withBasePath("/mod-assets/items/ai-biet-ly-gu.png")!} alt="Biểu tượng Cổ trùng" width={32} height={32} className="pixel-art size-8" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-heading text-base font-semibold">Cổ Chân Nhân Wiki</span>
            <span className="text-xs text-muted-foreground">Minecraft 1.21.1 · NeoForge</span>
          </span>
        </Link>
        <WikiSearch items={items} />
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Kho dữ liệu chi tiết" links={catalogLinks} pathname={pathname} />
        <NavGroup label="Công cụ người chơi" links={toolLinks} pathname={pathname} />
        {groups.map((group) => (
          <SidebarGroup key={group.category}>
            <SidebarGroupLabel>{group.category}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.slug}>
                    <SidebarMenuButton render={<Link href={`/${item.slug}`} />} isActive={pathname === `/${item.slug}`} tooltip={item.label}>
                      <BookOpenTextIcon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><DatabaseIcon /><span>Wiki cộng đồng Ảnh Tông</span></div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function NavGroup({
  label,
  links,
  pathname,
}: {
  label: string
  links: ReadonlyArray<readonly [string, string, typeof BugIcon]>
  pathname: string
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {links.map(([title, href, Icon]) => (
            <SidebarMenuItem key={href}>
              <SidebarMenuButton render={<Link href={href} />} isActive={pathname.startsWith(href)} tooltip={title}>
                <Icon />
                <span>{title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
