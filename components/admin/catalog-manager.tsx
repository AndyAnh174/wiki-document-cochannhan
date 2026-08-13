"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { PencilIcon, PlusIcon, SearchIcon, UploadIcon } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { catalogKinds, type CatalogKind } from "@/lib/catalog-types"

type CatalogRow = {
  id: number
  kind: CatalogKind
  source_id: string
  name: string
  image_path: string | null
  category: string
  rank: string | null
  summary: string
  attributes: Array<[string, string]>
  details: string[]
  is_published: boolean
  updated_at: string
}

type CatalogForm = {
  id?: number
  kind: CatalogKind
  sourceId: string
  name: string
  category: string
  rank: string
  summary: string
  imagePath: string
  attributes: string
  details: string
  slots: string
  published: boolean
}

const emptyForm: CatalogForm = {
  kind: "gu",
  sourceId: "",
  name: "",
  category: "Chưa phân loại",
  rank: "",
  summary: "",
  imagePath: "",
  attributes: "",
  details: "",
  slots: "",
  published: true,
}

const kindLabels: Record<CatalogKind, string> = {
  gu: "Cổ trùng",
  "killer-moves": "Sát chiêu",
  equipment: "Trang bị",
  effects: "Hiệu ứng",
  creatures: "Sinh vật",
}

function parseAttributes(value: string): Array<[string, string]> {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.includes("|") ? "|" : "="
      const index = line.indexOf(separator)
      return index < 0
        ? [line, ""]
        : [line.slice(0, index).trim(), line.slice(index + 1).trim()]
    })
}

function parseLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

