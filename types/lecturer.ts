export type LecturerRole =
  | "Tổ trưởng"
  | "Tổ phó"
  | "Phó khoa"
  | "Giảng viên"
  | "Trợ giảng"
  | "Thỉnh giảng"

export type Lecturer = {
  id: string
  /** MSCB — mã số cán bộ (bắt buộc) */
  staffId: string
  name: string
  role: LecturerRole
  /** ID khoa / bộ môn chính (bắt buộc) */
  departmentId: string
  /** ID các bộ môn mà giảng viên thỉnh giảng */
  guestDepartmentIds: string[]
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
