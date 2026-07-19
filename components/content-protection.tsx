"use client"

import * as React from "react"

/**
 * - Tắt bôi đen chữ toàn site (trừ input/textarea/contenteditable)
 * - Chặn chuột phải + một số phím tắt mở DevTools
 *
 * Lưu ý: DevTools không thể chặn tuyệt đối (menu trình duyệt, remote debug…).
 * Đây chỉ là lớp cản trở cơ bản trên trang.
 */
export function ContentProtection() {
  React.useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false
      if (el.isContentEditable) return true
      const tag = el.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
      return Boolean(el.closest("input, textarea, select, [contenteditable=true]"))
    }

    const onContextMenu = (e: MouseEvent) => {
      if (isEditable(e.target)) return
      e.preventDefault()
    }

    const onSelectStart = (e: Event) => {
      if (isEditable(e.target)) return
      e.preventDefault()
    }

    const onDragStart = (e: DragEvent) => {
      if (isEditable(e.target)) return
      e.preventDefault()
    }

    const onCopy = (e: ClipboardEvent) => {
      if (isEditable(e.target)) return
      e.preventDefault()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey
      const shift = e.shiftKey
      const alt = e.altKey

      // F12
      if (e.key === "F12") {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Ctrl+Shift+I / J / C — DevTools
      if (ctrl && shift && (key === "i" || key === "j" || key === "c")) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Ctrl+Shift+K (Firefox console)
      if (ctrl && shift && key === "k") {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Ctrl+U — view source
      if (ctrl && key === "u") {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Ctrl+S — save page
      if (ctrl && key === "s") {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Ctrl+P — print (optional block)
      if (ctrl && key === "p") {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Ctrl+A — select all (except in fields)
      if (ctrl && key === "a" && !isEditable(e.target)) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // Ctrl+C / X — copy/cut outside fields
      if (ctrl && (key === "c" || key === "x") && !isEditable(e.target)) {
        e.preventDefault()
        e.stopPropagation()
        return
      }

      // macOS Option+Cmd+I
      if (e.metaKey && alt && key === "i") {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    document.addEventListener("contextmenu", onContextMenu)
    document.addEventListener("selectstart", onSelectStart)
    document.addEventListener("dragstart", onDragStart)
    document.addEventListener("copy", onCopy)
    document.addEventListener("cut", onCopy)
    document.addEventListener("keydown", onKeyDown, true)

    return () => {
      document.removeEventListener("contextmenu", onContextMenu)
      document.removeEventListener("selectstart", onSelectStart)
      document.removeEventListener("dragstart", onDragStart)
      document.removeEventListener("copy", onCopy)
      document.removeEventListener("cut", onCopy)
      document.removeEventListener("keydown", onKeyDown, true)
    }
  }, [])

  return null
}
