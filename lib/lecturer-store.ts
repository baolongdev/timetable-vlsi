"use client"

import * as React from "react"

import { initialLecturers } from "@/data/lecturers"
import { appToast } from "@/lib/app-toast"
import { fetchSyncSnapshot, pushLecturers } from "@/lib/sync-client"
import type { Lecturer } from "@/types/lecturer"

type StoreState = {
  lecturers: Lecturer[]
  updatedAt: number
}

const STORAGE_KEY = "timetable-lecturers-v1"
const META_KEY = "timetable-lecturers-meta-v1"

type GlobalLecturerStore = {
  state: StoreState
  hydrated: boolean
  syncing: boolean
  version: number
  listeners: Set<() => void>
  snapshot: LecturerStoreSnapshot
  pushTimer: number | null
  pollTimer: number | null
  remoteConfigured: boolean | null
  seeded: boolean
  hasRemoteApplied: boolean
}

export type LecturerStoreSnapshot = {
  lecturers: Lecturer[]
  version: number
  updatedAt: number
  remoteConfigured: boolean | null
}

const g = globalThis as unknown as {
  __timetableLecturerStore?: GlobalLecturerStore
}

function fingerprintLecturers(list: Lecturer[]): string {
  try {
    return JSON.stringify(
      list.map((l) => ({
        id: l.id,
        name: l.name,
        role: l.role,
        staffId: l.staffId,
        email: l.email,
        phone: l.phone,
      }))
    )
  } catch {
    return String(list.length)
  }
}

function getG(): GlobalLecturerStore {
  if (!g.__timetableLecturerStore) {
    const empty: StoreState = { lecturers: [], updatedAt: 0 }
    g.__timetableLecturerStore = {
      state: empty,
      hydrated: false,
      syncing: false,
      version: 0,
      listeners: new Set(),
      snapshot: {
        lecturers: empty.lecturers,
        version: 0,
        updatedAt: 0,
        remoteConfigured: null,
      },
      pushTimer: null,
      pollTimer: null,
      remoteConfigured: null,
      seeded: false,
      hasRemoteApplied: false,
    }
  }
  return g.__timetableLecturerStore
}

function loadState(): StoreState {
  if (typeof window === "undefined") {
    return { lecturers: [], updatedAt: 0 }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const metaRaw = window.localStorage.getItem(META_KEY)
    const meta = metaRaw ? (JSON.parse(metaRaw) as { updatedAt?: number }) : {}
    if (!raw) {
      return { lecturers: [], updatedAt: meta.updatedAt ?? 0 }
    }
    const parsed = JSON.parse(raw) as { lecturers?: Lecturer[] }
    return {
      lecturers: parsed.lecturers ?? [],
      updatedAt: meta.updatedAt ?? 0,
    }
  } catch {
    return { lecturers: [], updatedAt: 0 }
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
      JSON.stringify({ lecturers: next.lecturers })
    )
    window.localStorage.setItem(
      META_KEY,
      JSON.stringify({ updatedAt: next.updatedAt })
    )
  } catch {
    // ignore
  }
}

function applyState(next: StoreState, opts?: { skipRemote?: boolean }) {
  const store = getG()
  store.state = next
  store.version += 1
  store.snapshot = {
    lecturers: next.lecturers,
    version: store.version,
    updatedAt: next.updatedAt,
    remoteConfigured: store.remoteConfigured,
  }
  writeLocal(next)
  emit()
  if (!opts?.skipRemote) schedulePush()
}

function persist(lecturers: Lecturer[]) {
  applyState({ lecturers, updatedAt: Date.now() })
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
    const ok = await pushLecturers(store.state.lecturers)
    if (ok) {
      store.remoteConfigured = true
      store.snapshot = { ...store.snapshot, remoteConfigured: true }
      emit()
    } else if (store.remoteConfigured == null) {
      const statusTry = await fetchSyncSnapshot()
      if (!statusTry.ok && statusTry.reason === "mongo_not_configured") {
        store.remoteConfigured = false
        store.snapshot = { ...store.snapshot, remoteConfigured: false }
        emit()
      }
    }
  } finally {
    store.syncing = false
  }
}

export async function pullLecturersFromRemote(): Promise<boolean> {
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

  // Server trống: seed initial nếu local trống, hoặc push local
  if (data.lecturers.length === 0) {
    if (store.state.lecturers.length > 0) {
      await pushLecturers(store.state.lecturers)
    } else if (!store.seeded) {
      store.seeded = true
      applyState(
        { lecturers: initialLecturers, updatedAt: Date.now() },
        { skipRemote: false }
      )
      await pushLecturers(initialLecturers)
    }
    return true
  }

  if (
    store.state.updatedAt > 0 &&
    data.updatedAt > 0 &&
    store.state.updatedAt > data.updatedAt &&
    store.state.lecturers.length > 0
  ) {
    await pushLecturers(store.state.lecturers)
    return true
  }

  const prevFp = fingerprintLecturers(store.state.lecturers)
  const nextFp = fingerprintLecturers(data.lecturers)
  const changed = prevFp !== nextFp
  const firstApply = !store.hasRemoteApplied

  applyState(
    {
      lecturers: data.lecturers,
      updatedAt: data.updatedAt || Date.now(),
    },
    { skipRemote: true }
  )
  store.hasRemoteApplied = true

  if (changed) {
    if (firstApply) {
      appToast.remoteLoaded("lecturers")
    } else {
      appToast.remoteUpdate("lecturers")
    }
  }
  return true
}

