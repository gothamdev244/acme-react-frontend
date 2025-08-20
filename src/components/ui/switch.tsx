import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "../../lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Base layout & positioning
      "peer inline-flex items-center",
      // Size & shape
      "h-5 w-9 shrink-0 rounded-full",
      // Border & shadows
      "border-2 border-transparent shadow-sm",
      // Interaction
      "cursor-pointer",
      // Transitions
      "transition-colors",
      // Focus state
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      // Disabled state
      "disabled:cursor-not-allowed disabled:opacity-50",
      // State colors
      "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      // Custom classes
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Base layout
        "pointer-events-none block",
        // Size & shape
        "h-4 w-4 rounded-full",
        // Colors & shadows
        "bg-background shadow-lg ring-0",
        // Animation
        "transition-transform",
        // State positions
        "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
