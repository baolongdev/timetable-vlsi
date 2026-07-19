"use client"

import * as React from "react"
import {
  AlertTriangle,
  CalendarRange,
  Clock,
  Copy,
  GraduationCap,
  MapPin,
  MoreHorizontal,
  Pencil,
  } from "lucide-react"

import { getPeriodRangeLabel } from "@/data/timetable"
import { getLecturerColor } from "@/lib/lecturer-colors"
import {
  formatLecturerWithStaffId,
  getStaffIdByName,
} from "@/lib/lecturer-staff"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Schedule } from "@/types/timetable"

/** Tooltip text trên card — neo sát text (w-fit), không theo full width card */
function InfoTooltip({
  label,
  children,
  className,
  side = "right",
}: {
  label: string
  children: React.ReactNode
  className?: string
  side?: "top" | "bottom" | "left" | "right"
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={300}
        render={
          <span
            className={cn(
              // w-fit: anchor đúng bề ngang nội dung → tooltip không bị đẩy xa
              "inline-flex w-fit max-w-full min-w-0",
              className
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        side={side}
        // Cách text một chút, căn giữa theo trục dọc
        sideOffset={12}
        align="center"
        className="max-w-xs text-left text-balance whitespace-normal"
      >
        {label}
      </TooltipContent>
    </Tooltip>
  )
}

/** Một dòng người phụ trách / giảng dạy — kèm MSCB (mã số cán bộ) */
function PersonLine({
  icon: Icon,
  label,
  name,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  name?: string
}) {
  if (!name) {
    return (
      <InfoTooltip label={`${label}: chưa phân công`}>
        <span className="inline-flex max-w-full items-center gap-1.5 text-[13px] text-muted-foreground/60">
          <Icon className="size-3.5 shrink-0 opacity-50" />
          <span className="truncate italic text-muted-foreground/70">
            Chưa phân công
          </span>
        </span>
      </InfoTooltip>
    )
  }
  const color = getLecturerColor(name)
  const staffId = getStaffIdByName(name)
  const tooltip = `${label}: ${formatLecturerWithStaffId(name)}`
  return (
    <InfoTooltip label={tooltip}>
      <span className="inline-flex max-w-full items-center gap-1.5 text-[13px] text-muted-foreground">
        <Icon className={cn("size-3.5 shrink-0", color.text)} />
        <span className="flex min-w-0 items-baseline gap-1.5">
          <span className={cn("truncate font-medium", color.text)}>
            {name}
          </span>
          {staffId ? (
            <span
              className={cn(
                "shrink-0 font-mono text-[10px] tabular-nums opacity-70",
                color.text
              )}
            >
              MSCB {staffId}
            </span>
          ) : null}
        </span>
      </span>
    </InfoTooltip>
  )
}

type TimetableCardProps = {
  schedule: Schedule
  span?: number
  style?: React.CSSProperties
  className?: string
  selected?: boolean
  /** Trùng lịch (GV / phòng) */
  hasConflict?: boolean
  conflictHint?: string
  onClick?: () => void
  onPeriodHoverChange?: (range: { start: number; end: number } | null) => void
}

export function TimetableCard({
  schedule,
  span = 3,
  style,
  className,
  selected = false,
  hasConflict = false,
  conflictHint,
  onClick,
  onPeriodHoverChange,
}: TimetableCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const canExpand = span <= 2
  const isExpanded = canExpand && expanded

  // Collapsed density by period count
  const isSingle = span === 1 && !isExpanded
  const isDouble = span === 2 && !isExpanded

  const timeRange = getPeriodRangeLabel(
    schedule.startPeriod,
    schedule.endPeriod
  )
  const lecturerColor = getLecturerColor(schedule.lecturer)
  const lecturerStaffId = getStaffIdByName(schedule.lecturer)

  const codeGroupLabel = `${schedule.courseCode} · ${schedule.className}`
  const weeksLabel = `Tuần ${schedule.weeks}`
  const teacherLabel = schedule.teacher
    ? formatLecturerWithStaffId(schedule.teacher)
    : formatLecturerWithStaffId(schedule.lecturer)

  const setHover = (active: boolean) => {
    if (canExpand) setExpanded(active)
    if (active) {
      onPeriodHoverChange?.({
        start: schedule.startPeriod,
        end: schedule.endPeriod,
      })
    } else {
      onPeriodHoverChange?.(null)
    }
  }

  const layoutStyle: React.CSSProperties = isExpanded
    ? {
        ...style,
        height: "auto",
        minHeight:
          typeof style?.height === "string" || typeof style?.height === "number"
            ? style.height
            : undefined,
        zIndex: 40,
      }
    : style ?? {}

  return (
    <div
      role="button"
      tabIndex={0}
      data-timetable-card=""
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick?.()
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={layoutStyle}
      className={cn(
        "group absolute z-10 cursor-pointer select-none text-left outline-none",
        "transition-all duration-150 ease-out",
        isExpanded ? "z-40 overflow-visible" : "overflow-hidden hover:z-30",
        "hover:-translate-y-px",
        "focus-visible:z-40 focus-visible:ring-2 focus-visible:ring-ring/30",
        className
      )}
    >
      <div
        className={cn(
          "relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl",
          isExpanded && "h-auto min-h-full overflow-visible",
          "border border-border/80 bg-background p-2.5 shadow-none lg:p-3 xl:p-4",
          "transition-all duration-150 ease-out",
          "group-hover:border-foreground/20 group-hover:shadow-sm",
          selected && "border-foreground/30 ring-1 ring-foreground/10",
          hasConflict &&
            "border-destructive/50 ring-1 ring-destructive/25 group-hover:border-destructive/70"
        )}
        title={hasConflict && conflictHint ? conflictHint : undefined}
      >
        {hasConflict ? (
          <span
            className="absolute top-2 right-2 z-10 flex size-5 items-center justify-center rounded-full bg-destructive/15 text-destructive"
            aria-label="Trùng lịch"
            title={conflictHint || "Trùng lịch"}
          >
            <AlertTriangle className="size-3" />
          </span>
        ) : null}
        <div
          className={cn(
            "absolute top-2 z-20 flex items-center gap-0.5",
            // Tránh đè icon cảnh báo bên phải
            hasConflict ? "right-8" : "right-2",
            "opacity-0 transition-opacity duration-150 ease-out",
            "group-hover:opacity-100 group-focus-visible:opacity-100",
            (isSingle || isDouble) && "hidden group-hover:flex"
          )}
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="bg-background/90"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClick?.()
                  }}
                  aria-label="Xem chi tiết"
                />
              }
            >
              <MoreHorizontal />
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} align="center">
              Xem chi tiết
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="bg-background/90"
                  onClick={(e) => {
                    e.stopPropagation()
                    onClick?.()
                  }}
                  aria-label="Phân công cán bộ"
                />
              }
            >
              <Pencil />
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} align="center">
              Phân công cán bộ
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="bg-background/90"
                  onClick={(e) => {
                    e.stopPropagation()
                    void navigator.clipboard?.writeText(
                      `${schedule.courseCode} ${schedule.courseName}`
                    )
                  }}
                  aria-label="Copy mã môn"
                />
              }
            >
              <Copy />
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} align="center">
              Copy mã + tên môn
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Shared padding + type scale with 3–4 period cards */}
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-1.5",
            !isExpanded && "overflow-hidden",
            (isSingle || isDouble) && "justify-center"
          )}
        >
          {/* Tên môn */}
          <InfoTooltip label={schedule.courseName}>
            <p
              className={cn(
                "w-fit max-w-full font-semibold tracking-tight text-foreground",
                "text-sm leading-snug xl:text-base",
                isSingle
                  ? hasConflict
                    ? "truncate pr-7"
                    : "truncate pr-0"
                  : hasConflict
                    ? "line-clamp-2 pr-7"
                    : "line-clamp-2 pr-2"
              )}
            >
              {schedule.courseName}
            </p>
          </InfoTooltip>

          {/* 2 tiết: mã môn • L0x + giảng viên */}
          {isDouble && (
            <>
              <InfoTooltip label={codeGroupLabel}>
                <span className="inline-flex max-w-full flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="h-5 border-border/70 font-mono text-[11px] font-medium tabular-nums text-muted-foreground"
                  >
                    {schedule.courseCode}
                  </Badge>
                  <span className="text-[11px] text-border">•</span>
                  <Badge
                    variant="secondary"
                    className="h-5 font-mono text-[11px] font-medium tabular-nums"
                  >
                    {schedule.className}
                  </Badge>
                </span>
              </InfoTooltip>
              <InfoTooltip
                label={
                  schedule.lecturer !== "Chưa phân công"
                    ? `CB giảng dạy: ${teacherLabel}`
                    : "Chưa phân công CB giảng dạy"
                }
              >
                <span className="inline-flex max-w-full items-center gap-1.5 text-[13px] text-muted-foreground">
                  <GraduationCap
                    className={cn("size-3.5 shrink-0", lecturerColor.text)}
                  />
                  <span className="flex min-w-0 items-baseline gap-1.5">
                    <span
                      className={cn(
                        "truncate font-medium",
                        lecturerColor.text
                      )}
                    >
                      {schedule.lecturer}
                    </span>
                    {lecturerStaffId ? (
                      <span
                        className={cn(
                          "shrink-0 font-mono text-[10px] tabular-nums opacity-70",
                          lecturerColor.text
                        )}
                      >
                        MSCB {lecturerStaffId}
                      </span>
                    ) : null}
                  </span>
                </span>
              </InfoTooltip>
            </>
          )}

          {/* ≥3 tiết / expand: full */}
          {!isSingle && !isDouble && (
            <>
              <InfoTooltip label={codeGroupLabel}>
                <span className="inline-flex max-w-full flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="h-5 border-border/70 font-mono text-[11px] font-medium tabular-nums text-muted-foreground"
                  >
                    {schedule.courseCode}
                  </Badge>
                  <span className="text-[11px] text-border">•</span>
                  <Badge
                    variant="secondary"
                    className="h-5 font-mono text-[11px] font-medium tabular-nums"
                  >
                    {schedule.className}
                  </Badge>
                </span>
              </InfoTooltip>

              <div className="mt-0.5 flex flex-col items-start gap-1">
                <PersonLine
                  icon={GraduationCap}
                  label="Cán bộ giảng dạy"
                  name={schedule.teacher || schedule.lecturer}
                />
                <InfoTooltip label={`Phòng: ${schedule.room}`}>
                  <span className="inline-flex max-w-full items-center gap-1.5 text-[13px] text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{schedule.room}</span>
                  </span>
                </InfoTooltip>
                <InfoTooltip label={weeksLabel}>
                  <span className="inline-flex max-w-full items-center gap-1.5 text-[13px] text-muted-foreground">
                    <CalendarRange className="size-3.5 shrink-0 opacity-60" />
                    <span className="truncate font-mono text-xs tabular-nums">
                      {weeksLabel}
                    </span>
                  </span>
                </InfoTooltip>
              </div>

              <InfoTooltip label={`Giờ học: ${timeRange}`}>
                <p className="mt-auto inline-flex w-fit max-w-full items-center gap-1.5 pt-1 font-mono text-xs tabular-nums text-muted-foreground">
                  <Clock className="size-3 shrink-0 opacity-60" />
                  {timeRange}
                </p>
              </InfoTooltip>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
