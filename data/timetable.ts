import { sections } from "@/data/sections"
import { initialCourses } from "@/data/courses"
import type { Course } from "@/types/course"
import type { CourseSection } from "@/types/section"
import type { DayInfo, Period, Schedule } from "@/types/timetable"

/** 16 periods × 1 hour, 06:00 → 22:00 */
export const PERIODS: Period[] = Array.from({ length: 16 }, (_, i) => {
  const h = i + 6
  const fmt = (v: number) => `${String(v).padStart(2, "0")}:00`
  return {
    period: i + 1,
    label: `Tiết ${i + 1}`,
    time: fmt(h),
    endTime: fmt(h + 1),
  }
})

/** Mon–Sun — file gốc dùng Thứ 2–8 (8 = CN) */
export const DAYS: DayInfo[] = [
  { day: 1, label: "Thứ 2", shortLabel: "T2" },
  { day: 2, label: "Thứ 3", shortLabel: "T3" },
  { day: 3, label: "Thứ 4", shortLabel: "T4" },
  { day: 4, label: "Thứ 5", shortLabel: "T5" },
  { day: 5, label: "Thứ 6", shortLabel: "T6" },
  { day: 6, label: "Thứ 7", shortLabel: "T7" },
  { day: 7, label: "Chủ nhật", shortLabel: "CN" },
]

export const PERIOD_HEIGHT = 72
export const SEMESTER_LABEL = "Semester 1 • 2026"

export function getPeriodRangeLabel(startPeriod: number, endPeriod: number) {
  const start = PERIODS.find((p) => p.period === startPeriod)
  const end = PERIODS.find((p) => p.period === endPeriod)
  if (start && end) return `${start.time} — ${end.endTime}`
  // Periods outside the table (13+): tiết p chạy (p+5):00 → (p+6):00
  const fmt = (h: number) => `${String(h).padStart(2, "0")}:00`
  return `${fmt(startPeriod + 5)} — ${fmt(endPeriod + 6)}`
}

export function getPeriodSpanLabel(startPeriod: number, endPeriod: number) {
  if (startPeriod === endPeriod) return `Tiết ${startPeriod}`
  return `Tiết ${startPeriod}–${endPeriod}`
}

/**
 * Lịch học từ dữ liệu phân nhóm lớp thật (data/sections.ts).
 * Thứ trong file gốc: 2–8 (8 = CN) → day 1–7 (Mon–Sun).
 * Giảng viên lấy theo GV phụ trách của môn (data/courses.ts); nhóm TH/TN
 * chưa gán người cụ thể nên cũng dùng GV phụ trách.
 */
/**
 * Lịch học từ dữ liệu phân nhóm lớp (mặc định: data/sections.ts, hoặc DB).
 * Thứ trong file gốc: 2–8 (8 = CN) → day 1–7 (Mon–Sun).
 * Giảng viên lấy theo GV phụ trách của môn; nhóm TH/TN chưa gán người cụ
 * thể nên cũng dùng GV phụ trách.
 */
export function buildSchedules(
  sectionData: CourseSection[],
  courseData: Course[]
): Schedule[] {
  return (
    sectionData
      .map((s, i) => {
        const baseName = s.courseName
          .replace(/\s*\((TN|Th|bài tập)\)?\s*$/i, "")
          .trim()
        const course = courseData.find(
          (c) =>
            c.code === s.code ||
            c.name.toLowerCase() === baseName.toLowerCase()
        )
        return {
          id: `${s.code}-${s.group}-${i}`,
          courseCode: s.code,
          courseName: s.courseName,
          lecturer: course?.leadLecturer ?? "Chưa phân công",
          room: s.room,
          day: s.day - 1,
          startPeriod: s.startPeriod,
          endPeriod: s.endPeriod,
          className: s.group,
          capacity: s.capacity,
          weeks: s.weeksLabel,
        }
      })
  )
}

export const schedules: Schedule[] = buildSchedules(sections, initialCourses)

export function getUniqueLecturers(data: Schedule[] = schedules): string[] {
  return [...new Set(data.map((s) => s.lecturer))].sort()
}

export function getUniqueCourses(data: Schedule[] = schedules): string[] {
  return [
    ...new Set(data.map((s) => `${s.courseCode} — ${s.courseName}`)),
  ].sort()
}

export function getUniqueRooms(data: Schedule[] = schedules): string[] {
  return [...new Set(data.map((s) => s.room))].sort()
}

export function filterSchedules(
  data: Schedule[],
  filters: {
    search: string
    lecturer: string
    course: string
    room: string
  }
): Schedule[] {
  const q = filters.search.trim().toLowerCase()

  return data.filter((item) => {
    const matchesSearch =
      !q ||
      item.courseName.toLowerCase().includes(q) ||
      item.courseCode.toLowerCase().includes(q) ||
      item.lecturer.toLowerCase().includes(q)

    const matchesLecturer =
      !filters.lecturer ||
      filters.lecturer === "all" ||
      item.lecturer === filters.lecturer

    const courseKey = `${item.courseCode} — ${item.courseName}`
    const matchesCourse =
      !filters.course ||
      filters.course === "all" ||
      courseKey === filters.course

    const matchesRoom =
      !filters.room || filters.room === "all" || item.room === filters.room

    return matchesSearch && matchesLecturer && matchesCourse && matchesRoom
  })
}
