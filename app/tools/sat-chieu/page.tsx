import type { Metadata } from "next"

import { KillerMoveTool } from "@/components/tools/killer-move-tool"
import { ToolPageHeader } from "@/components/tools/tool-page-header"
import { getKillerMoveGuides } from "@/lib/player-tools"

export const metadata: Metadata = { title: "Xếp Cổ cho sát chiêu" }

export default function KillerMoveToolPage() {
  const guides = getKillerMoveGuides()
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <ToolPageHeader eyebrow="Công cụ người chơi" title="Xếp Cổ cho sát chiêu" description="Chọn sát chiêu, xem chính xác Cổ nào nằm ở ô nào và liên kết nó với phím Z/X/C/V trong game." count={`${guides.length} sát chiêu`} />
      <KillerMoveTool guides={guides} />
    </main>
  )
}
