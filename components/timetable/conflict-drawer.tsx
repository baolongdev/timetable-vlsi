"use client"

import { AlertTriangle, DoorOpen, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import type { ConflictIndex, ScheduleConflict } from "@/lib/schedule-conflicts"
import { cn } from "@/lib/utils"

type ConflictDrawerProps = {
  index: ConflictIndex
  className?: string
}

function ConflictCard({ c }: { c: ScheduleConflict }) {
  const Icon = c.kind === "lecturer" ? UserRound : DoorOpen
  const kindLabel =
    c.kind === "lecturer" ? "Trùng giảng viên" : "Trùng phòng học"

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-destructive/20 bg-background text-destructive">
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-destructive">{kindLabel}</p>
          <p className="truncate text-sm font-semibold text-foreground">
            {c.resource}
          </p>
        </div>
      </div>
      <p className="text-xs leading-relaxed whitespace-pre-line text-muted-foreground">
        {c.message}
      </p>
    </div>
  )
}

/**
 * Icon/nút trên header (cùng hàng Khoa · Export · Môn học…).
 * Bấm mở Drawer danh sách trùng lịch — chỉ hiện khi có conflict.
 */
export function ConflictDrawer({ index, className }: ConflictDrawerProps) {
  const { conflicts, counts } = index
  if (conflicts.length === 0) return null

  const lecturerConflicts = conflicts.filter((c) => c.kind === "lecturer")
  const roomConflicts = conflicts.filter((c) => c.kind === "room")

  return (
    <Drawer swipeDirection="right">
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            data-tour="conflicts"
            className={cn(
              "text-destructive transition-opacity duration-150 hover:bg-destructive/10 hover:text-destructive",
              className
            )}
            aria-label={`Cảnh báo trùng lịch: ${counts.schedules} nhóm`}
            title={`${counts.schedules} nhóm bị trùng lịch — bấm để xem chi tiết`}
          />
        }
      >
        <AlertTriangle data-icon="inline-start" />
        Trùng lịch
        <Badge
          variant="destructive"
          className="ml-0.5 h-5 min-w-5 justify-center rounded-full px-1.5 tabular-nums"
        >
          {counts.schedules}
        </Badge>
      </DrawerTrigger>

      <DrawerContent className="data-[swipe-direction=right]:w-full data-[swipe-direction=right]:max-w-md sm:data-[swipe-direction=right]:max-w-md">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            Cảnh báo trùng lịch
          </DrawerTitle>
          <DrawerDescription className="text-left">
            Có{" "}
            <span className="font-medium text-foreground">
              {counts.schedules} nhóm lớp
            </span>{" "}
            bị ảnh hưởng
            {counts.lecturer > 0
              ? ` · ${counts.lecturer} trường hợp trùng giảng viên`
              : ""}
            {counts.room > 0
              ? ` · ${counts.room} trường hợp trùng phòng`
              : ""}
            . Các card trên lưới có viền đỏ — chỉnh phân công để hết cảnh báo.
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-3">
          {lecturerConflicts.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Trùng giảng viên ({lecturerConflicts.length})
              </h3>
              <div className="flex flex-col gap-2">
                {lecturerConflicts.map((c, i) => (
                  <ConflictCard key={`l-${c.aId}-${c.bId}-${i}`} c={c} />
                ))}
              </div>
            </section>
          ) : null}

          {roomConflicts.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Trùng phòng ({roomConflicts.length})
              </h3>
              <div className="flex flex-col gap-2">
                {roomConflicts.map((c, i) => (
                  <ConflictCard key={`r-${c.aId}-${c.bId}-${i}`} c={c} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <DrawerFooter>
          <DrawerClose
            render={<Button variant="outline" className="w-full rounded-xl" />}
          >
            Đóng
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
