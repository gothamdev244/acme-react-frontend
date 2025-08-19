import { useState, useCallback, useEffect } from 'react'
import { useRoleConfig } from '../contexts/role-context'

export type ColumnState = 'normal' | 'collapsed' | 'maximized'

export interface ColumnLayoutState {
  customer: ColumnState
  embedded: ColumnState
  spaceCopilot: ColumnState
  kms: ColumnState
}

const DEFAULT_LAYOUT: ColumnLayoutState = {
  customer: 'normal',
  embedded: 'normal',
  spaceCopilot: 'normal',
  kms: 'normal'
}

const STORAGE_KEY = 'ccaas-layout-v2'

export function useColumnLayout() {
  const { canManageColumns, currentRole } = useRoleConfig()
  
  // Load persisted layout
  const loadLayout = (): ColumnLayoutState => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-${currentRole}`)
      return saved ? JSON.parse(saved) : DEFAULT_LAYOUT
    } catch {
      return DEFAULT_LAYOUT
    }
  }

  const [layout, setLayout] = useState<ColumnLayoutState>(loadLayout)

  // Listen for storage changes from other components/tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `${STORAGE_KEY}-${currentRole}` && e.newValue) {
        try {
          const newLayout = JSON.parse(e.newValue)
          setLayout(newLayout)
        } catch (error) {
        }
      }
    }

    // Also listen for custom events for same-tab updates
    const handleLayoutUpdate = (e: CustomEvent) => {
      if (e.detail) {
        setLayout(e.detail)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('layout-updated', handleLayoutUpdate as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('layout-updated', handleLayoutUpdate as EventListener)
    }
  }, [currentRole])

  // Save layout to localStorage and broadcast update
  const saveLayout = useCallback((newLayout: ColumnLayoutState) => {
    try {
      localStorage.setItem(`${STORAGE_KEY}-${currentRole}`, JSON.stringify(newLayout))
      // Dispatch custom event for same-tab updates (use setTimeout to avoid React warning)
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('layout-updated', { detail: newLayout }))
      }, 0)
    } catch (error) {
    }
  }, [currentRole])

  // Update a specific column state
  const updateColumn = useCallback((column: keyof ColumnLayoutState, state: ColumnState) => {
    
    if (!canManageColumns()) {
      return
    }

    setLayout(prev => {
      const newLayout = { ...prev }
      
      // If maximizing a column, collapse others
      if (state === 'maximized') {
        Object.keys(newLayout).forEach(key => {
          if (key !== column) {
            newLayout[key as keyof ColumnLayoutState] = 'collapsed'
          }
        })
      }
      
      newLayout[column] = state
      saveLayout(newLayout)
      
      // Force a re-render by creating a new object
      return { ...newLayout }
    })
  }, [canManageColumns, saveLayout])

  // Apply complete layout (for presets)
  const applyLayout = useCallback((newLayout: Partial<ColumnLayoutState>) => {
    if (!canManageColumns()) {
      return
    }
    
    setLayout(prev => {
      const updated = { ...prev, ...newLayout }
      saveLayout(updated)
      return updated
    })
  }, [canManageColumns, saveLayout])

  // Reset to default layout
  const resetLayout = useCallback(() => {
    if (!canManageColumns()) return
    
    setLayout(DEFAULT_LAYOUT)
    saveLayout(DEFAULT_LAYOUT)
  }, [canManageColumns, saveLayout])

  // Toggle column between normal and collapsed
  const toggleColumn = useCallback((column: keyof ColumnLayoutState) => {
    if (!canManageColumns()) return
    
    const currentState = layout[column]
    const newState = currentState === 'collapsed' ? 'normal' : 'collapsed'
    updateColumn(column, newState)
  }, [layout, updateColumn, canManageColumns])

  // Get CSS classes for column based on state
  const getColumnClasses = useCallback((column: keyof ColumnLayoutState): string => {
    const state = layout[column]
    
    switch (state) {
      case 'collapsed':
        return 'w-12 min-w-[48px] max-w-[48px] overflow-hidden'
      case 'maximized':
        return 'flex-1'
      case 'normal':
      default:
        // Return default column widths based on column type
        switch (column) {
          case 'customer':
            return 'w-[360px] min-w-[280px] max-w-[480px]'
          case 'embedded':
            return 'flex-1 min-w-[400px]'
          case 'spaceCopilot':
          case 'kms':
            return 'w-[640px] min-w-[400px] max-w-[800px]'
          default:
            return 'flex-1'
        }
    }
  }, [layout])

  // Check if any column is maximized
  const hasMaximizedColumn = Object.values(layout).some(state => state === 'maximized')

  return {
    layout,
    updateColumn,
    applyLayout,
    toggleColumn,
    resetLayout,
    getColumnClasses,
    hasMaximizedColumn,
    canManageColumns: canManageColumns(),
    // Helper methods
    isCollapsed: (column: keyof ColumnLayoutState) => layout[column] === 'collapsed',
    isMaximized: (column: keyof ColumnLayoutState) => layout[column] === 'maximized',
    isNormal: (column: keyof ColumnLayoutState) => layout[column] === 'normal'
  }
}
