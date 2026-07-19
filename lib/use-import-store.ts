"use client"

import * as React from "react"

import type {
  Assignment,
  ImportedSection,
  ImportState,
} from "@/types/import"
import { sectionKey } from "@/types/import"

const STORAGE_KEY = "timetable-import-v1"

function loadState(): ImportState {
  if (typeof window === "undefined")
    return { fileName: null, sections: [], assignments: {} }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { fileName: null, sections: [], assignments: {} }
    const parsed = JSON.parse(raw) as ImportState
    return {
      fileName: parsed.fileName ?? null,
      sections: parsed.sections ?? [],
      assignments: parsed.assignments ?? {},
    }
  } catch {
    return { fileName: null, sections: [], assignments: {} }
  }
}

/**
 * Store dữ liệu Excel phân công + lựa chọn cán bộ, lưu localStorage để
 * giữ qua reload. Dùng chung giữa trang Timetable và Môn học.
 */
export function useImportStore() {
  const [state, setState] = React.useState<ImportState>({
    fileName: null,
    sections: [],
    assignments: {},
  })
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    setState(loadState())
    setHydrated(true)
  }, [])

  const persist = React.useCallback((next: ImportState) => {
    setState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // localStorage đầy / bị chặn — giữ state trong phiên
    }
  }, [])

  const importSections = React.useCallback(
    (fileName: string, sections: ImportedSection[]) => {
      // Giữ phân công cũ cho các nhóm vẫn tồn tại trong file mới
      const keys = new Set(sections.map(sectionKey))
      const kept: Record<string, Assignment> = {}
      for (const [k, v] of Object.entries(state.assignments)) {
        if (keys.has(k)) kept[k] = v
      }
      persist({ fileName, sections, assignments: kept })
    },
    [persist, state.assignments]
  )

  const assign = React.useCallback(
    (key: string, patch: Assignment) => {
      persist({
        ...state,
        assignments: {
          ...state.assignments,
          [key]: { ...state.assignments[key], ...patch },
        },
      })
    },
    [persist, state]
  )

  const clear = React.useCallback(() => {
    persist({ fileName: null, sections: [], assignments: {} })
  }, [persist])

  /** Phân công hiệu lực của một nhóm: người dùng chọn > giá trị trong file */
  const getAssignment = React.useCallback(
    (s: ImportedSection): Assignment => {
      const chosen = state.assignments[sectionKey(s)]
      return {
        lead: chosen?.lead ?? s.lead,
        teacher: chosen?.teacher ?? s.teacher,
      }
    },
    [state.assignments]
  )

  return {
    ...state,
    hydrated,
    hasImport: state.sections.length > 0,
    importSections,
    assign,
    clear,
    getAssignment,
  }
}
