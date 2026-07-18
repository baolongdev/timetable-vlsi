import type { Metadata } from "next"

import { CoursesView } from "@/components/courses/courses-view"
import { loadCourses, loadSections } from "@/lib/data-loader"

export const metadata: Metadata = {
  title: "Môn học",
  description:
    "Danh sách môn học Tổ VLSI — nhóm lớp, tiết học, tuần học và đội ngũ giảng dạy từng môn.",
  alternates: { canonical: "/courses" },
}

export const revalidate = 300

export default async function CoursesPage() {
  const [courses, sections] = await Promise.all([
    loadCourses(),
    loadSections(),
  ])
  return <CoursesView initialData={courses} sections={sections} />
}
