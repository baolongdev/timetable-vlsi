export type Schedule = {
  id: string
  courseCode: string
  courseName: string
  /** Người hiển thị chính (CB giảng dạy, fallback CB phụ trách) */
  lecturer: string
  /** Cán bộ phụ trách */
  lead?: string
  /** Cán bộ giảng dạy */
  teacher?: string
  room: string
  day: number // 1 = Monday … 7 = Sunday
  startPeriod: number
  endPeriod: number
  className: string
  capacity: number
  weeks: string
}

export type Period = {
  period: number
  label: string
  /** Start time HH:mm */
  time: string
  /** End time HH:mm (each period is 1 hour) */
  endTime: string
}

export type DayInfo = {
  day: number
  label: string
  shortLabel: string
}

export type TimetableFilters = {
  search: string
  lecturer: string
  course: string
  room: string
}

export type ViewMode = "week"
