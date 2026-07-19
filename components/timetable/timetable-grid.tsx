"use client"

import * as React from "react"

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
import { DAYS, PERIOD_HEIGHT, PERIODS } from "@/data/timetable"
import type { DayInfo, Schedule } from "@/types/timetable"

type PeriodRange = { start: number; end: number }

export type TimetableScrollState = {
  canScrollLeft: boolean
  canScrollRight: boolean
}

export type TimetableGridHandle = {
  scrollByViewport: (direction: 1 | -1) => void
}

type TimetableGridProps = {
  schedules: Schedule[]
  selectedId?: string | null
  onSelect: (schedule: Schedule) => void
  onAddSchedule?: (day: number, period: number) => void
  /** Báo trạng thái cuộn ngang ra toolbar */
  onScrollStateChange?: (state: TimetableScrollState) => void
  /** id nhóm bị trùng lịch */
  conflictIds?: Set<string>
  /** tooltip chi tiết conflict theo id */
  conflictHints?: Map<string, string>
}

/** Fixed width (px) of ONE lane — every card renders the same width */
const LANE_WIDTH = 240

export const TimetableGrid = React.forwardRef<
  TimetableGridHandle,
  TimetableGridProps
>(function TimetableGrid(
  {
    schedules,
    selectedId,
    onSelect,
    onAddSchedule,
    onScrollStateChange,
    conflictIds,
    conflictHints,
  },
  ref
) {
  const periodCount = PERIODS.length
  const days: DayInfo[] = DAYS

  const [highlightRange, setHighlightRange] =
    React.useState<PeriodRange | null>(null)

  // Cuộn ngang — nút < > nằm trên toolbar, điều khiển qua ref
  const scrollRef = React.useRef<HTMLDivElement>(null)
  /** Mục tiêu tuyệt đối khi bấm nhanh — tránh cộng dồn scrollBy smooth bị lệch */
  const targetScrollLeftRef = React.useRef<number | null>(null)
  const scrollStateRef = React.useRef<TimetableScrollState>({
    canScrollLeft: false,
    canScrollRight: false,
  })

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    // Animation xong (hoặc user kéo tay tới gần target) → thả target
    const target = targetScrollLeftRef.current
    if (target != null && Math.abs(el.scrollLeft - target) < 1.5) {
      targetScrollLeftRef.current = null
    }

    const next: TimetableScrollState = {
      canScrollLeft: el.scrollLeft > 4,
      canScrollRight:
        el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    }
    const prev = scrollStateRef.current
    if (
      prev.canScrollLeft === next.canScrollLeft &&
      prev.canScrollRight === next.canScrollRight
    ) {
      return
    }
    scrollStateRef.current = next
    onScrollStateChange?.(next)
  }, [onScrollStateChange])

  React.useEffect(() => {
    updateScrollState()
    const el = scrollRef.current
    if (!el) return

    const clearTarget = () => {
      targetScrollLeftRef.current = null
    }

    el.addEventListener("scroll", updateScrollState, { passive: true })
    // Cuộn tay / thanh scroll → bỏ target pending (tránh lệch bước sau)
    el.addEventListener("wheel", clearTarget, { passive: true })
    el.addEventListener("pointerdown", clearTarget, { passive: true })
    el.addEventListener("scrollend", updateScrollState)
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      el.removeEventListener("wheel", clearTarget)
      el.removeEventListener("pointerdown", clearTarget)
      el.removeEventListener("scrollend", updateScrollState)
      observer.disconnect()
    }
  }, [updateScrollState, schedules])

  const scrollByViewport = React.useCallback((direction: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
    // Bấm nhanh: cộng từ target đang chờ, không từ scrollLeft giữa chừng
    const base =
      targetScrollLeftRef.current ??
      Math.round(el.scrollLeft / LANE_WIDTH) * LANE_WIDTH

    const next = Math.min(
      maxScroll,
      Math.max(0, base + direction * LANE_WIDTH)
    )
    // Snap theo lưới card (trừ khi kẹp ở mép cuối không chia hết)
    const snapped =
      next >= maxScroll - 0.5
        ? maxScroll
        : Math.min(
            maxScroll,
            Math.max(0, Math.round(next / LANE_WIDTH) * LANE_WIDTH)
          )

    if (Math.abs(snapped - el.scrollLeft) < 0.5) return

    targetScrollLeftRef.current = snapped
    el.scrollTo({ left: snapped, behavior: "smooth" })
  }, [])

  React.useImperativeHandle(
    ref,
    () => ({ scrollByViewport }),
    [scrollByViewport]
  )

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
            // `isolate`: reset z-index của card trong body — card không đè lên
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
                      hasConflict={conflictIds?.has(schedule.id) ?? false}
                      conflictHint={conflictHints?.get(schedule.id)}
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
    </div>
  )
})
