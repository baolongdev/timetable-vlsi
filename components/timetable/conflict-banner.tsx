"use client"

import { AlertTriangle } from "lucide-react"

import type { ConflictIndex } from "@/lib/schedule-conflicts"
import { cn } from "@/lib/utils"

type ConflictBannerProps = {
  index: ConflictIndex
  className?: string
}

/** Thanh cảnh báo tổng hợp trùng lịch (GV / phòng) */
export function ConflictBanner({ index, className }: ConflictBannerProps) {
  const { counts, conflicts } = index
  if (conflicts.length === 0) return null

  const parts: string[] = []
  if (counts.lecturer > 0) {
    parts.push(`${counts.lecturer} trùng giảng viên`)
  }
  if (counts.room > 0) {
    parts.push(`${counts.room} trùng phòng`)
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive",
        className
      )}
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex flex-col gap-0.5">
        <p className="font-medium">
          Cảnh báo trùng lịch · {counts.schedules} nhóm bị ảnh hưởng
        </p>
        <p className="text-xs text-destructive/80">
          {parts.join(" · ")}. Card viền đỏ trên lưới; hover để xem chi tiết.
        </p>
      </div>
    </div>
  )
}
