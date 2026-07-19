"use client"

import { AlertTriangle } from "lucide-react"

import type { ConflictIndex } from "@/lib/schedule-conflicts"
import { cn } from "@/lib/utils"

type ConflictBannerProps = {
  index: ConflictIndex
  className?: string
}

/** Thanh cảnh báo tổng hợp — ngôn ngữ dễ hiểu */
export function ConflictBanner({ index, className }: ConflictBannerProps) {
  const { counts, conflicts } = index
  if (conflicts.length === 0) return null

  const reasons: string[] = []
  if (counts.lecturer > 0) {
    reasons.push(
      counts.lecturer === 1
        ? "1 trường hợp cùng giảng viên dạy hai nhóm cùng lúc"
        : `${counts.lecturer} trường hợp cùng giảng viên dạy hai nhóm cùng lúc`
    )
  }
  if (counts.room > 0) {
    reasons.push(
      counts.room === 1
        ? "1 trường hợp hai nhóm dùng chung một phòng cùng lúc"
        : `${counts.room} trường hợp hai nhóm dùng chung một phòng cùng lúc`
    )
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
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-medium">
          Có {counts.schedules} nhóm lớp bị trùng lịch
        </p>
        <p className="text-xs leading-relaxed text-destructive/85">
          {reasons.join(". ")}.
        </p>
        <p className="text-xs text-destructive/70">
          Nhóm bị trùng có viền đỏ trên lưới — bấm vào card để xem chi tiết và
          chỉnh lại phân công.
        </p>
      </div>
    </div>
  )
}
