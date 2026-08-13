"use client"
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { CircleHelpIcon, ImageIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

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
  faq_media: FaqMedia[]
}

type FaqMedia = {
  id: number
  object_path: string
  alt_text: string
  sort_order: number
}

type FaqForm = Omit<FaqRow, "id" | "updated_at" | "faq_media"> & { id?: number }

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
  const [media, setMedia] = useState<FaqMedia[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [fileInputKey, setFileInputKey] = useState(0)

  const load = useCallback(async () => {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    setLoading(true)
    const { data, error } = await supabase
      .from("faq_entries")
      .select("id,question,answer,category,sort_order,is_published,updated_at,faq_media(id,object_path,alt_text,sort_order)")
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
    setMedia([])
    setFiles([])
    setFileInputKey((value) => value + 1)
    setOpen(true)
  }

  function edit(row: FaqRow) {
    setForm({ ...row })
    setFormError("")
    setMedia([...row.faq_media].sort((left, right) => left.sort_order - right.sort_order))
    setFiles([])
    setFileInputKey((value) => value + 1)
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
    let faqId = form.id
    let saveError
    if (faqId) {
      const result = await supabase.from("faq_entries").update(payload).eq("id", faqId)
      saveError = result.error
    } else {
      const result = await supabase.from("faq_entries").insert(payload).select("id").single()
      saveError = result.error
      faqId = result.data?.id
    }
    if (!saveError && faqId && files.length) {
      for (const [index, file] of files.entries()) {
        const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-")
        const objectPath = `faq/${faqId}/${crypto.randomUUID()}-${safeName}`
        const upload = await supabase.storage.from("wiki-assets").upload(objectPath, file, {
          cacheControl: "3600",
          upsert: false,
        })
        if (upload.error) {
          saveError = upload.error
          break
        }
        const inserted = await supabase.from("faq_media").insert({
          faq_id: faqId,
          object_path: objectPath,
          alt_text: form.question.trim(),
          sort_order: media.length + index,
        })
        if (inserted.error) {
          await supabase.storage.from("wiki-assets").remove([objectPath])
          saveError = inserted.error
          break
        }
      }
    }
    setSaving(false)
    if (saveError) {
      setFormError(saveError.message)
      return
    }
    toast.add({ type: "success", title: form.id ? "Đã cập nhật FAQ" : "Đã thêm câu hỏi" })
    setOpen(false)
    await load()
  }

  async function remove(row: FaqRow) {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    if (row.faq_media.length) {
      const storageError = await supabase.storage
        .from("wiki-assets")
        .remove(row.faq_media.map((item) => item.object_path))
      if (storageError.error) {
        toast.add({ type: "error", title: "Không xóa được ảnh FAQ", description: storageError.error.message })
        return
      }
    }
    const { error } = await supabase.from("faq_entries").delete().eq("id", row.id)
    if (error) {
      toast.add({ type: "error", title: "Xóa FAQ thất bại", description: error.message })
      return
    }
    toast.add({ type: "success", title: "Đã xóa câu hỏi" })
    await load()
  }

  async function removeMedia(item: FaqMedia) {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    const storageResult = await supabase.storage.from("wiki-assets").remove([item.object_path])
    if (storageResult.error) {
      setFormError(storageResult.error.message)
      return
    }
    const { error } = await supabase.from("faq_media").delete().eq("id", item.id)
    if (error) {
      setFormError(error.message)
      return
    }
    setMedia((current) => current.filter((mediaItem) => mediaItem.id !== item.id))
    toast.add({ type: "success", title: "Đã xóa ảnh khỏi FAQ" })
    await load()
  }

  const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "")

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
            <TableHeader><TableRow><TableHead className="w-16">STT</TableHead><TableHead>Câu hỏi</TableHead><TableHead>Nhóm</TableHead><TableHead>Ảnh</TableHead><TableHead>Trạng thái</TableHead><TableHead className="w-24 text-right">Thao tác</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6}><span className="flex items-center gap-2 py-8 text-muted-foreground"><Spinner /> Đang tải…</span></TableCell></TableRow>
              ) : rows.length ? rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.sort_order}</TableCell>
                  <TableCell className="max-w-xl font-medium">{row.question}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell><Badge variant="outline"><ImageIcon data-icon="inline-start" /> {row.faq_media.length}</Badge></TableCell>
                  <TableCell><Badge variant={row.is_published ? "secondary" : "outline"}>{row.is_published ? "Công khai" : "Bản nháp"}</Badge></TableCell>
                  <TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon-sm" onClick={() => edit(row)}><PencilIcon /><span className="sr-only">Sửa {row.question}</span></Button><ConfirmDeleteDialog label={row.question} onConfirm={() => remove(row)} /></div></TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Chưa có câu hỏi nào.</TableCell></TableRow>
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
              <Field>
                <FieldLabel htmlFor="faq-images">Hình ảnh</FieldLabel>
                <Input
                  key={fileInputKey}
                  id="faq-images"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
                />
                <FieldDescription>Chọn cùng lúc nhiều ảnh. Không giới hạn số ảnh cho một FAQ; mỗi ảnh tối đa 10 MB.</FieldDescription>
                {files.length ? <p className="text-sm text-muted-foreground">Đã chọn {files.length} ảnh mới.</p> : null}
                {media.length && storageUrl ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {media.map((item) => (
                      <div key={item.id} className="flex flex-col gap-2 rounded-lg border p-2">
                        <img src={`${storageUrl}/storage/v1/object/public/wiki-assets/${item.object_path.split("/").map(encodeURIComponent).join("/")}`} alt={item.alt_text || form.question} className="h-32 w-full rounded-md object-contain" />
                        <Button type="button" variant="outline" size="sm" onClick={() => void removeMedia(item)}><Trash2Icon data-icon="inline-start" /> Xóa ảnh</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><ImageIcon /> Chưa có ảnh đã lưu.</div>
                )}
              </Field>
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
