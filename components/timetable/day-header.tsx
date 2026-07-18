import { periodColVar } from "@/components/timetable/layout"
import { DAYS } from "@/data/timetable"
import { cn } from "@/lib/utils"
import type { DayInfo } from "@/types/timetable"

type DayHeaderProps = {
  days?: DayInfo[]
  /** Must match the body grid so header cells align with day columns */
  gridTemplateColumns?: string
  className?: string
}

export function DayHeader({
  days = DAYS,
  gridTemplateColumns,
  className,
}: DayHeaderProps) {
  const colCount = days.length

  return (
    <div
      className={cn(
        "sticky top-0 z-30 grid h-11 shrink-0 border-b border-border bg-background",
        periodColVar,
        className
      )}
      style={{
        gridTemplateColumns:
          gridTemplateColumns ??
          `var(--period-col) repeat(${colCount}, minmax(0, 1fr))`,
      }}
    >
      <div className="sticky left-0 z-40 border-r border-border/70 bg-background" />
      {days.map((day) => (
        <div
          key={day.day}
          className="flex items-center justify-center border-r border-border/70 px-2 last:border-r-0"
        >
          {/* Sticky theo trục X: cột rộng cuộn ngang thì nhãn vẫn bám trong
              vùng nhìn thấy (sau cột tiết), hết cột mới trôi đi */}
          <span className="sticky left-[calc(var(--period-col)+0.5rem)] right-2 text-xs font-medium tracking-tight text-muted-foreground sm:text-[13px] sm:text-foreground">
            <span className="sm:hidden">{day.shortLabel}</span>
            <span className="hidden sm:inline">{day.label}</span>
          </span>
        </div>
      ))}
    </div>
  )
}
