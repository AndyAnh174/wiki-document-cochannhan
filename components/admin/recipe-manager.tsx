"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import {
  FlaskConicalIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"

import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog"
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
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

type RecipeRow = {
  id: number
  source_id: string
  name: string
  summary: string
  updated_at: string
}

type RecipeForm = {
  id?: number
  sourceId: string
  name: string
  summary: string
  components: string
  outputs: string
}

const emptyForm: RecipeForm = {
  sourceId: "",
  name: "",
  summary: "",
  components: "",
  outputs: "",
}

function lines(value: string) {
  return value
    .split(/[\n,]/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function RecipeManager() {
  const [rows, setRows] = useState<RecipeRow[]>([])
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<RecipeForm>(emptyForm)
  const [formError, setFormError] = useState("")
  const pageSize = 25

  const load = useCallback(async () => {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    setLoading(true)
    let request = supabase
      .from("recipes")
      .select("id,source_id,name,summary,updated_at", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1)
    if (query.trim())
      request = request.or(
        `name.ilike.%${query.trim()}%,source_id.ilike.%${query.trim()}%`
      )
    const { data, count, error } = await request
    setLoading(false)
    if (error) {
      toast.add({
        type: "error",
        title: "Không tải được Cổ phương",
        description: error.message,
      })
      return
    }
    setRows((data ?? []) as RecipeRow[])
    setTotal(count ?? 0)
  }, [page, query])

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(timeout)
  }, [load])

  function createNew() {
    setForm(emptyForm)
    setFormError("")
    setOpen(true)
  }

  async function edit(row: RecipeRow) {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    const [{ data: components }, { data: outputs }] = await Promise.all([
      supabase
        .from("recipe_components")
        .select("position,raw_text")
        .eq("recipe_id", row.id)
        .order("position"),
      supabase
        .from("recipe_outputs")
        .select("entry_id")
        .eq("recipe_id", row.id)
        .order("is_primary", { ascending: false }),
    ])
    const entryIds = (outputs ?? []).map((output) => output.entry_id)
    const { data: entries } = entryIds.length
      ? await supabase
          .from("catalog_entries")
          .select("id,source_id")
          .in("id", entryIds)
      : { data: [] }
    const sourceById = new Map(
      (entries ?? []).map((entry) => [entry.id, entry.source_id])
    )
    setForm({
      id: row.id,
      sourceId: row.source_id,
      name: row.name,
      summary: row.summary,
      components: (components ?? [])
        .map((component) => component.raw_text)
        .join("\n"),
      outputs: entryIds
        .map((id) => sourceById.get(id))
        .filter(Boolean)
        .join("\n"),
    })
    setFormError("")
    setOpen(true)
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    if (!form.sourceId.trim() || !form.name.trim()) {
      setFormError("ID nguồn và tên Cổ phương là bắt buộc.")
      return
    }
    setSaving(true)
    setFormError("")
    try {
      const payload = {
        source_id: form.sourceId.trim(),
        name: form.name.trim(),
        summary: form.summary.trim(),
      }
      const result = form.id
        ? await supabase
            .from("recipes")
            .update(payload)
            .eq("id", form.id)
            .select("id")
            .single()
        : await supabase.from("recipes").insert(payload).select("id").single()
      if (result.error) throw result.error
      const recipeId = result.data.id as number

      const [{ error: componentDeleteError }, { error: outputDeleteError }] =
        await Promise.all([
          supabase.from("recipe_components").delete().eq("recipe_id", recipeId),
          supabase.from("recipe_outputs").delete().eq("recipe_id", recipeId),
        ])
      if (componentDeleteError) throw componentDeleteError
      if (outputDeleteError) throw outputDeleteError

      const components = form.components
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean)
      if (components.length) {
        const { error } = await supabase.from("recipe_components").insert(
          components.map((rawText, index) => ({
            recipe_id: recipeId,
            position: index + 1,
            raw_text: rawText,
          }))
        )
        if (error) throw error
      }

      const outputIds = lines(form.outputs)
      if (outputIds.length) {
        const { data: entries, error: entryError } = await supabase
          .from("catalog_entries")
          .select("id,source_id")
          .eq("kind", "gu")
          .in("source_id", outputIds)
        if (entryError) throw entryError
        const found = new Set((entries ?? []).map((entry) => entry.source_id))
        const missing = outputIds.filter((id) => !found.has(id))
        if (missing.length)
          throw new Error(`Không tìm thấy Cổ: ${missing.join(", ")}`)
        const { error } = await supabase.from("recipe_outputs").insert(
          (entries ?? []).map((entry, index) => ({
            recipe_id: recipeId,
            entry_id: entry.id,
            is_primary: index === 0,
            match_method: "manual",
            confidence: 100,
          }))
        )
        if (error) throw error
      }

      toast.add({
        type: "success",
        title: form.id ? "Đã cập nhật Cổ phương" : "Đã tạo Cổ phương",
      })
      setOpen(false)
      await load()
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Không thể lưu Cổ phương."
      )
    } finally {
      setSaving(false)
    }
  }

  async function remove(row: RecipeRow) {
    const supabase = getBrowserSupabaseClient()
    if (!supabase) return
    const { error } = await supabase.from("recipes").delete().eq("id", row.id)
    if (error) {
      toast.add({
        type: "error",
        title: "Xóa thất bại",
        description: error.message,
      })
      return
    }
    toast.add({ type: "success", title: "Đã xóa Cổ phương" })
    await load()
  }

  return (
    <Card>
      <CardHeader className="gap-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <CardTitle>Cổ phương</CardTitle>
            <CardDescription>
              Mỗi công thức chỉ lưu một lần, có thể nối với nhiều Cổ đầu ra.
            </CardDescription>
          </div>
          <Button onClick={createNew}>
            <PlusIcon data-icon="inline-start" /> Thêm Cổ phương
          </Button>
        </div>
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Tìm tên hoặc ID Cổ phương…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(0)
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cổ phương</TableHead>
                <TableHead>Tóm tắt</TableHead>
                <TableHead className="w-24 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3}>
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
                    <TableCell className="max-w-md truncate">
                      {row.summary}
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
                    colSpan={3}
                    className="py-12 text-center text-muted-foreground"
                  >
                    Không tìm thấy Cổ phương.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{total.toLocaleString("vi-VN")} Cổ phương</span>
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Sửa Cổ phương" : "Thêm Cổ phương"}
            </DialogTitle>
            <DialogDescription>
              Nguyên liệu giữ nguyên từng dòng gốc; đầu ra dùng ID của Cổ trùng.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="flex flex-col gap-6">
            <FieldGroup>
              <Field data-invalid={Boolean(formError) || undefined}>
                <FieldLabel htmlFor="recipe-source-id">ID nguồn</FieldLabel>
                <Input
                  id="recipe-source-id"
                  value={form.sourceId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sourceId: event.target.value,
                    }))
                  }
                  disabled={Boolean(form.id)}
                  aria-invalid={Boolean(formError)}
                  required
                />
              </Field>
              <Field data-invalid={Boolean(formError) || undefined}>
                <FieldLabel htmlFor="recipe-name">Tên</FieldLabel>
                <Input
                  id="recipe-name"
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
              <Field>
                <FieldLabel htmlFor="recipe-summary">Tóm tắt</FieldLabel>
                <Textarea
                  id="recipe-summary"
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
                <FieldLabel htmlFor="recipe-components">Nguyên liệu</FieldLabel>
                <Textarea
                  id="recipe-components"
                  className="min-h-56"
                  value={form.components}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      components: event.target.value,
                    }))
                  }
                />
                <FieldDescription>
                  Mỗi dòng là một nguyên liệu hoặc một bước cho vào lò.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="recipe-outputs">Cổ đầu ra</FieldLabel>
                <Textarea
                  id="recipe-outputs"
                  className="min-h-28 font-mono"
                  placeholder="e_nian_gu\ne_nian_gu_5"
                  value={form.outputs}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      outputs: event.target.value,
                    }))
                  }
                />
                <FieldDescription>
                  Mỗi dòng là source_id của một Cổ trùng.
                </FieldDescription>
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
                  <FlaskConicalIcon data-icon="inline-start" />
                )}
                {form.id ? "Lưu thay đổi" : "Tạo Cổ phương"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
