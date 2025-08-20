import { cn } from "../../lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Animation
        "animate-pulse",
        // Shape
        "rounded-md",
        // Colors
        "bg-muted",
        // Custom classes
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
