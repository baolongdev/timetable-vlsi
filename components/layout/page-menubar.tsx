"use client"

import Link from "next/link"
import {
  ArrowRightLeft,
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
import { cn } from "@/lib/utils"

type DeptItem = { id: string; name: string }

type PageMenubarProps = {
  /** Current page identifier — controls "Trang" menu active state */
  activePage: "timetable" | "courses" | "lecturers"
  /** Department list */
  departments: DeptItem[]
  /** Current dept id (null if viewing all) */
  currentDeptId?: string
  /** Route prefix for dept links, defaults to activePage */
  deptRoute?: string
  /** Show "Chưa phân khoa" link in Bộ môn menu (lecturers only) */
  unassignedCount?: number
  /** Show "Chỉ thỉnh giảng" link in Bộ môn menu (lecturers only) */
  guestOnlyCount?: number
  /** Show export menu */
  exportMenu?: {
    onExport: () => void
    onExportImage?: () => void
    onExportPdf?: () => void
    exporting?: boolean
  }
  /** Conflict badge slot (inserted between menubar and utilities) */
  conflictSlot?: React.ReactNode
  /** Extra action slot after utilities (e.g. "Thêm giảng viên" button) */
  actionSlot?: React.ReactNode
  className?: string
}

function DeptLink({
  d,
  active,
  route,
}: {
  d: DeptItem
  active: boolean
  route: string
}) {
  return (
    <MenubarItem
      className={cn("gap-2", active && "font-semibold")}
      render={<Link href={`/${route}/${d.id}`} />}
    >
      {active ? "✓ " : null}
      {d.name}
    </MenubarItem>
  )
}

export function PageMenubar({
  activePage,
  departments,
  currentDeptId,
  deptRoute,
  unassignedCount,
  guestOnlyCount,
  exportMenu,
  conflictSlot,
  actionSlot,
  className,
}: PageMenubarProps) {
  const route = deptRoute ?? activePage

  return (
    <div data-tour="header-actions" className={cn("flex items-center gap-1", className)}>
      <Menubar className="h-9 rounded-xl border-0 bg-muted/40 p-0.5">
        {/* Bộ môn — only when departments exist */}
        {departments.length > 0 ? (
          <MenubarMenu>
            <MenubarTrigger className="gap-1.5 px-2.5">
              <Building2 className="size-4 shrink-0" />
              Bộ môn
            </MenubarTrigger>
            <MenubarContent align="start">
              {departments.map((d) => (
                <DeptLink
                  key={d.id}
                  d={d}
                  active={d.id === currentDeptId}
                  route={route}
                />
              ))}
              {unassignedCount ? (
                <MenubarItem
                  className="gap-2"
                  render={<Link href="/lecturers/unassigned" />}
                >
                  {currentDeptId === "unassigned" ? "✓ " : null}
                  Chưa phân khoa
                  <span className="ml-auto text-xs text-muted-foreground">
                    {unassignedCount}
                  </span>
                </MenubarItem>
              ) : null}
              {guestOnlyCount ? (
                <MenubarItem
                  className="gap-2"
                  render={<Link href="/lecturers/guest-only" />}
                >
                  {currentDeptId === "guest-only" ? "✓ " : null}
                  <ArrowRightLeft className="size-4" />
                  Chỉ thỉnh giảng
                  <span className="ml-auto text-xs text-muted-foreground">
                    {guestOnlyCount}
                  </span>
                </MenubarItem>
              ) : null}
              <MenubarSeparator />
              <MenubarItem className="gap-2" render={<Link href="/departments" />}>
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
            <MenubarItem className="gap-2" render={<Link href="/timetable" />}>
              {activePage === "timetable" ? "✓ " : null}
              Thời khóa biểu
            </MenubarItem>
            <MenubarItem className="gap-2" render={<Link href="/courses" />}>
              {activePage === "courses" ? "✓ " : null}
              Môn học
            </MenubarItem>
            <MenubarItem className="gap-2" render={<Link href="/lecturers" />}>
              {activePage === "lecturers" ? "✓ " : null}
              Giảng viên
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        {/* Xuất file — only for timetable */}
        {exportMenu ? (
          <MenubarMenu>
            <MenubarTrigger
              disabled={exportMenu.exporting}
              className="gap-1.5 px-2.5"
            >
              {exportMenu.exporting ? (
                <Loader2 className="size-4 shrink-0 animate-spin" />
              ) : (
                <Download className="size-4 shrink-0" />
              )}
              Xuất
            </MenubarTrigger>
            <MenubarContent align="end" className="w-64">
              <MenubarItem className="gap-2" onClick={exportMenu.onExport}>
                <Table2 className="size-4" />
                <div className="flex flex-col">
                  <span>File CSV</span>
                  <span className="text-[11px] text-muted-foreground">
                    Danh sách đang lọc — mở bằng Excel
                  </span>
                </div>
              </MenubarItem>
              {exportMenu.onExportImage || exportMenu.onExportPdf ? (
                <MenubarSeparator />
              ) : null}
              {exportMenu.onExportImage ? (
                <MenubarItem
                  className="gap-2"
                  disabled={exportMenu.exporting}
                  onClick={exportMenu.onExportImage}
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
              {exportMenu.onExportPdf ? (
                <MenubarItem
                  className="gap-2"
                  disabled={exportMenu.exporting}
                  onClick={exportMenu.onExportPdf}
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
        ) : null}
      </Menubar>

      {conflictSlot}
      <TourHelpButton />
      <PresenceHeaderControl />
      <span data-tour="theme-toggle" className="inline-flex">
        <ThemeToggle className="transition-opacity duration-150 hover:opacity-80" />
      </span>
      {actionSlot}
    </div>
  )
}
