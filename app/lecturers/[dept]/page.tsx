import type { Metadata } from "next"

import { LecturersView } from "@/components/lecturers/lecturers-view"

export const metadata: Metadata = {
  title: "Giảng viên",
  description:
    "Danh sách giảng viên theo bộ môn — mã số cán bộ, vai trò và thông tin liên hệ.",
}

export default function LecturersDeptPage() {
  return <LecturersView />
}
