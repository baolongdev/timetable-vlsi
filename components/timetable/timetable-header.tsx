"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  Building2,
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
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar"
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
  /** Department list for menu */
  departments?: { id: string; name: string }[]
  /** Current dept id */
  currentDeptId?: string
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
  departments = [],
  currentDeptId,
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
        className="flex items-center gap-1"
      >
        <Menubar className="h-9 rounded-xl border-0 bg-muted/40 p-0.5">
          {/* Bộ môn */}
          {departments.length > 1 ? (
            <MenubarMenu>
              <MenubarTrigger className="gap-1.5 px-2.5">
                <Building2 className="size-4 shrink-0" />
                Bộ môn
              </MenubarTrigger>
              <MenubarContent align="start">
                {departments.map((d) => (
                  <MenubarItem
                    key={d.id}
                    className={cn(
                      "cursor-pointer gap-2",
                      d.id === currentDeptId && "font-semibold"
                    )}
                    render={<Link href={`/timetable/${d.id}`} />}
                  >
                    {d.id === currentDeptId ? "✓ " : null}
                    {d.name}
                  </MenubarItem>
                ))}
                <MenubarSeparator />
                <MenubarItem
                  className="gap-2"
                  render={<Link href="/departments" />}
                >
                  <Building2 className="size-4" />
                  Quản lý khoa
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          ) : null}

          {/* Trang */}
          <MenubarMenu>
            <MenubarTrigger className="gap-1.5 px-2.5">
              <BookOpen className="size-4 shrink-0" />
              Trang
            </MenubarTrigger>
            <MenubarContent align="start">
              <MenubarItem
                className="gap-2"
                render={<Link href="/courses" />}
              >
                <BookOpen className="size-4" />
                Môn học
              </MenubarItem>
              <MenubarItem
                className="gap-2"
                render={<Link href="/lecturers" />}
              >
                <Users className="size-4" />
                Giảng viên
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem
                className="gap-2"
                render={<Link href="/departments" />}
              >
                <Building2 className="size-4" />
                Quản lý khoa
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* Xuất file */}
          <MenubarMenu>
            <MenubarTrigger
              disabled={exporting}
              className="gap-1.5 px-2.5"
            >
              {exporting ? (
                <Loader2 className="size-4 shrink-0 animate-spin" />
              ) : (
                <Download className="size-4 shrink-0" />
              )}
              Xuất
            </MenubarTrigger>
            <MenubarContent align="end" className="w-64">
              <MenubarItem className="gap-2" onClick={onExport}>
                <Table2 className="size-4" />
                <div className="flex flex-col">
                  <span>File CSV</span>
                  <span className="text-[11px] text-muted-foreground">
                    Danh sách đang lọc — mở bằng Excel
                  </span>
                </div>
              </MenubarItem>
              {onExportImage || onExportPdf ? <MenubarSeparator /> : null}
              {onExportImage ? (
                <MenubarItem
                  className="gap-2"
                  disabled={exporting}
                  onClick={onExportImage}
                >
                  <FileImage className="size-4" />
                  <div className="flex flex-col">
                    <span>Ảnh PNG</span>
                    <span className="text-[11px] text-muted-foreground">
                      Toàn bộ grid trong một ảnh nét cao
                    </span>
                  </div>
                </MenubarItem>
              ) : null}
              {onExportPdf ? (
                <MenubarItem
                  className="gap-2"
                  disabled={exporting}
                  onClick={onExportPdf}
                >
                  <FileText className="size-4" />
                  <div className="flex flex-col">
                    <span>File PDF</span>
                    <span className="text-[11px] text-muted-foreground">
                      Một trang, khổ giấy vừa đúng grid
                    </span>
                  </div>
                </MenubarItem>
              ) : null}
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        {conflictSlot}
        <TourHelpButton />
        <PresenceHeaderControl />
        <span data-tour="theme-toggle" className="inline-flex">
          <ThemeToggle className="transition-opacity duration-150 hover:opacity-80" />
        </span>
      </div>
    </header>
  )
}
