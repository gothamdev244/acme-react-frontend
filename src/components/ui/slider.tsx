import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "../../lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      // Base layout
      "relative flex w-full items-center",
      // Interaction
      "touch-none select-none",
      // Custom classes
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track 
      className={cn(
        // Base layout
        "relative w-full grow",
        // Size & shape
        "h-2 overflow-hidden rounded-full",
        // Colors
        "bg-secondary"
      )}
    >
      <SliderPrimitive.Range 
        className={cn(
          // Positioning
          "absolute h-full",
          // Colors
          "bg-primary"
        )}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb 
      className={cn(
        // Base layout
        "block",
        // Size & shape
        "h-5 w-5 rounded-full",
        // Border & colors
        "border-2 border-primary bg-background",
        // Ring offset
        "ring-offset-background",
        // Transitions
        "transition-colors",
        // Focus state
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Disabled state
        "disabled:pointer-events-none disabled:opacity-50"
      )}
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
