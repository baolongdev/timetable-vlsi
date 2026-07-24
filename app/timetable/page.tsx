import type { Metadata } from "next"

import { TimetablesOverview } from "@/components/timetable/timetables-overview"

export const metadata: Metadata = {
  title: "Thời khóa biểu",
  description: "Chọn khoa để xem thời khóa biểu.",
  alternates: { canonical: "/timetable" },
}

export default function TimetableIndexPage() {
  return <TimetablesOverview />
}
