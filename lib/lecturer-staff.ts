import { initialLecturers } from "@/data/lecturers"
import {
  LECTURER_ROLES,
  type Lecturer,
  type LecturerRole,
} from "@/types/lecturer"

/**
 * Các helper nhận `roster` (danh sách GV hiện hành từ lecturerStore) để
 * GV thêm/sửa trên trang Giảng viên hiện ngay ở mọi picker. Không truyền
 * thì fallback danh sách tĩnh ban đầu.
 */

/** Lấy MSCB theo họ tên */
export function getStaffIdByName(
  name: string,
  roster: Lecturer[] = initialLecturers
): string | undefined {
  return roster.find((l) => l.name === name.trim())?.staffId
}

/**
 * Hiển thị: "Lê Trọng Nhân · MSCB 3777"
 * Không có mã → chỉ tên.
 */
export function formatLecturerWithStaffId(
  name: string,
  roster: Lecturer[] = initialLecturers
): string {
  const id = getStaffIdByName(name, roster)
  return id ? `${name} · MSCB ${id}` : name
}

export type LecturerRoleGroup = {
  role: LecturerRole | "Khác"
  names: string[]
}

/**
 * Gom danh sách tên GV theo vai trò (Tổ trưởng → … → Thỉnh giảng).
 * Tên không có trong roster (vd. "Chưa phân công") → nhóm "Khác".
 * `onlyIn` nếu truyền: chỉ giữ tên có trong tập đó (filter theo TKB).
 */
export function groupLecturersByRole(
  onlyIn?: Iterable<string>,
  roster: Lecturer[] = initialLecturers
): LecturerRoleGroup[] {
  const allow = onlyIn ? new Set(onlyIn) : null
  const groups: LecturerRoleGroup[] = []

  for (const role of LECTURER_ROLES) {
    const names = roster
      .filter((l) => l.role === role && (!allow || allow.has(l.name)))
      .map((l) => l.name)
    if (names.length > 0) groups.push({ role, names })
  }

  if (allow) {
    const known = new Set(roster.map((l) => l.name))
    const other = [...allow].filter((n) => n && !known.has(n))
    if (other.length > 0) {
      groups.push({
        role: "Khác",
        names: other.sort((a, b) => a.localeCompare(b, "vi")),
      })
    }
  }

  return groups
}

export function getRoleByName(
  name: string,
  roster: Lecturer[] = initialLecturers
): LecturerRole | undefined {
  return roster.find((l) => l.name === name.trim())?.role
}
