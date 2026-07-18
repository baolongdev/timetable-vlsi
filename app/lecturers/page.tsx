import type { Metadata } from "next"

import { LecturersView } from "@/components/lecturers/lecturers-view"
import { loadLecturers } from "@/lib/data-loader"

export const metadata: Metadata = {
  title: "Giảng viên",
  description:
    "Danh sách giảng viên Tổ VLSI — mã số cán bộ, vai trò và thông tin liên hệ.",
  alternates: { canonical: "/lecturers" },
}

export const revalidate = 300

export default async function LecturersPage() {
  const lecturers = await loadLecturers()
  return <LecturersView initialData={lecturers} />
}
