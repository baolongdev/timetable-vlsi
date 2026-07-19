import type { Metadata } from "next"

import { DeptIndexRedirect } from "@/components/dept-index-redirect"

export const metadata: Metadata = {
  title: "Môn học",
  description: "Chọn khoa để xem danh sách môn học.",
  alternates: { canonical: "/courses" },
}

export default function CoursesIndexPage() {
  return <DeptIndexRedirect base="/courses" />
}
