/**
 * Deterministic per-person accent color (works in light & dark).
 *
 * `createPersonColorMap` assigns each name a UNIQUE palette slot (hash-based
 * preferred slot + linear probing), so no two people share a color as long as
 * the roster is not larger than the palette. Colors only repeat once the
 * roster exceeds the palette size.
 */
export type PersonColor = {
  /** Avatar / swatch background */
  bg: string
  /** Text on the tinted background */
  text: string
  /** Border tint */
  border: string
}

const PALETTE: PersonColor[] = [
  { bg: "bg-red-100 dark:bg-red-950/60", text: "text-red-700 dark:text-red-300", border: "border-red-200 dark:border-red-900" },
  { bg: "bg-orange-100 dark:bg-orange-950/60", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-900" },
  { bg: "bg-amber-100 dark:bg-amber-950/60", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-900" },
  { bg: "bg-yellow-100 dark:bg-yellow-950/60", text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-900" },
  { bg: "bg-lime-100 dark:bg-lime-950/60", text: "text-lime-700 dark:text-lime-300", border: "border-lime-200 dark:border-lime-900" },
  { bg: "bg-green-100 dark:bg-green-950/60", text: "text-green-700 dark:text-green-300", border: "border-green-200 dark:border-green-900" },
  { bg: "bg-emerald-100 dark:bg-emerald-950/60", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-900" },
  { bg: "bg-teal-100 dark:bg-teal-950/60", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-900" },
  { bg: "bg-cyan-100 dark:bg-cyan-950/60", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-900" },
  { bg: "bg-sky-100 dark:bg-sky-950/60", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-900" },
  { bg: "bg-blue-100 dark:bg-blue-950/60", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-900" },
  { bg: "bg-indigo-100 dark:bg-indigo-950/60", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-900" },
  { bg: "bg-violet-100 dark:bg-violet-950/60", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-900" },
  { bg: "bg-purple-100 dark:bg-purple-950/60", text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-900" },
  { bg: "bg-fuchsia-100 dark:bg-fuchsia-950/60", text: "text-fuchsia-700 dark:text-fuchsia-300", border: "border-fuchsia-200 dark:border-fuchsia-900" },
  { bg: "bg-pink-100 dark:bg-pink-950/60", text: "text-pink-700 dark:text-pink-300", border: "border-pink-200 dark:border-pink-900" },
  { bg: "bg-rose-100 dark:bg-rose-950/60", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-900" },
  { bg: "bg-slate-200 dark:bg-slate-800/80", text: "text-slate-700 dark:text-slate-300", border: "border-slate-300 dark:border-slate-700" },
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Assign every name a unique color. Names get their hash-preferred slot;
 * on collision we probe to the next free slot. Deterministic for a given
 * roster (order-independent: names are sorted before assignment).
 */
export function createPersonColorMap(
  names: string[]
): Map<string, PersonColor> {
  const map = new Map<string, PersonColor>()
  const used = new Set<number>()
  const unique = [...new Set(names)].sort((a, b) => a.localeCompare(b, "vi"))

  for (const name of unique) {
    let idx = hashString(name) % PALETTE.length
    if (used.size < PALETTE.length) {
      while (used.has(idx)) idx = (idx + 1) % PALETTE.length
    }
    used.add(idx % PALETTE.length)
    map.set(name, PALETTE[idx % PALETTE.length])
  }
  return map
}

/** Standalone fallback (may collide) — prefer createPersonColorMap. */
export function getPersonColor(name: string): PersonColor {
  return PALETTE[hashString(name) % PALETTE.length]
}

/** "Nguyễn Văn Hiếu" → "NH" (first + last word initials) */
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 0 || words[0] === "") return "?"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}
