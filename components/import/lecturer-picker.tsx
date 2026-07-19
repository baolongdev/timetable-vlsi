"use client"

import * as React from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { initialLecturers } from "@/data/lecturers"

const lecturerNames = initialLecturers.map((l) => l.name)

type LecturerPickerProps = {
  value: string | null
  onValueChange: (value: string | null) => void
  placeholder?: string
  className?: string
}

/** Combobox chọn giảng viên (search + clear) dùng cho phân công */
export function LecturerPicker({
  value,
  onValueChange,
  placeholder = "Chọn giảng viên…",
  className,
}: LecturerPickerProps) {
  return (
    <Combobox
      autoHighlight
      items={lecturerNames}
      value={value}
      onValueChange={onValueChange}
    >
      <ComboboxInput
        placeholder={placeholder}
        showClear
        className={className ?? "h-8 w-full rounded-lg text-[13px]"}
      />
      <ComboboxContent>
        <ComboboxEmpty>Không tìm thấy giảng viên.</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
