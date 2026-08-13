"use client"

import { useState } from "react"
import { CalculatorIcon, InfoIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

function n(value: string) {
  const parsed = Number(value.replace(",", "."))
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

function format(value: number, digits = 3) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: digits }).format(value)
}

export function DaoMarkCalculator() {
  const [baseDamage, setBaseDamage] = useState("100")
  const [attackerMain, setAttackerMain] = useState("2000")
  const [attackerTotal, setAttackerTotal] = useState("2500")
  const [targetMain, setTargetMain] = useState("1000")
  const [targetTotal, setTargetTotal] = useState("1800")
  const [jiaCheng, setJiaCheng] = useState("0")
  const [powerReduction, setPowerReduction] = useState("0")
  const [vulnerability, setVulnerability] = useState("0")
  const [forcePath, setForcePath] = useState(false)

  const attackerOther = Math.max(n(attackerTotal) - n(attackerMain), 0)
  const targetOther = Math.max(n(targetTotal) - n(targetMain), 0)
  const A = Math.max(n(attackerMain) / 1000 - attackerOther / 1000, 0)
  const B = Math.max(attackerOther / 1000 - n(attackerMain) / 1000, 0)
  const C = Math.max(n(targetMain) / 1000 - targetOther / 1000, 0)
  const D = Math.max(targetOther / 1000 - n(targetMain) / 1000, 0)
  const daoMultiplier = ((1 + A) * (1 + C)) / (1 + B) / (1 + D)
  const buffMultiplier = 1 + n(jiaCheng)
  const reductionDivisor = n(powerReduction) + 1
  const vulnerabilityMultiplier = forcePath ? 1 + 0.1 * n(vulnerability) : 1
  const finalDamage = n(baseDamage) * daoMultiplier * buffMultiplier / reductionDivisor * vulnerabilityMultiplier
  const invalidTotal = n(attackerTotal) < n(attackerMain) || n(targetTotal) < n(targetMain)

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="font-serif">Thông số đòn đánh</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-5 sm:grid-cols-2">
                <NumberField id="base-damage" label="Sát thương gốc" value={baseDamage} onChange={setBaseDamage} description="Giá trị ShangHai trước khi qua Đạo ngân." />
                <NumberField id="jia-cheng" label="JiaCheng" value={jiaCheng} onChange={setJiaCheng} step="0.1" description="Hệ số cộng thêm từ buff trong source; 1 tương đương ×2." />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <NumberField id="attacker-main" label="Đạo ngân chính của người đánh" value={attackerMain} onChange={setAttackerMain} />
                <NumberField id="attacker-total" label="Tổng Đạo ngân người đánh" value={attackerTotal} onChange={setAttackerTotal} description="Biến daohen_zong; phải lớn hơn hoặc bằng Đạo ngân chính." />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <NumberField id="target-main" label="Đạo ngân cùng lưu phái trên mục tiêu" value={targetMain} onChange={setTargetMain} />
                <NumberField id="target-total" label="Tổng Đạo ngân mục tiêu" value={targetTotal} onChange={setTargetTotal} />
              </div>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-serif">Hiệu ứng bổ sung</CardTitle></CardHeader>
          <CardContent>
            <FieldGroup>
              <NumberField id="power-reduction" label="Amplifier Uy Lực Giảm Bán" value={powerReduction} onChange={setPowerReduction} description="Source chia cho amplifier + 1. Không có hiệu ứng nhập 0." />
              <Field orientation="horizontal" className="rounded-lg border p-4">
                <Switch id="force-path" checked={forcePath} onCheckedChange={setForcePath} />
                <div>
                  <FieldLabel htmlFor="force-path">Đòn thuộc nhánh Lực đạo</FieldLabel>
                  <FieldDescription>Chỉ nhánh LvDao và LvDao_zhenshang nhân thêm Dễ Tổn Thương.</FieldDescription>
                </div>
              </Field>
              {forcePath ? <NumberField id="vulnerability" label="Amplifier Dễ Tổn Thương" value={vulnerability} onChange={setVulnerability} description="Mỗi amplifier tăng 10% trong đúng hai nhánh Lực đạo." /> : null}
            </FieldGroup>
          </CardContent>
        </Card>

        {invalidTotal ? (
          <Alert variant="destructive"><InfoIcon /><AlertTitle>Tổng Đạo ngân không hợp lệ</AlertTitle><AlertDescription>Tổng Đạo ngân không thể nhỏ hơn Đạo ngân của lưu phái chính. Máy tính tạm xem phần lưu phái khác bằng 0.</AlertDescription></Alert>
        ) : null}
      </div>

      <div className="space-y-6 xl:sticky xl:top-20 xl:h-fit">
        <Card className="border-primary/30 bg-primary/[0.035]">
          <CardHeader>
            <Badge className="w-fit"><CalculatorIcon data-icon="inline-start" /> Kết quả</Badge>
            <CardTitle className="font-serif text-4xl text-primary">{format(finalDamage)} sát thương</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ResultRow label="Hệ số Đạo ngân" value={`×${format(daoMultiplier)}`} />
            <ResultRow label="Buff JiaCheng" value={`×${format(buffMultiplier)}`} />
            <ResultRow label="Uy Lực Giảm Bán" value={`÷${format(reductionDivisor)}`} />
            {forcePath ? <ResultRow label="Dễ Tổn Thương" value={`×${format(vulnerabilityMultiplier)}`} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-serif">Bốn biến trong source</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Factor name="A" value={A} description="Ưu thế chính đạo người đánh" />
            <Factor name="B" value={B} description="Tạp đạo phạt người đánh" />
            <Factor name="C" value={C} description="Cùng đạo trên mục tiêu" />
            <Factor name="D" value={D} description="Khác đạo trên mục tiêu" />
          </CardContent>
        </Card>

        <Alert>
          <InfoIcon />
          <AlertTitle>Công thức đã đối chiếu source</AlertTitle>
          <AlertDescription>
            Mỗi 1.000 Đạo ngân tạo 1 đơn vị hệ số. A và C nằm ở tử số; B và D nằm ở mẫu số. Cùng lưu phái trên mục tiêu làm đòn đó mạnh hơn, còn nhiều Đạo ngân khác lưu phái làm nó yếu đi.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

function NumberField({ id, label, value, onChange, description, step = "1" }: { id: string; label: string; value: string; onChange: (value: string) => void; description?: string; step?: string }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} type="number" min="0" step={step} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between rounded-lg border bg-background/70 px-4 py-3 text-sm"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>
}

function Factor({ name, value, description }: { name: string; value: number; description: string }) {
  return <div className="rounded-lg border p-3"><div className="font-mono text-lg font-semibold text-primary">{name} = {format(value)}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>
}
