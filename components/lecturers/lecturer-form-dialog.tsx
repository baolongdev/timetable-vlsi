"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { getInitials, getPersonColor } from "@/lib/person-color"
import { cn } from "@/lib/utils"
import {
  LECTURER_ROLES,
  type Lecturer,
  type LecturerRole,
} from "@/types/lecturer"

type LecturerFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lecturer: Lecturer | null
  onSubmit: (data: Omit<Lecturer, "id"> & { id?: string }) => void
}

type FormState = {
  name: string
  role: LecturerRole
  email: string
  phone: string
  note: string
}

const emptyForm: FormState = {
  name: "",
  role: "Giảng viên",
  email: "",
  phone: "",
  note: "",
}

function OptionalTag() {
  return (
    <span className="text-[11px] font-normal text-muted-foreground">
      · tùy chọn
    </span>
  )
}

export function LecturerFormDialog({
  open,
  onOpenChange,
  lecturer,
  onSubmit,
}: LecturerFormDialogProps) {
  const isEdit = Boolean(lecturer)
  const [form, setForm] = React.useState<FormState>(emptyForm)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    if (lecturer) {
      setForm({
        name: lecturer.name,
        role: lecturer.role,
        email: lecturer.email ?? "",
        phone: lecturer.phone ?? "",
        note: lecturer.note ?? "",
      })
    } else {
      setForm(emptyForm)
    }
    setError(null)
  }, [open, lecturer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    if (!name) {
      setError("Vui lòng nhập họ tên giảng viên.")
      return
    }
    onSubmit({
      id: lecturer?.id,
      name,
      role: form.role,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      note: form.note.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5 p-6">
            <DialogHeader className="gap-1.5">
              <div className="flex items-center gap-3">
                {isEdit ? (
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                      getPersonColor(form.name || lecturer?.name || "?").bg,
                      getPersonColor(form.name || lecturer?.name || "?").text,
                      getPersonColor(form.name || lecturer?.name || "?").border
                    )}
                    aria-hidden
                  >
                    {getInitials(form.name || lecturer?.name || "?")}
                  </span>
                ) : null}
                <div className="flex flex-col gap-1">
                  <DialogTitle className="text-lg font-semibold tracking-tight">
                    {isEdit ? "Chỉnh sửa giảng viên" : "Thêm giảng viên"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEdit
                      ? "Cập nhật thông tin giảng viên."
                      : "Nhập thông tin giảng viên mới."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lecturer-name">Họ và tên</Label>
                <Input
                  id="lecturer-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="VD: Trần Ngọc Thịnh"
                  className="h-10 rounded-xl"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Chức vụ / vai trò</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => {
                    if (value)
                      setForm((f) => ({
                        ...f,
                        role: value as LecturerRole,
                      }))
                  }}
                >
                  <SelectTrigger className="h-10 w-full rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {LECTURER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lecturer-email">
                    Email <OptionalTag />
                  </Label>
                  <Input
                    id="lecturer-email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="ten@hcmut.edu.vn"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lecturer-phone">
                    Điện thoại <OptionalTag />
                  </Label>
                  <Input
                    id="lecturer-phone"
                    type="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="09xx xxx xxx"
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lecturer-note">
                  Ghi chú <OptionalTag />
                </Label>
                <Textarea
                  id="lecturer-note"
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                  placeholder="VD: Phụ trách hướng nghiên cứu hệ thống nhúng…"
                  className="min-h-20 rounded-xl"
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 border-t border-border/60 bg-muted/30 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" className="rounded-xl">
              {isEdit ? "Lưu thay đổi" : "Thêm giảng viên"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
