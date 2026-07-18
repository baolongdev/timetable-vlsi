/**
 * Premium minimal layout tokens — Notion / Linear spacing scale.
 */
export const pagePad = "px-6 py-6 md:px-8 md:py-8" // ~24–32px
export const pagePadX = "px-6 md:px-8"
export const sectionGap = "gap-6" // 24px Header → Toolbar → Calendar
export const controlGap = "gap-4" // 16px between toolbar controls

export const cardInsetX = 4
export const cardInsetY = 3

/** Time / period column width */
export const periodColVar =
  "[--period-col:3.5rem] sm:[--period-col:4rem] lg:[--period-col:4.5rem]"

export const DAY_HEADER_HEIGHT = 52

/** Position a schedule block as % of the day column */
export function periodOffsetStyle(
  startPeriod: number,
  endPeriod: number,
  periodCount: number,
  insetY = cardInsetY
): { top: string; height: string } {
  const span = endPeriod - startPeriod + 1
  const topPct = ((startPeriod - 1) / periodCount) * 100
  const heightPct = (span / periodCount) * 100

  return {
    top: `calc(${topPct}% + ${insetY}px)`,
    height: `calc(${heightPct}% - ${insetY * 2}px)`,
  }
}
