import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"

type TimetableEmptyProps = {
  onClear?: () => void
}

export function TimetableEmpty({ onClear }: TimetableEmptyProps) {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
        <Search className="size-4 text-muted-foreground" />
      </div>
      <div className="flex max-w-sm flex-col gap-1.5">
        <p className="text-base font-semibold tracking-tight text-foreground">
          No schedules found
        </p>
        <p className="text-sm text-muted-foreground">
          Try another search or clear filters to see the full week.
        </p>
      </div>
      {onClear ? (
        <Button variant="outline" size="sm" className="rounded-xl" onClick={onClear}>
          Clear filters
        </Button>
      ) : null}
    </div>
  )
}
