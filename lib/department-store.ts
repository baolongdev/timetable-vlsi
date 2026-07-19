"use client"

import * as React from "react"

import type { Assignment, ImportedSection } from "@/types/import"
import { sectionKey } from "@/types/import"

export type Department = {
  /** id ổn định: slug từ tên sheet */
  id: string
  /** Tên khoa / tổ (tên sheet trong file Excel) */
  name: string
  fileName: string
  uploadedAt: number
  sections: ImportedSection[]
  assignments: Record<string, Assignment>
}

type StoreState = {
  departments: Department[]
}

const STORAGE_KEY = "timetable-departments-v2"

/**
 * Singleton gắn globalThis — tránh HMR/Next tạo 2 bản store
 * (ghi vào A, đọc từ B → phải F5 mới thấy).
 */
type GlobalDeptStore = {
  state: StoreState
  hydrated: boolean
  version: number
  listeners: Set<() => void>
  /** Snapshot ổn định cho useSyncExternalStore (đổi ref khi version tăng) */
  snapshot: DeptStoreSnapshot
}

export type DeptStoreSnapshot = {
  departments: Department[]
  version: number
}

const g = globalThis as unknown as { __timetableDeptStore?: GlobalDeptStore }

function getG(): GlobalDeptStore {
  if (!g.__timetableDeptStore) {
    const empty: StoreState = { departments: [] }
    g.__timetableDeptStore = {
      state: empty,
      hydrated: false,
      version: 0,
      listeners: new Set(),
      snapshot: { departments: empty.departments, version: 0 },
    }
  }
  return g.__timetableDeptStore
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "khoa"
  )
}

function loadState(): StoreState {
  if (typeof window === "undefined") return { departments: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { departments: [] }
    const parsed = JSON.parse(raw) as StoreState
    return { departments: parsed.departments ?? [] }
  } catch {
    return { departments: [] }
  }
}

function emit() {
  const store = getG()
  for (const l of store.listeners) l()
}

function persist(next: StoreState) {
  const store = getG()
  store.state = next
  store.version += 1
  // Snapshot mới mỗi lần mutate → useSyncExternalStore luôn detect thay đổi
  store.snapshot = {
    departments: next.departments,
    version: store.version,
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage đầy / bị chặn — giữ state trong phiên
  }
  emit()
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
  }
}

// Snapshot server/SSR — hằng số, không loop
const SERVER_SNAPSHOT: DeptStoreSnapshot = {
  departments: [],
  version: 0,
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
    sections: ImportedSection[]
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
    persist({
      departments: [
        ...store.state.departments.filter((d) => d.id !== id),
        dept,
      ].sort((a, b) => a.name.localeCompare(b.name, "vi")),
    })
    return id
  },

  removeDepartment(id: string) {
    ensureHydrated()
    const store = getG()
    persist({
      departments: store.state.departments.filter((d) => d.id !== id),
    })
  },

  assign(deptId: string, key: string, patch: Assignment) {
    ensureHydrated()
    const store = getG()
    persist({
      departments: store.state.departments.map((d) =>
        d.id === deptId
          ? {
              ...d,
              assignments: {
                ...d.assignments,
                [key]: { ...d.assignments[key], ...patch },
              },
            }
          : d
      ),
    })
  },
}

/** Hook đọc danh sách khoa + version (để force recompute conflict realtime) */
export function useDepartments() {
  const snapshot = React.useSyncExternalStore(
    departmentStore.subscribe,
    departmentStore.getSnapshot,
    departmentStore.getServerSnapshot
  )
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => setHydrated(true), [])
  return {
    departments: snapshot.departments,
    version: snapshot.version,
    hydrated,
  }
}

/** Phân công hiệu lực của một nhóm: người dùng chọn > giá trị trong file */
export function getEffectiveAssignment(
  dept: Department,
  s: ImportedSection
): Assignment {
  const chosen = dept.assignments[sectionKey(s)]
  return {
    lead: chosen?.lead ?? s.lead,
    teacher: chosen?.teacher ?? s.teacher,
  }
}
