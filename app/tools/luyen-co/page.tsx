import type { Metadata } from "next"

import { RefinementTool } from "@/components/tools/refinement-tool"
import { ToolPageHeader } from "@/components/tools/tool-page-header"
import { getRefinementGuides } from "@/lib/player-tools"

export const metadata: Metadata = { title: "Luyện Cổ theo Cổ phương" }

export default function RefinementToolPage() {
  const guides = getRefinementGuides()
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <ToolPageHeader eyebrow="Công cụ người chơi" title="Luyện Cổ theo Cổ phương" description="Chọn con Cổ muốn luyện, chuẩn bị nguyên liệu và đánh dấu từng bước theo đúng mốc tiến độ trong GUI luyện Cổ." count={`${guides.length} Cổ phương`} />
      <RefinementTool guides={guides} />
    </main>
  )
}
