import type { Metadata } from "next"

import { DaoMarkCalculator } from "@/components/tools/dao-mark-calculator"
import { ToolPageHeader } from "@/components/tools/tool-page-header"

export const metadata: Metadata = { title: "Máy tính Đạo ngân" }

export default function DaoMarkToolPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
      <ToolPageHeader eyebrow="Công cụ người chơi" title="Máy tính Đạo ngân" description="Nhập Đạo ngân của người đánh và mục tiêu để xem chính xác hệ số khuếch đại, suy giảm và sát thương cuối theo procedure của mod." />
      <DaoMarkCalculator />
    </main>
  )
}
