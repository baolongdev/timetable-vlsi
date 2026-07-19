"use client"

import { Clock, MapPin } from "lucide-react"

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
  /** Chế độ file phân công: lấy phân công hiệu lực của một nhóm */
  getAssignment?: (section: CourseSection) => Assignment
  /** Chế độ file phân công: cập nhật phân công (key = `${code}-${group}`) */
  onAssign?: (key: string, patch: Assignment) => void
}

export function CourseSectionsDialog({
  open,
  onOpenChange,
  course,
  sections,
  getAssignment,
  onAssign,
}: CourseSectionsDialogProps) {
  if (!course) return null

  const assignable = Boolean(getAssignment && onAssign)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0",
          assignable ? "sm:max-w-5xl" : "sm:max-w-3xl"
        )}
      >
        <div className="flex max-h-[80dvh] flex-col gap-4 p-6">
          <DialogHeader className="gap-1.5">
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
            <div
              className={cn(
                "scrollbar-minimal min-h-0 flex-1 overflow-auto rounded-xl border border-border/70",
                "[&_[data-slot=table-container]]:overflow-visible"
              )}
            >
              <Table className="[&_td]:py-2 [&_th:first-child]:pl-3 [&_td:first-child]:pl-3 [&_th:last-child]:pr-3 [&_td:last-child]:pr-3">
                <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_var(--border)] [&_tr]:border-b-0">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[70px]">MSMH</TableHead>
                    <TableHead className="w-[70px]">Nhóm</TableHead>
                    <TableHead className="w-[70px]">Thứ</TableHead>
                    <TableHead>Tiết</TableHead>
                    <TableHead className="w-[110px]">Phòng</TableHead>
                    <TableHead className="hidden w-[60px] text-center sm:table-cell">
                      Sĩ số
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Tuần học
                    </TableHead>
                    <TableHead className="w-[50px] text-center">NN</TableHead>
                    {assignable ? (
                      <>
                        <TableHead className="w-[180px]">
                          CB phụ trách
                        </TableHead>
                        <TableHead className="w-[180px]">
                          CB giảng dạy
                        </TableHead>
                      </>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((s) => (
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
                        <>
                          <TableCell>
                            <LecturerPicker
                              value={getAssignment!(s).lead ?? null}
                              onValueChange={(value) =>
                                onAssign!(`${s.code}-${s.group}`, {
                                  lead: value ?? undefined,
                                })
                              }
                              placeholder="Chọn…"
                            />
                          </TableCell>
                          <TableCell>
                            <LecturerPicker
                              value={getAssignment!(s).teacher ?? null}
                              onValueChange={(value) =>
                                onAssign!(`${s.code}-${s.group}`, {
                                  teacher: value ?? undefined,
                                })
                              }
                              placeholder="Chọn…"
                            />
                          </TableCell>
                        </>
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
