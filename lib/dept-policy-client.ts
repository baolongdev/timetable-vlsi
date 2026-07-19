/** Client: nhớ pass trong session để gửi header API (không commit git) */

/** Phải khớp lib/dept-policy.ts — không import server file (tránh lộ env vào bundle) */
export const POLICY_PASSWORD_HEADER = "x-policy-password"

const STORAGE_KEY = "vlsi-dept-policy-pass-v1"

export function rememberPolicyPassword(password: string) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_KEY, password)
  } catch {
    // ignore
  }
}

export function getRememberedPolicyPassword(): string | null {
  if (typeof window === "undefined") return null
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function clearRememberedPolicyPassword() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function policyPasswordHeaders(
  password?: string | null
): Record<string, string> {
  const pass = password ?? getRememberedPolicyPassword()
  if (!pass) return {}
  return { [POLICY_PASSWORD_HEADER]: pass }
}

/** Xác thực mật khẩu qua API server */
export async function verifyPolicyPasswordRemote(
  password: string
): Promise<boolean> {
  try {
    const res = await fetch("/api/data/policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) return false
    const data = (await res.json()) as { ok?: boolean }
    if (data.ok) {
      rememberPolicyPassword(password)
      return true
    }
    return false
  } catch {
    return false
  }
}
