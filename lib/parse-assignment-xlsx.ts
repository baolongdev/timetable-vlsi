import * as XLSX from "xlsx"

import { parseWeeksPattern } from "@/data/sections"
import type { ImportedSection } from "@/types/import"
import type { SectionLanguage } from "@/types/section"

/** Header chuẩn của file phân công (dòng 1) */
const HEADER_COLS = ["Cán bộ phụ trách", "Cán bộ giảng dạy", "Thứ", "Tiết"]

/** Pattern tiết `-------89012----` → { start, end } */
function parsePeriodPattern(pattern: string): {
  start: number
  end: number
} | null {
  let start = 0
  let end = 0
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] !== "-") {
      if (start === 0) start = i + 1
      end = i + 1
    }
  }
  return start > 0 ? { start, end } : null
}

/** Sheet có đúng cấu trúc phân công? (dòng đầu chứa các cột chuẩn) */
function isScheduleSheet(rows: unknown[][]): boolean {
  const header = rows[0]
  if (!Array.isArray(header)) return false
  const cells = header.map((c) => String(c ?? "").trim())
  return HEADER_COLS.every((h) => cells.includes(h))
}

/**
 * Parse toàn bộ workbook phân công giảng dạy: quét mọi sheet có header
 * chuẩn (CNPM, KTMT, KhoaQuanly…), bỏ sheet pivot/danh mục.
 */
export function parseAssignmentWorkbook(
  data: ArrayBuffer
): ImportedSection[] {
  const wb = XLSX.read(data, { type: "array" })
  const out: ImportedSection[] = []

  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
    })
    if (!isScheduleSheet(rows)) continue

    for (const row of rows.slice(1)) {
      const [
        lead,
        teacher,
        day,
        periodPattern,
        code,
        courseName,
        group,
        capacity,
        room,
        weeksPattern,
        language,
        department,
      ] = row.map((c) => String(c ?? "").trim())

      // Dòng hợp lệ cần đủ: thứ, pattern tiết, mã môn, nhóm
      const dayNum = Number(day)
      if (!code || !group || !dayNum || !periodPattern) continue
      const periods = parsePeriodPattern(periodPattern)
      if (!periods) continue

      out.push({
        lead: lead || undefined,
        teacher: teacher || undefined,
        day: dayNum,
        startPeriod: periods.start,
        endPeriod: periods.end,
        code,
        courseName,
        group,
        capacity: Number(capacity) || 0,
        room,
        weeksLabel: weeksPattern ? parseWeeksPattern(weeksPattern) : "—",
        language: (language === "TA" ? "TA" : "V") as SectionLanguage,
        department,
        sheet: sheetName,
      })
    }
  }

  return out
}