function ensureHydrated() {
  const store = getG()
  if (store.hydrated || typeof window === "undefined") return
  let loaded = loadState()
  // Lần đầu hoàn toàn trống → seed static
  if (loaded.lecturers.length === 0) {
    loaded = { lecturers: initialLecturers, updatedAt: 0 }
    store.seeded = true
  }
  store.state = loaded
  store.hydrated = true
  store.version += 1
  store.snapshot = {
    lecturers: loaded.lecturers,
    version: store.version,
    updatedAt: loaded.updatedAt,
    remoteConfigured: store.remoteConfigured,
  }
  writeLocal(loaded)
}

const SERVER_SNAPSHOT: LecturerStoreSnapshot = {
  lecturers: initialLecturers,
  version: 0,
  updatedAt: 0,
  remoteConfigured: null,
}

export const lecturerStore = {
  subscribe(listener: () => void) {
    const store = getG()
    store.listeners.add(listener)
    return () => store.listeners.delete(listener)
  },
  getSnapshot(): LecturerStoreSnapshot {
    ensureHydrated()
    return getG().snapshot
  },
  getServerSnapshot(): LecturerStoreSnapshot {
    return SERVER_SNAPSHOT
  },

  setAll(lecturers: Lecturer[]) {
    ensureHydrated()
    persist(lecturers)
  },

  upsert(data: Omit<Lecturer, "id"> & { id?: string }) {
    ensureHydrated()
    const store = getG()
    if (data.id) {
      persist(
        store.state.lecturers.map((l) =>
          l.id === data.id
            ? {
                ...l,
                name: data.name,
                role: data.role,
                departmentId: data.departmentId,
                email: data.email,
                phone: data.phone,
                note: data.note,
                staffId: data.staffId ?? l.staffId,
              }
            : l
        )
      )
      appToast.success("Đã cập nhật giảng viên", data.name)
      return data.id
    }
    const id = String(
      Math.max(0, ...store.state.lecturers.map((l) => Number(l.id) || 0)) + 1
    )
    persist([
      ...store.state.lecturers,
      {
        id,
        name: data.name,
        role: data.role,
        departmentId: data.departmentId,
        email: data.email,
        phone: data.phone,
        note: data.note,
        staffId: data.staffId,
      },
    ])
    appToast.success("Đã thêm giảng viên", data.name)
    return id
  },

  remove(id: string) {
    ensureHydrated()
    const store = getG()
    const name = store.state.lecturers.find((l) => l.id === id)?.name ?? id
    persist(store.state.lecturers.filter((l) => l.id !== id))
    appToast.success("Đã xóa giảng viên", name)
  },
}

const POLL_BASE = 30_000
const POLL_MAX = 120_000
const POLL_BACKOFF_FACTOR = 1.5

export function useLecturers(initialData?: Lecturer[]) {
  const snapshot = React.useSyncExternalStore(
    lecturerStore.subscribe,
    lecturerStore.getSnapshot,
    lecturerStore.getServerSnapshot
  )
  const [hydrated, setHydrated] = React.useState(false)

  React.useEffect(() => {
    // SSR seed: chỉ khi local hoàn toàn trống
    if (initialData && initialData.length > 0) {
      ensureHydrated()
      const store = getG()
      if (store.state.updatedAt === 0 && store.state.lecturers.length === 0) {
        applyState(
          { lecturers: initialData, updatedAt: 0 },
          { skipRemote: true }
        )
      }
    }
    setHydrated(true)
    void pullLecturersFromRemote()

    const store = getG()
    let currentInterval = POLL_BASE
    let consecutiveNoChange = 0

    const onFocus = () => {
      currentInterval = POLL_BASE
      consecutiveNoChange = 0
      setupPoll()
      void pullLecturersFromRemote()
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        currentInterval = POLL_BASE
        consecutiveNoChange = 0
        setupPoll()
      }
    }

    function setupPoll() {
      if (store.pollTimer != null) window.clearInterval(store.pollTimer)
      store.pollTimer = window.setInterval(async () => {
        const prev = getG().state.updatedAt
        const ok = await pullLecturersFromRemote()
        if (ok) {
          const next = getG().state.updatedAt
          if (next === prev) {
            consecutiveNoChange++
            currentInterval = Math.min(
              currentInterval * POLL_BACKOFF_FACTOR,
              POLL_MAX
            )
          } else {
            consecutiveNoChange = 0
            currentInterval = POLL_BASE
          }
          setupPoll()
        }
      }, currentInterval)
    }

    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisibility)
    setupPoll()

    return () => {
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisibility)
      if (store.pollTimer != null) {
        window.clearInterval(store.pollTimer)
        store.pollTimer = null
      }
    }
    // initialData chỉ dùng seed lần đầu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    lecturers: snapshot.lecturers,
    version: snapshot.version,
    updatedAt: snapshot.updatedAt,
    remoteConfigured: snapshot.remoteConfigured,
    hydrated,
  }
}
