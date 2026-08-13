"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { CircleHelpIcon, PencilIcon, PlusIcon } from "lucide-react"

import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { getBrowserSupabaseClient } from "@/lib/supabase/client"

type FaqRow = {
  id: number
  question: string
  answer: string
  category: string
  sort_order: number
  is_published: boolean
  updated_at: string
}

type FaqForm = Omit<FaqRow, "id" | "updated_at"> & { id?: number }

const emptyForm: FaqForm = {
  question: "",
  answer: "",
  category: "Chung",
  sort_order: 0,
  is_published: true,
}

export function FaqManager() {
  const [rows, setRows] = useState<FaqRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FaqForm>(emptyForm)
  const [formError, setFormError] = useState("")

  const load = useCallback(async () => {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from("faq_entries")
      .select("id,question,answer,category,sort_order,is_published,updated_at")
      .order("sort_order")
      .order("id")
    setLoading(false)
    if (error) {
      toast.add({ type: "error", title: "Không tải được FAQ", description: error.message })
      return
    }
    setRows((data ?? []) as FaqRow[])
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timeout)
  }, [load])

  function createNew() {
    setForm({ ...emptyForm, sort_order: (rows.at(-1)?.sort_order ?? 0) + 10 })
    setFormError("")
    setOpen(true)
  }

  function edit(row: FaqRow) {
    setForm({ ...row })
    setFormError("")
    setOpen(true)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    if (!form.question.trim() || !form.answer.trim()) {
      setFormError("Câu hỏi và câu trả lời là bắt buộc.")
      return
    }
    setSaving(true)
    setFormError("")
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: form.category.trim() || "Chung",
      sort_order: Number(form.sort_order) || 0,
      is_published: form.is_published,
    }
    const { error } = form.id
      ? await supabase.from("faq_entries").update(payload).eq("id", form.id)
      : await supabase.from("faq_entries").insert(payload)
    setSaving(false)
    if (error) {
      setFormError(error.message)
      return
    }
    toast.add({ type: "success", title: form.id ? "Đã cập nhật FAQ" : "Đã thêm câu hỏi" })
    setOpen(false)
    await load()
  }

  async function remove(row: FaqRow) {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    const { error } = await supabase.from("faq_entries").delete().eq("id", row.id)
    if (error) {
      toast.add({ type: "error", title: "Xóa FAQ thất bại", description: error.message })
      return
    }
    toast.add({ type: "success", title: "Đã xóa câu hỏi" })
    await load()
  }

  return (
    <Card>
      <CardHeader className="gap-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <CardTitle>FAQ</CardTitle>
            <CardDescription>Thêm, sửa, sắp xếp và xuất bản câu hỏi thường gặp từ Supabase.</CardDescription>
          </div>
          <Button onClick={createNew}><PlusIcon data-icon="inline-start" /> Thêm câu hỏi</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead className="w-16">STT</TableHead><TableHead>Câu hỏi</TableHead><TableHead>Nhóm</TableHead><TableHead>Trạng thái</TableHead><TableHead className="w-24 text-right">Thao tác</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5}><span className="flex items-center gap-2 py-8 text-muted-foreground"><Spinner /> Đang tải…</span></TableCell></TableRow>
              ) : rows.length ? rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.sort_order}</TableCell>
                  <TableCell className="max-w-xl font-medium">{row.question}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell><Badge variant={row.is_published ? "secondary" : "outline"}>{row.is_published ? "Công khai" : "Bản nháp"}</Badge></TableCell>
                  <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" onClick={() => edit(row)}><PencilIcon /><span className="sr-only">Sửa {row.question}</span></Button><ConfirmDeleteDialog label={row.question} onConfirm={() => remove(row)} /></div></TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">Chưa có câu hỏi nào.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>{form.id ? "Sửa câu hỏi" : "Thêm câu hỏi"}</DialogTitle><DialogDescription>Câu trả lời hỗ trợ Markdown, danh sách, liên kết và code.</DialogDescription></DialogHeader>
          <form onSubmit={save} className="flex flex-col gap-6">
            <FieldGroup>
              <Field data-invalid={Boolean(formError) || undefined}><FieldLabel htmlFor="faq-question">Câu hỏi</FieldLabel><Input id="faq-question" value={form.question} onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))} aria-invalid={Boolean(formError)} required /></Field>
              <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
                <Field><FieldLabel htmlFor="faq-category">Nhóm</FieldLabel><Input id="faq-category" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} /></Field>
                <Field><FieldLabel htmlFor="faq-order">Thứ tự</FieldLabel><Input id="faq-order" type="number" value={form.sort_order} onChange={(event) => setForm((current) => ({ ...current, sort_order: Number(event.target.value) }))} /></Field>
              </div>
              <Field data-invalid={Boolean(formError) || undefined}><FieldLabel htmlFor="faq-answer">Câu trả lời</FieldLabel><Textarea id="faq-answer" className="min-h-64 font-mono" value={form.answer} onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))} aria-invalid={Boolean(formError)} required /><FieldDescription>Dùng Markdown để in đậm, tạo danh sách, bảng hoặc liên kết.</FieldDescription></Field>
              <Field orientation="horizontal"><FieldLabel htmlFor="faq-published"><FieldContent><span>Xuất bản</span><FieldDescription>Tắt để giữ câu hỏi ở trạng thái bản nháp.</FieldDescription></FieldContent><Switch id="faq-published" checked={form.is_published} onCheckedChange={(checked) => setForm((current) => ({ ...current, is_published: checked }))} /></FieldLabel></Field>
              {formError ? <FieldError>{formError}</FieldError> : null}
            </FieldGroup>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit" disabled={saving}>{saving ? <Spinner data-icon="inline-start" /> : <CircleHelpIcon data-icon="inline-start" />}{form.id ? "Lưu thay đổi" : "Tạo câu hỏi"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
