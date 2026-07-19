import type { SectionLanguage } from "@/types/section"

/** Một dòng nhóm lớp đọc từ file Excel phân công giảng dạy */
export type ImportedSection = {
  /** Cột A — Cán bộ phụ trách (thường trống, chờ phân công) */
  lead?: string
  /** Cột B — Cán bộ giảng dạy (thường trống, chờ phân công) */
  teacher?: string
  /** Cột C — Thứ 2–8 (8 = CN) */
  day: number
  startPeriod: number
  endPeriod: number
  /** Cột E — MMH */
  code: string
  courseName: string
  group: string
  capacity: number
  room: string
  weeksLabel: string
  language: SectionLanguage
  /** Cột L — Tổ chuyên môn */
  department: string
  /** Sheet gốc trong workbook (CNPM, KTMT…) */
  sheet: string
}

/** Phân công do người dùng chọn trên UI, key = `${code}-${group}` */
export type Assignment = {
  /** @deprecated Không dùng CB phụ trách */
  lead?: string
  /** Cán bộ giảng dạy */
  teacher?: string
}

export type ImportState = {
  fileName: string | null
  sections: ImportedSection[]
  assignments: Record<string, Assignment>
}

export function sectionKey(s: { code: string; group: string }): string {
  return `${s.code}-${s.group}`
}
