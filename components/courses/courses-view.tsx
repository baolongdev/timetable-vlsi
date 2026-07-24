"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Building2,
  CalendarDays,
  Pencil,
  Search,
  Users,
} from "lucide-react"

import { CourseRenameDialog } from "@/components/courses/course-rename-dialog"
import { LecturerChip } from "@/components/lecturer-chip"
import { TourHelpButton } from "@/components/onboarding-tour"
import { PresenceHeaderControl } from "@/components/presence-widget"

// Dialog nặng (bảng nhóm lớp + combobox phân công) — tải khi mở lần đầu
const CourseSectionsDialog = dynamic(
  () =>
    import("@/components/courses/course-sections-dialog").then(
      (m) => m.CourseSectionsDialog
    ),
  { ssr: false }
)
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
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatLecturerWithStaffId,
  groupLecturersByRole,
} from "@/lib/lecturer-staff"
import {
  departmentStore,
  getEffectiveAssignment,
  useDepartments,
} from "@/lib/department-store"
import {
  findScheduleConflicts,
  summarizeConflictsFor,
  periodsOverlap,
  parseWeeksToSet,
} from "@/lib/schedule-conflicts"
import { useLecturers } from "@/lib/lecturer-store"
import { cn } from "@/lib/utils"
import type { Course } from "@/types/course"
import type { CourseSection } from "@/types/section"
import type { Schedule } from "@/types/timetable"

function setsIntersect(a: Set<number>, b: Set<number>): boolean {
  if (a.size === 0 || b.size === 0) return false
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  for (const x of small) if (large.has(x)) return true
  return false
}

