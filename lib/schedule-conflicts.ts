import { DAYS } from "@/data/timetable"
import type { Schedule } from "@/types/timetable"

/** Bỏ qua khi không có người / không có phòng hợp lệ */
const UNASSIGNED = new Set(["", "chưa phân công", "—", "-", "n/a", "na"])

export type ConflictKind = "lecturer" | "room"

export type ScheduleConflict = {
  kind: ConflictKind
  /** Tên GV hoặc mã phòng */
  resource: string
  aId: string
  bId: string
  /** Tiêu đề ngắn (1 dòng) */
  title: string
  /** Giải thích đầy đủ, nhiều dòng */
  message: string
}

export type ConflictIndex = {
  conflicts: ScheduleConflict[]
  byScheduleId: Map<string, ScheduleConflict[]>
  conflictIds: Set<string>
  counts: { lecturer: number; room: number; schedules: number }
}

/**
 * Parse nhãn tuần: "1–7, 9–16" | "Tuần 1-7" | "1,3,5" → Set tuần.
 * Rỗng / "—" → coi như mọi tuần (1–25) để vẫn phát hiện trùng tiết.
 */
export function parseWeeksToSet(label: string | undefined | null): Set<number> {
  const raw = (label ?? "").replace(/^Tuần\s*/i, "").trim()
  if (!raw || raw === "—" || raw === "-" || raw.toLowerCase() === "all") {
    return new Set(Array.from({ length: 25 }, (_, i) => i + 1))
  }

  const set = new Set<number>()
  for (const part of raw.split(/[,;]/)) {
    const p = part.trim()
    if (!p) continue
    const range = p.match(/^(\d+)\s*[–\-—]\s*(\d+)$/)
    if (range) {
      const a = Number(range[1])
      const b = Number(range[2])
      if (!Number.isFinite(a) || !Number.isFinite(b)) continue
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)
      for (let w = lo; w <= hi; w++) set.add(w)
      continue
    }
    if (/^\d+$/.test(p)) set.add(Number(p))
  }
  return set.size > 0
    ? set
    : new Set(Array.from({ length: 25 }, (_, i) => i + 1))
}

function setsIntersect(a: Set<number>, b: Set<number>): boolean {
  if (a.size === 0 || b.size === 0) return false
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  for (const x of small) if (large.has(x)) return true
  return false
}

/** Hai khoảng tiết giao nhau trên cùng ngày (inclusive) */
export function periodsOverlap(
  a: Pick<Schedule, "day" | "startPeriod" | "endPeriod">,
  b: Pick<Schedule, "day" | "startPeriod" | "endPeriod">
): boolean {
  if (a.day !== b.day) return false
  return a.startPeriod <= b.endPeriod && b.startPeriod <= a.endPeriod
}

function isAssignedPerson(name: string | undefined | null): name is string {
  if (!name) return false
  return !UNASSIGNED.has(name.trim().toLowerCase())
}

function isValidRoom(room: string | undefined | null): room is string {
  if (!room) return false
  const t = room.trim()
  if (!t) return false
  return !UNASSIGNED.has(t.toLowerCase())
}

function peopleOf(s: Schedule): string[] {
  const out = new Set<string>()
  for (const n of [s.teacher, s.lead, s.lecturer]) {
    if (isAssignedPerson(n)) out.add(n.trim())
  }
  return [...out]
}

/** schedule.day = 1…7 (T2…CN) */
function dayLabel(day: number): string {
  return DAYS.find((d) => d.day === day)?.label ?? `Ngày ${day}`
}

function periodPhrase(s: Schedule): string {
  if (s.startPeriod === s.endPeriod) return `tiết ${s.startPeriod}`
  return `tiết ${s.startPeriod}–${s.endPeriod}`
}

/** Ví dụ: CO3038 · nhóm CC02 — Phát triển Ứng dụng IoT (TN) */
function sectionPhrase(s: Schedule): string {
  return `${s.courseCode} · nhóm ${s.className} — ${s.courseName}`
}

function overlapWhen(a: Schedule, b: Schedule): string {
  // Cùng day đã được periodsOverlap đảm bảo
  const periods =
    a.startPeriod === b.startPeriod && a.endPeriod === b.endPeriod
      ? periodPhrase(a)
      : `${periodPhrase(a)} giao với ${periodPhrase(b)}`
  return `${dayLabel(a.day)}, ${periods}`
}

