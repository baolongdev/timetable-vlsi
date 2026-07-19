"use client"

import { AlertTriangle, Clock, GraduationCap, MapPin, UserCog } from "lucide-react"

import { pagePadX } from "@/components/timetable/layout"
import { Badge } from "@/components/ui/badge"
import { DAYS, getPeriodRangeLabel } from "@/data/timetable"
import { getLecturerColor } from "@/lib/lecturer-colors"
import {
  formatLecturerWithStaffId,
  getStaffIdByName,
} from "@/lib/lecturer-staff"
import { cn } from "@/lib/utils"
import type { Schedule } from "@/types/timetable"

type TimetableMobileProps = {
  schedules: Schedule[]
  onSelect: (schedule: Schedule) => void
  conflictIds?: Set<string>
  conflictHints?: Map<string, string>
}

export function TimetableMobile({
  schedules,
  onSelect,
  conflictIds,
  conflictHints,
}: TimetableMobileProps) {
  return (
    <div className={cn(pagePadX, "flex flex-col gap-8 pt-2 pb-10")}>
      {DAYS.map((day) => {
        const daySchedules = schedules
          .filter((s) => s.day === day.day)
          .sort((a, b) => a.startPeriod - b.startPeriod)

        return (
          <section key={day.day} className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              {day.label}
            </h2>

            {daySchedules.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-center text-xs text-muted-foreground">
                No classes
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {daySchedules.map((schedule) => {
                  const timeRange = getPeriodRangeLabel(
                    schedule.startPeriod,
                    schedule.endPeriod
                  )

                  const hasConflict = conflictIds?.has(schedule.id) ?? false
                  return (
                    <button
                      key={schedule.id}
                      type="button"
                      onClick={() => onSelect(schedule)}
                      title={conflictHints?.get(schedule.id)}
                      className={cn(
                        "rounded-2xl border border-border/80 bg-background p-4 text-left shadow-none select-none",
                        "transition-all duration-150 ease-out",
                        "hover:-translate-y-px hover:border-foreground/20 hover:shadow-sm",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
                        hasConflict &&
                          "border-destructive/50 ring-1 ring-destructive/20"
                      )}
                    >
                      <div className="flex flex-col gap-2">
                        <p className="text-base font-semibold leading-snug tracking-tight text-foreground">
                          {schedule.courseName}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className="font-mono text-[11px] tabular-nums text-muted-foreground"
                          >
                            {schedule.courseCode}
                          </Badge>
                          <span className="text-border">•</span>
                          <Badge
                            variant="secondary"
                            className="font-mono text-[11px]"
                          >
                            {schedule.className}
                          </Badge>
                          {hasConflict ? (
                            <Badge
                              variant="destructive"
                              className="gap-0.5 text-[10px]"
                            >
                              <AlertTriangle className="size-3" />
                              Trùng lịch
                            </Badge>
                          ) : null}
                        </div>
                        <div className="flex flex-col gap-1 text-[13px] text-muted-foreground">
                          {schedule.lead ? (
                            <div className="flex items-center gap-1.5">
                              <UserCog
                                className={cn(
                                  "size-3.5 shrink-0",
                                  getLecturerColor(schedule.lead).text
                                )}
                              />
                              <span
                                className={cn(
                                  "font-medium",
                                  getLecturerColor(schedule.lead).text
                                )}
                              >
                                {formatLecturerWithStaffId(schedule.lead)}
                              </span>
                            </div>
                          ) : null}
                          <div className="flex items-center gap-1.5">
                            <GraduationCap
                              className={cn(
                                "size-3.5 shrink-0",
                                getLecturerColor(schedule.lecturer).text
                              )}
                            />
                            <span
                              className={cn(
                                "font-medium",
                                getLecturerColor(schedule.lecturer).text
                              )}
                            >
                              {getStaffIdByName(schedule.lecturer)
                                ? formatLecturerWithStaffId(schedule.lecturer)
                                : schedule.lecturer}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 opacity-60" />
                            {schedule.room}
                          </div>
                        </div>
                        <p className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-muted-foreground">
                          <Clock className="size-3 opacity-60" />
                          {timeRange}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
