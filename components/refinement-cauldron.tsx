import Image from "next/image"
import { FlaskConicalIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import type { RefinementGuide } from "@/lib/player-tools"
import { withBasePath } from "@/lib/base-path"
import { cn } from "@/lib/utils"

const slotPositions: Record<number, string> = {
  1: "left-1/2 top-[12%]",
  2: "left-[23%] top-[25%]",
  3: "left-[77%] top-[25%]",
  4: "left-1/2 top-[39%]",
  5: "left-[17%] top-[64%]",
  6: "left-1/2 top-[64%]",
  7: "left-[83%] top-[64%]",
  8: "left-1/2 top-[89%]",
}

type Ingredient = RefinementGuide["ingredients"][number]

export function RefinementCauldron({
  ingredients,
  outputName,
  outputImage,
  checked,
  onToggle,
}: {
  ingredients: Ingredient[]
  outputName: string
  outputImage?: string
  checked: Set<number>
  onToggle: (position: number, value: boolean) => void
}) {
  const slotMap = new Map(ingredients.map((ingredient) => [ingredient.slotNumber, ingredient]))

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-center">
      <div className="relative mx-auto aspect-square w-full max-w-[620px] overflow-hidden rounded-[2rem] border bg-muted/30 shadow-inner">
        <div className="absolute inset-[8%] overflow-hidden rounded-[2rem] opacity-45">
          <Image
            src={withBasePath("/mod-assets/screens/refinement.png")!}
            alt="Đỉnh Luyện Cổ trong game"
            fill
            sizes="560px"
            className="pixel-art scale-125 object-cover object-left"
          />
        </div>

        {Array.from({ length: 8 }, (_, index) => index + 1).map((slotNumber) => {
          const ingredient = slotMap.get(slotNumber)
          const isChecked = ingredient ? checked.has(ingredient.position) : false
          const inputId = `refinement-slot-${slotNumber}-${ingredient?.position ?? "empty"}`
          return (
            <Field
              key={slotNumber}
              className={cn(
                "absolute w-auto -translate-x-1/2 -translate-y-1/2",
                slotPositions[slotNumber]
              )}
            >
              <FieldLabel
                htmlFor={inputId}
                className={cn(
                  "relative flex size-[4.75rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-full border-2 bg-card px-1 text-center shadow-md sm:size-24",
                  ingredient ? "border-primary/60" : "cursor-default border-dashed border-muted-foreground/40"
                )}
              >
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">{slotNumber}</Badge>
                {ingredient?.image ? (
                  <Image src={withBasePath(ingredient.image)!} alt="" width={38} height={38} className="pixel-art size-8 object-contain sm:size-10" />
                ) : null}
                <span className={cn("line-clamp-2 text-[9px] leading-tight sm:text-xs", !ingredient && "text-muted-foreground")}>
                  {ingredient?.displayText ?? "Vô"}
                </span>
                {ingredient ? (
                  <Checkbox
                    id={inputId}
                    checked={isChecked}
                    onCheckedChange={(value) => onToggle(ingredient.position, value === true)}
                    className="absolute right-1 bottom-1"
                  />
                ) : null}
              </FieldLabel>
            </Field>
          )
        })}
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/25 p-5 text-center">
        <Badge>Thành phẩm</Badge>
        <div className="flex size-28 items-center justify-center rounded-xl border bg-card">
          {outputImage ? (
            <Image src={withBasePath(outputImage)!} alt={outputName} width={84} height={84} className="pixel-art size-20 object-contain" />
          ) : (
            <FlaskConicalIcon className="size-10 text-muted-foreground" />
          )}
        </div>
        <strong className="font-serif text-lg">{outputName}</strong>
        <p className="text-xs leading-5 text-muted-foreground">
          Đặt nguyên liệu đúng các ô 1–8. Ô “Vô” phải bỏ trống.
        </p>
      </div>
    </div>
  )
}
