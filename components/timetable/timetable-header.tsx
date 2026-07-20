"use client"

import Link from "next/link"
import {
  BookOpen,
  Download,
  FileImage,
  FileText,
  Loader2,
  Table2,
  Users,
} from "lucide-react"

import { TourHelpButton } from "@/components/onboarding-tour"
import { PresenceHeaderControl } from "@/components/presence-widget"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type TimetableHeaderProps = {
  /** Export CSV (danh sách đang lọc) */
  onExport: () => void
  /** Export ảnh PNG toàn bộ grid */
  onExportImage?: () => void
  /** Export PDF một trang */
  onExportPdf?: () => void
  /** Đang render ảnh/PDF */
  exporting?: boolean
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
  onExportImage,
  onExportPdf,
  exporting = false,
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
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger
              render={
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="sm"
                      data-tour="export"
                      disabled={exporting}
                      className="transition-opacity duration-150 hover:opacity-80"
                    />
                  }
                />
              }
            >
              {exporting ? (
                <Loader2
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <Download data-icon="inline-start" />
              )}
              Export
            </TooltipTrigger>
            <TooltipContent>
              Tải thời khóa biểu: CSV · Ảnh PNG · PDF
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Tải thời khóa biểu</DropdownMenuLabel>
              <DropdownMenuItem onClick={onExport}>
                <Table2 />
                <div className="flex flex-col">
                  <span>File CSV</span>
                  <span className="text-[11px] text-muted-foreground">
                    Danh sách đang lọc — mở bằng Excel
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            {onExportImage || onExportPdf ? <DropdownMenuSeparator /> : null}
            {onExportImage || onExportPdf ? (
              <DropdownMenuGroup>
                {onExportImage ? (
                  <DropdownMenuItem
                    disabled={exporting}
                    onClick={onExportImage}
                  >
                    <FileImage />
                    <div className="flex flex-col">
                      <span>Ảnh PNG</span>
                      <span className="text-[11px] text-muted-foreground">
                        Toàn bộ grid trong một ảnh nét cao
                      </span>
                    </div>
                  </DropdownMenuItem>
                ) : null}
                {onExportPdf ? (
                  <DropdownMenuItem
                    disabled={exporting}
                    onClick={onExportPdf}
                  >
                    <FileText />
                    <div className="flex flex-col">
                      <span>File PDF</span>
                      <span className="text-[11px] text-muted-foreground">
                        Một trang, khổ giấy vừa đúng grid
                      </span>
                    </div>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuGroup>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
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
