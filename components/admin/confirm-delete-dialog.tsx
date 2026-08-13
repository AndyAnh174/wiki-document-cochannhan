"use client"

import { Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function ConfirmDeleteDialog({
  label,
  disabled,
  onConfirm,
}: {
  label: string
  disabled?: boolean
  onConfirm: () => void | Promise<void>
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" disabled={disabled} />}
      >
        <Trash2Icon />
        <span className="sr-only">Xóa {label}</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa “{label}”?</DialogTitle>
          <DialogDescription>
            Dữ liệu liên quan sẽ bị xóa theo. Thao tác này không thể hoàn tác từ
            trang quản trị.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Hủy</DialogClose>
          <DialogClose
            render={<Button variant="destructive" onClick={onConfirm} />}
          >
            <Trash2Icon data-icon="inline-start" /> Xóa
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
