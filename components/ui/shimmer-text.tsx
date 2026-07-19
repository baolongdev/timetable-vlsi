import { cn } from "@/lib/utils"

type ShimmerTextProps = {
  children: React.ReactNode
  className?: string
  /** Phát 1 lần (reveal) thay vì loop */
  once?: boolean
}

/**
 * Text shimmer (shadcn utility) — status / loading copy.
 * Dựa `currentColor`; reduced-motion tự tắt animation.
 */
export function ShimmerText({
  children,
  className,
  once = false,
}: ShimmerTextProps) {
  return (
    <span
      role="status"
      className={cn(
        "shimmer shimmer-duration-1600 text-muted-foreground",
        once && "shimmer-once",
        className
      )}
    >
      {children}
    </span>
  )
}
