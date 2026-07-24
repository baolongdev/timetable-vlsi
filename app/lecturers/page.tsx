import type { Metadata } from "next"

import { LecturersOverview } from "@/components/lecturers/lecturers-overview"

export const metadata: Metadata = {
  title: "Giảng viên",
  description:
    "Tổng quan giảng viên theo bộ môn — mã số cán bộ, vai trò và thông tin liên hệ.",
  alternates: { canonical: "/lecturers" },
}

export default function LecturersPage() {
  return <LecturersOverview />
}
