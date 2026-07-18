export type LecturerRole =
  | "Tổ trưởng"
  | "Tổ phó"
  | "Phó khoa"
  | "Giảng viên"
  | "Trợ giảng"
  | "Thỉnh giảng"

export type Lecturer = {
  id: string
  /** MSCB — mã số cán bộ */
  staffId?: string
  name: string
  role: LecturerRole
  email?: string
  phone?: string
  note?: string
}

export const LECTURER_ROLES: LecturerRole[] = [
  "Tổ trưởng",
  "Tổ phó",
  "Phó khoa",
  "Giảng viên",
  "Trợ giảng",
  "Thỉnh giảng",
]
