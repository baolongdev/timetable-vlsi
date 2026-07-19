import { Skeleton } from "@/components/ui/skeleton"
import { pagePad, sectionGap } from "@/components/timetable/layout"
import { cn } from "@/lib/utils"

/** Khung xám mô phỏng grid thời khóa biểu khi đang tải */
export function TimetableSkeleton() {
  // [cột, top %, height %] các block giả
  const blocks: Array<[number, number, number]> = [
    [0, 8, 22], [0, 55, 18],
    [1, 12, 30], [1, 60, 25],
    [2, 20, 18], [2, 48, 30],
    [3, 6, 25], [3, 65, 20],
    [4, 15, 35],
    [5, 10, 20], [5, 45, 28],
    [6, 30, 22],
  ]

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background">
      {/* Day header */}
      <div className="grid h-11 shrink-0 grid-cols-[3.5rem_repeat(7,1fr)] border-b border-border">
        <div className="border-r border-border/70" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-center border-r border-border/70 last:border-r-0"
          >
            <Skeleton className="h-3.5 w-12" />
          </div>
        ))}
      </div>
      {/* Body */}
      <div className="grid min-h-0 flex-1 grid-cols-[3.5rem_repeat(7,1fr)]">
        {/* Period column */}
        <div className="flex flex-col border-r border-border/70">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-1 flex-col items-end justify-center gap-1 border-b border-border/50 pr-2 last:border-b-0"
            >
              <Skeleton className="h-2.5 w-8" />
              <Skeleton className="h-2 w-10" />
            </div>
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, col) => (
          <div
            key={col}
            className="relative border-r border-border/70 last:border-r-0"
          >
            {blocks
              .filter(([c]) => c === col)
              .map(([, top, height], i) => (
                <Skeleton
                  key={i}
                  className="absolute right-1 left-1 rounded-2xl"
                  style={{ top: `${top}%`, height: `${height}%` }}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Skeleton nguyên trang timetable (header + toolbar + grid) */
export function TimetablePageSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className={cn(pagePad, "flex min-h-0 flex-1 flex-col", sectionGap)}>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        {/* Toolbar */}
        <div className="flex items-center gap-4 border-b border-border/60 pb-4">
          <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
          <Skeleton className="hidden h-10 w-[180px] rounded-xl md:block" />
          <Skeleton className="hidden h-10 w-[160px] rounded-xl md:block" />
          <Skeleton className="hidden h-10 w-[130px] rounded-xl md:block" />
        </div>
        {/* Grid */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <TimetableSkeleton />
        </div>
      </div>
    </div>
  )
}

/** Skeleton trang dạng bảng (Môn học / Giảng viên) */
export function TablePageSkeleton() {
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <div className={cn(pagePad, "flex min-h-0 flex-1 flex-col gap-6")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>
        <div className="flex items-center gap-3 border-b border-border/60 pb-4">
          <Skeleton className="h-10 w-full max-w-sm rounded-xl" />
          <Skeleton className="h-10 w-[200px] rounded-xl" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/70">
          <div className="flex h-10 items-center gap-6 border-b border-border bg-background px-4">
            {[8, 16, 40, 20, 32].map((w, i) => (
              <Skeleton key={i} className="h-3" style={{ width: w * 4 }} />
            ))}
          </div>
          <div className="flex flex-col">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-6 border-b border-border/50 px-4 py-3"
              >
                <Skeleton className="size-7 rounded-full" />
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="hidden h-4 w-40 lg:block" />
                <Skeleton className="ml-auto h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
