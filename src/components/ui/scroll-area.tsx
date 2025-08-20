import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "../../lib/utils"

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn(
      // Base layout
      "relative overflow-hidden",
      // Custom classes
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport 
      className={cn(
        // Size
        "h-full w-full",
        // Shape inheritance
        "rounded-[inherit]"
      )}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      // Base layout
      "flex",
      // Interaction
      "touch-none select-none",
      // Transitions
      "transition-colors",
      // Orientation-specific styles
      orientation === "vertical" && [
        // Size
        "h-full w-2.5",
        // Border & spacing
        "border-l border-l-transparent p-[1px]"
      ],
      orientation === "horizontal" && [
        // Size
        "h-2.5 flex-col",
        // Border & spacing
        "border-t border-t-transparent p-[1px]"
      ],
      // Custom classes
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb 
      className={cn(
        // Layout
        "relative flex-1",
        // Shape
        "rounded-full",
        // Colors
        "bg-border"
      )}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
