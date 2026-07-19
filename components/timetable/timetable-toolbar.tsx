"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react"

import { controlGap } from "@/components/timetable/layout"
import type { TimetableScrollState } from "@/components/timetable/timetable-grid"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  formatLecturerWithStaffId,
  getStaffIdByName,
  groupLecturersByRole,
} from "@/lib/lecturer-staff"
import { groupRoomsByBuilding } from "@/lib/room-groups"
import { cn } from "@/lib/utils"
import type { TimetableFilters } from "@/types/timetable"

type SelectOption = { label: string; value: string }

type TimetableToolbarProps = {
  filters: TimetableFilters
  lecturers: string[]
  courses: string[]
  rooms: string[]
  searchInputRef?: React.RefObject<HTMLInputElement | null>
  onFiltersChange: (filters: TimetableFilters) => void
  /** Nút cuộn ngang lưới TKB (desktop) */
  scrollState?: TimetableScrollState
  onScrollByViewport?: (direction: 1 | -1) => void
}

export function TimetableToolbar({
  filters,
  lecturers,
  courses,
  rooms,
  searchInputRef,
  onFiltersChange,
  scrollState,
  onScrollByViewport,
}: TimetableToolbarProps) {
  const activeFilterCount = [
    filters.lecturer !== "all" && filters.lecturer,
    filters.course !== "all" && filters.course,
    filters.room !== "all" && filters.room,
    filters.search.trim(),
  ].filter(Boolean).length

  const update = (partial: Partial<TimetableFilters>) => {
    onFiltersChange({ ...filters, ...partial })
  }

  const clearAll = () => {
    onFiltersChange({
      search: "",
      lecturer: "all",
      course: "all",
      room: "all",
    })
  }

  // Base UI Select: items = [{ label, value }, …] (docs base-nova)
  const courseItems = React.useMemo<SelectOption[]>(
    () => [
      { label: "Tất cả môn học", value: "all" },
      ...courses.map((name) => ({ label: name, value: name })),
    ],
    [courses]
  )
  // value = tên (để filter), label = tên · MSCB xxxx; UI group theo vai trò
  const lecturerRoleGroups = React.useMemo(
    () => groupLecturersByRole(lecturers),
    [lecturers]
  )
  const lecturerItems = React.useMemo<SelectOption[]>(
    () => [
      { label: "Tất cả giảng viên", value: "all" },
      ...lecturers.map((name) => ({
        label: formatLecturerWithStaffId(name),
        value: name,
      })),
    ],
    [lecturers]
  )
  const roomItems = React.useMemo<SelectOption[]>(
    () => [
      { label: "Tất cả phòng", value: "all" },
      ...rooms.map((name) => ({ label: name, value: name })),
    ],
    [rooms]
  )
  // Nhóm theo tòa: A4, B1, B10, C5…
  const roomBuildingGroups = React.useMemo(
    () => groupRoomsByBuilding(rooms),
    [rooms]
  )

  const showScrollControls = Boolean(onScrollByViewport)

  return (
    <div className="border-b border-border/60 bg-background pb-4">
      <div
        className={cn(
          "flex flex-col lg:flex-row lg:items-center",
          controlGap
        )}
      >
        <div className="relative w-full max-w-sm transition-all duration-150 focus-within:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder="Tìm môn học, mã môn, giảng viên…"
            className="h-10 rounded-xl border-border/80 bg-background pr-9 pl-9 text-sm shadow-none transition-all duration-150 focus-visible:border-foreground/20"
            aria-label="Search timetable"
          />
          {filters.search ? (
            <button
              type="button"
              onClick={() => update({ search: "" })}
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-opacity hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-wrap items-center",
            controlGap
          )}
        >
          <div className={cn("hidden items-center md:flex", controlGap)}>
            <Select
              value={filters.course}
              onValueChange={(value) => update({ course: value ?? "all" })}
              items={courseItems}
            >
              <SelectTrigger className="h-10 w-[min(100%,17.5rem)] min-w-[14rem] max-w-[20rem] rounded-xl border-border/80 shadow-none sm:w-[18rem]">
                <SelectValue placeholder="Môn học" />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                // Rộng hơn trigger — hiện đủ "CO1023 — Hệ thống số (TN)"
                className="w-[min(calc(100vw-2rem),28rem)] min-w-[18rem] max-w-[28rem]"
              >
                <SelectGroup>
                  {courseItems.map((item) => (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                      className="h-auto min-h-8 items-start whitespace-normal py-1.5 *:[span]:whitespace-normal *:[span]:leading-snug"
                    >
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={filters.lecturer}
              onValueChange={(value) => update({ lecturer: value ?? "all" })}
              items={lecturerItems}
            >
              <SelectTrigger className="h-10 w-[220px] rounded-xl border-border/80 shadow-none">
                <SelectValue placeholder="Giảng viên" />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="min-w-(--anchor-width) max-w-sm"
              >
                <SelectGroup>
                  <SelectItem value="all">Tất cả giảng viên</SelectItem>
                </SelectGroup>
                {lecturerRoleGroups.map((group, index) => (
                  <SelectGroup key={group.role}>
                    {index > 0 ? <SelectSeparator /> : null}
                    <SelectLabel>{group.role}</SelectLabel>
                    {group.names.map((name) => {
                      const staffId = getStaffIdByName(name)
                      return (
                        <SelectItem key={name} value={name}>
                          {staffId ? (
                            <span className="flex w-full items-center justify-between gap-3">
                              <span>{name}</span>
                              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                                MSCB {staffId}
                              </span>
                            </span>
                          ) : (
                            name
                          )}
                        </SelectItem>
                      )
                    })}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.room}
              onValueChange={(value) => update({ room: value ?? "all" })}
              items={roomItems}
            >
              <SelectTrigger className="h-10 w-[140px] rounded-xl border-border/80 shadow-none">
                <SelectValue placeholder="Phòng" />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="min-w-(--anchor-width) max-w-xs"
              >
                <SelectGroup>
                  <SelectItem value="all">Tất cả phòng</SelectItem>
                </SelectGroup>
                {roomBuildingGroups.map((group, index) => (
                  <SelectGroup key={group.building}>
                    {index > 0 ? <SelectSeparator /> : null}
                    <SelectLabel>Tòa {group.building}</SelectLabel>
                    {group.rooms.map((room) => (
                      <SelectItem key={room} value={room}>
                        {room}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl border-border/80 shadow-none md:hidden"
                />
              }
            >
              <Filter data-icon="inline-start" />
              Bộ lọc
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-0.5 tabular-nums">
                  {activeFilterCount}
                </Badge>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="max-h-[min(70dvh,28rem)] w-[min(calc(100vw-2rem),22rem)]"
              align="end"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>Môn học</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={filters.course}
                  onValueChange={(value) => update({ course: value })}
                >
                  <DropdownMenuRadioItem value="all">
                    Tất cả
                  </DropdownMenuRadioItem>
                  {courses.map((name) => (
                    <DropdownMenuRadioItem
                      key={name}
                      value={name}
                      className="h-auto min-h-8 items-start whitespace-normal py-1.5"
                    >
                      {name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Giảng viên</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={filters.lecturer}
                  onValueChange={(value) => update({ lecturer: value })}
                >
                  <DropdownMenuRadioItem value="all">
                    Tất cả
                  </DropdownMenuRadioItem>
                  {lecturerRoleGroups.map((group) => (
                    <React.Fragment key={group.role}>
                      <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                        {group.role}
                      </DropdownMenuLabel>
                      {group.names.map((name) => (
                        <DropdownMenuRadioItem key={name} value={name}>
                          {formatLecturerWithStaffId(name)}
                        </DropdownMenuRadioItem>
                      ))}
                    </React.Fragment>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Phòng</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={filters.room}
                  onValueChange={(value) => update({ room: value })}
                >
                  <DropdownMenuRadioItem value="all">
                    Tất cả
                  </DropdownMenuRadioItem>
                  {roomBuildingGroups.map((group) => (
                    <React.Fragment key={group.building}>
                      <DropdownMenuLabel className="text-[11px] text-muted-foreground">
                        Tòa {group.building}
                      </DropdownMenuLabel>
                      {group.rooms.map((room) => (
                        <DropdownMenuRadioItem key={room} value={room}>
                          {room}
                        </DropdownMenuRadioItem>
                      ))}
                    </React.Fragment>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground"
            >
              Xóa lọc
            </Button>
          )}

          {/* Nút cuộn trái/phải — cùng hàng toolbar, căn phải (desktop grid) */}
          {showScrollControls ? (
            <div
              className={cn(
                "ml-auto hidden items-center md:flex",
                controlGap
              )}
            >
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onScrollByViewport?.(-1)}
                      disabled={!scrollState?.canScrollLeft}
                      aria-label="Cuộn sang trái"
                      className="size-10 rounded-xl border-border/80 shadow-none"
                    />
                  }
                >
                  <ChevronLeft />
                </TooltipTrigger>
                <TooltipContent>Cuộn sang trái</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onScrollByViewport?.(1)}
                      disabled={!scrollState?.canScrollRight}
                      aria-label="Cuộn sang phải"
                      className="size-10 rounded-xl border-border/80 shadow-none"
                    />
                  }
                >
                  <ChevronRight />
                </TooltipTrigger>
                <TooltipContent>Cuộn sang phải</TooltipContent>
              </Tooltip>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
