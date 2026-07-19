/** Nhóm phòng theo tòa/dãy: A4-409 → "A4", B10-207 → "B10" */
export function getRoomBuilding(room: string): string {
  const t = room.trim()
  if (!t) return "Khác"
  const i = t.indexOf("-")
  if (i > 0) return t.slice(0, i)
  const m = t.match(/^[A-Za-z]+\d*/)
  return m?.[0] ?? "Khác"
}

function naturalKey(s: string): [string, number, string] {
  const m = s.match(/^([A-Za-z]*)(\d*)(.*)$/)
  if (!m) return [s, 0, ""]
  return [m[1].toUpperCase(), Number(m[2] || 0), m[3]]
}

function compareNatural(a: string, b: string): number {
  const [la, na, ra] = naturalKey(a)
  const [lb, nb, rb] = naturalKey(b)
  if (la !== lb) return la.localeCompare(lb, "vi")
  if (na !== nb) return na - nb
  return ra.localeCompare(rb, "vi")
}

export type RoomBuildingGroup = {
  building: string
  rooms: string[]
}

/** Gom danh sách phòng theo tòa, sort tự nhiên A4 < B1 < B10 */
export function groupRoomsByBuilding(rooms: string[]): RoomBuildingGroup[] {
  const map = new Map<string, string[]>()
  for (const room of rooms) {
    const b = getRoomBuilding(room)
    const list = map.get(b) ?? []
    list.push(room)
    map.set(b, list)
  }

  return [...map.entries()]
    .sort(([a], [b]) => compareNatural(a, b))
    .map(([building, list]) => ({
      building,
      rooms: [...list].sort(compareNatural),
    }))
}
