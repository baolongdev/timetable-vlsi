/**
 * Mật khẩu bảo vệ thêm / xóa khoa.
 * Ưu tiên env DEPT_POLICY_PASSWORD; mặc định ACLAB2023.
 */
export const DEFAULT_DEPT_POLICY_PASSWORD = "ACLAB2023"

export const POLICY_PASSWORD_HEADER = "x-policy-password"

export function getDeptPolicyPassword(): string {
  const fromEnv = process.env.DEPT_POLICY_PASSWORD?.trim()
  return fromEnv || DEFAULT_DEPT_POLICY_PASSWORD
}

export function verifyDeptPolicyPassword(input: unknown): boolean {
  if (typeof input !== "string") return false
  return input === getDeptPolicyPassword()
}

/** Lấy password từ header request API */
export function readPolicyPasswordFromRequest(headers: Headers): string | null {
  const h = headers.get(POLICY_PASSWORD_HEADER)?.trim()
  return h || null
}

export function requestHasValidPolicyPassword(headers: Headers): boolean {
  return verifyDeptPolicyPassword(readPolicyPasswordFromRequest(headers))
}
