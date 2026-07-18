import type { Metadata } from "next"

import { TimetableView } from "@/components/timetable/timetable-view"
import { buildSchedules } from "@/data/timetable"
import { loadCourses, loadSections } from "@/lib/data-loader"

export const metadata: Metadata = {
  title: "Thời khóa biểu",
  description:
    "Lịch học tuần Tổ VLSI theo thứ và tiết — tìm kiếm, lọc theo môn, giảng viên, phòng và xuất CSV.",
  alternates: { canonical: "/timetable" },
}

export const revalidate = 300 // re-read DB mỗi 5 phút

export default async function TimetablePage() {
  const [sections, courses] = await Promise.all([
    loadSections(),
    loadCourses(),
  ])
  return <TimetableView schedules={buildSchedules(sections, courses)} />
}
