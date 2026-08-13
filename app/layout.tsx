import type { Metadata } from "next"
import { Geist_Mono, Noto_Sans, Noto_Serif } from "next/font/google"

import "./globals.css"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toast"
import { getWikiNavigation } from "@/lib/wiki"
import { cn } from "@/lib/utils"

const notoSans = Noto_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-noto-sans",
})
const notoSerif = Noto_Serif({
  subsets: ["latin", "vietnamese"],
  variable: "--font-noto-serif",
})
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Cổ Chân Nhân Wiki",
    template: "%s | Cổ Chân Nhân Wiki",
  },
  description:
    "Cẩm nang tiếng Việt dành cho mod Minecraft Cổ Chân Nhân: cổ trùng, sát chiêu, tu luyện, luyện đạo và thế giới ngũ vực.",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const navigation = getWikiNavigation()

  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        notoSans.variable,
        notoSerif.variable,
        geistMono.variable
      )}
    >
      <body>
        <ThemeProvider>
          <Toaster />
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar items={navigation} />
              <SidebarInset>
                <SiteHeader />
                {children}
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
