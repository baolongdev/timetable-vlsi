import type { Metadata } from "next"

import { HomeMenu } from "@/components/home-menu"

export const metadata: Metadata = {
  title: "Trang chủ",
  description:
    "Điều hướng nhanh: thời khóa biểu, quản lý môn học và giảng viên Tổ VLSI.",
}

export default function HomePage() {
  return <HomeMenu />
}
