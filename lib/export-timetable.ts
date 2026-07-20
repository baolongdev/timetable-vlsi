"use client"

import { toPng } from "html-to-image"

/**
 * Chụp node grid (toàn bộ, kể cả phần cuộn khuất) thành PNG dataURL.
 * pixelRatio 2 cho ảnh nét khi in / phóng to.
 */
async function captureNode(node: HTMLElement): Promise<{
  dataUrl: string
  width: number
  height: number
}> {
  const width = node.scrollWidth
  const height = node.scrollHeight
  const dataUrl = await toPng(node, {
    width,
    height,
    pixelRatio: 2,
    backgroundColor: getComputedStyle(document.body).backgroundColor,
    style: {
      // Bỏ transform/animation dở dang khi chụp
      transform: "none",
    },
    filter: (el) => {
      // Bỏ các nút hành động hover trên card (chi tiết / phân công / copy)
      if (el instanceof HTMLElement && el.dataset?.exportExclude === "true")
        return false
      return true
    },
  })
  return { dataUrl, width, height }
}

function triggerDownload(href: string, fileName: string) {
  const link = document.createElement("a")
  link.href = href
  link.download = fileName
  link.click()
}

/** Tải grid thành file PNG */
export async function exportTimetableAsImage(
  node: HTMLElement,
  fileName: string
): Promise<void> {
  const { dataUrl } = await captureNode(node)
  triggerDownload(dataUrl, `${fileName}.png`)
}

/**
 * Tải grid thành file PDF một trang — khổ giấy đặt đúng tỉ lệ grid
 * (landscape nếu grid rộng) nên toàn bộ TKB nằm gọn trong 1 trang.
 */
export async function exportTimetableAsPdf(
  node: HTMLElement,
  fileName: string,
  title?: string
): Promise<void> {
  const { dataUrl, width, height } = await captureNode(node)
  const { jsPDF } = await import("jspdf")

  const HEADER = title ? 36 : 0
  const orientation = width >= height ? "landscape" : "portrait"
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [width, height + HEADER],
    compress: true,
  })

  if (title) {
    pdf.setFontSize(16)
    pdf.setTextColor(20)
    // jsPDF font mặc định không có glyph tiếng Việt đầy đủ — dùng ASCII an toàn
    pdf.text(title, 16, 24)
  }

  pdf.addImage(dataUrl, "PNG", 0, HEADER, width, height)
  pdf.save(`${fileName}.pdf`)
}
