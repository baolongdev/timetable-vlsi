"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Building2, FileSpreadsheet } from "lucide-react"

import { UploadAssignmentButton } from "@/components/import/upload-assignment-button"
import { ConflictBanner } from "@/components/timetable/conflict-banner"
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
  findScheduleConflicts,
  summarizeConflictsFor,
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
import { cn } from "@/lib/utils"
import { sectionKey } from "@/types/import"
import type { Schedule, TimetableFilters } from "@/types/timetable"

const INITIAL_FILTERS: TimetableFilters = {
  search: "",
  lecturer: "all",
  course: "all",
  room: "all",
}

export function TimetableView() {
  const [filters, setFilters] =
    React.useState<TimetableFilters>(INITIAL_FILTERS)
  const [selected, setSelected] = React.useState<Schedule | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
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

  const { departments, hydrated } = useDepartments()
  const params = useParams<{ dept?: string }>()
  const deptParam = params.dept ?? null

  // Khoa đang xem: theo ?dept=, mặc định khoa đầu tiên
  const dept = React.useMemo(
    () =>
      departments.find((d) => d.id === deptParam) ?? departments[0] ?? null,
    [departments, deptParam]
  )

  const baseSchedules = React.useMemo<Schedule[]>(() => {
    if (!dept) return []
    return dept.sections
      .filter((s) => s.endPeriod <= 12)
      .map((s, i) => {
        const a = getEffectiveAssignment(dept, s)
        return {
          id: `${sectionKey(s)}-${i}`,
          courseCode: s.code,
          courseName: s.courseName,
          lecturer: a.teacher || a.lead || "Chưa phân công",
          lead: a.lead,
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
  }, [dept])

  const filtered = React.useMemo(
    () => filterSchedules(baseSchedules, filters),
    [baseSchedules, filters]
  )

  /** Trùng lịch trên toàn khoa (không theo filter) — đổi phân công sẽ recompute */
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

  const selectedConflictMessages = React.useMemo(() => {
    if (!selected) return undefined
    return conflictIndex.byScheduleId
      .get(selected.id)
      ?.map((c) => c.message)
  }, [selected, conflictIndex])

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
          departmentName={dept?.name}
          importSlot={
            <div className="flex items-center gap-1">
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

        {conflictIndex.conflicts.length > 0 ? (
          <ConflictBanner index={conflictIndex} className="shrink-0" />
        ) : null}

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
              <UploadAssignmentButton className="rounded-xl border border-border/80" />
            </div>
          ) : filtered.length === 0 ? (
            <TimetableEmpty onClear={clearFilters} />
          ) : (
            <>
              <div className="hidden h-full md:block">
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

      <TimetableDialog
        schedule={selected}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assignment={currentAssignment}
        conflictMessages={selectedConflictMessages}
        onAssignmentChange={
          dept && selected
            ? (patch) => {
                departmentStore.assign(
                  dept.id,
                  scheduleKey(selected.id),
                  patch
                )
                if (patch.teacher !== undefined || patch.lead !== undefined) {
                  setSelected((prev) =>
                    prev
                      ? {
                          ...prev,
                          lecturer:
                            patch.teacher ||
                            patch.lead ||
                            prev.lecturer,
                          lead:
                            patch.lead !== undefined
                              ? patch.lead
                              : prev.lead,
                          teacher:
                            patch.teacher !== undefined
                              ? patch.teacher
                              : prev.teacher,
                        }
                      : prev
                  )
                }
              }
            : undefined
        }
      />
    </div>
  )
}
