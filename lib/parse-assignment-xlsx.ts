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

export type WorkbookSheetInfo = {
  name: string
  /** Số dòng nhóm lớp hợp lệ trong sheet */
  rowCount: number
}

export type ParsedWorkbook = {
  wb: XLSX.WorkBook
  /** Các sheet có header phân công chuẩn */
  sheets: WorkbookSheetInfo[]
}

function parseSheetRows(
  wb: XLSX.WorkBook,
  sheetName: string
): ImportedSection[] {
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  })
  if (!isScheduleSheet(rows)) return []

  const out: ImportedSection[] = []
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
  return out
}

/**
 * Đọc workbook và liệt kê các sheet có cấu trúc phân công chuẩn
 * (CNPM, KTMT, KhoaQuanly…) kèm số dòng — để người dùng chọn sheet.
 */
export function readAssignmentWorkbook(data: ArrayBuffer): ParsedWorkbook {
  const wb = XLSX.read(data, { type: "array" })
  const sheets: WorkbookSheetInfo[] = []
  for (const name of wb.SheetNames) {
    const rowCount = parseSheetRows(wb, name).length
    if (rowCount > 0) sheets.push({ name, rowCount })
  }
  return { wb, sheets }
}

/** Parse một sheet đã chọn */
export function parseWorkbookSheet(
  parsed: ParsedWorkbook,
  sheetName: string
): ImportedSection[] {
  return parseSheetRows(parsed.wb, sheetName)
}

/**
 * Parse toàn bộ workbook (mọi sheet hợp lệ) — giữ cho tương thích cũ.
 */
export function parseAssignmentWorkbook(
  data: ArrayBuffer
): ImportedSection[] {
  const parsed = readAssignmentWorkbook(data)
  return parsed.sheets.flatMap((s) => parseSheetRows(parsed.wb, s.name))
}
