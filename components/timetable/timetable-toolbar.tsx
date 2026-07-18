"use client"

import { Filter, Search, X } from "lucide-react"

import { controlGap } from "@/components/timetable/layout"
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { TimetableFilters } from "@/types/timetable"

type TimetableToolbarProps = {
  filters: TimetableFilters
  lecturers: string[]
  courses: string[]
  rooms: string[]
  searchInputRef?: React.RefObject<HTMLInputElement | null>
  onFiltersChange: (filters: TimetableFilters) => void
}

export function TimetableToolbar({
  filters,
  lecturers,
  courses,
  rooms,
  searchInputRef,
  onFiltersChange,
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
            placeholder="Search course, code, lecturer…"
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

        <div className={cn("flex flex-wrap items-center", controlGap)}>
          <div className={cn("hidden items-center md:flex", controlGap)}>
            <Select
              value={filters.course}
              onValueChange={(value) => update({ course: value ?? "all" })}
            >
              <SelectTrigger className="h-10 w-[180px] rounded-xl border-border/80 shadow-none">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  <SelectItem value="all">All courses</SelectItem>
                  {courses.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={filters.lecturer}
              onValueChange={(value) => update({ lecturer: value ?? "all" })}
            >
              <SelectTrigger className="h-10 w-[160px] rounded-xl border-border/80 shadow-none">
                <SelectValue placeholder="Lecturer" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  <SelectItem value="all">All lecturers</SelectItem>
                  {lecturers.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={filters.room}
              onValueChange={(value) => update({ room: value ?? "all" })}
            >
              <SelectTrigger className="h-10 w-[130px] rounded-xl border-border/80 shadow-none">
                <SelectValue placeholder="Room" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectGroup>
                  <SelectItem value="all">All rooms</SelectItem>
                  {rooms.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
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
              Filter
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-0.5 tabular-nums">
                  {activeFilterCount}
                </Badge>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Course</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={filters.course}
                  onValueChange={(value) => update({ course: value })}
                >
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  {courses.map((name) => (
                    <DropdownMenuRadioItem key={name} value={name}>
                      {name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Lecturer</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={filters.lecturer}
                  onValueChange={(value) => update({ lecturer: value })}
                >
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  {lecturers.map((name) => (
                    <DropdownMenuRadioItem key={name} value={name}>
                      {name}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Room</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={filters.room}
                  onValueChange={(value) => update({ room: value })}
                >
                  <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                  {rooms.map((name) => (
                    <DropdownMenuRadioItem key={name} value={name}>
                      {name}
                    </DropdownMenuRadioItem>
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
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
