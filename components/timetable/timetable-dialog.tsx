"use client"

import * as React from "react"
import {
  AlertTriangle,
  CalendarRange,
  Clock,
  Hash,
  MapPin,
  Users,
} from "lucide-react"

import { LecturerPicker } from "@/components/import/lecturer-picker"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  getPeriodRangeLabel,
  getPeriodSpanLabel,
} from "@/data/timetable"
import { formatLecturerWithStaffId } from "@/lib/lecturer-staff"
import { useLecturers } from "@/lib/lecturer-store"
import type { Schedule } from "@/types/timetable"

type TimetableDialogProps = {
  schedule: Schedule | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLecturerChange?: (scheduleId: string, lecturer: string) => void
  assignment?: { teacher?: string }
  onAssignmentChange?: (patch: { teacher?: string }) => void
  /** Các dòng cảnh báo trùng lịch của nhóm này */
  conflictMessages?: string[]
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/40">
        <Icon className="size-3.5 text-muted-foreground" />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  )
}

/** Dialog chi tiết nhóm lớp — 3 tab: Môn học · Lịch · Phân công */
export function TimetableDialog({
  schedule,
  open,
  onOpenChange,
  onLecturerChange,
  assignment,
  onAssignmentChange,
  conflictMessages,
}: TimetableDialogProps) {
  const { lecturers: roster } = useLecturers()

  if (!schedule) return null

  const timeRange = getPeriodRangeLabel(
    schedule.startPeriod,
    schedule.endPeriod
  )
  const periodLabel = getPeriodSpanLabel(
    schedule.startPeriod,
    schedule.endPeriod
  )
  const canAssign = Boolean(assignment && onAssignmentChange)
  const hasConflicts = Boolean(conflictMessages?.length)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[700px]">
        <div className="flex max-h-[85dvh] flex-col gap-5 overflow-y-auto p-6">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {schedule.courseName}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="font-mono text-xs tabular-nums"
              >
                {schedule.courseCode}
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs">
                {schedule.className}
              </Badge>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {timeRange}
              </span>
              {hasConflicts ? (
                <Badge variant="destructive" className="gap-0.5 text-[10px]">
                  <AlertTriangle className="size-3" />
                  Trùng lịch
                </Badge>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {hasConflicts ? (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
            >
              <p className="flex items-center gap-1.5 font-medium">
                <AlertTriangle className="size-3.5 shrink-0" />
                Nhóm này bị trùng lịch
              </p>
              <p className="text-[11px] leading-snug text-destructive/75">
                Cần đổi cán bộ hoặc phòng (tab Phân công) để hết cảnh báo.
              </p>
              <div className="flex flex-col gap-2.5">
                {conflictMessages!.map((m, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-destructive/15 bg-background/60 px-3 py-2 text-xs leading-relaxed whitespace-pre-line text-destructive/95"
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <Tabs defaultValue={canAssign ? "people" : "info"}>
            <TabsList
              variant="line"
              className="h-9 w-full justify-start gap-1 bg-transparent p-0"
            >
              <TabsTrigger
                value="info"
                className="rounded-lg data-active:bg-muted"
              >
                Môn học
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                className="rounded-lg data-active:bg-muted"
              >
                Lịch
              </TabsTrigger>
              <TabsTrigger
                value="people"
                className="rounded-lg data-active:bg-muted"
              >
                Phân công
              </TabsTrigger>
            </TabsList>

            <Separator className="my-4" />

            <TabsContent value="info" className="mt-0 flex flex-col gap-1">
              <Row
                icon={Hash}
                label="Mã môn"
                value={
                  <span className="font-mono">{schedule.courseCode}</span>
                }
              />
              <Row icon={MapPin} label="Phòng" value={schedule.room} />
              <Row
                icon={CalendarRange}
                label="Tuần học"
                value={schedule.weeks}
              />
              <Row
                icon={Users}
                label="Sĩ số"
                value={`${schedule.capacity} sinh viên`}
              />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0 flex flex-col gap-1">
              <Row icon={Clock} label="Tiết" value={periodLabel} />
              <Row
                icon={Clock}
                label="Giờ"
                value={
                  <span className="font-mono tabular-nums">{timeRange}</span>
                }
              />
              <Row
                icon={CalendarRange}
                label="Tuần học"
                value={schedule.weeks}
              />
              <Row icon={MapPin} label="Phòng" value={schedule.room} />
              <Row
                icon={Users}
                label="Nhóm"
                value={
                  <span className="font-mono">{schedule.className}</span>
                }
              />
            </TabsContent>

            <TabsContent value="people" className="mt-0 flex flex-col gap-3">
              {canAssign ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Phân công CB giảng dạy cho nhóm{" "}
                    <span className="font-mono font-medium text-foreground">
                      {schedule.className}
                    </span>
                    . Trùng lịch chỉ xét người này + phòng.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      Cán bộ giảng dạy
                    </span>
                    <LecturerPicker
                      value={assignment?.teacher ?? null}
                      onValueChange={(value) =>
                        onAssignmentChange?.({
                          teacher: value ?? undefined,
                        })
                      }
                      placeholder="Chọn cán bộ giảng dạy…"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Giảng viên
                  </span>
                  {onLecturerChange ? (
                    <LecturerPicker
                      value={
                        schedule.lecturer === "Chưa phân công"
                          ? null
                          : schedule.lecturer
                      }
                      onValueChange={(value) => {
                        if (value) onLecturerChange(schedule.id, value)
                      }}
                      placeholder="Chọn giảng viên…"
                      className="h-10 rounded-xl"
                    />
                  ) : (
                    <p className="text-sm font-medium">
                      {schedule.lecturer === "Chưa phân công"
                        ? "Chưa phân công"
                        : formatLecturerWithStaffId(schedule.lecturer, roster)}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              <Row
                icon={Users}
                label="Nhóm"
                value={
                  <span className="font-mono">{schedule.className}</span>
                }
              />
              <Row
                icon={Users}
                label="Sĩ số"
                value={`${schedule.capacity} sinh viên`}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
