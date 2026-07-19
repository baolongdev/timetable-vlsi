"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { X } from "lucide-react"

import { UploadAssignmentButton } from "@/components/import/upload-assignment-button"
import { pagePad, sectionGap } from "@/components/timetable/layout"
import { TimetableEmpty } from "@/components/timetable/timetable-empty"
import { TimetableGrid } from "@/components/timetable/timetable-grid"
import { TimetableHeader } from "@/components/timetable/timetable-header"
import { TimetableMobile } from "@/components/timetable/timetable-mobile"
import { TimetableToolbar } from "@/components/timetable/timetable-toolbar"

// Dialog chỉ tải khi người dùng click card đầu tiên — giảm bundle ban đầu
const TimetableDialog = dynamic(
  () =>
    import("@/components/timetable/timetable-dialog").then(
      (m) => m.TimetableDialog
    ),
  { ssr: false }
)
import { Badge } from "@/components/ui/badge"
import {
  filterSchedules,
  getUniqueCourses,
  getUniqueLecturers,
  getUniqueRooms,
  schedules as staticSchedules,
} from "@/data/timetable"
import { useImportStore } from "@/lib/use-import-store"
import { cn } from "@/lib/utils"
import { sectionKey } from "@/types/import"
import type { Schedule, TimetableFilters } from "@/types/timetable"

const INITIAL_FILTERS: TimetableFilters = {
  search: "",
  lecturer: "all",
  course: "all",
  room: "all",
}

type TimetableViewProps = {
  /** Schedules from the server (DB); falls back to static data */
  schedules?: Schedule[]
}

export function TimetableView({
  schedules = staticSchedules,
}: TimetableViewProps) {
  const [filters, setFilters] =
    React.useState<TimetableFilters>(INITIAL_FILTERS)
  const [selected, setSelected] = React.useState<Schedule | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  // Đổi giảng viên trực tiếp trên dialog — chỉ tồn tại trong phiên
  const [lecturerOverrides, setLecturerOverrides] = React.useState<
    Record<string, string>
  >({})
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const importStore = useImportStore()

  // Ưu tiên dữ liệu Excel đã upload; chưa upload thì dùng data mặc định
  const baseSchedules = React.useMemo<Schedule[]>(() => {
    if (!importStore.hasImport) return schedules
    return importStore.sections
      .filter((s) => s.endPeriod <= 12)
      .map((s, i) => {
        const a = importStore.getAssignment(s)
        return {
          id: `${sectionKey(s)}-${i}`,
          courseCode: s.code,
          courseName: s.courseName,
          lecturer: a.teacher || a.lead || "Chưa phân công",
          room: s.room,
          day: s.day - 1,
          startPeriod: s.startPeriod,
          endPeriod: s.endPeriod,
          className: s.group,
          capacity: s.capacity,
          weeks: s.weeksLabel,
        }
      })
  }, [importStore, schedules])

  const effectiveSchedules = React.useMemo(
    () =>
      baseSchedules.map((s) =>
        lecturerOverrides[s.id]
          ? { ...s, lecturer: lecturerOverrides[s.id] }
          : s
      ),
    [baseSchedules, lecturerOverrides]
  )

  const handleLecturerChange = (scheduleId: string, lecturer: string) => {
    if (importStore.hasImport) {
      // schedule.id có dạng `${code}-${group}-${i}` — cắt bỏ index cuối
      const key = scheduleId.replace(/-\d+$/, "")
      importStore.assign(key, { teacher: lecturer })
    } else {
      setLecturerOverrides((prev) => ({ ...prev, [scheduleId]: lecturer }))
    }
    setSelected((prev) =>
      prev && prev.id === scheduleId ? { ...prev, lecturer } : prev
    )
  }

  const filtered = React.useMemo(
    () => filterSchedules(effectiveSchedules, filters),
    [effectiveSchedules, filters]
  )

  const lecturers = React.useMemo(
    () => getUniqueLecturers(effectiveSchedules),
    [effectiveSchedules]
  )
  const courses = React.useMemo(
    () => getUniqueCourses(effectiveSchedules),
    [effectiveSchedules]
  )
  const rooms = React.useMemo(
    () => getUniqueRooms(effectiveSchedules),
    [effectiveSchedules]
  )

  const handleSelect = (schedule: Schedule) => {
    setSelected(schedule)
    setDialogOpen(true)
  }

  const clearFilters = () => setFilters(INITIAL_FILTERS)

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

    // NOTE: không dùng ="..." cho cột weeks — field không bắt đầu bằng dấu
    // nháy nên CSV parser bỏ qua quote, dấu phẩy bên trong bị tách cột.
    // Nhãn tuần giờ dùng en-dash "1–7, 9–16" nên Excel không hiểu nhầm
    // thành ngày nữa, chỉ cần quote thường.
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
    link.download = "timetable.csv"
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
          importSlot={
            <div className="flex items-center gap-2">
              <UploadAssignmentButton
                className="transition-opacity duration-150 hover:opacity-80"
                onImported={importStore.importSections}
              />
              {importStore.hasImport ? (
                <Badge
                  variant="secondary"
                  className="max-w-40 gap-1 font-normal"
                  title={importStore.fileName ?? undefined}
                >
                  <span className="truncate">{importStore.fileName}</span>
                  <button
                    type="button"
                    onClick={importStore.clear}
                    aria-label="Gỡ file phân công"
                    className="opacity-60 hover:opacity-100"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ) : null}
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
        />

        <main className="min-h-0 flex-1 overflow-hidden">
          {filtered.length === 0 ? (
            <TimetableEmpty onClear={clearFilters} />
          ) : (
            <>
              <div className="hidden h-full md:block">
                <TimetableGrid
                  schedules={filtered}
                  selectedId={selected?.id}
                  onSelect={handleSelect}
                />
              </div>
              <div className="scrollbar-minimal h-full overflow-y-auto md:hidden">
                <TimetableMobile
                  schedules={filtered}
                  onSelect={handleSelect}
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
        onLecturerChange={
          importStore.hasImport ? undefined : handleLecturerChange
        }
        assignment={
          importStore.hasImport && selected
            ? {
                ...findImportedDefaults(selected.id),
                ...importStore.assignments[selectedKey(selected.id)],
              }
            : undefined
        }
        onAssignmentChange={
          importStore.hasImport && selected
            ? (patch) => {
                const key = selectedKey(selected.id)
                importStore.assign(key, patch)
                if (patch.teacher !== undefined || patch.lead !== undefined) {
                  setSelected((prev) =>
                    prev
                      ? {
                          ...prev,
                          lecturer:
                            patch.teacher ??
                            patch.lead ??
                            prev.lecturer,
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

  /** schedule.id có dạng `${code}-${group}-${i}` — cắt index cuối */
  function selectedKey(scheduleId: string): string {
    return scheduleId.replace(/-\d+$/, "")
  }

  function findImportedDefaults(scheduleId: string): {
    lead?: string
    teacher?: string
  } {
    const key = selectedKey(scheduleId)
    const section = importStore.sections.find(
      (s) => `${s.code}-${s.group}` === key
    )
    return { lead: section?.lead, teacher: section?.teacher }
  }
}
