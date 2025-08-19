import React, { createContext, useContext, useState, useCallback } from 'react'
import { Toast, ToastContainer, ToastProps } from '../components/ui/toast'

interface ToastContextValue {
  toast: (props: Omit<ToastProps, 'id' | 'onClose'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([])
  
  const toast = useCallback((props: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Date.now().toString()
    const newToast: ToastProps = {
      ...props,
      id,
      onClose: () => dismiss(id),
    }
    
    setToasts((prev) => [...prev, newToast])
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismiss(id)
    }, 5000)
  }, [])
  
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])
  
  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer>
        {toasts.map((toastProps) => (
          <Toast key={toastProps.id} {...toastProps} />
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
