"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Building2, FileSpreadsheet, AlertTriangle, DoorOpen, UserRound } from "lucide-react"

import { UploadAssignmentButton } from "@/components/import/upload-assignment-button"
import { ConflictDrawer } from "@/components/timetable/conflict-drawer"
import { pagePad, sectionGap } from "@/components/timetable/layout"
import { TimetableEmpty } from "@/components/timetable/timetable-empty"
import {
  TimetableGrid,
  type TimetableGridHandle,
  type TimetableScrollState,
} from "@/components/timetable/timetable-grid"
import { TimetableHeader } from "@/components/timetable/timetable-header"
import { TimetableMobile } from "@/components/timetable/timetable-mobile"
import { TimetableToolbar } from "@/components/timetable/timetable-toolbar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  detailConflictsFor,
  findScheduleConflicts,
  summarizeConflictsFor,
  periodsOverlap,
  parseWeeksToSet,
  type ScheduleConflict,
} from "@/lib/schedule-conflicts"

// Dialog chỉ tải khi người dùng click card đầu tiên — giảm bundle ban đầu
const TimetableDialog = dynamic(
  () =>
    import("@/components/timetable/timetable-dialog").then(
      (m) => m.TimetableDialog
    ),
  { ssr: false }
)
import { Button } from "@/components/ui/button"

import {
  filterSchedules,
  getUniqueCourses,
  getUniqueLecturers,
  getUniqueRooms,
} from "@/data/timetable"
import {
  departmentStore,
  getEffectiveAssignment,
  useDepartments,
} from "@/lib/department-store"
import { appToast } from "@/lib/app-toast"
import { cn } from "@/lib/utils"
import { sectionKey } from "@/types/import"
import type { Schedule, TimetableFilters } from "@/types/timetable"

const INITIAL_FILTERS: TimetableFilters = {
  search: "",
  lecturer: "all",
  course: "all",
  room: "all",
}

function setsIntersectSimple(a: Set<number>, b: Set<number>): boolean {
  if (a.size === 0 || b.size === 0) return false
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  for (const x of small) if (large.has(x)) return true
  return false
}

