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
  /** ID khoa / bộ môn (slug, khớp với Department.id) */
  departmentId?: string
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
