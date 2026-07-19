/** Cookie + localStorage: đã xem tour onboarding */

export const TOUR_STORAGE_KEY = "vlsi-tour-v1"
export const TOUR_PAGES_KEY = "vlsi-tour-pages-v1"
export const TOUR_COOKIE_NAME = "vlsi_tour_v1"

export type TourPage =
  | "home"
  | "departments"
  | "timetable"
  | "courses"
  | "lecturers"

export function resolveTourPage(pathname: string): TourPage | null {
  if (!pathname || pathname === "/") return "home"
  if (pathname.startsWith("/departments")) return "departments"
  if (pathname.startsWith("/timetable")) return "timetable"
  if (pathname.startsWith("/courses")) return "courses"
  if (pathname.startsWith("/lecturers")) return "lecturers"
  return null
}

export function hasCompletedTourClient(): boolean {
  if (typeof window === "undefined") return true
  try {
    if (window.localStorage.getItem(TOUR_STORAGE_KEY) === "1") return true
  } catch {
    // ignore
  }
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${TOUR_COOKIE_NAME}=1`))
}

function readCompletedPages(): Partial<Record<TourPage, boolean>> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(TOUR_PAGES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as Partial<Record<TourPage, boolean>>
  } catch {
    return {}
  }
}

export function hasCompletedPageTour(page: TourPage): boolean {
  if (typeof window === "undefined") return true
  const pages = readCompletedPages()
  if (pages[page]) return true
  // Backward-compat: nếu chỉ có cờ global cũ, coi như đã xong timetable
  // (tour ban đầu chỉ có trên TKB) — các page khác vẫn hiện tour lần đầu.
  if (page === "timetable" && hasCompletedTourClient()) return true
  return false
}

export function markTourCompletedClient(page?: TourPage): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, "1")
    if (page) {
      const pages = readCompletedPages()
      pages[page] = true
      window.localStorage.setItem(TOUR_PAGES_KEY, JSON.stringify(pages))
    }
  } catch {
    // ignore
  }
  // cookie 1 năm (client-side backup; server cũng set khi POST)
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${TOUR_COOKIE_NAME}=1; path=/; max-age=${maxAge}; samesite=lax`
}
