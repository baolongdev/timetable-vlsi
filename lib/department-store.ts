"use client"

import * as React from "react"

import type {
  Assignment,
  ImportedSection,
} from "@/types/import"
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

type Listener = () => void

/**
 * Store module-level + subscribe: các trang (Timetable, Môn học, hub)
 * cùng thấy một danh sách khoa, đồng bộ ngay khi thay đổi, lưu localStorage.
 */
let state: StoreState = { departments: [] }
let hydratedGlobal = false
const listeners = new Set<Listener>()

function emit() {
  for (const l of listeners) l()
}

function persist(next: StoreState) {
  state = next
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // localStorage đầy / bị chặn — giữ state trong phiên
  }
  emit()
}

function ensureHydrated() {
  if (hydratedGlobal || typeof window === "undefined") return
  state = loadState()
  hydratedGlobal = true
}

// Snapshot server/SSR — phải là hằng để useSyncExternalStore không loop
const EMPTY_STATE: StoreState = { departments: [] }

export const departmentStore = {
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot(): StoreState {
    ensureHydrated()
    return state
  },
  getServerSnapshot(): StoreState {
    return EMPTY_STATE
  },

  /** Thêm/ghi đè một khoa từ sheet đã chọn */
  addDepartment(
    sheetName: string,
    fileName: string,
    sections: ImportedSection[]
  ) {
    const id = slugify(sheetName)
    const existing = state.departments.find((d) => d.id === id)
    // Giữ phân công cũ cho các nhóm vẫn tồn tại
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
        ...state.departments.filter((d) => d.id !== id),
        dept,
      ].sort((a, b) => a.name.localeCompare(b.name, "vi")),
    })
    return id
  },

  removeDepartment(id: string) {
    persist({
      departments: state.departments.filter((d) => d.id !== id),
    })
  },

  assign(deptId: string, key: string, patch: Assignment) {
    persist({
      departments: state.departments.map((d) =>
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

/** Hook đọc danh sách khoa (đồng bộ giữa các component/trang) */
export function useDepartments() {
  const snapshot = React.useSyncExternalStore(
    departmentStore.subscribe,
    departmentStore.getSnapshot,
    departmentStore.getServerSnapshot
  )
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => setHydrated(true), [])
  return { departments: snapshot.departments, hydrated }
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
