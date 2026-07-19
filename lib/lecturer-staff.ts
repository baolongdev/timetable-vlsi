import { initialLecturers } from "@/data/lecturers"
import { LECTURER_ROLES, type LecturerRole } from "@/types/lecturer"

/** name → MSCB (mã số cán bộ) */
const staffIdByName = new Map(
  initialLecturers
    .filter((l) => l.staffId)
    .map((l) => [l.name, l.staffId as string])
)

const roleByName = new Map(
  initialLecturers.map((l) => [l.name, l.role as LecturerRole])
)

/** Lấy MSCB theo họ tên (từ danh sách cán bộ) */
export function getStaffIdByName(name: string): string | undefined {
  return staffIdByName.get(name.trim())
}

/**
 * Hiển thị: "Lê Trọng Nhân · MSCB 3777"
 * Không có mã → chỉ tên.
 */
export function formatLecturerWithStaffId(name: string): string {
  const id = getStaffIdByName(name)
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
  onlyIn?: Iterable<string>
): LecturerRoleGroup[] {
  const allow = onlyIn ? new Set(onlyIn) : null
  const groups: LecturerRoleGroup[] = []

  for (const role of LECTURER_ROLES) {
    const names = initialLecturers
      .filter((l) => l.role === role && (!allow || allow.has(l.name)))
      .map((l) => l.name)
    if (names.length > 0) groups.push({ role, names })
  }

  if (allow) {
    const known = new Set(initialLecturers.map((l) => l.name))
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

export function getRoleByName(name: string): LecturerRole | undefined {
  return roleByName.get(name.trim())
}
