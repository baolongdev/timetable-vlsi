import { Plus } from "lucide-react"

import { PERIODS } from "@/data/timetable"
import { cn } from "@/lib/utils"

type TimetableCellProps = {
  children?: React.ReactNode
  className?: string
  onAddSchedule?: (period: number) => void
}

export function TimetableCell({
  children,
  className,
  onAddSchedule,
}: TimetableCellProps) {
  const periodCount = PERIODS.length

  return (
    <div
      className={cn(
        "relative h-full min-h-0 border-r border-border/70 bg-background last:border-r-0",
        className
      )}
    >
      {/* Empty period hover zones */}
      {Array.from({ length: periodCount }).map((_, index) => {
        const period = index + 1
        return (
          <div
            key={period}
            className="group/empty absolute inset-x-0 z-0 border-b border-border/50 last:border-b-0"
            style={{
              top: `${(index / periodCount) * 100}%`,
              height: `${(1 / periodCount) * 100}%`,
            }}
          >
            <button
              type="button"
              onClick={() => onAddSchedule?.(period)}
              className={cn(
                "flex size-full items-center justify-center",
                "opacity-0 transition-opacity duration-150 ease-out",
                "group-hover/empty:opacity-100",
                "text-[11px] font-medium text-muted-foreground"
              )}
            >
              <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-muted hover:text-foreground">
                <Plus className="size-3" />
                Add
              </span>
            </button>
          </div>
        )
      })}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}