export function CoursesView() {
  const [search, setSearch] = React.useState("")
  const [lecturerFilter, setLecturerFilter] = React.useState<string>("all")

  const { departments, hydrated } = useDepartments()
  const { lecturers: roster } = useLecturers()
  const params = useParams<{ dept?: string }>()
  const deptParam = params.dept ?? null

  // Khoa đang xem: theo ?dept=, mặc định khoa đầu tiên
  const dept = React.useMemo(
    () =>
      departments.find((d) => d.id === deptParam) ?? departments[0] ?? null,
    [departments, deptParam]
  )

  // Dữ liệu từ khoa đang chọn
  const effectiveSections = React.useMemo<CourseSection[]>(() => {
    if (!dept) return []
    return dept.sections.map((s) => ({
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
  }, [dept])

  // Trùng lịch toàn khoa (CB giảng dạy + phòng) — theo section
  const { conflictByCode, conflictByKey } = React.useMemo(() => {
    const byCode = new Map<string, { count: number; hint: string }>()
    // key = `${code}-${group}` → mô tả trùng (cho dialog nhóm lớp)
    const byKey = new Map<string, string>()
    if (!dept) return { conflictByCode: byCode, conflictByKey: byKey }

    // Section → Schedule để dùng lại findScheduleConflicts
    // id giữ nguyên `${code}-${group}` để map ngược về nhóm
    const schedules: Schedule[] = dept.sections.map((s) => {
      const a = getEffectiveAssignment(dept, s)
      return {
        id: `${s.code}-${s.group}`,
        courseCode: s.code,
        courseName: s.courseName,
        lecturer: a.teacher || "Chưa phân công",
        teacher: a.teacher,
        room: s.room,
        day: s.day - 1,
        startPeriod: s.startPeriod,
        endPeriod: s.endPeriod,
        className: s.group,
        capacity: s.capacity,
        weeks: s.weeksLabel,
      }
    })
    const index = findScheduleConflicts(schedules)
    for (const sch of schedules) {
      if (!index.conflictIds.has(sch.id)) continue
      byKey.set(sch.id, summarizeConflictsFor(sch.id, index))
      const entry = byCode.get(sch.courseCode) ?? { count: 0, hint: "" }
      entry.count += 1
      if (!entry.hint) entry.hint = summarizeConflictsFor(sch.id, index)
      byCode.set(sch.courseCode, entry)
    }
    return { conflictByCode: byCode, conflictByKey: byKey }
  }, [dept])

  /** Tên GV trùng lịch theo từng nhóm — dùng vô hiệu hóa trong picker */
  const conflictingLecturersByKey = React.useMemo(() => {
    const map = new Map<string, Set<string>>()
    if (!dept) return map

    const sections = dept.sections
    const n = sections.length
    for (let i = 0; i < n; i++) {
      const a = sections[i]
      const aKey = `${a.code}-${a.group}`
      const aWeeks = parseWeeksToSet(a.weeksLabel)
      const aSchedule = {
        day: a.day - 1,
        startPeriod: a.startPeriod,
        endPeriod: a.endPeriod,
      }

      for (let j = 0; j < n; j++) {
        if (i === j) continue
        const b = sections[j]
        if (!periodsOverlap(aSchedule, { day: b.day - 1, startPeriod: b.startPeriod, endPeriod: b.endPeriod })) continue
        if (!setsIntersect(aWeeks, parseWeeksToSet(b.weeksLabel))) continue

        const bTeacher = getEffectiveAssignment(dept, b).teacher
        if (!bTeacher || bTeacher.toLowerCase() === "chưa phân công") continue

        let set = map.get(aKey)
        if (!set) {
          set = new Set()
          map.set(aKey, set)
        }
        set.add(bTeacher)
      }
    }
    return map
  }, [dept])

  const effectiveCourses = React.useMemo<Course[]>(() => {
    if (!dept) return []
    // Gom môn từ file: mỗi MMH một dòng; CB giảng dạy = teacher
    const byCode = new Map<string, Course & { _teachers: string[] }>()
    for (const s of dept.sections) {
      const a = getEffectiveAssignment(dept, s)
      let entry = byCode.get(s.code)
      if (!entry) {
        entry = {
          id: s.code,
          code: s.code,
          name: s.courseName,
          leadLecturer: undefined,
          theoryLecturers: [],
          practiceLecturers: [],
          _teachers: [],
        }
        byCode.set(s.code, entry)
      }
      if (a.teacher && !entry._teachers.includes(a.teacher)) {
        entry._teachers.push(a.teacher)
      }
      if (a.teacher && !entry.theoryLecturers.includes(a.teacher)) {
        entry.theoryLecturers.push(a.teacher)
      }
    }
    return [...byCode.values()].map(({ _teachers, ...c }) => ({
      ...c,
      // Cột “Giảng dạy”: người dạy đầu tiên (không còn phụ trách)
      leadLecturer: _teachers[0],
    }))
  }, [dept])

  const [sectionsOpen, setSectionsOpen] = React.useState(false)
  const [viewing, setViewing] = React.useState<Course | null>(null)

  const conflictCount = conflictByCode.size

  const [renameOpen, setRenameOpen] = React.useState(false)
  const [renaming, setRenaming] = React.useState<Course | null>(null)

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

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <div
        className={cn(
          pagePad,
          // min-w-0: flex child không tràn ngang; overflow-x-hidden chặn spill page
          "flex min-h-0 min-w-0 flex-1 flex-col gap-4 sm:gap-6"
        )}
      >
        {/* Header */}
        <header className="flex min-w-0 shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-fit text-muted-foreground"
              render={<Link href="/timetable" />}
              nativeButton={false}
            >
              <ArrowLeft data-icon="inline-start" />
              Timetable
            </Button>
            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="font-heading truncate text-2xl font-semibold tracking-tight">
                {dept ? `Môn học — ${dept.name}` : "Môn học"}
              </h1>
              <p className="text-sm break-words text-muted-foreground">
                {!hydrated ? (
                  <span>Đang tải môn học&hellip;</span>
                ) : dept ? (
                  <>
                    Từ file{" "}
                    <span className="font-medium text-foreground/80">
                      {dept.fileName}
                    </span>{" "}
                    · {effectiveCourses.length} môn ·{" "}
                    {dept.sections.length} nhóm lớp
                  </>
                ) : (
                  <>Chưa có dữ liệu — upload file phân công</>
                )}
              </p>
              {conflictCount > 0 ? (
                <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  {conflictCount} môn có nhóm bị trùng lịch (CB giảng dạy /
                  phòng)
                </p>
              ) : null}
            </div>
          </div>
          <div
            data-tour="courses-dept-switch"
            className="scrollbar-minimal -mx-1 flex min-w-0 max-w-full items-center gap-1 overflow-x-auto px-1 sm:gap-2"
          >
            {departments.length > 1
              ? departments.map((d) => (
                  <Button
                    key={d.id}
                    variant={d.id === dept?.id ? "secondary" : "ghost"}
                    size="sm"
                    className="shrink-0 rounded-lg"
                    render={<Link href={`/courses/${d.id}`} />}
                    nativeButton={false}
                  >
                    {d.name}
                  </Button>
                ))
              : null}
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0 transition-opacity duration-150 hover:opacity-80"
              render={<Link href="/departments" />}
              nativeButton={false}
            >
              <Building2 data-icon="inline-start" />
              Khoa
            </Button>
            <Button
              variant="ghost"
              size="sm"
              data-tour="courses-nav-lecturers"
              className="shrink-0 transition-opacity duration-150 hover:opacity-80"
              render={<Link href="/lecturers" />}
              nativeButton={false}
            >
              <Users data-icon="inline-start" />
              Giảng viên
            </Button>
            <TourHelpButton className="shrink-0" />
            <PresenceHeaderControl className="shrink-0" />
            <span data-tour="theme-toggle" className="inline-flex shrink-0">
              <ThemeToggle className="shrink-0" />
            </span>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex min-w-0 shrink-0 flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
          <div
            data-tour="courses-search"
            className="relative w-full min-w-0 max-w-sm"
          >
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo mã môn, tên môn, giảng viên…"
              className="h-10 w-full rounded-xl pl-9 shadow-none"
            />
          </div>
          <div data-tour="courses-filter-lecturer" className="w-full sm:w-auto">
            <Select
              value={lecturerFilter}
              onValueChange={(value) => setLecturerFilter(value ?? "all")}
              items={[
                { label: "Tất cả giảng viên", value: "all" },
                ...roster.map((l) => ({
                  label: formatLecturerWithStaffId(l.name, roster),
                  value: l.name,
                })),
              ]}
            >
              <SelectTrigger className="h-10 w-full shrink-0 rounded-xl sm:w-[240px]">
                <SelectValue placeholder="Giảng viên" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} className="max-w-sm">
                <SelectGroup>
                  <SelectItem value="all">Tất cả giảng viên</SelectItem>
                </SelectGroup>
                {groupLecturersByRole(undefined, roster).map((group, index) => (
                  <SelectGroup key={group.role}>
                    {index > 0 ? <SelectSeparator /> : null}
                    <SelectLabel>{group.role}</SelectLabel>
                    {group.names.map((name) => {
                      const lecturer = roster.find(
                        (l) => l.name === name
                      )
                      return (
                        <SelectItem key={name} value={name}>
                          {lecturer?.staffId ? (
                            <span className="flex w-full items-center justify-between gap-3">
                              <span>{name}</span>
                              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                                MSCB {lecturer.staffId}
                              </span>
                            </span>
                          ) : (
                            name
                          )}
                        </SelectItem>
                      )
                    })}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/*
          Table scroll: KHÔNG set overflow-visible lên table-container
          (sẽ phá overflow-x-auto → không cuộn ngang / lệch padding).
        */}
        <div
          data-tour="courses-table"
          className="scrollbar-minimal min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border/70"
        >
          <Table
            containerClassName="overflow-visible"
            className={cn(
              "min-w-[800px] border-separate border-spacing-0",
              "[&_td]:py-2.5 [&_th:first-child]:pl-4 [&_td:first-child]:pl-4",
              "[&_th:last-child]:pr-4 [&_td:last-child]:pr-4"
            )}
          >
            <TableHeader className="sticky top-0 z-20 [&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="sticky top-0 z-20 w-12 border-b bg-background text-center">
                  #
                </TableHead>
                <TableHead className="sticky top-0 z-20 w-[90px] border-b bg-background">
                  MSMH
                </TableHead>
                <TableHead className="sticky top-0 z-20 min-w-[160px] border-b bg-background">
                  Tên môn học
                </TableHead>
                <TableHead className="sticky top-0 z-20 w-[100px] border-b bg-background text-center">
                  Nhóm lớp
                </TableHead>
                <TableHead className="sticky top-0 z-20 w-[90px] border-b bg-background text-center">
                  Chưa phân công
                </TableHead>
                <TableHead className="sticky top-0 z-20 min-w-[140px] border-b bg-background">
                  CB giảng dạy
                </TableHead>
                <TableHead className="sticky top-0 z-20 hidden min-w-[180px] border-b bg-background lg:table-cell">
                  Lý thuyết
                </TableHead>
                <TableHead className="sticky top-0 z-20 hidden min-w-[180px] border-b bg-background xl:table-cell">
                  Thực hành
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hydrated ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-40 text-center text-muted-foreground"
                  >
                    <span className="text-sm text-muted-foreground">
                      Đang tải danh sách môn&hellip;
                    </span>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
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
                  // Mỗi MSMH một dòng riêng — chỉ đếm nhóm của đúng mã đó
                  // (không gộp CO1024 (TN) vào CO1023 như trước)
                  const sectionCount = effectiveSections.filter(
                    (s) => s.code === course.code
                  ).length
                  const unassignedCount = dept
                    ? dept.sections.filter(
                        (s) =>
                          s.code === course.code &&
                          !getEffectiveAssignment(dept, s).teacher
                      ).length
                    : 0
                  const conflict = conflictByCode.get(course.code)

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
                      <TableCell className="max-w-[240px] whitespace-normal">
                        <span className="group/name flex items-center gap-1">
                          <span className="font-medium tracking-tight">
                            {course.name}
                          </span>
                          {conflict ? (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <span
                                    className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-destructive/10 px-1 py-0.5 text-[10px] font-medium text-destructive"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                }
                              >
                                <AlertTriangle className="size-3" />
                                {conflict.count}
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs whitespace-pre-line">
                                {conflict.hint}
                              </TooltipContent>
                            </Tooltip>
                          ) : null}
                          {dept ? (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/name:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setRenaming(course)
                                      setRenameOpen(true)
                                    }}
                                    aria-label={`Đổi tên ${course.name}`}
                                  />
                                }
                              >
                                <Pencil />
                              </TooltipTrigger>
                              <TooltipContent>Đổi tên môn học</TooltipContent>
                            </Tooltip>
                          ) : null}
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
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {unassignedCount > 0 ? (
                          <Badge
                            variant="destructive"
                            className="font-mono text-xs tabular-nums"
                          >
                            {unassignedCount}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {course.leadLecturer ? (
                          <LecturerChip name={course.leadLecturer} />
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden max-w-[280px] whitespace-normal lg:table-cell">
                        {course.theoryLecturers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {course.theoryLecturers.map((name) => (
                              <LecturerChip key={name} name={name} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden max-w-[280px] whitespace-normal xl:table-cell">
                        {course.practiceLecturers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {course.practiceLecturers.map((name) => (
                              <LecturerChip key={name} name={name} />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CourseRenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        course={renaming}
        onRename={(code, newName) => {
          if (dept) departmentStore.renameCourse(dept.id, code, newName)
        }}
      />

      <CourseSectionsDialog
        open={sectionsOpen}
        onOpenChange={setSectionsOpen}
        course={viewing}
        sections={
          viewing
            ? effectiveSections.filter((s) => s.code === viewing.code)
            : []
        }
        getAssignment={
          dept
            ? (s) => {
                const src = dept.sections.find(
                  (i) => i.code === s.code && i.group === s.group
                )
                return src
                  ? getEffectiveAssignment(dept, src)
                  : { teacher: undefined }
              }
            : undefined
        }
        onAssign={
          dept
            ? (key, patch) => departmentStore.assign(dept.id, key, patch)
            : undefined
        }
        getConflict={(s) => conflictByKey.get(`${s.code}-${s.group}`)}
        getConflictingLecturers={(s) =>
          conflictingLecturersByKey.get(`${s.code}-${s.group}`)
        }
      />
    </div>
  )
}
