export type SectionLanguage = "V" | "TA"

export type CourseSection = {
  /** MSMH */
  code: string
  courseName: string
  /** Nhóm — A01, L01, CC01, TN01… */
  group: string
  /** Thứ (2–8, 8 = CN theo file gốc) */
  day: number
  startPeriod: number
  endPeriod: number
  capacity: number
  room: string
  /** Tuần học đã parse, VD "1–7, 9–16" */
  weeksLabel: string
  language: SectionLanguage
}
