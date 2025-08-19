import * as React from "react"
import { X } from "lucide-react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive" | "success"
  onClose?: () => void
}

export function Toast({
  title,
  description,
  action,
  variant = "default",
  onClose,
}: ToastProps) {
  const variantStyles = {
    default: "bg-white border-gray-200",
    destructive: "bg-red-50 border-red-200 text-red-900",
    success: "bg-green-50 border-green-200 text-green-900",
  }

  return (
    <div
      className={`
        relative flex w-full max-w-sm items-center space-x-4 rounded-lg border p-4 shadow-lg
        ${variantStyles[variant]}
        animate-in slide-in-from-top-full duration-300
      `}
    >
      <div className="flex-1 space-y-1">
        {title && <p className="text-sm font-semibold">{title}</p>}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {children}
    </div>
  )
}