export function TimetableView() {
  const [filters, setFilters] =
    React.useState<TimetableFilters>(INITIAL_FILTERS)
  const [selected, setSelected] = React.useState<Schedule | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [conflictWarning, setConflictWarning] = React.useState<{
    schedule: Schedule
    conflicts: ScheduleConflict[]
  } | null>(null)
  const [scrollState, setScrollState] =
    React.useState<TimetableScrollState>({
      canScrollLeft: false,
      canScrollRight: false,
    })
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const gridRef = React.useRef<TimetableGridHandle>(null)

  const handleScrollByViewport = React.useCallback((direction: 1 | -1) => {
    gridRef.current?.scrollByViewport(direction)
  }, [])

  const { departments, version, hydrated } = useDepartments()
  const params = useParams<{ dept?: string }>()
  const deptParam = params.dept ?? null

  // Khoa đang xem: theo ?dept=, mặc định khoa đầu tiên
  // `version` buộc recompute khi assign() — không chỉ dựa ref dept
  const dept = React.useMemo(
    () =>
      departments.find((d) => d.id === deptParam) ?? departments[0] ?? null,
    [departments, deptParam, version]
  )

  const baseSchedules = React.useMemo<Schedule[]>(() => {
    if (!dept) return []
    return dept.sections
      .map((s, i) => {
        const a = getEffectiveAssignment(dept, s)
        const teacher = a.teacher
        return {
          id: `${sectionKey(s)}-${i}`,
          courseCode: s.code,
          courseName: s.courseName,
          lecturer: teacher || "Chưa phân công",
          teacher,
          room: s.room,
          // Excel: Thứ 2–8 (8=CN) → schedule.day 0–6 (T2–CN)
          day: s.day - 1,
          startPeriod: s.startPeriod,
          endPeriod: s.endPeriod,
          className: s.group,
          capacity: s.capacity,
          weeks: s.weeksLabel,
        }
      })
  }, [dept, version])

  const filtered = React.useMemo(
    () => filterSchedules(baseSchedules, filters),
    [baseSchedules, filters]
  )

  /** Trùng lịch toàn khoa — recompute mỗi khi version/baseSchedules đổi */
  const conflictIndex = React.useMemo(
    () => findScheduleConflicts(baseSchedules),
    [baseSchedules]
  )

  const conflictHints = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const id of conflictIndex.conflictIds) {
      map.set(id, summarizeConflictsFor(id, conflictIndex))
    }
    return map
  }, [conflictIndex])

  const scheduleById = React.useMemo(() => {
    const map = new Map<string, Schedule>()
    for (const s of baseSchedules) map.set(s.id, s)
    return map
  }, [baseSchedules])

  // Đồng bộ card đang mở với data mới (phân công) — không giữ snapshot cũ
  React.useEffect(() => {
    if (!selected) return
    const latest = baseSchedules.find((s) => s.id === selected.id)
    if (!latest) return
    if (
      latest.teacher !== selected.teacher ||
      latest.lecturer !== selected.lecturer
    ) {
      setSelected(latest)
    }
  }, [baseSchedules, selected])

  const selectedConflictMessages = React.useMemo(() => {
    if (!selected) return undefined
    const details = detailConflictsFor(selected.id, conflictIndex)
    return details.length > 0 ? details : undefined
  }, [selected, conflictIndex])

  /** GV đang dạy cùng khung giờ với selected — vô hiệu hóa trong picker */
  const conflictingLecturers = React.useMemo(() => {
    if (!selected) return undefined
    const set = new Set<string>()
    const selectedWeeks = parseWeeksToSet(selected.weeks)
    for (const s of baseSchedules) {
      if (s.id === selected.id) continue
      if (!periodsOverlap(selected, s)) continue
      if (!setsIntersectSimple(selectedWeeks, parseWeeksToSet(s.weeks))) continue
      const name = s.teacher?.trim() || s.lecturer?.trim()
      if (name && name.toLowerCase() !== "chưa phân công") set.add(name)
    }
    return set.size > 0 ? set : undefined
  }, [selected, baseSchedules])

  const lecturers = React.useMemo(
    () => getUniqueLecturers(baseSchedules),
    [baseSchedules]
  )
  const courses = React.useMemo(
    () => getUniqueCourses(baseSchedules),
    [baseSchedules]
  )
  const rooms = React.useMemo(
    () => getUniqueRooms(baseSchedules),
    [baseSchedules]
  )

  const handleSelect = (schedule: Schedule) => {
    const conflicts = conflictIndex.byScheduleId.get(schedule.id)
    if (conflicts?.length) {
      setConflictWarning({ schedule, conflicts })
      return
    }
    setSelected(schedule)
    setDialogOpen(true)
  }

  const clearFilters = () => setFilters(INITIAL_FILTERS)

  /** schedule.id có dạng `${code}-${group}-${i}` — cắt index cuối */
  const scheduleKey = (scheduleId: string) =>
    scheduleId.replace(/-\d+$/, "")

  const currentAssignment = React.useMemo(() => {
    if (!dept || !selected) return undefined
    const key = scheduleKey(selected.id)
    const section = dept.sections.find(
      (s) => `${s.code}-${s.group}` === key
    )
    if (!section) return undefined
    return getEffectiveAssignment(dept, section)
  }, [dept, selected])

  const handleExport = () => {
    const rows = [
      [
        "courseCode",
        "courseName",
        "lecturer",
        "room",
        "day",
        "startPeriod",
        "endPeriod",
        "className",
        "capacity",
        "weeks",
      ],
      ...filtered.map((s) => [
        s.courseCode,
        s.courseName,
        s.lecturer,
        s.room,
        String(s.day),
        String(s.startPeriod),
        String(s.endPeriod),
        s.className,
        String(s.capacity),
        s.weeks,
      ]),
    ]

    const quote = (cell: string) => `"${cell.replaceAll('"', '""')}"`
    const csv = rows
      .map((row) => row.map((cell) => quote(String(cell))).join(","))
      .join("\r\n")

    // UTF-8 BOM so Excel renders Vietnamese correctly
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `timetable-${dept?.id ?? "export"}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const [exporting, setExporting] = React.useState(false)

  const runVisualExport = async (kind: "image" | "pdf") => {
    const node = gridRef.current?.getExportNode()
    if (!node || exporting) return
    setExporting(true)
    try {
      // Import lười — html-to-image/jspdf chỉ tải khi bấm export
      const mod = await import("@/lib/export-timetable")
      const fileName = `timetable-${dept?.id ?? "export"}`
      if (kind === "image") {
        await mod.exportTimetableAsImage(node, fileName)
      } else {
        await mod.exportTimetableAsPdf(node, fileName, dept?.name)
      }
      appToast.success(
        kind === "image" ? "Đã tải ảnh PNG" : "Đã tải file PDF",
        `${fileName}.${kind === "image" ? "png" : "pdf"}`
      )
    } catch (e) {
      console.error("[export-timetable]", e)
      appToast.error(
        "Xuất file thất bại",
        "Thử lại hoặc thu nhỏ bộ lọc để giảm kích thước grid."
      )
    } finally {
      setExporting(false)
    }
  }

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className={cn(pagePad, "flex min-h-0 flex-1 flex-col", sectionGap)}>
        <TimetableHeader
          onExport={handleExport}
          onExportImage={() => void runVisualExport("image")}
          onExportPdf={() => void runVisualExport("pdf")}
          exporting={exporting}
          departmentName={dept?.name}
          importSlot={
            <div data-tour="dept-switch" className="flex items-center gap-1">
              {/* Chuyển nhanh giữa các khoa đã import */}
              {departments.length > 1
                ? departments.map((d) => (
                    <Button
                      key={d.id}
                      variant={d.id === dept?.id ? "secondary" : "ghost"}
                      size="sm"
                      className="rounded-lg"
                      render={<Link href={`/timetable/${d.id}`} />}
                      nativeButton={false}
                    >
                      {d.name}
                    </Button>
                  ))
                : null}
              <Button
                variant="ghost"
                size="sm"
                className="transition-opacity duration-150 hover:opacity-80"
                render={<Link href="/departments" />}
                nativeButton={false}
              >
                <Building2 data-icon="inline-start" />
                Khoa
              </Button>
            </div>
          }
          conflictSlot={<ConflictDrawer index={conflictIndex} />}
        />

        <TimetableToolbar
          filters={filters}
          lecturers={lecturers}
          courses={courses}
          rooms={rooms}
          searchInputRef={searchInputRef}
          onFiltersChange={setFilters}
          scrollState={scrollState}
          onScrollByViewport={handleScrollByViewport}
        />

        <main className="min-h-0 flex-1 overflow-hidden">
          {!hydrated ? (
            <div className="flex h-full min-h-[280px] items-center justify-center px-6">
              <p className="text-sm text-muted-foreground">
                Đang tải thời khóa biểu&hellip;
              </p>
            </div>
          ) : !dept ? (
            // Chưa có khoa nào — hướng dẫn upload
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
                <FileSpreadsheet className="size-4 text-muted-foreground" />
              </div>
              <div className="flex max-w-sm flex-col gap-1.5">
                <p className="text-base font-semibold tracking-tight text-foreground">
                  Chưa có dữ liệu thời khóa biểu
                </p>
                <p className="text-sm text-muted-foreground">
                  Upload file Excel phân công giảng dạy (.xlsx) và chọn
                  khoa / tổ để hiển thị lịch học.
                </p>
              </div>
              <div data-tour="upload">
                <UploadAssignmentButton className="rounded-xl border border-border/80" />
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <TimetableEmpty onClear={clearFilters} />
          ) : (
            <>
              <div data-tour="grid" className="hidden h-full md:block">
                <TimetableGrid
                  ref={gridRef}
                  schedules={filtered}
                  selectedId={selected?.id}
                  onSelect={handleSelect}
                  onScrollStateChange={setScrollState}
                  conflictIds={conflictIndex.conflictIds}
                  conflictHints={conflictHints}
                />
              </div>
              <div className="scrollbar-minimal h-full overflow-y-auto md:hidden">
                <TimetableMobile
                  schedules={filtered}
                  onSelect={handleSelect}
                  conflictIds={conflictIndex.conflictIds}
                  conflictHints={conflictHints}
                />
              </div>
            </>
          )}
        </main>
      </div>

      <Dialog
        open={!!conflictWarning}
        onOpenChange={(open) => {
          if (!open) setConflictWarning(null)
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[520px]">
          {conflictWarning ? (
            <div className="flex max-h-[85dvh] flex-col gap-4 overflow-y-auto p-6">
              <DialogHeader className="gap-2">
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="size-5 shrink-0" />
                  Cảnh báo trùng lịch
                </DialogTitle>
                <DialogDescription>
                  Nhóm{" "}
                  <span className="font-mono font-medium text-foreground">
                    {conflictWarning.schedule.className}
                  </span>{" "}
                  ({conflictWarning.schedule.courseCode} ·{" "}
                  {conflictWarning.schedule.courseName}) bị trùng lịch.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2.5">
                {conflictWarning.conflicts.map((c, i) => {
                  const otherId =
                    c.aId === conflictWarning.schedule.id ? c.bId : c.aId
                  const other = scheduleById.get(otherId)
                  const Icon =
                    c.kind === "lecturer" ? UserRound : DoorOpen
                  const kindLabel =
                    c.kind === "lecturer"
                      ? "Trùng giảng viên"
                      : "Trùng phòng học"

                  return (
                    <div
                      key={`${c.kind}-${c.resource}-${otherId}-${i}`}
                      className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-destructive/20 bg-background text-destructive">
                          <Icon className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-destructive">
                            {kindLabel}: {c.resource}
                          </p>
                        </div>
                      </div>
                      {other ? (
                        <div className="flex flex-col gap-1 text-xs leading-relaxed text-muted-foreground">
                          <p>
                            <span className="font-medium text-foreground">
                              {conflictWarning.schedule.courseCode} · nhóm{" "}
                              {conflictWarning.schedule.className}
                            </span>{" "}
                            trùng với{" "}
                            <span className="font-medium text-foreground">
                              {other.courseCode} · nhóm {other.className}
                            </span>
                          </p>
                          <p>
                            {other.courseName}
                          </p>
                          <p className="text-muted-foreground/70">
                            {c.title}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {c.title}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setConflictWarning(null)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <TimetableDialog
        schedule={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assignment={currentAssignment}
        conflictMessages={selectedConflictMessages}
        conflictingLecturers={conflictingLecturers}
        onAssignmentChange={
          dept && selected
            ? (patch) => {
                // Ghi store → version++ → baseSchedules + conflictIndex recompute realtime
                departmentStore.assign(
                  dept.id,
                  scheduleKey(selected.id),
                  patch
                )
                // selected được sync qua useEffect từ baseSchedules
              }
            : undefined
        }
      />
    </div>
  )
}
