import { getLecturerColor } from "@/lib/lecturer-colors"
import {
  formatLecturerWithStaffId,
  getStaffIdByName,
} from "@/lib/lecturer-staff"
import { cn } from "@/lib/utils"

type LecturerChipProps = {
  name: string
  className?: string
}

/** Chip tên giảng viên + MSCB (mã số cán bộ) nếu có */
export function LecturerChip({ name, className }: LecturerChipProps) {
  const color = getLecturerColor(name)
  const staffId = getStaffIdByName(name)
  return (
    <span
      className={cn(
        "inline-flex h-5 max-w-full items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium",
        color.bg,
        color.text,
        color.border,
        className
      )}
      title={formatLecturerWithStaffId(name)}
    >
      <span className="truncate">{name}</span>
      {staffId ? (
        <span className="shrink-0 font-mono text-[10px] tabular-nums opacity-70">
          MSCB {staffId}
        </span>
      ) : null}
    </span>
  )
}