function lecturerConflictMessage(
  person: string,
  a: Schedule,
  b: Schedule
): { title: string; message: string } {
  const title = `Giảng viên ${person} bị xếp trùng 2 nhóm`
  const message = [
    `Giảng viên ${person} đang được phân công vào hai nhóm học cùng lúc:`,
    `1) ${sectionPhrase(a)}`,
    `2) ${sectionPhrase(b)}`,
    `Thời điểm trùng: ${overlapWhen(a, b)}.`,
    `Hai nhóm có giao tuần học — không thể dạy cả hai cùng lúc.`,
  ].join("\n")
  return { title, message }
}

function roomConflictMessage(
  room: string,
  a: Schedule,
  b: Schedule
): { title: string; message: string } {
  const title = `Phòng ${room} bị xếp trùng 2 nhóm`
  const message = [
    `Phòng ${room} đang được dùng cho hai nhóm học cùng lúc:`,
    `1) ${sectionPhrase(a)}`,
    `2) ${sectionPhrase(b)}`,
    `Thời điểm trùng: ${overlapWhen(a, b)}.`,
    `Hai nhóm có giao tuần học — một phòng không thể chứa hai lớp cùng lúc.`,
  ].join("\n")
  return { title, message }
}

/**
 * Tìm trùng lịch:
 * - **lecturer**: cùng người + cùng thứ + giao tiết + giao tuần
 * - **room**: cùng phòng + cùng thứ + giao tiết + giao tuần
 */
export function findScheduleConflicts(
  schedules: Schedule[]
): ConflictIndex {
  const conflicts: ScheduleConflict[] = []
  const byScheduleId = new Map<string, ScheduleConflict[]>()
  const conflictIds = new Set<string>()

  const weeksCache = new Map<string, Set<number>>()
  const weeksOf = (s: Schedule) => {
    let w = weeksCache.get(s.id)
    if (!w) {
      w = parseWeeksToSet(s.weeks)
      weeksCache.set(s.id, w)
    }
    return w
  }

  const push = (c: ScheduleConflict) => {
    conflicts.push(c)
    conflictIds.add(c.aId)
    conflictIds.add(c.bId)
    const la = byScheduleId.get(c.aId) ?? []
    const lb = byScheduleId.get(c.bId) ?? []
    la.push(c)
    lb.push(c)
    byScheduleId.set(c.aId, la)
    byScheduleId.set(c.bId, lb)
  }

  const n = schedules.length
  for (let i = 0; i < n; i++) {
    const a = schedules[i]
    for (let j = i + 1; j < n; j++) {
      const b = schedules[j]
      if (!periodsOverlap(a, b)) continue
      if (!setsIntersect(weeksOf(a), weeksOf(b))) continue

      const peopleA = peopleOf(a)
      const peopleB = new Set(peopleOf(b))
      for (const person of peopleA) {
        if (!peopleB.has(person)) continue
        const { title, message } = lecturerConflictMessage(person, a, b)
        push({
          kind: "lecturer",
          resource: person,
          aId: a.id,
          bId: b.id,
          title,
          message,
        })
      }

      if (
        isValidRoom(a.room) &&
        isValidRoom(b.room) &&
        a.room.trim() === b.room.trim()
      ) {
        const room = a.room.trim()
        const { title, message } = roomConflictMessage(room, a, b)
        push({
          kind: "room",
          resource: room,
          aId: a.id,
          bId: b.id,
          title,
          message,
        })
      }
    }
  }

  let lecturer = 0
  let room = 0
  for (const c of conflicts) {
    if (c.kind === "lecturer") lecturer++
    else room++
  }

  return {
    conflicts,
    byScheduleId,
    conflictIds,
    counts: {
      lecturer,
      room,
      schedules: conflictIds.size,
    },
  }
}

/** Tooltip / title: gộp title ngắn */
export function summarizeConflictsFor(
  scheduleId: string,
  index: ConflictIndex
): string {
  const list = index.byScheduleId.get(scheduleId)
  if (!list?.length) return ""
  return list.map((c) => c.title).join("\n")
}

/** Dialog: danh sách message đầy đủ */
export function detailConflictsFor(
  scheduleId: string,
  index: ConflictIndex
): string[] {
  const list = index.byScheduleId.get(scheduleId)
  if (!list?.length) return []
  return list.map((c) => c.message)
}
