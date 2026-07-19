"use client"

import * as React from "react"

import { appToast } from "@/lib/app-toast"
import {
  deleteDepartmentRemote,
  fetchSyncSnapshot,
  pushAssignmentRemote,
  pushDepartments,
  pushOneDepartment,
} from "@/lib/sync-client"
import type { Department } from "@/types/department"
import type { Assignment, ImportedSection } from "@/types/import"
import { sectionKey } from "@/types/import"

export type { Department }

type StoreState = {
  departments: Department[]
  /** Timestamp local lần mutate / lần pull server gần nhất */
  updatedAt: number
}

const STORAGE_KEY = "timetable-departments-v2"
const META_KEY = "timetable-departments-meta-v2"

/**
 * Singleton gắn globalThis — tránh HMR/Next tạo 2 bản store
 * (ghi vào A, đọc từ B → phải F5 mới thấy).
 */
type GlobalDeptStore = {
  state: StoreState
  hydrated: boolean
  syncing: boolean
  version: number
  listeners: Set<() => void>
  /** Snapshot ổn định cho useSyncExternalStore (đổi ref khi version tăng) */
  snapshot: DeptStoreSnapshot
  pushTimer: number | null
  pollTimer: number | null
  remoteConfigured: boolean | null
  /** Đã apply ít nhất 1 lần từ server (để toast "cập nhật" vs "tải lần đầu") */
  hasRemoteApplied: boolean
}

export type DeptStoreSnapshot = {
  departments: Department[]
  version: number
  updatedAt: number
  remoteConfigured: boolean | null
}

const g = globalThis as unknown as { __timetableDeptStore?: GlobalDeptStore }

function getG(): GlobalDeptStore {
  if (!g.__timetableDeptStore) {
    const empty: StoreState = { departments: [], updatedAt: 0 }
    g.__timetableDeptStore = {
      state: empty,
      hydrated: false,
      syncing: false,
      version: 0,
      listeners: new Set(),
      snapshot: {
        departments: empty.departments,
        version: 0,
        updatedAt: 0,
        remoteConfigured: null,
      },
      pushTimer: null,
      pollTimer: null,
      remoteConfigured: null,
      hasRemoteApplied: false,
    }
  }
  return g.__timetableDeptStore
}

function fingerprintDepartments(list: Department[]): string {
  try {
    return JSON.stringify(
      list.map((d) => ({
        id: d.id,
        uploadedAt: d.uploadedAt,
        n: d.sections.length,
        a: d.assignments,
      }))
    )
  } catch {
    return String(list.length)
  }
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "khoa"
  )
}

function loadState(): StoreState {
  if (typeof window === "undefined") return { departments: [], updatedAt: 0 }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const metaRaw = window.localStorage.getItem(META_KEY)
    const meta = metaRaw ? (JSON.parse(metaRaw) as { updatedAt?: number }) : {}
    if (!raw) return { departments: [], updatedAt: meta.updatedAt ?? 0 }
    const parsed = JSON.parse(raw) as StoreState | { departments?: Department[] }
    return {
      departments: parsed.departments ?? [],
      updatedAt:
        ("updatedAt" in parsed && typeof parsed.updatedAt === "number"
          ? parsed.updatedAt
          : meta.updatedAt) ?? 0,
    }
  } catch {
    return { departments: [], updatedAt: 0 }
  }
}

function emit() {
  const store = getG()
  for (const l of store.listeners) l()
}

function writeLocal(next: StoreState) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ departments: next.departments })
    )
    window.localStorage.setItem(
      META_KEY,
      JSON.stringify({ updatedAt: next.updatedAt })
    )
  } catch {
    // localStorage đầy / bị chặn — giữ state trong phiên
  }
}

function applyState(next: StoreState, opts?: { skipRemote?: boolean }) {
  const store = getG()
  store.state = next
  store.version += 1
  store.snapshot = {
    departments: next.departments,
    version: store.version,
    updatedAt: next.updatedAt,
    remoteConfigured: store.remoteConfigured,
  }
  writeLocal(next)
  emit()
  if (!opts?.skipRemote) schedulePush()
}

