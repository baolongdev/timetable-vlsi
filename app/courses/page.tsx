import type { Metadata } from "next"

import { CoursesOverview } from "@/components/courses/courses-overview"

export const metadata: Metadata = {
  title: "Môn học",
  description: "Chọn khoa để xem danh sách môn học.",
  alternates: { canonical: "/courses" },
}

export default function CoursesIndexPage() {
  return <CoursesOverview />
}
