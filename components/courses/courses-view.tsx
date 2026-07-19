"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react"

import { CourseDeleteDialog } from "@/components/courses/course-delete-dialog"
import { CourseFormDialog } from "@/components/courses/course-form-dialog"
import { CourseSectionsDialog } from "@/components/courses/course-sections-dialog"
import { UploadAssignmentButton } from "@/components/import/upload-assignment-button"
import { LecturerChip } from "@/components/lecturer-chip"
import { ThemeToggle } from "@/components/theme-toggle"
import { pagePad } from "@/components/timetable/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { initialCourses } from "@/data/courses"
import { initialLecturers } from "@/data/lecturers"
import { getSectionsForCourse } from "@/data/sections"
import { useImportStore } from "@/lib/use-import-store"
import { cn } from "@/lib/utils"
import type { Course } from "@/types/course"
import type { CourseSection } from "@/types/section"

export function CoursesView({
  initialData = initialCourses,
  sections,
}: {
  /** Courses from the server (DB); falls back to static data */
  initialData?: Course[]
  /** Sections from the server (DB); falls back to static data */
  sections?: CourseSection[]
}) {
  const [courses, setCourses] = React.useState<Course[]>(initialData)
  const [search, setSearch] = React.useState("")
  const [lecturerFilter, setLecturerFilter] = React.useState<string>("all")

  const importStore = useImportStore()

  // Chế độ file phân công: sections + danh sách môn sinh từ file Excel
  const effectiveSections = React.useMemo<CourseSection[]>(() => {
    if (!importStore.hasImport) return sections ?? []
    return importStore.sections.map((s) => ({
      code: s.code,
      courseName: s.courseName,
      group: s.group,
      day: s.day,
      startPeriod: s.startPeriod,
      endPeriod: s.endPeriod,
      capacity: s.capacity,
      room: s.room,
      weeksLabel: s.weeksLabel,
      language: s.language,
    }))
  }, [importStore, sections])

  const effectiveCourses = React.useMemo<Course[]>(() => {
    if (!importStore.hasImport) return courses
    // Gom môn từ file: mỗi MMH một dòng; phụ trách = lead được chọn nhiều nhất
    const byCode = new Map<string, Course & { _leads: string[] }>()
    for (const s of importStore.sections) {
      const a = importStore.getAssignment(s)
      let entry = byCode.get(s.code)
      if (!entry) {
        entry = {
          id: s.code,
          code: s.code,
          name: s.courseName,
          leadLecturer: undefined,
          theoryLecturers: [],
          practiceLecturers: [],
          _leads: [],
        }
        byCode.set(s.code, entry)
      }
      if (a.lead) entry._leads.push(a.lead)
      if (a.teacher && !entry.theoryLecturers.includes(a.teacher))
        entry.theoryLecturers.push(a.teacher)
    }
    return [...byCode.values()].map(({ _leads, ...c }) => ({
      ...c,
      leadLecturer: _leads[0],
    }))
  }, [importStore, courses])

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Course | null>(null)

  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState<Course | null>(null)

  const [sectionsOpen, setSectionsOpen] = React.useState(false)
  const [viewing, setViewing] = React.useState<Course | null>(null)

  const openSections = (course: Course) => {
    setViewing(course)
    setSectionsOpen(true)
  }

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return effectiveCourses.filter((c) => {
      const team = [
        c.leadLecturer,
        ...c.theoryLecturers,
        ...c.practiceLecturers,
      ].filter(Boolean) as string[]

      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        team.some((n) => n.toLowerCase().includes(q))

      const matchLecturer =
        lecturerFilter === "all" || team.includes(lecturerFilter)

      return matchSearch && matchLecturer
    })
  }, [effectiveCourses, search, lecturerFilter])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (course: Course) => {
    setEditing(course)
    setFormOpen(true)
  }

  const openDelete = (course: Course) => {
    setDeleting(course)
    setDeleteOpen(true)
  }

  const handleSubmit = (data: Omit<Course, "id"> & { id?: string }) => {
    if (data.id) {
      setCourses((list) =>
        list.map((c) => (c.id === data.id ? { ...c, ...data, id: c.id } : c))
      )
      return
    }
    const id = String(
      Math.max(0, ...courses.map((c) => Number(c.id) || 0)) + 1
    )
    setCourses((list) => [...list, { ...data, id }])
  }

  const handleDelete = () => {
    if (!deleting) return
    setCourses((list) => list.filter((c) => c.id !== deleting.id))
    setDeleting(null)
  }

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className={cn(pagePad, "flex min-h-0 flex-1 flex-col gap-6")}>
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit -ml-2 text-muted-foreground"
              render={<Link href="/timetable" />}
              nativeButton={false}
            >
              <ArrowLeft data-icon="inline-start" />
              Timetable
            </Button>
            <div className="flex flex-col gap-1">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Môn học
              </h1>
              <p className="text-sm text-muted-foreground">
                {importStore.hasImport ? (
                  <>
                    Từ file{" "}
                    <span className="font-medium text-foreground/80">
                      {importStore.fileName}
                    </span>{" "}
                    · {effectiveCourses.length} môn ·{" "}
                    {importStore.sections.length} nhóm lớp
                  </>
                ) : (
                  <>Môn học Tổ VLSI · {effectiveCourses.length} môn</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UploadAssignmentButton
              className="transition-opacity duration-150 hover:opacity-80"
              onImported={importStore.importSections}
            />
            {importStore.hasImport ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={importStore.clear}
                aria-label="Gỡ file phân công"
                className="text-muted-foreground"
              >
                <X />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="transition-opacity duration-150 hover:opacity-80"
              render={<Link href="/lecturers" />}
              nativeButton={false}
            >
              <Users data-icon="inline-start" />
              Giảng viên
            </Button>
            <ThemeToggle />
            <Button className="rounded-xl" onClick={openCreate}>
              <Plus data-icon="inline-start" />
              Thêm môn học
            </Button>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã môn, tên môn, giảng viên…"
              className="h-10 rounded-xl pl-9 shadow-none"
            />
          </div>
          <Select
            value={lecturerFilter}
            onValueChange={(value) => setLecturerFilter(value ?? "all")}
          >
            <SelectTrigger className="h-10 w-full rounded-xl sm:w-[210px]">
              <SelectValue placeholder="Giảng viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">Tất cả giảng viên</SelectItem>
                {initialLecturers.map((l) => (
                  <SelectItem key={l.id} value={l.name}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div
          className={cn(
            "scrollbar-minimal min-h-0 flex-1 overflow-auto rounded-xl border border-border/70",
            "[&_[data-slot=table-container]]:overflow-visible"
          )}
        >
          <Table
            className={cn(
              "[&_td]:py-2.5 [&_th:first-child]:pl-4 [&_td:first-child]:pl-4",
              "[&_th:last-child]:pr-4 [&_td:last-child]:pr-4"
            )}
          >
            <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_var(--border)] [&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="w-[90px]">MSMH</TableHead>
                <TableHead>Tên môn học</TableHead>
                <TableHead className="w-[95px] text-center">
                  Nhóm lớp
                </TableHead>
                <TableHead className="w-[170px]">Phụ trách</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Lý thuyết
                </TableHead>
                <TableHead className="hidden xl:table-cell">
                  Thực hành
                </TableHead>
                <TableHead className="w-[100px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-40 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <BookOpen className="size-5 opacity-40" />
                      <p>Không tìm thấy môn học.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((course, index) => {
                  const sectionCount = getSectionsForCourse(
                    course.code,
                    course.name,
                    effectiveSections
                  ).length

                  return (
                  <TableRow
                    key={course.id}
                    className={cn(sectionCount > 0 && "cursor-pointer")}
                    onClick={() => {
                      if (sectionCount > 0) openSections(course)
                    }}
                  >
                    <TableCell className="text-center font-mono text-xs tabular-nums text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-mono text-[11px] tabular-nums text-muted-foreground"
                      >
                        {course.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium tracking-tight whitespace-normal">
                        {course.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {sectionCount > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 rounded-lg px-2 font-mono text-xs tabular-nums text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation()
                            openSections(course)
                          }}
                        >
                          <CalendarDays className="size-3.5 opacity-60" />
                          {sectionCount} nhóm
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {course.leadLecturer ? (
                        <LecturerChip name={course.leadLecturer} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {course.theoryLecturers.length > 0 ? (
                        <div className="flex max-w-[340px] flex-wrap gap-1">
                          {course.theoryLecturers.map((name) => (
                            <LecturerChip key={name} name={name} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {course.practiceLecturers.length > 0 ? (
                        <div className="flex max-w-[340px] flex-wrap gap-1">
                          {course.practiceLecturers.map((name) => (
                            <LecturerChip key={name} name={name} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEdit(course)
                          }}
                          aria-label={`Sửa ${course.name}`}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDelete(course)
                          }}
                          aria-label={`Xóa ${course.name}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CourseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        course={editing}
        onSubmit={handleSubmit}
      />

      <CourseDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        course={deleting}
        onConfirm={handleDelete}
      />

      <CourseSectionsDialog
        open={sectionsOpen}
        onOpenChange={setSectionsOpen}
        course={viewing}
        sections={
          viewing
            ? getSectionsForCourse(
                viewing.code,
                viewing.name,
                effectiveSections
              )
            : []
        }
        getAssignment={
          importStore.hasImport
            ? (s) => {
                const src = importStore.sections.find(
                  (i) => i.code === s.code && i.group === s.group
                )
                return src
                  ? importStore.getAssignment(src)
                  : { lead: undefined, teacher: undefined }
              }
            : undefined
        }
        onAssign={
          importStore.hasImport ? importStore.assign : undefined
        }
      />
    </div>
  )
}
