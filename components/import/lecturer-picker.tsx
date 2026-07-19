"use client"

import * as React from "react"

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
import { formatLecturerWithStaffId } from "@/lib/lecturer-staff"
import { cn } from "@/lib/utils"
import { initialLecturers } from "@/data/lecturers"
import { LECTURER_ROLES } from "@/types/lecturer"

/** Sentinel nội bộ — không hiển thị; SelectValue tự render placeholder */
const EMPTY = "__empty__"

const lecturerGroups = LECTURER_ROLES.map((role) => ({
  value: role,
  items: initialLecturers.filter((l) => l.role === role).map((l) => l.name),
})).filter((group) => group.items.length > 0)

const staffIdByName = new Map(
  initialLecturers.map((l) => [l.name, l.staffId])
)

type SelectOption = { label: string; value: string }

type LecturerPickerProps = {
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  className?: string
}

/**
 * Select chọn 1 giảng viên — nhóm theo vai trò, label có MSCB.
 */
export function LecturerPicker({
  value,
  onValueChange,
  placeholder = "Chọn giảng viên…",
  className,
}: LecturerPickerProps) {
  const items = React.useMemo<SelectOption[]>(
    () => [
      { label: placeholder, value: EMPTY },
      ...initialLecturers.map((l) => ({
        label: formatLecturerWithStaffId(l.name),
        value: l.name,
      })),
    ],
    [placeholder]
  )

  const selectValue =
    value && value.trim().length > 0 && value !== "all" && value !== EMPTY
      ? value.trim()
      : EMPTY

  return (
    <Select
      value={selectValue}
      onValueChange={(next) => {
        if (!next || next === EMPTY) onValueChange(null)
        else onValueChange(next)
      }}
      items={items}
    >
      <SelectTrigger
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border-border/80 text-[13px] shadow-none",
          className
        )}
      >
        {/* Render tường minh — tránh hiện raw value __empty__ */}
        <SelectValue placeholder={placeholder}>
          {(selected: string | null) => {
            if (!selected || selected === EMPTY) return placeholder
            return formatLecturerWithStaffId(selected)
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        className="min-w-(--anchor-width) max-w-96"
      >
        <SelectGroup>
          <SelectItem value={EMPTY}>{placeholder}</SelectItem>
        </SelectGroup>
        {lecturerGroups.map((group, index) => (
          <SelectGroup key={group.value}>
            {index > 0 ? <SelectSeparator /> : null}
            <SelectLabel>{group.value}</SelectLabel>
            {group.items.map((name) => {
              const staffId = staffIdByName.get(name)
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
  )
}
