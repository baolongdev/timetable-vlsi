"use client"

import * as React from "react"

import { pagePad, sectionGap } from "@/components/timetable/layout"
import { TimetableDialog } from "@/components/timetable/timetable-dialog"
import { TimetableEmpty } from "@/components/timetable/timetable-empty"
import { TimetableGrid } from "@/components/timetable/timetable-grid"
import { TimetableHeader } from "@/components/timetable/timetable-header"
import { TimetableMobile } from "@/components/timetable/timetable-mobile"
import { TimetableToolbar } from "@/components/timetable/timetable-toolbar"
import {
  filterSchedules,
  getUniqueCourses,
  getUniqueLecturers,
  getUniqueRooms,
  schedules as staticSchedules,
} from "@/data/timetable"
import { cn } from "@/lib/utils"
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
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const filtered = React.useMemo(
    () => filterSchedules(schedules, filters),
    [schedules, filters]
  )

  const lecturers = React.useMemo(
    () => getUniqueLecturers(schedules),
    [schedules]
  )
  const courses = React.useMemo(
    () => getUniqueCourses(schedules),
    [schedules]
  )
  const rooms = React.useMemo(() => getUniqueRooms(schedules), [schedules])

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
        <TimetableHeader onExport={handleExport} />

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
      />
    </div>
  )
}
