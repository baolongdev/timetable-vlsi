"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { driver, type DriveStep, type Driver } from "driver.js"
import "driver.js/dist/driver.css"
import { CircleHelp } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { usePresenceReady } from "@/components/presence-widget"
import {
  mountTourCredit,
  unmountTourCredit,
} from "@/components/tour-credit"
import {
  hasCompletedPageTour,
  hasCompletedTourClient,
  markTourCompletedClient,
  resolveTourPage,
  type TourPage,
} from "@/lib/onboarding"
import { cn } from "@/lib/utils"

let activeDriver: Driver | null = null
let activeTourPage: TourPage | null = null

/** Mô tả HTML gọn, dễ đọc trong popover driver.js */
function desc(...paragraphs: string[]) {
  return paragraphs.filter(Boolean).join("<br/><br/>")
}

/** Element có trong DOM và đang hiển thị (bỏ qua md:hidden / hidden) */
function isTourTargetVisible(selector: string): boolean {
  const el = document.querySelector(selector)
  if (!(el instanceof HTMLElement)) return false
  const style = window.getComputedStyle(el)
  if (style.display === "none" || style.visibility === "hidden") return false
  const rect = el.getBoundingClientRect()
  if (rect.width < 2 || rect.height < 2) return false
  let parent: HTMLElement | null = el.parentElement
  while (parent && parent !== document.body) {
    const ps = window.getComputedStyle(parent)
    if (ps.display === "none" || ps.visibility === "hidden") return false
    parent = parent.parentElement
  }
  return true
}

function filterVisibleSteps(steps: DriveStep[]): DriveStep[] {
  return steps.filter((step) => {
    if (!step.element) return true
    return isTourTargetVisible(String(step.element))
  })
}

/**
 * Credit (ACLAB TEAM · phát triển bởi… · github.com) gắn bằng React Tooltip
 * qua mountTourCredit — không nhét HTML title vào description.
 */

/* ──────────────────────────── Home ──────────────────────────── */