function persist(departments: Department[]) {
  applyState({ departments, updatedAt: Date.now() })
}

function schedulePush() {
  if (typeof window === "undefined") return
  const store = getG()
  if (store.remoteConfigured === false) return
  if (store.pushTimer != null) window.clearTimeout(store.pushTimer)
  store.pushTimer = window.setTimeout(() => {
    store.pushTimer = null
    void flushToRemote()
  }, 400)
}

async function flushToRemote() {
  const store = getG()
  if (store.syncing) return
  store.syncing = true
  try {
    const ok = await pushDepartments(store.state.departments)
    if (ok) {
      store.remoteConfigured = true
      store.snapshot = {
        ...store.snapshot,
        remoteConfigured: true,
      }
      emit()
    } else if (store.remoteConfigured == null) {
      // Lần đầu fail (503) → đánh dấu không có remote, ngừng spam
      const statusTry = await fetchSyncSnapshot()
      if (!statusTry.ok && statusTry.reason === "mongo_not_configured") {
        store.remoteConfigured = false
        store.snapshot = {
          ...store.snapshot,
          remoteConfigured: false,
        }
        emit()
      }
    }
  } finally {
    store.syncing = false
  }
}

/** Kéo snapshot từ server và merge LWW theo updatedAt */
export async function pullDepartmentsFromRemote(): Promise<boolean> {
  if (typeof window === "undefined") return false
  ensureHydrated()
  const store = getG()

  const result = await fetchSyncSnapshot(store.state.updatedAt || undefined)
  if (!result.ok) {
    if (result.reason === "mongo_not_configured") {
      store.remoteConfigured = false
      store.snapshot = { ...store.snapshot, remoteConfigured: false }
      emit()
    }
    return false
  }
  if ("notModified" in result && result.notModified) {
    store.remoteConfigured = true
    return true
  }
  if (!("data" in result)) return false

  const data = result.data
  store.remoteConfigured = true

  // Server trống + local có data → đẩy local lên
  if (
    data.departments.length === 0 &&
    store.state.departments.length > 0
  ) {
    await pushDepartments(store.state.departments)
    return true
  }

  // Local mới hơn server (offline edit) → push
  if (
    store.state.updatedAt > 0 &&
    data.updatedAt > 0 &&
    store.state.updatedAt > data.updatedAt &&
    store.state.departments.length > 0
  ) {
    await pushDepartments(store.state.departments)
    return true
  }

  // Server thắng → replace local (không push lại ngay)
  const prevFp = fingerprintDepartments(store.state.departments)
  const nextFp = fingerprintDepartments(data.departments)
  const changed = prevFp !== nextFp
  const firstApply = !store.hasRemoteApplied

  applyState(
    {
      departments: data.departments,
      updatedAt: data.updatedAt || Date.now(),
    },
    { skipRemote: true }
  )
  store.hasRemoteApplied = true

  if (changed) {
    if (firstApply && store.state.departments.length > 0) {
      appToast.remoteLoaded("departments")
    } else if (!firstApply) {
      appToast.remoteUpdate("departments")
    }
  }
  return true
}

function ensureHydrated() {
  const store = getG()
  if (store.hydrated || typeof window === "undefined") return
  const loaded = loadState()
  store.state = loaded
  store.hydrated = true
  store.version += 1
  store.snapshot = {
    departments: loaded.departments,
    version: store.version,
    updatedAt: loaded.updatedAt,
    remoteConfigured: store.remoteConfigured,
  }
}

// Snapshot server/SSR — hằng số, không loop
const SERVER_SNAPSHOT: DeptStoreSnapshot = {
  departments: [],
  version: 0,
  updatedAt: 0,
  remoteConfigured: null,
}

