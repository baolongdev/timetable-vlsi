"use client"

import * as React from "react"
import {
  CalendarRange,
  Clock,
  Hash,
  MapPin,
  Pencil,
  Users,
  X,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LecturerChip } from "@/components/lecturer-chip"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
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
import { findCourseByCode } from "@/data/courses"
import { initialLecturers } from "@/data/lecturers"
import { getLecturerColor } from "@/lib/lecturer-colors"
import { getInitials } from "@/lib/person-color"
import { cn } from "@/lib/utils"
import type { Schedule } from "@/types/timetable"

const lecturerNames = initialLecturers.map((l) => l.name)

type TimetableDialogProps = {
  schedule: Schedule | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Đổi giảng viên trực tiếp cho nhóm lớp này (chỉ trong phiên) */
  onLecturerChange?: (scheduleId: string, lecturer: string) => void
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

export function TimetableDialog({
  schedule,
  open,
  onOpenChange,
  onLecturerChange,
}: TimetableDialogProps) {
  const [editingLecturer, setEditingLecturer] = React.useState(false)

  React.useEffect(() => {
    if (!open) setEditingLecturer(false)
  }, [open])

  if (!schedule) return null

  const timeRange = getPeriodRangeLabel(
    schedule.startPeriod,
    schedule.endPeriod
  )
  const periodLabel = getPeriodSpanLabel(
    schedule.startPeriod,
    schedule.endPeriod
  )
  const course = findCourseByCode(schedule.courseCode)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[700px]">
        <div className="flex flex-col gap-5 p-6">
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
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info">
            <TabsList className="h-9 w-full justify-start gap-1 bg-transparent p-0">
              <TabsTrigger
                value="info"
                className="rounded-lg data-active:bg-muted"
              >
                Course
              </TabsTrigger>
              <TabsTrigger
                value="schedule"
                className="rounded-lg data-active:bg-muted"
              >
                Schedule
              </TabsTrigger>
              <TabsTrigger
                value="people"
                className="rounded-lg data-active:bg-muted"
              >
                People
              </TabsTrigger>
            </TabsList>

            <Separator className="my-4" />

            <TabsContent value="info" className="mt-0 flex flex-col gap-1">
              <Row
                icon={Hash}
                label="Course code"
                value={
                  <span className="font-mono">{schedule.courseCode}</span>
                }
              />
              <Row icon={MapPin} label="Room" value={schedule.room} />
              <Row
                icon={CalendarRange}
                label="Weeks"
                value={schedule.weeks}
              />
              <Row
                icon={Users}
                label="Capacity"
                value={`${schedule.capacity} students`}
              />
            </TabsContent>

            <TabsContent value="schedule" className="mt-0 flex flex-col gap-1">
              <Row icon={Clock} label="Periods" value={periodLabel} />
              <Row
                icon={Clock}
                label="Time"
                value={
                  <span className="font-mono tabular-nums">{timeRange}</span>
                }
              />
              <Row
                icon={CalendarRange}
                label="Weeks"
                value={schedule.weeks}
              />
              <Row icon={MapPin} label="Room" value={schedule.room} />
            </TabsContent>

            <TabsContent value="people" className="mt-0 flex flex-col gap-1">
              <div className="flex items-start gap-3 py-2">
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                    getLecturerColor(schedule.lecturer).bg,
                    getLecturerColor(schedule.lecturer).text,
                    getLecturerColor(schedule.lecturer).border
                  )}
                  aria-hidden
                >
                  {getInitials(schedule.lecturer)}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Lecturer
                  </span>
                  {editingLecturer && onLecturerChange ? (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <Combobox
                        autoHighlight
                        items={lecturerNames}
                        value={schedule.lecturer}
                        onValueChange={(value) => {
                          if (value) {
                            onLecturerChange(schedule.id, value)
                            setEditingLecturer(false)
                          }
                        }}
                      >
                        <ComboboxInput
                          placeholder="Tìm giảng viên…"
                          className="h-9 w-full max-w-xs rounded-lg"
                          autoFocus
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>
                            Không tìm thấy giảng viên.
                          </ComboboxEmpty>
                          <ComboboxList>
                            {(item: string) => (
                              <ComboboxItem key={item} value={item}>
                                {item}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingLecturer(false)}
                        aria-label="Hủy đổi giảng viên"
                      >
                        <X />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">
                        {schedule.lecturer}
                      </span>
                      {onLecturerChange ? (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground opacity-60 hover:opacity-100"
                          onClick={() => setEditingLecturer(true)}
                          aria-label="Đổi giảng viên"
                        >
                          <Pencil />
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
              <Row icon={Users} label="Group" value={schedule.className} />
              <Row
                icon={Users}
                label="Students"
                value={`${schedule.capacity} enrolled`}
              />

              {course ? (
                <>
                  <Separator className="my-2" />
                  <div className="flex flex-col gap-3">
                    {course.leadLecturer ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          Giảng viên phụ trách môn
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <LecturerChip name={course.leadLecturer} />
                        </div>
                      </div>
                    ) : null}
                    {course.theoryLecturers.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          Giảng viên lý thuyết
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {course.theoryLecturers.map((name) => (
                            <LecturerChip key={name} name={name} />
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {course.practiceLecturers.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">
                          Trợ giảng / thực hành
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {course.practiceLecturers.map((name) => (
                            <LecturerChip key={name} name={name} />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