function buildHomeSteps(): DriveStep[] {
  return [
    {
      popover: {
        title: "Chào mừng — VLSI Timetable",
        description: desc(
          "<strong>ACLAB TEAM</strong> · Thời khóa biểu học kỳ Tổ VLSI.",
          "Trang chủ: chọn nhanh Khoa, Timetable, Môn học hoặc Giảng viên.",
          "Di chuột (hoặc chạm) vào từng hàng menu, rồi bấm để vào trang."
        ),
        align: "center",
      },
    },
    {
      element: "[data-tour='home-menu']",
      popover: {
        title: "Menu chính",
        description: desc(
          "<strong>Departments</strong> — quản lý khoa / tổ đã import, upload Excel.",
          "<strong>Timetable</strong> — xem lưới thời khóa biểu, lọc, phân công, cảnh báo trùng.",
          "<strong>Courses</strong> — danh sách môn học & nhóm lớp theo khoa.",
          "<strong>Lecturers</strong> — danh sách giảng viên / cán bộ (MSCB, vai trò…)."
        ),
        side: "left",
        align: "center",
      },
    },
    {
      element: "[data-tour='help-tour']",
      popover: {
        title: "Hướng dẫn theo từng trang",
        description: desc(
          "Nút <strong>Hướng dẫn</strong> luôn có trên mỗi trang — bấm để xem tour riêng cho trang đó.",
          "Phím <strong>H</strong> mở bảng trợ giúp (phím tắt). Phím <strong>D</strong> đổi theme sáng/tối."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      popover: {
        title: "Bắt đầu thôi",
        description: desc(
          "Gợi ý: vào <strong>Departments</strong> upload file phân công, rồi mở <strong>Timetable</strong> để xem lịch.",
          "Mỗi trang có tour riêng — bấm Hướng dẫn khi cần."
        ),
        align: "center",
      },
    },
  ]
}

/* ──────────────────────── Departments ──────────────────────── */

function buildDepartmentsSteps(): DriveStep[] {
  return [
    {
      popover: {
        title: "Trang Khoa / Tổ chuyên môn",
        description: desc(
          "Đây là nơi quản lý các khoa đã import từ file Excel phân công giảng dạy.",
          "Mỗi sheet hợp lệ trong file (CNPM, KTMT…) sẽ thành một khoa riêng trên danh sách."
        ),
        align: "center",
      },
    },
    {
      element: "[data-tour='dept-upload']",
      popover: {
        title: "Upload file Excel",
        description: desc(
          "Bấm để chọn file <strong>.xlsx</strong> phân công. Hệ thống đọc từng sheet và cho bạn tick chọn khoa nào cần import.",
          "Upload lại file có cùng tên sheet → cập nhật dữ liệu khoa đó; <strong>phân công đã chọn được giữ</strong>."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='dept-nav-lecturers']",
      popover: {
        title: "Sang trang Giảng viên",
        description: desc(
          "Mở danh sách giảng viên / cán bộ để xem MSCB, vai trò, hoặc thêm/sửa người."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='dept-list']",
      popover: {
        title: "Danh sách khoa",
        description: desc(
          "Mỗi thẻ khoa hiện: số môn, số nhóm lớp, tỷ lệ đã phân công, tên file & thời điểm import.",
          "Nút <strong>Thời khóa biểu</strong> → lưới lịch của khoa. Nút <strong>Môn học</strong> → bảng môn & nhóm lớp.",
          "Icon thùng rác (hiện khi hover) xóa khoa khỏi hệ thống trên trình duyệt này."
        ),
        side: "top",
        align: "center",
      },
    },
    {
      element: "[data-tour='dept-empty']",
      popover: {
        title: "Chưa có khoa",
        description: desc(
          "Khi chưa import gì, màn hình trống hướng dẫn upload. Bấm nút upload để nạp file phân công đầu tiên."
        ),
        side: "top",
        align: "center",
      },
    },
    {
      element: "[data-tour='help-tour']",
      popover: {
        title: "Xem lại hướng dẫn",
        description: desc(
          "Bấm <strong>Hướng dẫn</strong> bất cứ lúc nào để chạy lại tour trang Khoa."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      popover: {
        title: "Tiếp theo",
        description: desc(
          "Sau khi có khoa, mở <strong>Thời khóa biểu</strong> trên thẻ khoa để xem lịch và phân công."
        ),
        align: "center",
      },
    },
  ]
}

/* ──────────────────────── Timetable ──────────────────────── */

function buildTimetableSteps(): DriveStep[] {
  return [
    {
      popover: {
        title: "Chào mừng — VLSI Timetable",
        description: desc(
          "<strong>ACLAB TEAM</strong> · Thời khóa biểu: xem lịch, lọc, phân công cán bộ và theo dõi cảnh báo trùng lịch.",
          "<strong>Tour này gồm:</strong> điều hướng · tìm &amp; lọc · lưới lịch · trùng lịch · import · phím tắt."
        ),
        align: "center",
      },
    },
    {
      element: "[data-tour='dept-switch']",
      popover: {
        title: "Chọn khoa / tổ",
        description: desc(
          "Nút <strong>Khoa</strong> mở danh sách khoa đã import. Nếu có nhiều khoa, nút tên khoa hiện ngay đây để chuyển nhanh.",
          "Bộ lọc và cảnh báo trùng chỉ áp dụng cho khoa đang xem."
        ),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='conflicts']",
      popover: {
        title: "Cảnh báo trùng lịch",
        description: desc(
          "Khi có xung đột, nút <strong>Trùng lịch</strong> (đỏ) xuất hiện. Bấm mở panel chi tiết.",
          "Hai loại: <strong>trùng giảng viên</strong> và <strong>trùng phòng</strong>. Card trên lưới có viền đỏ khi bị trùng."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      element: "[data-tour='export']",
      popover: {
        title: "Export CSV",
        description: desc(
          "Tải danh sách nhóm <strong>đang hiển thị</strong> (sau tìm kiếm & lọc) ra file CSV."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='nav-courses']",
      popover: {
        title: "Trang Môn học",
        description: desc(
          "Quản lý môn học, xem nhóm lớp và đội ngũ giảng dạy theo khoa."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='nav-lecturers']",
      popover: {
        title: "Trang Giảng viên",
        description: desc(
          "Danh sách giảng viên / cán bộ — dùng khi lọc lịch và phân công nhóm lớp."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='theme-toggle']",
      popover: {
        title: "Giao diện sáng / tối",
        description: desc(
          "Bấm để đổi theme, hoặc phím <strong>D</strong> khi không đang gõ trong ô nhập."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='search']",
      popover: {
        title: "Ô tìm kiếm",
        description: desc(
          "Lọc theo tên môn, mã môn hoặc giảng viên. Phím tắt: <strong>Ctrl/⌘ + K</strong>.",
          "Nút × xóa nhanh từ khóa. Có thể kết hợp với bộ lọc bên cạnh."
        ),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='filters']",
      popover: {
        title: "Bộ lọc (máy tính)",
        description: desc(
          "Ba select: <strong>Môn</strong> · <strong>Giảng viên</strong> (nhóm vai trò + MSCB) · <strong>Phòng</strong> (nhóm theo tòa).",
          "Nút <strong>Xóa lọc</strong> hiện khi đang lọc. Trên mobile gộp vào nút Bộ lọc."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      element: "[data-tour='filter-course']",
      popover: {
        title: "Lọc theo môn học",
        description: desc(
          "Chỉ hiện nhóm của một môn. Danh sách dạng mã + tên, menu rộng để đọc tên dài."
        ),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='filter-lecturer']",
      popover: {
        title: "Lọc theo giảng viên",
        description: desc(
          "Nhóm theo vai trò; kèm <strong>MSCB</strong> khi có. Chọn một người → chỉ còn nhóm có người đó."
        ),
        side: "bottom",
        align: "center",
      },
    },
    {
      element: "[data-tour='filter-room']",
      popover: {
        title: "Lọc theo phòng",
        description: desc(
          "Phòng nhóm theo tòa (A4, B1…). Hữu ích khi kiểm tra tải phòng / trùng phòng."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='filters-mobile']",
      popover: {
        title: "Bộ lọc (điện thoại)",
        description: desc(
          "Trên màn nhỏ, ba select gộp vào nút này. Badge cho biết số điều kiện đang bật."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='scroll']",
      popover: {
        title: "Cuộn lưới ngang",
        description: desc(
          "Nút ‹ › cuộn một viewport. Hoặc <strong>kéo chuột</strong> trên vùng trống lưới — thả ra có quán tính."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='grid']",
      popover: {
        title: "Lưới thời khóa biểu",
        description: desc(
          "Trục dọc = tiết, ngang = thứ. Bấm card → dialog phân công. Viền đỏ = trùng lịch.",
          "Card ngắn: hover để mở rộng. Mobile: xem dạng danh sách theo ngày."
        ),
        side: "top",
        align: "center",
      },
    },
    {
      element: "[data-tour='upload']",
      popover: {
        title: "Import file Excel",
        description: desc(
          "Khi chưa có dữ liệu: upload .xlsx và chọn khoa/tổ để hiển thị lịch."
        ),
        side: "top",
        align: "center",
      },
    },
    {
      element: "[data-tour='help-tour']",
      popover: {
        title: "Xem lại hướng dẫn",
        description: desc(
          "Bấm <strong>Hướng dẫn</strong> hoặc phím <strong>H</strong> (bảng trợ giúp). Phím tắt: Ctrl/⌘K · D · H · Esc."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      popover: {
        title: "Bạn đã sẵn sàng",
        description: desc(
          "Thử: tìm môn → lọc GV → bấm card phân công → mở «Trùng lịch» nếu có cảnh báo.",
          "Chúc bạn dùng VLSI Timetable hiệu quả."
        ),
        align: "center",
      },
    },
  ]
}

/* ──────────────────────── Courses ──────────────────────── */

function buildCoursesSteps(): DriveStep[] {
  return [
    {
      popover: {
        title: "Trang Môn học",
        description: desc(
          "Danh sách môn học theo khoa: mã môn, tên, số nhóm lớp, CB giảng dạy.",
          "Dữ liệu lấy từ file Excel đã import của khoa đang chọn."
        ),
        align: "center",
      },
    },
    {
      element: "[data-tour='courses-dept-switch']",
      popover: {
        title: "Chuyển khoa",
        description: desc(
          "Khi có nhiều khoa: bấm tên khoa để xem môn của khoa đó. Nút <strong>Khoa</strong> về trang danh sách khoa."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='courses-nav-lecturers']",
      popover: {
        title: "Giảng viên",
        description: desc(
          "Sang trang quản lý danh sách giảng viên — đối chiếu khi xem đội ngũ môn học."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='courses-search']",
      popover: {
        title: "Tìm kiếm môn",
        description: desc(
          "Gõ mã môn, tên môn hoặc tên giảng viên trong đội ngũ. Bảng lọc ngay khi gõ."
        ),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='courses-filter-lecturer']",
      popover: {
        title: "Lọc theo giảng viên",
        description: desc(
          "Chỉ hiện môn có CB giảng dạy trùng tên. Danh sách nhóm theo vai trò, có MSCB."
        ),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='courses-table']",
      popover: {
        title: "Bảng môn học",
        description: desc(
          "Mỗi dòng một môn. Cột <strong>Nhóm lớp</strong>: bấm số nhóm để mở dialog chi tiết section.",
          "Trong dialog bạn xem lịch từng nhóm và <strong>phân công CB giảng dạy</strong> nếu đã import khoa.",
          "Cuộn ngang trên màn hẹp để thấy đủ cột Lý thuyết / Thực hành."
        ),
        side: "top",
        align: "center",
      },
    },
    {
      element: "[data-tour='help-tour']",
      popover: {
        title: "Xem lại hướng dẫn",
        description: desc(
          "Bấm <strong>Hướng dẫn</strong> để chạy lại tour trang Môn học. Phím <strong>H</strong> mở trợ giúp chung."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      popover: {
        title: "Gợi ý",
        description: desc(
          "Bấm một dòng môn có nhóm → mở chi tiết. Muốn xem trên lưới lịch: vào Timetable của cùng khoa."
        ),
        align: "center",
      },
    },
  ]
}

/* ──────────────────────── Lecturers ──────────────────────── */

function buildLecturersSteps(): DriveStep[] {
  return [
    {
      popover: {
        title: "Trang Giảng viên",
        description: desc(
          "Quản lý danh sách cán bộ / giảng viên: MSCB, họ tên, vai trò, email, điện thoại.",
          "Danh sách này hỗ trợ lọc trên thời khóa biểu và phân công nhóm lớp."
        ),
        align: "center",
      },
    },
    {
      element: "[data-tour='lecturers-nav-courses']",
      popover: {
        title: "Sang trang Môn học",
        description: desc(
          "Xem môn & nhóm lớp theo khoa — đối chiếu đội ngũ giảng dạy."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='lecturers-add']",
      popover: {
        title: "Thêm giảng viên",
        description: desc(
          "Mở form tạo mới: họ tên, vai trò (Tổ trưởng, Giảng viên…), email, SĐT, ghi chú.",
          "Dữ liệu lưu trên phiên làm việc hiện tại (cùng cách quản lý danh sách app)."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: "[data-tour='lecturers-search']",
      popover: {
        title: "Tìm kiếm",
        description: desc(
          "Lọc theo tên, vai trò hoặc email. Kết hợp với bộ lọc vai trò bên cạnh."
        ),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='lecturers-filter-role']",
      popover: {
        title: "Lọc theo vai trò",
        description: desc(
          "Chọn một vai trò (Tổ trưởng, Phó khoa, Giảng viên…) để thu hẹp bảng."
        ),
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "[data-tour='lecturers-table']",
      popover: {
        title: "Bảng danh sách",
        description: desc(
          "Cột MSCB, tên (avatar màu), vai trò, liên hệ. Cột <strong>Thao tác</strong>: sửa (bút) hoặc xóa (thùng rác).",
          "Sửa mở form điền sẵn; xóa có hộp thoại xác nhận."
        ),
        side: "top",
        align: "center",
      },
    },
    {
      element: "[data-tour='help-tour']",
      popover: {
        title: "Xem lại hướng dẫn",
        description: desc(
          "Bấm <strong>Hướng dẫn</strong> để chạy lại tour trang này bất cứ lúc nào."
        ),
        side: "bottom",
        align: "end",
      },
    },
    {
      popover: {
        title: "Xong",
        description: desc(
          "Sau khi cập nhật danh sách, quay Timetable để lọc / phân công với thông tin mới nhất."
        ),
        align: "center",
      },
    },
  ]
}

function buildStepsForPage(page: TourPage): DriveStep[] {
  switch (page) {
    case "home":
      return filterVisibleSteps(buildHomeSteps())
    case "departments":
      return filterVisibleSteps(buildDepartmentsSteps())
    case "timetable":
      return filterVisibleSteps(buildTimetableSteps())
    case "courses":
      return filterVisibleSteps(buildCoursesSteps())
    case "lecturers":
      return filterVisibleSteps(buildLecturersSteps())
    default:
      return []
  }
}

function completeTour(page: TourPage | null) {
  markTourCompletedClient(page ?? undefined)
  void fetch("/api/onboarding", { method: "POST" }).catch(() => {})
}

/**
 * Chạy tour driver.js theo trang hiện tại.
 * @param force true = xem lại (có thể đóng); lần đầu (force false) bắt buộc đi hết
 * @param page  ghi đè trang (mặc định lấy từ pathname)
 */
export function startOnboardingTour(options?: {
  force?: boolean
  page?: TourPage
}) {
  if (typeof window === "undefined") return
  const isReplay = Boolean(options?.force)
  const page =
    options?.page ?? resolveTourPage(window.location.pathname) ?? "timetable"

  if (!isReplay && hasCompletedPageTour(page)) return

  try {
    activeDriver?.destroy()
  } catch {
    // ignore
  }
  activeDriver = null
  activeTourPage = page

  const steps = buildStepsForPage(page)
  if (steps.length === 0) return

  const blockEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault()
      e.stopPropagation()
    }
  }
  if (!isReplay) {
    window.addEventListener("keydown", blockEscape, true)
  }

  const d = driver({
    showProgress: true,
    animate: true,
    allowClose: isReplay,
    overlayClickBehavior: isReplay ? "close" : () => {},
    // Lần đầu: không tương tác UI bên dưới — credit/tooltip vẫn hover được trong popover
    disableActiveInteraction: !isReplay,
    overlayOpacity: 0.55,
    stagePadding: 8,
    stageRadius: 12,
    nextBtnText: "Tiếp",
    prevBtnText: "Lùi",
    doneBtnText: "Xong",
    progressText: "{{current}} / {{total}}",
    steps,
    onPopoverRender: (popover) => {
      // Tooltip shadcn (Base UI) cho «phát triển bởi…» → Lê Bảo Long
      mountTourCredit(popover.description)
    },
    onCloseClick: isReplay
      ? undefined
      : (_el, _step, { config, state }) => {
          void _el
          void _step
          void config
          void state
        },
    onDestroyed: () => {
      unmountTourCredit()
      if (!isReplay) {
        window.removeEventListener("keydown", blockEscape, true)
      }
      const donePage = activeTourPage
      activeDriver = null
      activeTourPage = null
      completeTour(donePage)
    },
  })
  activeDriver = d
  d.drive()
}

/**
 * Nút header — xem lại hướng dẫn trang hiện tại
 */
export function TourHelpButton({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-tour="help-tour"
            className={cn(
              "transition-opacity duration-150 hover:opacity-80",
              className
            )}
            onClick={() => startOnboardingTour({ force: true })}
            aria-label="Xem lại hướng dẫn"
          />
        }
      >
        <CircleHelp data-icon="inline-start" />
        Hướng dẫn
      </TooltipTrigger>
      <TooltipContent>Xem lại hướng dẫn trang này</TooltipContent>
    </Tooltip>
  )
}

/**
 * Tự chạy tour lần đầu theo từng trang.
 * - Chỉ sau khi user nhập tên / ẩn danh (presence ready).
 * - Lần đầu dùng app (chưa complete global): bắt buộc (force false).
 * - Trang mới chưa xem tour: auto chạy có thể bỏ qua (force true).
 * - Nút Hướng dẫn: luôn force true.
 */
export function OnboardingTour() {
  const pathname = usePathname()
  const presenceReady = usePresenceReady()
  const startedPagesRef = React.useRef<Set<TourPage>>(new Set())

  React.useEffect(() => {
    // Chờ dialog tên xong — không chồng driver.js lên form nhập tên
    if (!presenceReady) return

    const page = resolveTourPage(pathname)
    if (!page) return
    if (startedPagesRef.current.has(page)) return
    if (hasCompletedPageTour(page)) return

    let cancelled = false
    let timer: number | undefined

    const run = async () => {
      // Chỉ hỏi API cho lần đầu app (chưa có global).
      // Nếu server báo đã xong → đồng bộ client, vẫn cho tour trang khác lần đầu.
      if (!hasCompletedTourClient()) {
        try {
          const res = await fetch("/api/onboarding", { cache: "no-store" })
          if (res.ok) {
            const data = (await res.json()) as { showTour?: boolean }
            if (data.showTour === false) {
              markTourCompletedClient()
            }
          }
        } catch {
          // ignore
        }
      }

      if (cancelled || hasCompletedPageTour(page)) return

      // Chờ dialog đóng / layout ổn định rồi mới drive
      timer = window.setTimeout(() => {
        if (cancelled) return
        let tries = 0
        const tryStart = () => {
          if (cancelled) return
          const steps = buildStepsForPage(page)
          if (steps.length >= 2 || tries >= 12) {
            if (
              !startedPagesRef.current.has(page) &&
              !hasCompletedPageTour(page)
            ) {
              startedPagesRef.current.add(page)
              // Lần đầu tuyệt đối: bắt buộc. Các trang sau: có thể đóng.
              const isFirstEver = !hasCompletedTourClient()
              startOnboardingTour({
                force: !isFirstEver,
                page,
              })
            }
            return
          }
          tries++
          timer = window.setTimeout(tryStart, 250)
        }
        tryStart()
      }, 400)
    }

    void run()

    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [pathname, presenceReady])

  return null
}
