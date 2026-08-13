import Link from "next/link"
import { CompassIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-[70svh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CompassIcon className="size-7" />
      </div>
      <p className="text-sm font-medium tracking-[0.2em] text-primary uppercase">
        404 · Lạc trong Ngũ Vực
      </p>
      <h1 className="mt-3 font-serif text-4xl font-semibold">
        Không tìm thấy chương này
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Trang bạn tìm có thể đã đổi tên hoặc chưa được ghi vào cổ thư.
      </p>
      <Button className="mt-7" render={<Link href="/" />}>
        Trở về trang chủ
      </Button>
    </main>
  )
}
