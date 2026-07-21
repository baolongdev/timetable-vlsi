"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, ChevronsUpDown, Clock, MapPin } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getSectionDayLabel } from "@/data/sections"
import { getPeriodRangeLabel } from "@/data/timetable"
import { LecturerPicker } from "@/components/import/lecturer-picker"
import { cn } from "@/lib/utils"
import type { Course } from "@/types/course"
import type { Assignment } from "@/types/import"
import type { CourseSection } from "@/types/section"

type CourseSectionsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
  sections: CourseSection[]
  getAssignment?: (section: CourseSection) => Assignment
  onAssign?: (key: string, patch: Assignment) => void
}

type SortKey =
  | "group"
  | "day"
  | "period"
  | "room"
  | "capacity"
  | "weeks"
  | "language"
  | "teacher"

type SortState = { key: SortKey; dir: 1 | -1 }

/**
 * Header cột sort được — hỗ trợ multi-sort:
 * - Click: sort theo cột này (bỏ các cột khác); click tiếp đảo chiều / bỏ
 * - Shift+Click: THÊM cột vào chuỗi sort (ưu tiên theo thứ tự thêm),
 *   hiện số thứ tự ①②③ cạnh mũi tên
 */
function SortableHead({
  label,
  sortKey,
  sorts,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  sorts: SortState[]
  onSort: (key: SortKey, additive: boolean) => void
  className?: string
}) {
  const index = sorts.findIndex((s) => s.key === sortKey)
  const active = index >= 0
  const dir = active ? sorts[index].dir : null
  return (
    <TableHead
      className={cn(
        "sticky top-0 z-20 border-b bg-background p-0",
        className
      )}
    >
      <button
        type="button"
        onClick={(e) => onSort(sortKey, e.shiftKey)}
        title={`${label} — click để sort, Shift+click để sort thêm cột`}
        className={cn(
          "flex h-10 w-full items-center gap-1 px-2 text-left font-medium",
          "transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
        {active ? (
          <span className="flex shrink-0 items-center gap-0.5">
            {dir === 1 ? (
              <ArrowUp className="size-3" />
            ) : (
              <ArrowDown className="size-3" />
            )}
            {sorts.length > 1 ? (
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {index + 1}
              </span>
            ) : null}
          </span>
        ) : (
          <ChevronsUpDown className="size-3 shrink-0 opacity-40" />
        )}
      </button>
    </TableHead>
  )
}

export function CourseSectionsDialog({
  open,
  onOpenChange,
  course,
  sections,
  getAssignment,
  onAssign,
}: CourseSectionsDialogProps) {
  const [sorts, setSorts] = React.useState<SortState[]>([])

  // Reset sort khi mở môn khác
  React.useEffect(() => {
    if (open) setSorts([])
  }, [open, course?.code])

  if (!course) return null

  const assignable = Boolean(getAssignment && onAssign)

  const toggleSort = (key: SortKey, additive: boolean) => {
    setSorts((prev) => {
      const idx = prev.findIndex((s) => s.key === key)

      if (additive) {
        // Shift+click: thêm/sửa cột trong chuỗi, giữ các cột khác
        if (idx === -1) return [...prev, { key, dir: 1 }]
        if (prev[idx].dir === 1)
          return prev.map((s, i) => (i === idx ? { key, dir: -1 } : s))
        return prev.filter((_, i) => i !== idx) // bỏ cột khỏi chuỗi
      }

      // Click thường: chỉ sort cột này
      if (idx === -1 || prev.length > 1) return [{ key, dir: 1 }]
      if (prev[idx].dir === 1) return [{ key, dir: -1 }]
      return []
    })
  }

  const sortValue = (s: CourseSection, key: SortKey): string | number => {
    switch (key) {
      case "group":
        return s.group
      case "day":
        return s.day
      case "period":
        return s.startPeriod * 100 + s.endPeriod
      case "room":
        return s.room
      case "capacity":
        return s.capacity
      case "weeks":
        return s.weeksLabel
      case "language":
        return s.language
      case "teacher":
        return getAssignment?.(s).teacher ?? "￿" // chưa phân công xuống cuối
    }
  }

  // Multi-sort theo thứ tự chuỗi; mặc định: mã + nhóm (A01 → CC → L → TN)
  const sorted = [...sections].sort((a, b) => {
    for (const { key, dir } of sorts) {
      const va = sortValue(a, key)
      const vb = sortValue(b, key)
      const cmp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "vi")
      if (cmp !== 0) return cmp * dir
    }
    return (
      a.code.localeCompare(b.code) || a.group.localeCompare(b.group)
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0",
          assignable ? "sm:max-w-5xl" : "sm:max-w-3xl"
        )}
      >
        <div className="flex max-h-[80dvh] min-w-0 flex-col gap-4 p-4 sm:p-6">
          <DialogHeader className="shrink-0 gap-1.5">
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {course.name}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="font-mono text-xs tabular-nums"
              >
                {course.code}
              </Badge>
              <span>
                {sections.length > 0
                  ? `${sections.length} nhóm lớp`
                  : "Chưa có nhóm lớp"}
              </span>
            </DialogDescription>
          </DialogHeader>

          {sections.length === 0 ? (
            <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 text-sm text-muted-foreground">
              <Clock className="size-4 opacity-50" />
              Chưa có dữ liệu tiết / lịch tuần cho môn này.
            </div>
          ) : (
            /*
             * Một scrollport duy nhất (x + y).
             * Bỏ overflow-x-auto lồng nhau của Table — sticky header mới bám được.
             */
            <div className="scrollbar-minimal min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border/70">
              <Table
                containerClassName="overflow-visible"
                className={cn(
                  assignable ? "min-w-[980px]" : "min-w-[640px]",
                  "border-separate border-spacing-0",
                  "[&_td]:py-2 [&_th:first-child]:pl-3 [&_td:first-child]:pl-3",
                  "[&_th:last-child]:pr-3 [&_td:last-child]:pr-3"
                )}
              >
                <TableHeader className="sticky top-0 z-20 [&_tr]:border-b-0">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="sticky top-0 z-20 w-[70px] border-b bg-background">
                      MSMH
                    </TableHead>
                    <SortableHead
                      label="Nhóm"
                      sortKey="group"
                      sorts={sorts}
                      onSort={toggleSort}
                      className="w-[80px]"
                    />
                    <SortableHead
                      label="Thứ"
                      sortKey="day"
                      sorts={sorts}
                      onSort={toggleSort}
                      className="w-[80px]"
                    />
                    <SortableHead
                      label="Tiết"
                      sortKey="period"
                      sorts={sorts}
                      onSort={toggleSort}
                    />
                    <SortableHead
                      label="Phòng"
                      sortKey="room"
                      sorts={sorts}
                      onSort={toggleSort}
                      className="w-[110px]"
                    />
                    <SortableHead
                      label="Sĩ số"
                      sortKey="capacity"
                      sorts={sorts}
                      onSort={toggleSort}
                      className="hidden w-[80px] sm:table-cell"
                    />
                    <SortableHead
                      label="Tuần học"
                      sortKey="weeks"
                      sorts={sorts}
                      onSort={toggleSort}
                      className="hidden md:table-cell"
                    />
                    <SortableHead
                      label="NN"
                      sortKey="language"
                      sorts={sorts}
                      onSort={toggleSort}
                      className="w-[60px]"
                    />
                    {assignable ? (
                      <SortableHead
                        label="CB giảng dạy"
                        sortKey="teacher"
                        sorts={sorts}
                        onSort={toggleSort}
                        className="w-[200px]"
                      />
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((s) => (
                    <TableRow key={`${s.code}-${s.group}`}>
                      <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                        {s.code}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-mono text-[11px]"
                        >
                          {s.group}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[13px]">
                        {getSectionDayLabel(s.day)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px]">
                            Tiết {s.startPeriod}–{s.endPeriod}
                          </span>
                          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                            {getPeriodRangeLabel(s.startPeriod, s.endPeriod)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-[13px] text-muted-foreground">
                          <MapPin className="size-3 shrink-0 opacity-60" />
                          {s.room}
                        </span>
                      </TableCell>
                      <TableCell className="hidden text-center font-mono text-xs tabular-nums text-muted-foreground sm:table-cell">
                        {s.capacity}
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs tabular-nums text-muted-foreground md:table-cell">
                        {s.weeksLabel}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={s.language === "V" ? "outline" : "default"}
                          className="text-[10px]"
                        >
                          {s.language}
                        </Badge>
                      </TableCell>
                      {assignable ? (
                        <TableCell>
                          <LecturerPicker
                            value={getAssignment!(s).teacher ?? null}
                            onValueChange={(value) =>
                              onAssign!(`${s.code}-${s.group}`, {
                                teacher: value ?? undefined,
                              })
                            }
                            placeholder="Chọn CB giảng dạy…"
                          />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
