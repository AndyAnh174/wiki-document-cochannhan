import Image from "next/image"
import { ScrollTextIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { withBasePath } from "@/lib/base-path"
import { cn } from "@/lib/utils"

export type BaguaSlot = {
  position: number
  itemId: string
  itemName: string
  image?: string
}

const positions: Record<number, string> = {
  1: "left-[35%] top-[45%] sm:left-[40%]",
  2: "left-[65%] top-[45%] sm:left-[60%]",
  3: "left-1/2 top-[10%]",
  4: "left-[76%] top-[21%]",
  5: "left-[88%] top-[44%]",
  6: "left-[77%] top-[70%]",
  7: "left-1/2 top-[86%]",
  8: "left-[23%] top-[70%]",
  9: "left-[12%] top-[44%]",
  10: "left-[24%] top-[21%]",
}

const labels: Record<number, { title: string; code: string }> = {
  1: { title: "Âm Ngư", code: "Ô 1" },
  2: { title: "Dương Ngư", code: "Ô 2" },
  3: { title: "1", code: "Ô 3" },
  4: { title: "2", code: "Ô 4" },
  5: { title: "3", code: "Ô 5" },
  6: { title: "4", code: "Ô 6" },
  7: { title: "5", code: "Ô 7" },
  8: { title: "6", code: "Ô 8" },
  9: { title: "7", code: "Ô 9" },
  10: { title: "8", code: "Ô 10" },
}

export function KillerMoveBagua({
  slots,
  scrollName,
  scrollImage,
}: {
  slots: BaguaSlot[]
  scrollName: string
  scrollImage?: string
}) {
  const slotMap = new Map(slots.map((slot) => [slot.position, slot]))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-xl border bg-muted/30 p-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-card">
          {scrollImage ? (
            <Image src={withBasePath(scrollImage)!} alt="" width={38} height={38} className="pixel-art size-9 object-contain" />
          ) : (
            <ScrollTextIcon className="text-primary" />
          )}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Ô 11</Badge>
            <strong className="text-sm">Cổ quyển sát chiêu</strong>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{scrollName}</p>
        </div>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[680px] overflow-hidden rounded-[2rem] border bg-muted/25 shadow-inner">
        <div className="absolute inset-[15%] overflow-hidden rounded-full border-4 border-primary/20 bg-card shadow-lg">
          <Image
            src={withBasePath("/mod-assets/screens/killer-move-scroll.png")!}
            alt="Bàn Bát Quái Âm Dương của giao diện Sát chiêu"
            fill
            sizes="520px"
            className="pixel-art scale-[1.7] object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-background/15" />
        </div>

        {Array.from({ length: 10 }, (_, index) => index + 1).map((position) => {
          const slot = slotMap.get(position)
          const label = labels[position]
          const central = position <= 2
          return (
            <div
              key={position}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5",
                positions[position]
              )}
            >
              <div
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-full border-2 bg-card text-center shadow-md",
                  central ? "size-20 sm:size-24" : "size-[4.5rem] sm:size-24",
                  slot ? "border-primary/60" : "border-dashed border-muted-foreground/40"
                )}
              >
                <Badge
                  variant={central ? "default" : "secondary"}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap"
                >
                  {label.title}
                </Badge>
                {slot?.image ? (
                  <Image
                    src={withBasePath(slot.image)!}
                    alt={slot.itemName}
                    width={42}
                    height={42}
                    className="pixel-art size-8 object-contain sm:size-11"
                  />
                ) : null}
                <span className={cn("px-1 text-[10px] leading-tight font-medium sm:text-xs", !slot && "text-muted-foreground")}>
                  {slot?.itemName ?? "Vô"}
                </span>
                <span className="mt-0.5 text-[9px] text-muted-foreground">{label.code}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline">Vô = bỏ qua, để trống</Badge>
        <span>Vòng ngoài đi từ 1 ở đỉnh, theo chiều kim đồng hồ đến 8.</span>
      </div>
    </div>
  )
}
