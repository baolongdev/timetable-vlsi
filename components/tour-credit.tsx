"use client"

import * as React from "react"
import { createRoot, type Root } from "react-dom/client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * Dòng credit trong popover driver.js (React + shadcn Tooltip).
 * ACLAB TEAM · phát triển bởi … (hover → Lê Bảo Long) · github.com → baolongdev
 */
export function TourCreditLine() {
  return (
    <TooltipProvider delay={150}>
      <p className="mt-2 border-t border-border/50 pt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
        <strong className="font-semibold text-foreground">ACLAB TEAM</strong>
        <span className="text-border"> · </span>
        <span>phát triển bởi </span>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                className="inline cursor-help border-0 border-b border-dotted border-foreground/45 bg-transparent p-0 font-medium text-foreground outline-none hover:border-foreground"
              />
            }
          >
            …
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6} className="z-[10001]">
            Lê Bảo Long
          </TooltipContent>
        </Tooltip>
        <span className="text-border"> · </span>
        <a
          href="https://github.com/baolongdev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 underline underline-offset-2 hover:opacity-90 dark:text-sky-400"
        >
          github.com
        </a>
      </p>
    </TooltipProvider>
  )
}

let creditRoot: Root | null = null
let creditHost: HTMLElement | null = null

/** Gắn credit React vào popover driver (sau description) */
export function mountTourCredit(descriptionEl: HTMLElement | null | undefined) {
  if (typeof document === "undefined" || !descriptionEl) return

  unmountTourCredit()

  const host = document.createElement("div")
  host.setAttribute("data-tour-credit-root", "1")
  host.className = "driver-tour-credit-host"
  descriptionEl.insertAdjacentElement("afterend", host)

  creditHost = host
  creditRoot = createRoot(host)
  creditRoot.render(<TourCreditLine />)
}

export function unmountTourCredit() {
  if (creditRoot) {
    try {
      creditRoot.unmount()
    } catch {
      // ignore
    }
    creditRoot = null
  }
  if (creditHost) {
    creditHost.remove()
    creditHost = null
  }
  // Dọn host sót nếu driver re-render popover
  document.querySelectorAll("[data-tour-credit-root]").forEach((n) => n.remove())
}
