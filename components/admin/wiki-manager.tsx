"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { BookOpenIcon, PencilIcon, PlusIcon, SearchIcon } from "lucide-react"

import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { getBrowserSupabaseClient } from "@/lib/supabase/client"

type WikiRow = {
  id: number
  slug: string
  title: string
  category: string
  description: string
  content: string
  chapter_index: number
  is_published: boolean
  updated_at: string
}

type WikiForm = Omit<WikiRow, "id" | "updated_at"> & { id?: number }

const emptyForm: WikiForm = {
  slug: "",
  title: "",
  category: "Tài liệu",
  description: "",
  content: "",
  chapter_index: 0,
  is_published: true,
}

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function WikiManager() {
  const [rows, setRows] = useState<WikiRow[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<WikiForm>(emptyForm)
  const [formError, setFormError] = useState("")

  const load = useCallback(async () => {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    setLoading(true)
    let request = supabase
      .from("wiki_chapters")
      .select(
        "id,slug,title,category,description,content,chapter_index,is_published,updated_at"
      )
      .neq("slug", "faq")
      .order("chapter_index")
    if (query.trim())
      request = request.or(
        `title.ilike.%${query.trim()}%,slug.ilike.%${query.trim()}%,category.ilike.%${query.trim()}%`
      )
    const { data, error } = await request
    setLoading(false)
    if (error) {
      toast.add({
        type: "error",
        title: "Không tải được Wiki",
        description: error.message,
      })
      return
    }
    setRows((data ?? []) as WikiRow[])
  }, [query])

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timeout)
  }, [load])

  function createNew() {
    setForm({ ...emptyForm, chapter_index: rows.length })
    setFormError("")
    setOpen(true)
  }

  function edit(row: WikiRow) {
    setForm({ ...row })
    setFormError("")
    setOpen(true)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    if (!form.slug.trim() || !form.title.trim()) {
      setFormError("Slug và tiêu đề là bắt buộc.")
      return
    }
    setSaving(true)
    setFormError("")
    const payload = {
      slug: form.slug.trim(),
      title: form.title.trim(),
      category: form.category.trim() || "Tài liệu",
      description: form.description.trim(),
      content: form.content,
      chapter_index: Number(form.chapter_index) || 0,
      is_published: form.is_published,
    }
    const { error } = form.id
      ? await supabase.from("wiki_chapters").update(payload).eq("id", form.id)
      : await supabase.from("wiki_chapters").insert(payload)
    setSaving(false)
    if (error) {
      setFormError(error.message)
      return
    }
    toast.add({
      type: "success",
      title: form.id ? "Đã cập nhật chương Wiki" : "Đã tạo chương Wiki",
    })
    setOpen(false)
    await load()
  }

  async function remove(row: WikiRow) {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    const { error } = await supabase
      .from("wiki_chapters")
      .delete()
      .eq("id", row.id)
    if (error) {
      toast.add({
        type: "error",
        title: "Xóa thất bại",
        description: error.message,
      })
      return
    }
    toast.add({ type: "success", title: "Đã xóa chương Wiki" })
    await load()
  }

  return (
    <Card>
      <CardHeader className="gap-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <CardTitle>Chương Wiki</CardTitle>
            <CardDescription>
              Soạn Markdown, phân loại, sắp thứ tự và xuất bản tài liệu.
            </CardDescription>
          </div>
          <Button onClick={createNew}>
            <PlusIcon data-icon="inline-start" /> Thêm chương
          </Button>
        </div>
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm tiêu đề, slug hoặc nhóm…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">STT</TableHead>
                <TableHead>Chương</TableHead>
                <TableHead>Nhóm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <span className="flex items-center gap-2 py-8 text-muted-foreground">
                      <Spinner /> Đang tải…
                    </span>
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.chapter_index}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{row.title}</span>
                        <code className="text-xs text-muted-foreground">
                          /{row.slug}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>
                      <Badge
                        variant={row.is_published ? "secondary" : "outline"}
                      >
                        {row.is_published ? "Công khai" : "Bản nháp"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => edit(row)}
                        >
                          <PencilIcon />
                          <span className="sr-only">Sửa {row.title}</span>
                        </Button>
                        <ConfirmDeleteDialog
                          label={row.title}
                          onConfirm={() => remove(row)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Không tìm thấy chương Wiki.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Sửa chương Wiki" : "Thêm chương Wiki"}
            </DialogTitle>
            <DialogDescription>
              Nội dung hỗ trợ Markdown và bảng GitHub Flavored Markdown.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="flex flex-col gap-6">
            <FieldGroup>
              <Field data-invalid={Boolean(formError) || undefined}>
                <FieldLabel htmlFor="wiki-title">Tiêu đề</FieldLabel>
                <Input
                  id="wiki-title"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                      slug: current.id
                        ? current.slug
                        : toSlug(event.target.value),
                    }))
                  }
                  aria-invalid={Boolean(formError)}
                  required
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
                <Field data-invalid={Boolean(formError) || undefined}>
                  <FieldLabel htmlFor="wiki-slug">Slug</FieldLabel>
                  <Input
                    id="wiki-slug"
                    className="font-mono"
                    value={form.slug}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        slug: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(formError)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="wiki-index">Thứ tự</FieldLabel>
                  <Input
                    id="wiki-index"
                    type="number"
                    value={form.chapter_index}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        chapter_index: Number(event.target.value),
                      }))
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="wiki-category">Nhóm</FieldLabel>
                <Input
                  id="wiki-category"
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="wiki-description">Mô tả ngắn</FieldLabel>
                <Textarea
                  id="wiki-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="wiki-content">
                  Nội dung Markdown
                </FieldLabel>
                <Textarea
                  id="wiki-content"
                  className="min-h-[420px] font-mono"
                  value={form.content}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                />
                <FieldDescription>
                  Có thể dùng tiêu đề, bảng, danh sách, code block và liên kết.
                </FieldDescription>
              </Field>
              <Field orientation="horizontal">
                <FieldLabel htmlFor="wiki-published">
                  <FieldContent>
                    <span>Xuất bản</span>
                    <FieldDescription>
                      Tắt để giữ chương ở trạng thái bản nháp.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="wiki-published"
                    checked={form.is_published}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        is_published: checked,
                      }))
                    }
                  />
                </FieldLabel>
              </Field>
              {formError ? <FieldError>{formError}</FieldError> : null}
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <BookOpenIcon data-icon="inline-start" />
                )}
                {form.id ? "Lưu thay đổi" : "Tạo chương"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
