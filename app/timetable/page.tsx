import type { Metadata } from "next"
import { Suspense } from "react"

import { TimetablePageSkeleton } from "@/components/skeletons"
import { TimetableView } from "@/components/timetable/timetable-view"

export const metadata: Metadata = {
  title: "Thời khóa biểu",
  description:
    "Lịch học theo thứ và tiết từ file phân công giảng dạy — tìm kiếm, lọc và xuất CSV.",
  alternates: { canonical: "/timetable" },
}

export default function TimetablePage() {
  return (
    <Suspense fallback={<TimetablePageSkeleton />}>
      <TimetableView />
    </Suspense>
  )
}
