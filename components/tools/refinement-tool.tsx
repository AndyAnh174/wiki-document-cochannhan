"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { FlaskConicalIcon, RotateCcwIcon, SearchIcon, TriangleAlertIcon } from "lucide-react"

import { RefinementCauldron } from "@/components/refinement-cauldron"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { RefinementGuide } from "@/lib/player-tools"
import { withBasePath } from "@/lib/base-path"

const stageLabels: Record<number, string> = {
  0: "Bắt đầu",
  20: "Tiến độ 20%",
  50: "Tiến độ 50%",
}

export function RefinementTool({ guides }: { guides: RefinementGuide[] }) {
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(guides[0]?.id ?? "")
  const [selectedStage, setSelectedStage] = useState(0)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const selected = guides.find((guide) => guide.id === selectedId) ?? guides[0]
  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase("vi")
    if (!value) return guides
    return guides.filter((guide) =>
      `${guide.outputName} ${guide.name} ${guide.id}`.toLocaleLowerCase("vi").includes(value)
    )
  }, [guides, query])

  if (!selected) return null
  const stages = [...new Set(selected.ingredients.map((item) => item.stagePercent))].sort((a, b) => a - b)
  const activeStage = stages.includes(selectedStage) ? selectedStage : stages[0] ?? 0
  const stageIngredients = selected.ingredients.filter((item) => item.stagePercent === activeStage)

  function choose(id: string) {
    const guide = guides.find((item) => item.id === id)
    setSelectedId(id)
    setSelectedStage(guide?.ingredients[0]?.stagePercent ?? 0)
    setChecked(new Set())
  }

  function toggle(position: number, value: boolean) {
    setChecked((current) => {
      const next = new Set(current)
      if (value) next.add(position)
      else next.delete(position)
      return next
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="h-fit xl:sticky xl:top-20">
        <CardHeader>
          <CardTitle className="font-serif">Chọn Cổ muốn luyện</CardTitle>
          <CardDescription>Bấm vào Cổ phương để đổi sơ đồ 8 ô của Đỉnh Luyện.</CardDescription>
          <Field>
            <FieldLabel htmlFor="recipe-search" className="sr-only">Tìm Cổ phương</FieldLabel>
            <div className="relative">
              <SearchIcon className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground" />
              <Input id="recipe-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên Cổ hoặc Cổ phương..." className="pl-9" />
            </div>
          </Field>
        </CardHeader>
        <CardContent className="flex max-h-[65svh] flex-col gap-2 overflow-y-auto">
          {filtered.map((guide) => (
            <button
              key={guide.id}
              type="button"
              onClick={() => choose(guide.id)}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary/5"
              aria-pressed={guide.id === selected.id}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-muted">
                {guide.outputImage ? <Image src={withBasePath(guide.outputImage)!} alt="" width={36} height={36} className="pixel-art size-9 object-contain" /> : <FlaskConicalIcon />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{guide.outputName}</span>
                <span className="block truncate text-xs text-muted-foreground">{guide.name}</span>
              </span>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="flex min-w-0 flex-col gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              {selected.rank ? <Badge>{selected.rank}</Badge> : null}
              <Badge variant="outline">guzhenren:{selected.id}</Badge>
            </div>
            <CardTitle className="font-serif text-2xl">{selected.outputName}</CardTitle>
            <CardDescription>{selected.name} · {selected.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <Field>
              <FieldLabel>Chọn giai đoạn cho nguyên liệu</FieldLabel>
              <ToggleGroup
                value={[String(activeStage)]}
                onValueChange={(values) => values[0] && setSelectedStage(Number(values[0]))}
                variant="outline"
                className="grid w-full"
                style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
              >
                {stages.map((stage) => (
                  <ToggleGroupItem key={stage} value={String(stage)}>
                    {stageLabels[stage] ?? `Tiến độ ${stage}%`}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
          </CardContent>
        </Card>

        <Alert>
          <TriangleAlertIcon />
          <AlertTitle>Đúng vị trí và đúng thời điểm</AlertTitle>
          <AlertDescription>
            Chỉ đặt nhóm đang hiển thị vào Đỉnh Luyện. Sang mốc 20% hoặc 50%, chọn đúng giai đoạn rồi đặt lại theo sơ đồ mới; ô “Vô” phải để trống.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <Badge className="w-fit">{stageLabels[activeStage] ?? `Tiến độ ${activeStage}%`}</Badge>
            <CardTitle className="font-serif">Sơ đồ Đỉnh Luyện 8 ô</CardTitle>
            <CardDescription>Thứ tự ô lấy trực tiếp từ tọa độ GUI Luyện Cổ trong source.</CardDescription>
          </CardHeader>
          <CardContent>
            <RefinementCauldron
              ingredients={stageIngredients}
              outputName={selected.outputName}
              outputImage={selected.outputImage}
              checked={checked}
              onToggle={toggle}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Nguyên liệu ở giai đoạn này</CardTitle>
            <CardDescription>Đối chiếu nhanh số ô và tên nguyên liệu trước khi bắt đầu.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }, (_, index) => index + 1).map((slotNumber) => {
              const ingredient = stageIngredients.find((item) => item.slotNumber === slotNumber)
              return (
                <div key={slotNumber} className="flex items-center gap-3 rounded-lg border p-3">
                  <Badge variant={ingredient ? "secondary" : "outline"}>Ô {slotNumber}</Badge>
                  {ingredient?.image ? <Image src={withBasePath(ingredient.image)!} alt="" width={32} height={32} className="pixel-art size-8 object-contain" /> : null}
                  <span className={ingredient ? "text-sm" : "text-sm text-muted-foreground"}>{ingredient?.displayText ?? "Vô · bỏ qua"}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Button variant="outline" className="w-fit" onClick={() => setChecked(new Set())}>
          <RotateCcwIcon data-icon="inline-start" /> Đặt lại đánh dấu
        </Button>
      </div>
    </div>
  )
}
