import { getLecturerColor } from "@/lib/lecturer-colors"
import { cn } from "@/lib/utils"

type LecturerChipProps = {
  name: string
  className?: string
}

/** Small tinted chip showing a lecturer's name in their personal color */
export function LecturerChip({ name, className }: LecturerChipProps) {
  const color = getLecturerColor(name)
  return (
    <span
      className={cn(
        "inline-flex h-5 max-w-full items-center rounded-md border px-1.5 text-[11px] font-medium",
        color.bg,
        color.text,
        color.border,
        className
      )}
      title={name}
    >
      <span className="truncate">{name}</span>
    </span>
  )
}
