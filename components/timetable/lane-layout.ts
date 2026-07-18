import type { Schedule } from "@/types/timetable"

export type PositionedSchedule = {
  schedule: Schedule
  /** 0-based lane index within its overlap cluster */
  lane: number
  /** Total lanes in the cluster (cards in cluster share this width) */
  laneCount: number
}

/**
 * Assign overlapping schedules of one day to side-by-side lanes.
 * Greedy interval-partitioning: sort by start, put each item in the first
 * lane whose last item has ended; cards in the same overlap cluster share
 * the cluster's lane count so widths line up.
 */
export function layoutDaySchedules(
  daySchedules: Schedule[]
): PositionedSchedule[] {
  const sorted = [...daySchedules].sort(
    (a, b) =>
      a.startPeriod - b.startPeriod ||
      b.endPeriod - a.endPeriod ||
      a.className.localeCompare(b.className)
  )

  const result: PositionedSchedule[] = []
  // Current overlap cluster
  let cluster: PositionedSchedule[] = []
  let laneEnds: number[] = [] // per-lane last endPeriod
  let clusterEnd = -1

  const flush = () => {
    const laneCount = laneEnds.length
    for (const item of cluster) item.laneCount = laneCount
    result.push(...cluster)
    cluster = []
    laneEnds = []
    clusterEnd = -1
  }

  for (const schedule of sorted) {
    if (cluster.length > 0 && schedule.startPeriod > clusterEnd) flush()

    let lane = laneEnds.findIndex((end) => end < schedule.startPeriod)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(schedule.endPeriod)
    } else {
      laneEnds[lane] = schedule.endPeriod
    }

    cluster.push({ schedule, lane, laneCount: 1 })
    clusterEnd = Math.max(clusterEnd, schedule.endPeriod)
  }
  flush()

  return result
}

/** Max lanes needed across a whole day (for sizing the day column) */
export function getDayLaneCount(daySchedules: Schedule[]): number {
  const positioned = layoutDaySchedules(daySchedules)
  return positioned.reduce((max, p) => Math.max(max, p.laneCount), 1)
}
