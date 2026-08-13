import { KillerMoveBagua } from "@/components/killer-move-bagua"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { CatalogSlot } from "@/lib/catalog-types"

export function KillerMoveFormation({
  slots,
  scrollId,
}: {
  slots: CatalogSlot[]
  scrollId: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Bàn Bát Quái Âm Dương</CardTitle>
        <CardDescription>
          Âm Ngư là ô 1, Dương Ngư là ô 2. Vòng ngoài bắt đầu từ đỉnh rồi đi theo chiều kim đồng hồ; “Vô” nghĩa là bỏ qua và để trống.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <KillerMoveBagua
          scrollName={scrollId}
          slots={slots.map((slot) => ({
            position: Number(slot.position),
            itemId: slot.itemId,
            itemName: slot.itemName,
          }))}
        />
      </CardContent>
    </Card>
  )
}
