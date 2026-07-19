import type { Metadata } from "next"

import { TimetableView } from "@/components/timetable/timetable-view"

export const metadata: Metadata = {
  title: "Thời khóa biểu",
  description:
    "Lịch học theo thứ và tiết từ file phân công giảng dạy — tìm kiếm, lọc và xuất CSV.",
}

export default function TimetableDeptPage() {
  return <TimetableView />
}
