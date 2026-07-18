import { PERIODS } from "@/data/timetable"
import { cn } from "@/lib/utils"

type PeriodColumnProps = {
  highlightRange?: { start: number; end: number } | null
  className?: string
}

export function PeriodColumn({
  highlightRange = null,
  className,
}: PeriodColumnProps) {
  return (
    <div
      className={cn(
        "sticky left-0 z-50 flex h-full w-[var(--period-col)] shrink-0 flex-col border-r border-border/70 bg-background",
        className
      )}
    >
      {PERIODS.map((period) => {
        const active =
          highlightRange != null &&
          period.period >= highlightRange.start &&
          period.period <= highlightRange.end

        return (
          <div
            key={period.period}
            className={cn(
              "flex min-h-0 flex-1 flex-col items-end justify-center gap-0.5 border-b border-border/50 pr-2 transition-colors duration-150 last:border-b-0",
              active && "bg-muted/60"
            )}
          >
            <span
              className={cn(
                "text-[11px] font-medium leading-none tracking-tight",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {period.label}
            </span>
            <span
              className={cn(
                "font-mono text-[10px] tabular-nums leading-none",
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground/70"
              )}
            >
              {period.time}
            </span>
          </div>
        )
      })}
    </div>
  )
}
