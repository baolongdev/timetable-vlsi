/**
 * Client helpers gọi /api/data/* — không throw ra UI nếu Mongo tắt.
 */
import { policyPasswordHeaders } from "@/lib/dept-policy-client"
import type { Department } from "@/types/department"
import type { Assignment } from "@/types/import"
import type { Lecturer } from "@/types/lecturer"

export type SyncSnapshot = {
  departments: Department[]
  lecturers: Lecturer[]
  updatedAt: number
  configured: boolean
}

export type SyncStatus = {
  configured: boolean
  updatedAt: number
}

async function parseJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** Trạng thái nhanh — configured + updatedAt */
export async function fetchSyncStatus(): Promise<SyncStatus | null> {
  try {
    const res = await fetch("/api/data/status", { cache: "no-store" })
    if (!res.ok) return null
    return parseJson<SyncStatus>(res)
  } catch {
    return null
  }
}

/**
 * Lấy full snapshot.
 * @returns null nếu Mongo tắt / lỗi mạng
 * @returns { notModified: true } nếu since còn mới
 */
export async function fetchSyncSnapshot(
  since?: number
): Promise<
  | { ok: true; data: SyncSnapshot }
  | { ok: true; notModified: true; updatedAt: number }
  | { ok: false; reason: string }
> {
  try {
    const qs =
      since != null && since > 0 ? `?since=${encodeURIComponent(String(since))}` : ""
    const res = await fetch(`/api/data${qs}`, { cache: "no-store" })
    if (res.status === 304) {
      return { ok: true, notModified: true, updatedAt: since ?? 0 }
    }
    if (res.status === 503) {
      return { ok: false, reason: "mongo_not_configured" }
    }
    if (!res.ok) {
      return { ok: false, reason: `http_${res.status}` }
    }
    const data = await parseJson<SyncSnapshot>(res)
    if (!data) return { ok: false, reason: "bad_json" }
    return { ok: true, data }
  } catch {
    return { ok: false, reason: "network" }
  }
}

export async function pushDepartments(
  departments: Department[]
): Promise<boolean> {
  try {
    // Gửi pass nếu đã xác thực trong session (cho phép xóa khoa khi sync)
    const res = await fetch("/api/data/departments", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...policyPasswordHeaders(),
      },
      body: JSON.stringify({ departments }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function pushOneDepartment(dept: Department): Promise<boolean> {
  try {
    const res = await fetch("/api/data/departments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...policyPasswordHeaders(),
      },
      body: JSON.stringify({ department: dept }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function deleteDepartmentRemote(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/data/departments/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        ...policyPasswordHeaders(),
      },
    })
    return res.ok || res.status === 404
  } catch {
    return false
  }
}

export async function pushAssignmentRemote(
  deptId: string,
  key: string,
  patch: Assignment
): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/data/departments/${encodeURIComponent(deptId)}/assign`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, patch }),
      }
    )
    return res.ok
  } catch {
    return false
  }
}

export async function pushLecturers(lecturers: Lecturer[]): Promise<boolean> {
  try {
    const res = await fetch("/api/data/lecturers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lecturers }),
    })
    return res.ok
  } catch {
    return false
  }
}
