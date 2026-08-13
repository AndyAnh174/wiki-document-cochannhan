"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { CheckCircle2Icon, SearchIcon, ScrollTextIcon } from "lucide-react"

import { KillerMoveBagua } from "@/components/killer-move-bagua"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { KillerMoveGuide } from "@/lib/player-tools"
import { withBasePath } from "@/lib/base-path"

const hotkeys = [
  ["z", "Z", "Liên kết 1"],
  ["x", "X", "Liên kết 2"],
  ["c", "C", "Liên kết 3"],
  ["v", "V", "Liên kết 4"],
] as const

const positionGuide = [
  [3, "1", "Trên cùng · 12 giờ"],
  [4, "2", "Chéo trên phải · 1–2 giờ"],
  [5, "3", "Bên phải · 3 giờ"],
  [6, "4", "Chéo dưới phải · 4–5 giờ"],
  [7, "5", "Dưới cùng · 6 giờ"],
  [8, "6", "Chéo dưới trái · 7–8 giờ"],
  [9, "7", "Bên trái · 9 giờ"],
  [10, "8", "Chéo trên trái · 10–11 giờ"],
] as const

export function KillerMoveTool({ guides }: { guides: KillerMoveGuide[] }) {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(guides[0]?.id ?? "")
  const [hotkey, setHotkey] = useState("z")
  const selected = guides.find((guide) => guide.id === selectedId) ?? guides[0]
  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("vi")
    if (!value) return guides
    return guides.filter((guide) =>
      `${guide.name} ${guide.id} ${guide.category}`.toLocaleLowerCase("vi").includes(value)
    )
  }, [guides, query])

  if (!selected) return null
  const slotMap = new Map(selected.slots.map((slot) => [slot.position, slot]))

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit xl:sticky xl:top-20">
        <CardHeader>
          <CardTitle className="font-serif">Chọn sát chiêu</CardTitle>
          <CardDescription>Bấm vào một sát chiêu để đổi toàn bộ Cổ trên bàn Bát Quái.</CardDescription>
          <Field>
            <FieldLabel htmlFor="killer-search" className="sr-only">Tìm sát chiêu</FieldLabel>
            <div className="relative">
              <SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
              <Input id="killer-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên hoặc ID sát chiêu..." className="pl-9" />
            </div>
          </Field>
        </CardHeader>
        <CardContent className="flex max-h-[60svh] flex-col gap-2 overflow-y-auto">
          {filtered.map((guide) => (
            <button
              key={guide.id}
              type="button"
              onClick={() => setSelectedId(guide.id)}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/5"
              aria-pressed={guide.id === selected.id}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
                {guide.image ? <Image src={withBasePath(guide.image)!} alt="" width={32} height={32} className="pixel-art size-8 object-contain" /> : <ScrollTextIcon />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{guide.name}</span>
                <span className="block text-xs text-muted-foreground">{guide.slots.length} Cổ · {10 - guide.slots.length} ô Vô</span>
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{selected.category}</Badge>
              <Badge variant="outline">guzhenren:{selected.id}</Badge>
            </div>
            <CardTitle className="font-serif text-2xl">{selected.name}</CardTitle>
            <CardDescription>{selected.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel>Chọn phím muốn liên kết</FieldLabel>
              <ToggleGroup
                value={[hotkey]}
                onValueChange={(values) => values[0] && setHotkey(values[0])}
                variant="outline"
                className="grid w-full grid-cols-4"
              >
                {hotkeys.map(([value, key, label]) => (
                  <ToggleGroupItem key={value} value={value} className="h-auto flex-col py-2">
                    <strong>{key}</strong>
                    <span className="text-xs font-normal text-muted-foreground">{label}</span>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Bàn Bát Quái Âm Dương</CardTitle>
              <CardDescription>Nhìn thẳng vào GUI trong game và đặt đúng từng Cổ như sơ đồ.</CardDescription>
            </CardHeader>
            <CardContent>
              <KillerMoveBagua slots={selected.slots} scrollName={selected.name} scrollImage={selected.image} />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Hai ô trung tâm</CardTitle>
                <CardDescription>Không tính chung vào thứ tự 1–8 vòng ngoài.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <PositionRow label="Âm Ngư" code="Ô 1" item={slotMap.get(1)?.itemName} />
                <PositionRow label="Dương Ngư" code="Ô 2" item={slotMap.get(2)?.itemName} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Vòng ngoài 1–8</CardTitle>
                <CardDescription>Từ đỉnh, đi theo chiều kim đồng hồ.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {positionGuide.map(([codePosition, visiblePosition, direction]) => (
                  <PositionRow key={codePosition} label={visiblePosition} code={`Ô ${codePosition}`} direction={direction} item={slotMap.get(codePosition)?.itemName} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <Alert>
          <CheckCircle2Icon />
          <AlertTitle>Sau khi xếp xong</AlertTitle>
          <AlertDescription>
            Ô ghi “Vô” phải bỏ qua và để trống. Đặt Cổ quyển vào ô 11, nhấn Xác nhận rồi dùng phím {hotkey.toUpperCase()} để thi triển. Không liên kết cùng một sát chiêu ở hai vị trí.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

function PositionRow({ label, code, direction, item }: { label: string; code: string; direction?: string; item?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 text-sm">
      <Badge variant={item ? "secondary" : "outline"}>{label}</Badge>
      <div className="min-w-0">
        <div className="font-medium">{item ?? "Vô · bỏ qua"}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{code}{direction ? ` · ${direction}` : ""}</div>
      </div>
    </div>
  )
}
