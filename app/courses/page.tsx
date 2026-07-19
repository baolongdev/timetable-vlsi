import type { Metadata } from "next"
import { Suspense } from "react"

import { CoursesView } from "@/components/courses/courses-view"
import { TablePageSkeleton } from "@/components/skeletons"

export const metadata: Metadata = {
  title: "Môn học",
  description:
    "Danh sách môn học theo khoa — nhóm lớp, tiết học, tuần học và phân công giảng dạy.",
  alternates: { canonical: "/courses" },
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<TablePageSkeleton />}>
      <CoursesView />
    </Suspense>
  )
}