export const departmentStore = {
  subscribe(listener: () => void) {
    const store = getG()
    store.listeners.add(listener)
    return () => store.listeners.delete(listener)
  },
  getSnapshot(): DeptStoreSnapshot {
    ensureHydrated()
    return getG().snapshot
  },
  getServerSnapshot(): DeptStoreSnapshot {
    return SERVER_SNAPSHOT
  },

  /** Thêm/ghi đè một khoa từ sheet đã chọn */
  addDepartment(
    sheetName: string,
    fileName: string,
    sections: ImportedSection[],
    opts?: { silent?: boolean }
  ) {
    ensureHydrated()
    const store = getG()
    const id = slugify(sheetName)
    const existing = store.state.departments.find((d) => d.id === id)
    const keys = new Set(sections.map(sectionKey))
    const kept: Record<string, Assignment> = {}
    if (existing) {
      for (const [k, v] of Object.entries(existing.assignments)) {
        if (keys.has(k)) kept[k] = v
      }
    }
    const dept: Department = {
      id,
      name: sheetName,
      fileName,
      uploadedAt: Date.now(),
      sections,
      assignments: kept,
    }
    const departments = [
      ...store.state.departments.filter((d) => d.id !== id),
      dept,
    ].sort((a, b) => a.name.localeCompare(b.name, "vi"))
    persist(departments)
    // Đẩy ngay khoa vừa import (không chờ debounce full list)
    void pushOneDepartment(dept)
    if (!opts?.silent) {
      if (existing) {
        appToast.success(`Đã cập nhật khoa «${sheetName}»`, `${sections.length} nhóm lớp`)
      } else {
        appToast.success(`Đã thêm khoa «${sheetName}»`, `${sections.length} nhóm lớp`)
      }
    }
    return id
  },

  removeDepartment(id: string, opts?: { silent?: boolean }) {
    ensureHydrated()
    const store = getG()
    const name = store.state.departments.find((d) => d.id === id)?.name ?? id
    persist(store.state.departments.filter((d) => d.id !== id))
    void deleteDepartmentRemote(id)
    if (!opts?.silent) {
      appToast.success(`Đã xóa khoa «${name}»`)
    }
  },

  assign(deptId: string, key: string, patch: Assignment, opts?: { silent?: boolean }) {
    ensureHydrated()
    const store = getG()
    const deptName =
      store.state.departments.find((d) => d.id === deptId)?.name ?? deptId
    persist(
      store.state.departments.map((d) =>
        d.id === deptId
          ? {
              ...d,
              assignments: {
                ...d.assignments,
                [key]: { ...d.assignments[key], ...patch },
              },
            }
          : d
      )
    )
    void pushAssignmentRemote(deptId, key, patch)
    if (!opts?.silent) {
      const who =
        patch.teacher !== undefined
          ? patch.teacher
            ? `CB giảng dạy: ${patch.teacher}`
            : "Đã bỏ phân công CB giảng dạy"
          : deptName
      appToast.success("Đã lưu phân công", who)
    }
  },
}

const POLL_MS = 30_000

/** Hook đọc danh sách khoa + version (để force recompute conflict realtime) */
export function useDepartments() {
  const snapshot = React.useSyncExternalStore(
    departmentStore.subscribe,
    departmentStore.getSnapshot,
    departmentStore.getServerSnapshot
  )
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setHydrated(true)
    void pullDepartmentsFromRemote()

    const onFocus = () => {
      void pullDepartmentsFromRemote()
    }
    window.addEventListener("focus", onFocus)
    const store = getG()
    if (store.pollTimer != null) window.clearInterval(store.pollTimer)
    store.pollTimer = window.setInterval(() => {
      void pullDepartmentsFromRemote()
    }, POLL_MS)

    return () => {
      window.removeEventListener("focus", onFocus)
      if (store.pollTimer != null) {
        window.clearInterval(store.pollTimer)
        store.pollTimer = null
      }
    }
  }, [])

  return {
    departments: snapshot.departments,
    version: snapshot.version,
    updatedAt: snapshot.updatedAt,
    remoteConfigured: snapshot.remoteConfigured,
    hydrated,
  }
}

/** Phân công hiệu lực: chỉ CB giảng dạy (user chọn > file Excel). Không dùng phụ trách. */
export function getEffectiveAssignment(
  dept: Department,
  s: ImportedSection
): Assignment {
  const chosen = dept.assignments[sectionKey(s)]
  return {
    teacher: chosen?.teacher ?? s.teacher,
  }
}
