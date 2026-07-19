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
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
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
import { initialLecturers } from "@/data/lecturers"
import { LECTURER_ROLES } from "@/types/lecturer"
import type { Course } from "@/types/course"

type CourseFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
  onSubmit: (data: Omit<Course, "id"> & { id?: string }) => void
}

/** Lecturers grouped by role, in LECTURER_ROLES order (empty roles omitted) */
const lecturerGroups = LECTURER_ROLES.map((role) => ({
  value: role,
  items: initialLecturers
    .filter((l) => l.role === role)
    .map((l) => l.name),
})).filter((group) => group.items.length > 0)

/** Shared grouped dropdown list (by role) for the lecturer comboboxes */
function LecturerGroupList() {
  return (
    <>
      <ComboboxEmpty>Không tìm thấy giảng viên.</ComboboxEmpty>
      <ComboboxList>
        {(group: { value: string; items: string[] }, index: number) => (
          <ComboboxGroup key={group.value} items={group.items}>
            <ComboboxLabel>{group.value}</ComboboxLabel>
            <ComboboxCollection>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxCollection>
            {index < lecturerGroups.length - 1 && <ComboboxSeparator />}
          </ComboboxGroup>
        )}
      </ComboboxList>
    </>
  )
}

/** Single-select searchable combobox for the lead lecturer */
function LecturerSingleSelect({
  id,
  value,
  onValueChange,
}: {
  id?: string
  value: string | null
  onValueChange: (value: string | null) => void
}) {
  return (
    <Combobox
      autoHighlight
      items={lecturerGroups}
      value={value}
      onValueChange={onValueChange}
    >
      <ComboboxInput
        id={id}
        placeholder="Chọn giảng viên phụ trách…"
        showClear
        className="h-10 w-full rounded-xl"
      />
      <ComboboxContent>
        <LecturerGroupList />
      </ComboboxContent>
    </Combobox>
  )
}

function LecturerMultiSelect({
  id,
  value,
  onValueChange,
  placeholder,
}: {
  id?: string
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder: string
}) {
  const anchor = useComboboxAnchor()

  return (
    <Combobox
      multiple
      autoHighlight
      items={lecturerGroups}
      value={value}
      onValueChange={onValueChange}
    >
      <ComboboxChips ref={anchor} className="w-full rounded-xl">
        <ComboboxValue>
          {(values: string[]) => (
            <React.Fragment>
              {values.map((name) => (
                <ComboboxChip key={name}>{name}</ComboboxChip>
              ))}
              <ComboboxChipsInput id={id} placeholder={placeholder} />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <LecturerGroupList />
      </ComboboxContent>
    </Combobox>
  )
}

export function CourseFormDialog({
  open,
  onOpenChange,
  course,
  onSubmit,
}: CourseFormDialogProps) {
  const isEdit = Boolean(course)
  const [code, setCode] = React.useState("")
  const [name, setName] = React.useState("")
  const [leadLecturer, setLeadLecturer] = React.useState("none")
  const [theoryLecturers, setTheoryLecturers] = React.useState<string[]>([])
  const [practiceLecturers, setPracticeLecturers] = React.useState<string[]>(
    []
  )
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    setCode(course?.code ?? "")
    setName(course?.name ?? "")
    setLeadLecturer(course?.leadLecturer ?? "none")
    setTheoryLecturers(course?.theoryLecturers ?? [])
    setPracticeLecturers(course?.practiceLecturers ?? [])
    setError(null)
  }, [open, course])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedCode = code.trim().toUpperCase()
    const trimmedName = name.trim()
    if (!trimmedCode || !trimmedName) {
      setError("Vui lòng nhập mã môn và tên môn học.")
      return
    }
    onSubmit({
      id: course?.id,
      code: trimmedCode,
      name: trimmedName,
      leadLecturer: leadLecturer === "none" ? undefined : leadLecturer,
      theoryLecturers,
      practiceLecturers,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-5 p-6">
            <DialogHeader className="gap-1.5">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {isEdit ? "Chỉnh sửa môn học" : "Thêm môn học"}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Cập nhật thông tin và đội ngũ giảng dạy."
                  : "Nhập thông tin môn học mới."}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="course-code">Mã môn (MSMH)</Label>
                  <Input
                    id="course-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="CO1023"
                    className="h-10 rounded-xl font-mono"
                    autoFocus
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="course-name">Tên môn học</Label>
                  <Input
                    id="course-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Hệ thống số"
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="course-lead">Giảng viên phụ trách</Label>
                <LecturerSingleSelect
                  id="course-lead"
                  value={leadLecturer === "none" ? null : leadLecturer}
                  onValueChange={(value) => setLeadLecturer(value ?? "none")}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="course-theory">Giảng viên lý thuyết</Label>
                <LecturerMultiSelect
                  id="course-theory"
                  value={theoryLecturers}
                  onValueChange={setTheoryLecturers}
                  placeholder={
                    theoryLecturers.length === 0
                      ? "Chọn giảng viên lý thuyết…"
                      : "Thêm giảng viên…"
                  }
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="course-practice">Trợ giảng / thực hành</Label>
                <LecturerMultiSelect
                  id="course-practice"
                  value={practiceLecturers}
                  onValueChange={setPracticeLecturers}
                  placeholder={
                    practiceLecturers.length === 0
                      ? "Chọn trợ giảng / thực hành…"
                      : "Thêm trợ giảng…"
                  }
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
              {isEdit ? "Lưu thay đổi" : "Thêm môn học"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
