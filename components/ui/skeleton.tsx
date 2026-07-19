import { cn } from "@/lib/utils"

/** Placeholder loading — pulse nhẹ (tránh shimmer gradient nhiều block → lag) */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
