"use client"

import Link from "next/link"
import { BookOpen, Download, Users } from "lucide-react"

import { TourHelpButton } from "@/components/onboarding-tour"
import { PresenceHeaderControl } from "@/components/presence-widget"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type TimetableHeaderProps = {
  onExport: () => void
  /** Tên khoa / tổ đang xem */
  departmentName?: string
  /** Slot cho nút chuyển khoa / upload */
  importSlot?: React.ReactNode
  /** Slot cảnh báo trùng lịch (icon + drawer) */
  conflictSlot?: React.ReactNode
  className?: string
}

export function TimetableHeader({
  onExport,
  departmentName,
  importSlot,
  conflictSlot,
  className,
}: TimetableHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          {departmentName ?? "Timetable"}
        </h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground/70">Semester 1</span>
          <span className="mx-1.5 text-border">•</span>
          <span>2026</span>
          {departmentName ? (
            <>
              <span className="mx-1.5 text-border">•</span>
              <span>Thời khóa biểu</span>
            </>
          ) : null}
        </p>
      </div>

      <div
        data-tour="header-actions"
        className="flex flex-wrap items-center gap-1"
      >
        {importSlot}
        {conflictSlot}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="sm"
                data-tour="export"
                onClick={onExport}
                className="transition-opacity duration-150 hover:opacity-80"
              />
            }
          >
            <Download data-icon="inline-start" />
            Export
          </TooltipTrigger>
          <TooltipContent>
            Tải danh sách đang lọc dưới dạng CSV
          </TooltipContent>
        </Tooltip>
        <Button
          variant="ghost"
          size="sm"
          data-tour="nav-courses"
          className="transition-opacity duration-150 hover:opacity-80"
          render={<Link href="/courses" />}
          nativeButton={false}
        >
          <BookOpen data-icon="inline-start" />
          Môn học
        </Button>
        <Button
          variant="ghost"
          size="sm"
          data-tour="nav-lecturers"
          className="transition-opacity duration-150 hover:opacity-80"
          render={<Link href="/lecturers" />}
          nativeButton={false}
        >
          <Users data-icon="inline-start" />
          Giảng viên
        </Button>
        <TourHelpButton />
        <PresenceHeaderControl />
        <span data-tour="theme-toggle" className="inline-flex">
          <ThemeToggle className="transition-opacity duration-150 hover:opacity-80" />
        </span>
      </div>
    </header>
  )
}
