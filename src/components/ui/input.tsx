import * as React from "react"

import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base layout & box model
          "flex w-full h-10 rounded-md border bg-background px-3 py-2",
          // Typography
          "text-sm",
          // Visuals
          "border-input placeholder:text-muted-foreground",
          // Shadows & Effects
          "ring-offset-background",
          // File input styling
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          // Focus state
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Custom classes
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
