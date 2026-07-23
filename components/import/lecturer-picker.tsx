"use client"

import * as React from "react"

import { X, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { useLecturers } from "@/lib/lecturer-store"
import {
  formatLecturerWithStaffId,
  getStaffIdByName,
  groupLecturersByRole,
} from "@/lib/lecturer-staff"
import { cn } from "@/lib/utils"

/** Sentinel nội bộ — không hiển thị; SelectValue tự render placeholder */
const EMPTY = "__empty__"

type SelectOption = { label: string; value: string }

type LecturerPickerProps = {
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  className?: string
  /** Hiện nút X để xóa lựa chọn */
  allowClear?: boolean
  /** Tên GV bị vô hiệu hóa (trùng lịch) — không cho chọn */
  disabledValues?: Set<string>
}

/**
 * Select chọn 1 giảng viên — nhóm theo vai trò, label có MSCB.
 * Đọc roster live từ lecturerStore: thêm GV ở trang Giảng viên là
 * hiện ngay ở đây.
 */
export function LecturerPicker({
  value,
  onValueChange,
  placeholder = "Chọn giảng viên…",
  className,
  allowClear = false,
  disabledValues,
}: LecturerPickerProps) {
  const { lecturers } = useLecturers()

  const groups = React.useMemo(
    () => groupLecturersByRole(undefined, lecturers),
    [lecturers]
  )

  const items = React.useMemo<SelectOption[]>(
    () => [
      { label: placeholder, value: EMPTY },
      ...lecturers.map((l) => ({
        label: formatLecturerWithStaffId(l.name, lecturers),
        value: l.name,
      })),
    ],
    [placeholder, lecturers]
  )

  const selectValue =
    value && value.trim().length > 0 && value !== "all" && value !== EMPTY
      ? value.trim()
      : EMPTY

  const hasValue = selectValue !== EMPTY

  return (
    <div className="flex flex-col gap-1.5">
      <Select
        value={selectValue}
        onValueChange={(next) => {
          if (!next || next === EMPTY) onValueChange(null)
          else onValueChange(next)
        }}
        items={items}
      >
        <SelectTrigger className={cn("h-8 w-full min-w-0 rounded-lg border-border/80 text-[13px] shadow-none", className)}>
          <SelectValue placeholder={placeholder}>
            {(selected: string | null) => {
              if (!selected || selected === EMPTY) return placeholder
              return formatLecturerWithStaffId(selected, lecturers)
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
          {groups.map((group, index) => (
            <SelectGroup key={group.role}>
              {index > 0 ? <SelectSeparator /> : null}
              <SelectLabel>{group.role}</SelectLabel>
              {group.names.map((name) => {
                const staffId = getStaffIdByName(name, lecturers)
                const isDisabled = disabledValues?.has(name) ?? false
                return (
                  <SelectItem
                    key={name}
                    value={name}
                    disabled={isDisabled}
                    title={isDisabled ? "Trùng lịch với nhóm đang xem" : undefined}
                  >
                    {staffId ? (
                      <span className="flex w-full items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5">
                          {name}
                          {isDisabled ? (
                            <AlertTriangle className="size-3 shrink-0 text-destructive" />
                          ) : null}
                        </span>
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          MSCB {staffId}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        {name}
                        {isDisabled ? (
                          <AlertTriangle className="size-3 shrink-0 text-destructive" />
                        ) : null}
                      </span>
                    )}
                  </SelectItem>
                )
              })}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {allowClear && hasValue && (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="h-7 gap-1 rounded-lg text-[11px] font-medium"
          onClick={() => onValueChange(null)}
        >
          <X className="size-3" />
          Xóa phân công
        </Button>
      )}
    </div>
  )
}
