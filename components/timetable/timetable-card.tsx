"use client"

import * as React from "react"
import { CalendarRange, Clock, Copy, GraduationCap, MapPin, MoreHorizontal, Pencil, UserCog } from "lucide-react"

import { getPeriodRangeLabel } from "@/data/timetable"
import { getLecturerColor } from "@/lib/lecturer-colors"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Schedule } from "@/types/timetable"

/** Một dòng người phụ trách / giảng dạy trên card, tô màu theo người */
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
      <div
        className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground/60"
        title={`${label}: chưa phân công`}
      >
        <Icon className="size-3.5 shrink-0 opacity-50" />
        <span className="truncate italic">Chưa phân công</span>
      </div>
    )
  }
  const color = getLecturerColor(name)
  return (
    <div
      className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground"
      title={`${label}: ${name}`}
    >
      <Icon className={cn("size-3.5 shrink-0", color.text)} />
      <span className={cn("truncate font-medium", color.text)}>{name}</span>
    </div>
  )
}

type TimetableCardProps = {
  schedule: Schedule
  span?: number
  style?: React.CSSProperties
  className?: string
  selected?: boolean
  onClick?: () => void
  onPeriodHoverChange?: (range: { start: number; end: number } | null) => void
}

export function TimetableCard({
  schedule,
  span = 3,
  style,
  className,
  selected = false,
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
        "group absolute z-10 cursor-pointer text-left outline-none",
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
            selected && "border-foreground/30 ring-1 ring-foreground/10"
          )}
        >
          <div
            className={cn(
              "absolute top-2 right-2 z-10 flex items-center gap-0.5",
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
              <TooltipContent>Xem chi tiết</TooltipContent>
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
              <TooltipContent>Phân công cán bộ</TooltipContent>
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
              <TooltipContent>Copy mã + tên môn</TooltipContent>
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
            {/* Tên môn — same as 3–4 tiết */}
            <p
              className={cn(
                "font-semibold tracking-tight text-foreground",
                "text-sm leading-snug xl:text-base",
                isSingle ? "truncate pr-0" : "line-clamp-2 pr-2"
              )}
            >
              {schedule.courseName}
            </p>

            {/* 1 tiết: chỉ tên môn (đã render ở trên) */}

            {/* 2 tiết: mã môn • L0x + giảng viên */}
            {isDouble && (
              <>
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
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
                </div>
                <div
                  className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground"
                  title={schedule.lecturer}
                >
                  <GraduationCap
                    className={cn("size-3.5 shrink-0", lecturerColor.text)}
                  />
                  <span
                    className={cn("truncate font-medium", lecturerColor.text)}
                  >
                    {schedule.lecturer}
                  </span>
                </div>
                {/* Khi hover mở rộng: đủ 2 vai trò */}
                {isExpanded ? (
                  <>
                    <PersonLine
                      icon={UserCog}
                      label="Cán bộ phụ trách"
                      name={schedule.lead}
                    />
                  </>
                ) : null}
              </>
            )}

            {/* ≥3 tiết / expand: full */}
            {!isSingle && !isDouble && (
              <>
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
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
                </div>

                <div className="mt-0.5 flex flex-col gap-1">
                  {/* Cán bộ phụ trách + Cán bộ giảng dạy */}
                  <PersonLine
                    icon={UserCog}
                    label="Cán bộ phụ trách"
                    name={schedule.lead}
                  />
                  <PersonLine
                    icon={GraduationCap}
                    label="Cán bộ giảng dạy"
                    name={schedule.teacher}
                  />
                  <div
                    className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground"
                    title={schedule.room}
                  >
                    <MapPin className="size-3.5 shrink-0 opacity-60" />
                    <span className="truncate">{schedule.room}</span>
                  </div>
                  <div
                    className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground"
                    title={`Tuần ${schedule.weeks}`}
                  >
                    <CalendarRange className="size-3.5 shrink-0 opacity-60" />
                    <span className="truncate font-mono text-xs tabular-nums">
                      Tuần {schedule.weeks}
                    </span>
                  </div>
                </div>

                <p className="mt-auto flex items-center gap-1.5 pt-1 font-mono text-xs tabular-nums text-muted-foreground">
                  <Clock className="size-3 shrink-0 opacity-60" />
                  {timeRange}
                </p>
              </>
            )}
          </div>
        </div>
    </div>
  )
}
