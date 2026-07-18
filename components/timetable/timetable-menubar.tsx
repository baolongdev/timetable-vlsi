"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  Download,
  FilterX,
  Moon,
  Search,
  Sun,
  Laptop,
} from "lucide-react"

import { pagePadX } from "@/components/timetable/layout"
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar"
import { cn } from "@/lib/utils"
import type { TimetableFilters } from "@/types/timetable"

type TimetableMenubarProps = {
  filters: TimetableFilters
  lecturers: string[]
  courses: string[]
  rooms: string[]
  showWeekends: boolean
  onShowWeekendsChange: (value: boolean) => void
  onFiltersChange: (filters: TimetableFilters) => void
  onFocusSearch: () => void
  onExport: () => void
}

export function TimetableMenubar({
  filters,
  lecturers,
  courses,
  rooms,
  showWeekends,
  onShowWeekendsChange,
  onFiltersChange,
  onFocusSearch,
  onExport,
}: TimetableMenubarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const resetFilters = () => {
    onFiltersChange({
      search: "",
      lecturer: "all",
      course: "all",
      room: "all",
    })
  }

  return (
    <div
      className={cn(
        pagePadX,
        "flex items-center justify-between gap-3 border-b border-border bg-muted/20 py-2.5"
      )}
    >
      <Menubar className="h-7 w-fit max-w-full border-0 bg-transparent p-0 shadow-none">
        <MenubarMenu>
          <MenubarTrigger className="text-xs">File</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Dữ liệu</MenubarLabel>
              <MenubarItem onClick={onExport}>
                <Download />
                Export CSV
                <MenubarShortcut>⌘E</MenubarShortcut>
              </MenubarItem>
              <MenubarItem onClick={onFocusSearch}>
                <Search />
                Tìm kiếm…
                <MenubarShortcut>⌘K</MenubarShortcut>
              </MenubarItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-xs">View</MenubarTrigger>
          <MenubarContent className="min-w-48">
            <MenubarGroup>
              <MenubarLabel>Hiển thị</MenubarLabel>
              <MenubarCheckboxItem
                checked={showWeekends}
                onCheckedChange={onShowWeekendsChange}
              >
                Hiện cuối tuần
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>Giao diện</MenubarLabel>
              <MenubarRadioGroup
                value={mounted ? (theme ?? "system") : "system"}
                onValueChange={(value) => {
                  if (value) setTheme(value)
                }}
              >
                <MenubarRadioItem value="light">
                  <Sun />
                  Sáng
                </MenubarRadioItem>
                <MenubarRadioItem value="dark">
                  <Moon />
                  Tối
                </MenubarRadioItem>
                <MenubarRadioItem value="system">
                  <Laptop />
                  Hệ thống
                </MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger className="text-xs">Filter</MenubarTrigger>
          <MenubarContent className="min-w-52">
            <MenubarGroup>
              <MenubarItem onClick={resetFilters}>
                <FilterX />
                Xóa bộ lọc
              </MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />

            <MenubarSub>
              <MenubarSubTrigger>Giảng viên</MenubarSubTrigger>
              <MenubarSubContent className="min-w-48">
                <MenubarRadioGroup
                  value={filters.lecturer}
                  onValueChange={(value) => {
                    if (value)
                      onFiltersChange({ ...filters, lecturer: value })
                  }}
                >
                  <MenubarRadioItem value="all">Tất cả</MenubarRadioItem>
                  {lecturers.map((name) => (
                    <MenubarRadioItem key={name} value={name}>
                      {name}
                    </MenubarRadioItem>
                  ))}
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>

            <MenubarSub>
              <MenubarSubTrigger>Môn học</MenubarSubTrigger>
              <MenubarSubContent className="min-w-56">
                <MenubarRadioGroup
                  value={filters.course}
                  onValueChange={(value) => {
                    if (value) onFiltersChange({ ...filters, course: value })
                  }}
                >
                  <MenubarRadioItem value="all">Tất cả</MenubarRadioItem>
                  {courses.map((name) => (
                    <MenubarRadioItem key={name} value={name}>
                      {name}
                    </MenubarRadioItem>
                  ))}
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>

            <MenubarSub>
              <MenubarSubTrigger>Phòng</MenubarSubTrigger>
              <MenubarSubContent className="min-w-40">
                <MenubarRadioGroup
                  value={filters.room}
                  onValueChange={(value) => {
                    if (value) onFiltersChange({ ...filters, room: value })
                  }}
                >
                  <MenubarRadioItem value="all">Tất cả</MenubarRadioItem>
                  {rooms.map((name) => (
                    <MenubarRadioItem key={name} value={name}>
                      {name}
                    </MenubarRadioItem>
                  ))}
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>

      <p className="hidden text-[11px] text-muted-foreground sm:block">
        12 tiết · 06:00–18:00
      </p>
    </div>
  )
}
