"use client"

import * as React from "react"

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
} from "@/components/ui/combobox"
import { initialLecturers } from "@/data/lecturers"
import { LECTURER_ROLES } from "@/types/lecturer"

/** Giảng viên nhóm theo vai trò, theo thứ tự LECTURER_ROLES (bỏ nhóm rỗng) */
const lecturerGroups = LECTURER_ROLES.map((role) => ({
  value: role,
  items: initialLecturers.filter((l) => l.role === role).map((l) => l.name),
})).filter((group) => group.items.length > 0)

/** name -> mã số cán bộ (MSCB) để hiển thị kèm */
const staffIdByName = new Map(
  initialLecturers.map((l) => [l.name, l.staffId])
)

type LecturerPickerProps = {
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  className?: string
}

/**
 * Combobox chọn giảng viên: search + clear, nhóm theo vai trò
 * (Tổ trưởng, Phó khoa, Giảng viên…) và hiển thị kèm mã số cán bộ.
 */
export function LecturerPicker({
  value,
  onValueChange,
  placeholder = "Chọn giảng viên…",
  className,
}: LecturerPickerProps) {
  return (
    <Combobox
      autoHighlight
      items={lecturerGroups}
      value={value}
      onValueChange={onValueChange}
    >
      <ComboboxInput
        placeholder={placeholder}
        showClear
        className={className ?? "h-8 w-full rounded-lg text-[13px]"}
      />
      <ComboboxContent className="w-auto min-w-(--anchor-width) max-w-96">
        <ComboboxEmpty>Không tìm thấy giảng viên.</ComboboxEmpty>
        <ComboboxList>
          {(
            group: { value: string; items: string[] },
            index: number
          ) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(item: string) => {
                  const staffId = staffIdByName.get(item)
                  return (
                    <ComboboxItem
                      key={item}
                      value={item}
                      className="flex items-center justify-between gap-3 whitespace-nowrap"
                    >
                      <span>{item}</span>
                      {staffId ? (
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {staffId}
                        </span>
                      ) : null}
                    </ComboboxItem>
                  )
                }}
              </ComboboxCollection>
              {index < lecturerGroups.length - 1 && <ComboboxSeparator />}
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
