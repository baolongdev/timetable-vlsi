import type { Metadata } from "next"

import { DepartmentsView } from "@/components/departments/departments-view"

export const metadata: Metadata = {
  title: "Khoa / Tổ chuyên môn",
  description:
    "Danh sách khoa đã import từ file phân công — chọn khoa để xem thời khóa biểu và môn học.",
  alternates: { canonical: "/departments" },
}

export default function DepartmentsPage() {
  return <DepartmentsView />
}