export function CatalogManager() {
  const [rows, setRows] = useState<CatalogRow[]>([])
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<CatalogKind>("gu")
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CatalogForm>(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [formError, setFormError] = useState("")
  const pageSize = 25

  const load = useCallback(async () => {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    setLoading(true)
    let request = supabase
      .from("catalog_entries")
      .select(
        "id,kind,source_id,name,image_path,category,rank,summary,attributes,details,is_published,updated_at",
        { count: "exact" }
      )
      .eq("kind", kind)
      .order("updated_at", { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1)
    if (query.trim())
      request = request.ilike("search_text", `%${query.trim()}%`)
    const { data, count, error } = await request
    setLoading(false)
    if (error) {
      toast.add({
        type: "error",
        title: "Không tải được nội dung",
        description: error.message,
      })
      return
    }
    setRows((data ?? []) as CatalogRow[])
    setTotal(count ?? 0)
  }, [kind, page, query])

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timeout)
  }, [load])

  function createNew() {
    setForm({ ...emptyForm, kind })
    setFile(null)
    setFormError("")
    setOpen(true)
  }

  async function edit(row: CatalogRow) {
    let slots = ""
    if (row.kind === "killer-moves") {
      const supabase = getBrowserSupabaseClient()
      if (!supabase) return
      const { data } = await supabase
        .from("killer_move_slots")
        .select("position,item_source_id,item_name")
        .eq("killer_move_id", row.id)
        .order("position")
      slots = (data ?? [])
        .map(
          (slot) =>
            `${slot.position} | ${slot.item_source_id} | ${slot.item_name}`
        )
        .join("\n")
    }
    setForm({
      id: row.id,
      kind: row.kind,
      sourceId: row.source_id,
      name: row.name,
      category: row.category,
      rank: row.rank ?? "",
      summary: row.summary,
      imagePath: row.image_path ?? "",
      attributes: row.attributes
        .map(([label, value]) => `${label} | ${value}`)
        .join("\n"),
      details: row.details.join("\n"),
      slots,
      published: row.is_published,
    })
    setFile(null)
    setFormError("")
    setOpen(true)
  }

  async function uploadImage() {
    if (!file) return form.imagePath || null
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return null
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-")
    const objectPath = `${form.kind}/${form.sourceId}/${Date.now()}-${safeName}`
    const { error } = await supabase.storage
      .from("wiki-assets")
      .upload(objectPath, file, { contentType: file.type, upsert: false })
    if (error) throw error
    return supabase.storage.from("wiki-assets").getPublicUrl(objectPath).data
      .publicUrl
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    if (!form.sourceId.trim() || !form.name.trim()) {
      setFormError("ID nguồn và tên là bắt buộc.")
      return
    }
    setSaving(true)
    setFormError("")
    try {
      const attributes = parseAttributes(form.attributes)
      const details = parseLines(form.details)
      const imagePath = await uploadImage()
      const payload = {
        kind: form.kind,
        source_id: form.sourceId.trim(),
        slug: form.sourceId.trim(),
        name: form.name.trim(),
        image_path: imagePath,
        category: form.category.trim() || "Chưa phân loại",
        rank: form.rank.trim() || null,
        summary: form.summary.trim(),
        attributes,
        details,
        is_published: form.published,
        published_at: form.published ? new Date().toISOString() : null,
      }
      const result = form.id
        ? await supabase
            .from("catalog_entries")
            .update(payload)
            .eq("id", form.id)
            .select("id")
            .single()
        : await supabase
            .from("catalog_entries")
            .insert(payload)
            .select("id")
            .single()
      if (result.error) throw result.error
      const entryId = result.data.id as number

      const cleanup = await Promise.all([
        supabase
          .from("catalog_entry_attributes")
          .delete()
          .eq("entry_id", entryId),
        supabase
          .from("catalog_entry_sections")
          .delete()
          .eq("entry_id", entryId),
        supabase.from("catalog_media").delete().eq("entry_id", entryId),
      ])
      const cleanupError = cleanup.find((item) => item.error)?.error
      if (cleanupError) throw cleanupError

      if (attributes.length) {
        const { error } = await supabase
          .from("catalog_entry_attributes")
          .insert(
            attributes.map(([label, value], sortOrder) => ({
              entry_id: entryId,
              label,
              value,
              sort_order: sortOrder,
            }))
          )
        if (error) throw error
      }
      if (details.length) {
        const { error } = await supabase.from("catalog_entry_sections").insert(
          details.map((body, sortOrder) => ({
            entry_id: entryId,
            body,
            sort_order: sortOrder,
          }))
        )
        if (error) throw error
      }
      if (imagePath) {
        const { error } = await supabase.from("catalog_media").insert({
          entry_id: entryId,
          path: imagePath,
          alt_text: form.name.trim(),
          is_primary: true,
          sort_order: 0,
        })
        if (error) throw error
      }

      if (form.kind === "killer-moves") {
        const { error: deleteError } = await supabase
          .from("killer_move_slots")
          .delete()
          .eq("killer_move_id", entryId)
        if (deleteError) throw deleteError
        const slots = parseLines(form.slots).map((line) => {
          const [position, itemSourceId, itemName] = line
            .split("|")
            .map((part) => part.trim())
          return {
            killer_move_id: entryId,
            position: Number(position),
            item_source_id: itemSourceId,
            item_name: itemName || itemSourceId,
          }
        })
        if (slots.length) {
          const { error } = await supabase
            .from("killer_move_slots")
            .insert(slots)
          if (error) throw error
        }
      }

      toast.add({
        type: "success",
        title: form.id ? "Đã cập nhật nội dung" : "Đã tạo nội dung",
      })
      setOpen(false)
      await load()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Không thể lưu nội dung."
      )
    } finally {
      setSaving(false)
    }
  }

  async function remove(row: CatalogRow) {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    const { error } = await supabase
      .from("catalog_entries")
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
    toast.add({ type: "success", title: "Đã xóa nội dung" })
    await load()
  }

  return (
    <Card>
      <CardHeader className="gap-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <CardTitle>Nội dung catalog</CardTitle>
            <CardDescription>
              CRUD cổ trùng, sát chiêu, trang bị, hiệu ứng và sinh vật.
            </CardDescription>
          </div>
          <Button onClick={createNew}>
            <PlusIcon data-icon="inline-start" /> Thêm nội dung
          </Button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Tìm tên, ID, mô tả…"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(0)
              }}
            />
          </div>
          <Select
            value={kind}
            onValueChange={(value) => {
              setKind(value as CatalogKind)
              setPage(0)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {catalogKinds.map((item) => (
                  <SelectItem key={item} value={item}>
                    {kindLabels[item]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Phân loại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <span className="flex items-center gap-2 py-8 text-muted-foreground">
                      <Spinner /> Đang tải…
                    </span>
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{row.name}</span>
                        <code className="text-xs text-muted-foreground">
                          {row.source_id}
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
                          onClick={() => void edit(row)}
                        >
                          <PencilIcon />
                          <span className="sr-only">Sửa {row.name}</span>
                        </Button>
                        <ConfirmDeleteDialog
                          label={row.name}
                          onConfirm={() => remove(row)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Không tìm thấy nội dung.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{total.toLocaleString("vi-VN")} mục</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((value) => value - 1)}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(page + 1) * pageSize >= total}
              onClick={() => setPage((value) => value + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Sửa nội dung" : "Thêm nội dung"}
            </DialogTitle>
            <DialogDescription>
              Các trường JSON cũ và bảng chuẩn hóa sẽ được đồng bộ cùng lúc.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="flex flex-col gap-6">
            <FieldGroup>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Loại</FieldLabel>
                  <Select
                    value={form.kind}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        kind: value as CatalogKind,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {catalogKinds.map((item) => (
                          <SelectItem key={item} value={item}>
                            {kindLabels[item]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
                <Field data-invalid={Boolean(formError) || undefined}>
                  <FieldLabel htmlFor="catalog-source-id">ID nguồn</FieldLabel>
                  <Input
                    id="catalog-source-id"
                    value={form.sourceId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sourceId: event.target.value,
                      }))
                    }
                    aria-invalid={Boolean(formError)}
                    disabled={Boolean(form.id)}
                    required
                  />
                  <FieldDescription>
                    Ví dụ: e_nian_gu, không gồm namespace.
                  </FieldDescription>
                </Field>
              </div>
              <Field data-invalid={Boolean(formError) || undefined}>
                <FieldLabel htmlFor="catalog-name">Tên</FieldLabel>
                <Input
                  id="catalog-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(formError)}
                  required
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="catalog-category">
                    Phân loại/Lưu phái
                  </FieldLabel>
                  <Input
                    id="catalog-category"
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
                  <FieldLabel htmlFor="catalog-rank">Cấp chuyển</FieldLabel>
                  <Input
                    id="catalog-rank"
                    value={form.rank}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        rank: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="catalog-summary">Tóm tắt</FieldLabel>
                <Textarea
                  id="catalog-summary"
                  value={form.summary}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="catalog-image">Đường dẫn ảnh</FieldLabel>
                <Input
                  id="catalog-image"
                  value={form.imagePath}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      imagePath: event.target.value,
                    }))
                  }
                />
                <FieldDescription>
                  Có thể giữ ảnh local hiện có hoặc upload ảnh mới bên dưới.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="catalog-upload">
                  <UploadIcon /> Upload ảnh mới
                </FieldLabel>
                <Input
                  id="catalog-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="catalog-attributes">Thuộc tính</FieldLabel>
                <Textarea
                  id="catalog-attributes"
                  className="min-h-36 font-mono"
                  placeholder="Chuyển số | Tam chuyển\nLưu phái | Trí đạo"
                  value={form.attributes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      attributes: event.target.value,
                    }))
                  }
                />
                <FieldDescription>Mỗi dòng: Nhãn | Giá trị.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="catalog-details">
                  Mô tả chi tiết
                </FieldLabel>
                <Textarea
                  id="catalog-details"
                  className="min-h-36"
                  value={form.details}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      details: event.target.value,
                    }))
                  }
                />
                <FieldDescription>
                  Mỗi dòng là một đoạn nội dung.
                </FieldDescription>
              </Field>
              {form.kind === "killer-moves" ? (
                <Field>
                  <FieldLabel htmlFor="catalog-slots">Vị trí đặt Cổ</FieldLabel>
                  <Textarea
                    id="catalog-slots"
                    className="min-h-40 font-mono"
                    placeholder="1 | e_nian_gu | Ác Niệm Cổ"
                    value={form.slots}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        slots: event.target.value,
                      }))
                    }
                  />
                  <FieldDescription>
                    Mỗi dòng: vị trí | item ID | tên hiển thị.
                  </FieldDescription>
                </Field>
              ) : null}
              <Field orientation="horizontal">
                <FieldLabel htmlFor="catalog-published">
                  <FieldContent>
                    <span>Xuất bản</span>
                    <FieldDescription>
                      Người đọc chỉ thấy nội dung đã xuất bản.
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id="catalog-published"
                    checked={form.published}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({ ...current, published: checked }))
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
                {saving ? <Spinner data-icon="inline-start" /> : null}
                {form.id ? "Lưu thay đổi" : "Tạo nội dung"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
