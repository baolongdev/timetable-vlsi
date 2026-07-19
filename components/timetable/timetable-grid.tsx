"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { DayHeader } from "@/components/timetable/day-header"
import {
  cardInsetX,
  periodColVar,
  periodOffsetStyle,
} from "@/components/timetable/layout"
import {
  getDayLaneCount,
  layoutDaySchedules,
} from "@/components/timetable/lane-layout"
import { PeriodColumn } from "@/components/timetable/period-column"
import { TimetableCard } from "@/components/timetable/timetable-card"
import { TimetableCell } from "@/components/timetable/timetable-cell"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DAYS, PERIOD_HEIGHT, PERIODS } from "@/data/timetable"
import { cn } from "@/lib/utils"
import type { DayInfo, Schedule } from "@/types/timetable"

type PeriodRange = { start: number; end: number }

type TimetableGridProps = {
  schedules: Schedule[]
  selectedId?: string | null
  onSelect: (schedule: Schedule) => void
  onAddSchedule?: (day: number, period: number) => void
}

/** Fixed width (px) of ONE lane — every card renders the same width */
const LANE_WIDTH = 240

export function TimetableGrid({
  schedules,
  selectedId,
  onSelect,
  onAddSchedule,
}: TimetableGridProps) {
  const periodCount = PERIODS.length
  const days: DayInfo[] = DAYS

  const [highlightRange, setHighlightRange] =
    React.useState<PeriodRange | null>(null)

  // Cuộn ngang bằng nút < >
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(
      el.scrollLeft + el.clientWidth < el.scrollWidth - 4
    )
  }, [])

  React.useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", updateScrollState, { passive: true })
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      observer.disconnect()
    }
  }, [updateScrollState])

  const scrollByViewport = (direction: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    // Cuộn ~80% khung nhìn mỗi lần bấm
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: "smooth",
    })
  }

  // Per-day: positioned schedules + lane count (column width scales with it)
  const dayLayouts = React.useMemo(
    () =>
      days.map((day) => {
        const daySchedules = schedules.filter((s) => s.day === day.day)
        return {
          day,
          positioned: layoutDaySchedules(daySchedules),
          laneCount: getDayLaneCount(daySchedules),
        }
      }),
    [days, schedules]
  )

  // Fixed-width day columns: laneCount × LANE_WIDTH → every card equal width
  const gridTemplateColumns = [
    "var(--period-col)",
    ...dayLayouts.map(({ laneCount }) => `${laneCount * LANE_WIDTH}px`),
  ].join(" ")

  return (
    <div className="relative h-full min-h-0 w-full">
      <div
        ref={scrollRef}
        className="scrollbar-minimal h-full min-h-0 w-full overflow-auto bg-background"
      >
        <div className={periodColVar + " flex w-fit min-w-full flex-col"}>
          <DayHeader days={days} gridTemplateColumns={gridTemplateColumns} />

          <div
            // `isolate`: chứa z-index của card trong body — card không đè lên
            // day header sticky khi cuộn dọc
            className="relative isolate grid flex-1"
            style={{
              gridTemplateColumns,
              minHeight: periodCount * PERIOD_HEIGHT,
            }}
          >
            <PeriodColumn highlightRange={highlightRange} />

            {dayLayouts.map(({ day, positioned }) => (
              <TimetableCell
                key={day.day}
                onAddSchedule={(period) => onAddSchedule?.(day.day, period)}
              >
                {positioned.map(({ schedule, lane }) => {
                  const span = schedule.endPeriod - schedule.startPeriod + 1
                  const offset = periodOffsetStyle(
                    schedule.startPeriod,
                    schedule.endPeriod,
                    periodCount
                  )

                  return (
                    <TimetableCard
                      key={schedule.id}
                      schedule={schedule}
                      span={span}
                      selected={selectedId === schedule.id}
                      style={{
                        ...offset,
                        // Fixed-width lanes — mọi card đều rộng bằng nhau
                        left: lane * LANE_WIDTH + cardInsetX,
                        width: LANE_WIDTH - cardInsetX * 2,
                      }}
                      onClick={() => onSelect(schedule)}
                      onPeriodHoverChange={setHighlightRange}
                    />
                  )
                })}
              </TimetableCell>
            ))}
          </div>
        </div>
      </div>

      {/* Nút cuộn ngang < > — chỉ hiện khi còn chỗ để cuộn */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => scrollByViewport(-1)}
              aria-label="Cuộn sang trái"
              className={cn(
                "absolute top-1/2 left-[calc(var(--period-col)+0.75rem)] z-40 -translate-y-1/2 rounded-full bg-background/95 shadow-md backdrop-blur transition-opacity",
                canScrollLeft
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              )}
            />
          }
        >
          <ChevronLeft />
        </TooltipTrigger>
        <TooltipContent side="right">Cuộn sang trái</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => scrollByViewport(1)}
              aria-label="Cuộn sang phải"
              className={cn(
                "absolute top-1/2 right-3 z-40 -translate-y-1/2 rounded-full bg-background/95 shadow-md backdrop-blur transition-opacity",
                canScrollRight
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              )}
            />
          }
        >
          <ChevronRight />
        </TooltipTrigger>
        <TooltipContent side="left">Cuộn sang phải</TooltipContent>
      </Tooltip>
    </div>
  )
}
