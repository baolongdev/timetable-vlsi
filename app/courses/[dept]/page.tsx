import type { Metadata } from "next"

import { CoursesView } from "@/components/courses/courses-view"

export const metadata: Metadata = {
  title: "Môn học",
  description:
    "Danh sách môn học theo khoa — nhóm lớp, tiết học, tuần học và phân công giảng dạy.",
}

export default function CoursesDeptPage() {
  return <CoursesView />
}
