import { useCallback, useEffect, useState } from 'react'
import { useWidgetLayoutStore } from '../stores/widget-layout-store'
import { useRoleConfig } from '../contexts/role-context'

interface UseWidgetLayoutOptions {
  column: 'customer' | 'spaceCopilot' | 'kms' | 'embedded'
  widgetId: string
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

export function useWidgetLayout({
  column,
  widgetId,
  defaultSize = 50,
  minSize = 10,
  maxSize = 90
}: UseWidgetLayoutOptions) {
  const { currentRole } = useRoleConfig()
  const { setWidgetSize, getWidgetSize } = useWidgetLayoutStore()
  
  // Get stored size or use default
  const storedSize = getWidgetSize(column, widgetId)
  const [size, setSize] = useState(storedSize?.height || defaultSize)
  
  // Handle resize
  const handleResize = useCallback((newSize: number) => {
    // Clamp size within bounds
    const clampedSize = Math.max(minSize, Math.min(maxSize, newSize))
    setSize(clampedSize)
    
    // Save to store
    setWidgetSize(column, widgetId, { 
      height: clampedSize,
      minHeight: minSize,
      maxHeight: maxSize
    })
  }, [column, widgetId, minSize, maxSize, setWidgetSize])
  
  // Reset to default
  const resetSize = useCallback(() => {
    setSize(defaultSize)
    setWidgetSize(column, widgetId, { 
      height: defaultSize,
      minHeight: minSize,
      maxHeight: maxSize
    })
  }, [column, widgetId, defaultSize, minSize, maxSize, setWidgetSize])
  
  // Update when role changes
  useEffect(() => {
    const storedSize = getWidgetSize(column, widgetId)
    if (storedSize?.height && storedSize.height !== size) {
      setSize(storedSize.height)
    }
  }, [currentRole, column, widgetId]) // Remove getWidgetSize from deps to prevent infinite loop
  
  return {
    size,
    handleResize,
    resetSize,
    minSize: storedSize?.minHeight || minSize,
    maxSize: storedSize?.maxHeight || maxSize
  }
}

// Hook for managing panel groups
export function useColumnPanels(column: 'customer' | 'spaceCopilot' | 'kms' | 'embedded') {
  const { resetWidgetSizes } = useWidgetLayoutStore()
  
  const resetColumnSizes = useCallback(() => {
    resetWidgetSizes(column)
  }, [column, resetWidgetSizes])
  
  return {
    resetColumnSizes
  }
}
