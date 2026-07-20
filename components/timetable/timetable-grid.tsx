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
  /** Node chứa TOÀN BỘ grid (kể cả phần đang cuộn khuất) — dùng export ảnh/PDF */
  getExportNode: () => HTMLElement | null
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

  // Cuộn ngang — nút < > trên toolbar + kéo chuột khoảng trống
  const scrollRef = React.useRef<HTMLDivElement>(null)
  /** Mục tiêu tuyệt đối khi bấm nhanh — tránh cộng dồn scrollBy smooth bị lệch */
  const targetScrollLeftRef = React.useRef<number | null>(null)
  const scrollStateRef = React.useRef<TimetableScrollState>({
    canScrollLeft: false,
    canScrollRight: false,
  })

  /**
   * Drag-to-pan + momentum.
   * Scroll gán trực tiếp trên pointermove (không rAF) → bám tay ngay từ pixel đầu.
   */
  const dragRef = React.useRef<{
    active: boolean
    moved: boolean
    pointerId: number
    startX: number
    startY: number
    scrollLeft: number
    scrollTop: number
    lastX: number
    lastY: number
    lastT: number
    vx: number
    vy: number
  } | null>(null)
  const momentumRafRef = React.useRef(0)
  const draggingRef = React.useRef(false)

  const FRICTION = 0.91
  const MIN_VELOCITY = 0.05 // px/ms
  const MAX_VELOCITY = 3.2

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    if (draggingRef.current) return

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
    const el = scrollRef.current
    if (!el) return

    const stopMomentum = () => {
      if (momentumRafRef.current) {
        cancelAnimationFrame(momentumRafRef.current)
        momentumRafRef.current = 0
      }
    }

    const startMomentum = (vx0: number, vy0: number) => {
      stopMomentum()
      let vx = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, vx0))
      let vy = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, vy0))
      if (Math.abs(vx) < MIN_VELOCITY && Math.abs(vy) < MIN_VELOCITY) {
        draggingRef.current = false
        updateScrollState()
        return
      }
      let lastT = performance.now()
      draggingRef.current = true

      const tick = (now: number) => {
        const dt = Math.min(24, now - lastT)
        lastT = now
        el.scrollLeft -= vx * dt
        el.scrollTop -= vy * dt
        vx *= FRICTION
        vy *= FRICTION

        if (el.scrollLeft <= 0 || el.scrollLeft + el.clientWidth >= el.scrollWidth - 0.5) {
          vx = 0
        }
        if (el.scrollTop <= 0 || el.scrollTop + el.clientHeight >= el.scrollHeight - 0.5) {
          vy = 0
        }

        if (Math.abs(vx) > MIN_VELOCITY || Math.abs(vy) > MIN_VELOCITY) {
          momentumRafRef.current = requestAnimationFrame(tick)
        } else {
          momentumRafRef.current = 0
          draggingRef.current = false
          updateScrollState()
        }
      }
      momentumRafRef.current = requestAnimationFrame(tick)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      const target = e.target as HTMLElement | null
      if (target?.closest("[data-timetable-card]")) return

      stopMomentum()
      targetScrollLeftRef.current = null
      draggingRef.current = true
      const now = performance.now()
      dragRef.current = {
        active: true,
        moved: false,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        lastT: now,
        vx: 0,
        vy: 0,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
      }
      // setPointerCapture sau — một số trình duyệt hitch khi capture ngay
      el.classList.add("cursor-grabbing", "select-none")
      el.classList.remove("cursor-grab")
    }

    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag?.active || drag.pointerId !== e.pointerId) return

      const now = performance.now()
      const dt = Math.max(1, now - drag.lastT)
      const instVx = (e.clientX - drag.lastX) / dt
      const instVy = (e.clientY - drag.lastY) / dt
      // EMA nhẹ hơn (0.5) — phản ứng nhanh hơn lúc đầu
      drag.vx = drag.vx * 0.5 + instVx * 0.5
      drag.vy = drag.vy * 0.5 + instVy * 0.5
      drag.lastX = e.clientX
      drag.lastY = e.clientY
      drag.lastT = now

      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      // Ngưỡng 1px — bám tay ngay, gần như không dead-zone
      if (!drag.moved) {
        if (dx * dx + dy * dy < 1) return
        drag.moved = true
        try {
          el.setPointerCapture(e.pointerId)
        } catch {
          // ignore
        }
      }

      e.preventDefault()
      // Gán scroll trực tiếp — không rAF (tránh trễ 1 frame khúc đầu)
      el.scrollLeft = drag.scrollLeft - dx
      el.scrollTop = drag.scrollTop - dy
    }

    const endDrag = (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag?.active || drag.pointerId !== e.pointerId) return

      const moved = drag.moved
      const vx = drag.vx
      const vy = drag.vy
      drag.active = false
      dragRef.current = null

      el.classList.remove("cursor-grabbing", "select-none")
      el.classList.add("cursor-grab")
      try {
        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId)
        }
      } catch {
        // ignore
      }

      if (moved) {
        const blockClick = (ev: Event) => {
          ev.preventDefault()
          ev.stopPropagation()
        }
        el.addEventListener("click", blockClick, { capture: true, once: true })
        window.setTimeout(() => {
          el.removeEventListener("click", blockClick, { capture: true })
        }, 0)

        if (Math.abs(vx) > MIN_VELOCITY || Math.abs(vy) > MIN_VELOCITY) {
          startMomentum(vx, vy)
        } else {
          draggingRef.current = false
          updateScrollState()
        }
      } else {
        draggingRef.current = false
        updateScrollState()
      }
    }

    const clearTarget = () => {
      targetScrollLeftRef.current = null
      stopMomentum()
      if (draggingRef.current && !dragRef.current) {
        draggingRef.current = false
        updateScrollState()
      }
    }

    el.addEventListener("pointerdown", onPointerDown)
    el.addEventListener("pointermove", onPointerMove, { passive: false })
    el.addEventListener("pointerup", endDrag)
    el.addEventListener("pointercancel", endDrag)
    el.addEventListener("scroll", updateScrollState, { passive: true })
    el.addEventListener("wheel", clearTarget, { passive: true })
    el.addEventListener("scrollend", updateScrollState)
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(el)

    updateScrollState()

    return () => {
      stopMomentum()
      el.removeEventListener("pointerdown", onPointerDown)
      el.removeEventListener("pointermove", onPointerMove)
      el.removeEventListener("pointerup", endDrag)
      el.removeEventListener("pointercancel", endDrag)
      el.removeEventListener("scroll", updateScrollState)
      el.removeEventListener("wheel", clearTarget)
      el.removeEventListener("scrollend", updateScrollState)
      observer.disconnect()
    }
  }, [updateScrollState])

  const scrollByViewport = React.useCallback((direction: 1 | -1) => {
    const el = scrollRef.current
    if (!el) return
    // Dừng momentum nếu đang trượt
    if (momentumRafRef.current) {
      cancelAnimationFrame(momentumRafRef.current)
      momentumRafRef.current = 0
      draggingRef.current = false
    }

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

  const exportNodeRef = React.useRef<HTMLDivElement>(null)

  React.useImperativeHandle(
    ref,
    () => ({
      scrollByViewport,
      getExportNode: () => exportNodeRef.current,
    }),
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
        // cursor-grab mặc định; lúc kéo đổi bằng classList (không re-render)
        className="scrollbar-minimal h-full min-h-0 w-full cursor-grab overflow-auto bg-background touch-none"
      >
        <div
          ref={exportNodeRef}
          className={periodColVar + " flex w-fit min-w-full flex-col bg-background"}
        >
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
