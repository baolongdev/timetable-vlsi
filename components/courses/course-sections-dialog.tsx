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
  getAssignment?: (section: CourseSection) => Assignment
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
                    <TableHead className="sticky top-0 z-20 w-[70px] border-b bg-background">
                      Nhóm
                    </TableHead>
                    <TableHead className="sticky top-0 z-20 w-[70px] border-b bg-background">
                      Thứ
                    </TableHead>
                    <TableHead className="sticky top-0 z-20 border-b bg-background">
                      Tiết
                    </TableHead>
                    <TableHead className="sticky top-0 z-20 w-[110px] border-b bg-background">
                      Phòng
                    </TableHead>
                    <TableHead className="sticky top-0 z-20 hidden w-[60px] border-b bg-background text-center sm:table-cell">
                      Sĩ số
                    </TableHead>
                    <TableHead className="sticky top-0 z-20 hidden border-b bg-background md:table-cell">
                      Tuần học
                    </TableHead>
                    <TableHead className="sticky top-0 z-20 w-[50px] border-b bg-background text-center">
                      NN
                    </TableHead>
                    {assignable ? (
                      <>
                        <TableHead className="sticky top-0 z-20 w-[180px] border-b bg-background">
                          CB phụ trách
                        </TableHead>
                        <TableHead className="sticky top-0 z-20 w-[180px] border-b bg-background">
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
                              placeholder="Chọn CB phụ trách…"
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
                              placeholder="Chọn CB giảng dạy…"
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
