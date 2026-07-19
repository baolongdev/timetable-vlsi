import type { Metadata } from "next"

import { DeptIndexRedirect } from "@/components/dept-index-redirect"

export const metadata: Metadata = {
  title: "Thời khóa biểu",
  description: "Chọn khoa để xem thời khóa biểu.",
  alternates: { canonical: "/timetable" },
}

export default function TimetableIndexPage() {
  return <DeptIndexRedirect base="/timetable" />
}
