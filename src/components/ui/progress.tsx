import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "../../lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      // Base layout
      "relative w-full",
      // Size & shape
      "h-4 overflow-hidden rounded-full",
      // Colors
      "bg-secondary",
      // Custom classes
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        // Size
        "h-full w-full flex-1",
        // Colors
        "bg-primary",
        // Transitions
        "transition-all"
      )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
