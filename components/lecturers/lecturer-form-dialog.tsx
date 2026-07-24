"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox"
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
import { useDepartments } from "@/lib/department-store"
import { getInitials, getPersonColor } from "@/lib/person-color"
import { cn } from "@/lib/utils"
import {
  LECTURER_ROLES,
  type Lecturer,
  type LecturerRole,
} from "@/types/lecturer"

function DeptMultiSelect({
  value,
  excludeId,
  onValueChange,
  placeholder,
}: {
  value: string[]
  excludeId?: string
  onValueChange: (value: string[]) => void
  placeholder: string
}) {
  const { departments } = useDepartments()
  const anchor = useComboboxAnchor()

  const items = departments
    .filter((d) => d.id !== excludeId)
    .map((d) => d.name)

  const idToName = React.useMemo(
    () => new Map(departments.map((d) => [d.id, d.name])),
    [departments]
  )
  const nameToId = React.useMemo(
    () => new Map(departments.map((d) => [d.name, d.id])),
    [departments]
  )

  const selectedNames = value
    .map((id) => idToName.get(id) ?? id)
    .filter((n) => items.includes(n))

  return (
    <Combobox
      multiple
      autoHighlight
      items={items}
      value={selectedNames}
      onValueChange={(names) => {
        const ids = (names as string[])
          .map((n) => nameToId.get(n) ?? n)
          .filter((id) => id !== excludeId)
        onValueChange(ids)
      }}
    >
      <ComboboxChips ref={anchor} className="w-full rounded-xl">
        <ComboboxValue>
          {(values: string[]) => (
            <React.Fragment>
              {values.map((name) => (
                <ComboboxChip key={name}>{name}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={placeholder} />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent
        anchor={anchor}
        className="w-auto min-w-(--anchor-width) max-w-80"
      >
        <ComboboxEmpty>Không tìm thấy bộ môn.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem
              key={item}
              value={item}
              className="whitespace-nowrap"
            >
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

type LecturerFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lecturer: Lecturer | null
  /** Khoa mặc định khi thêm mới (từ URL dept param) */
  defaultDepartmentId?: string
  onSubmit: (data: Omit<Lecturer, "id"> & { id?: string }) => void
}

type FormState = {
  name: string
  role: LecturerRole
  departmentId: string
  guestDepartmentIds: string[]
  staffId: string
  email: string
  phone: string
  note: string
}

function buildEmptyForm(defaultDepartmentId?: string): FormState {
  return {
    name: "",
    role: "Giảng viên",
    departmentId: defaultDepartmentId ?? "",
    guestDepartmentIds: [],
    staffId: "",
    email: "",
    phone: "",
    note: "",
  }
}

export function LecturerFormDialog({
  open,
  onOpenChange,
  lecturer,
  defaultDepartmentId,
  onSubmit,
}: LecturerFormDialogProps) {
  const isEdit = Boolean(lecturer)
  const { departments } = useDepartments()
  const [form, setForm] = React.useState<FormState>(() =>
    buildEmptyForm(defaultDepartmentId)
  )
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (!open) return
    if (lecturer) {
      setForm({
        name: lecturer.name,
        role: lecturer.role,
        departmentId: lecturer.departmentId ?? "",
        guestDepartmentIds: lecturer.guestDepartmentIds ?? [],
        staffId: lecturer.staffId ?? "",
        email: lecturer.email ?? "",
        phone: lecturer.phone ?? "",
        note: lecturer.note ?? "",
      })
    } else {
      setForm(buildEmptyForm(defaultDepartmentId))
    }
    setErrors({})
  }, [open, lecturer, defaultDepartmentId])

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Vui lòng nhập họ tên giảng viên."
    if (!form.departmentId && form.guestDepartmentIds.length === 0)
      e.departmentId =
        "Chọn ít nhất một bộ môn (chính hoặc thỉnh giảng)."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      id: lecturer?.id,
      name: form.name.trim(),
      role: form.role,
      departmentId: form.departmentId,
      guestDepartmentIds: form.guestDepartmentIds,
      staffId: form.staffId.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      note: form.note.trim() || undefined,
    })
    onOpenChange(false)
  }

  const toggleGuestDept = (deptId: string) => {
    setForm((f) => ({
      ...f,
      guestDepartmentIds: f.guestDepartmentIds.includes(deptId)
        ? f.guestDepartmentIds.filter((id) => id !== deptId)
        : [...f.guestDepartmentIds, deptId],
    }))
  }

  const deptItems = departments
    .filter((d) => d.id !== form.departmentId)
    .map((d) => ({ id: d.id, name: d.name }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-6">
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
                <Label htmlFor="lecturer-name">
                  Họ và tên <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lecturer-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="VD: Trần Ngọc Thịnh"
                  className={cn(
                    "h-10 rounded-xl",
                    errors.name && "border-destructive"
                  )}
                  autoFocus
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>Bộ môn chính</Label>
                  <Select
                    value={form.departmentId || "__empty__"}
                    onValueChange={(value) => {
                      if (value === "__empty__") {
                        setForm((f) => ({ ...f, departmentId: "" }))
                      } else if (value) {
                        setForm((f) => ({
                          ...f,
                          departmentId: value,
                          guestDepartmentIds: f.guestDepartmentIds.filter(
                            (id) => id !== value
                          ),
                        }))
                      }
                    }}
                    items={[
                      { label: "Chỉ thỉnh giảng", value: "__empty__" },
                      ...departments.map((d) => ({
                        label: d.name,
                        value: d.id,
                      })),
                    ]}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-10 w-full rounded-xl",
                        errors.departmentId && "border-destructive"
                      )}
                    >
                      <SelectValue placeholder="Chọn bộ môn…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="__empty__">
                          Không có (thỉnh giảng)
                        </SelectItem>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.departmentId && (
                    <p className="text-xs text-destructive">
                      {errors.departmentId}
                    </p>
                  )}
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lecturer-staffId">MSCB</Label>
                  <Input
                    id="lecturer-staffId"
                    value={form.staffId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, staffId: e.target.value }))
                    }
                    placeholder="Mã số cán bộ"
                    className={cn(
                      "h-10 rounded-xl",
                      errors.staffId && "border-destructive"
                    )}
                  />
                  {errors.staffId && (
                    <p className="text-xs text-destructive">{errors.staffId}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="lecturer-email">Email</Label>
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
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lecturer-phone">Điện thoại</Label>
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

              {departments.length > 1 && (
                <div className="flex flex-col gap-1.5">
                  <Label>Bộ môn thỉnh giảng</Label>
                  <DeptMultiSelect
                    value={form.guestDepartmentIds}
                    excludeId={form.departmentId}
                    onValueChange={(ids) =>
                      setForm((f) => ({ ...f, guestDepartmentIds: ids }))
                    }
                    placeholder="Chọn bộ môn thỉnh giảng…"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {form.departmentId
                      ? "Giảng viên có thể được phân công dạy các bộ môn bên dưới."
                      : "Giảng viên thỉnh giảng — chọn bộ môn mà giảng viên sẽ dạy."}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="lecturer-note">Ghi chú</Label>
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
            </div>
          </div>

          <DialogFooter className="mx-0 mb-0 shrink-0 border-t border-border/60 bg-muted/30 px-6 py-4">
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
