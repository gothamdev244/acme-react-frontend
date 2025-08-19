import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WidgetSize {
  width?: number
  height?: number
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
}

interface WidgetLayoutState {
  // Widget sizes per column
  customerWidgets: Record<string, WidgetSize>
  spaceCopilotWidgets: Record<string, WidgetSize>
  kmsWidgets: Record<string, WidgetSize>
  embeddedWidgets: Record<string, WidgetSize>
  
  // Actions
  setWidgetSize: (column: string, widgetId: string, size: Partial<WidgetSize>) => void
  getWidgetSize: (column: string, widgetId: string) => WidgetSize | undefined
  resetWidgetSizes: (column?: string) => void
  resetAllWidgetSizes: () => void
}

const DEFAULT_WIDGET_SIZES: Record<string, Record<string, WidgetSize>> = {
  customerWidgets: {
    'customer-info': { height: 40, minHeight: 30, maxHeight: 60 },
    'interaction-history': { height: 60, minHeight: 40, maxHeight: 70 }
  },
  spaceCopilotWidgets: {
    'transcript': { height: 50, minHeight: 30, maxHeight: 70 },
    'ai-assistance': { height: 50, minHeight: 30, maxHeight: 70 }
  },
  kmsWidgets: {
    'search': { height: 15, minHeight: 10, maxHeight: 25 },
    'articles': { height: 85, minHeight: 75, maxHeight: 90 }
  },
  embeddedWidgets: {}
}

export const useWidgetLayoutStore = create<WidgetLayoutState>()(
  persist(
    (set, get) => ({
      customerWidgets: DEFAULT_WIDGET_SIZES.customerWidgets,
      spaceCopilotWidgets: DEFAULT_WIDGET_SIZES.spaceCopilotWidgets,
      kmsWidgets: DEFAULT_WIDGET_SIZES.kmsWidgets,
      embeddedWidgets: DEFAULT_WIDGET_SIZES.embeddedWidgets,

      setWidgetSize: (column, widgetId, size) => {
        set((state) => ({
          [`${column}Widgets`]: {
            ...state[`${column}Widgets` as keyof typeof state] as Record<string, WidgetSize>,
            [widgetId]: {
              ...(state[`${column}Widgets` as keyof typeof state] as Record<string, WidgetSize>)?.[widgetId],
              ...size
            }
          }
        }))
      },

      getWidgetSize: (column, widgetId) => {
        const state = get()
        return (state[`${column}Widgets` as keyof typeof state] as Record<string, WidgetSize>)?.[widgetId]
      },

      resetWidgetSizes: (column) => {
        if (column) {
          set({
            [`${column}Widgets`]: DEFAULT_WIDGET_SIZES[`${column}Widgets`]
          })
        }
      },

      resetAllWidgetSizes: () => {
        set({
          customerWidgets: DEFAULT_WIDGET_SIZES.customerWidgets,
          spaceCopilotWidgets: DEFAULT_WIDGET_SIZES.spaceCopilotWidgets,
          kmsWidgets: DEFAULT_WIDGET_SIZES.kmsWidgets,
          embeddedWidgets: DEFAULT_WIDGET_SIZES.embeddedWidgets
        })
      }
    }),
    {
      name: 'widget-layout-storage',
      partialize: (state) => ({
        customerWidgets: state.customerWidgets,
        spaceCopilotWidgets: state.spaceCopilotWidgets,
        kmsWidgets: state.kmsWidgets,
        embeddedWidgets: state.embeddedWidgets
      })
    }
  )
)
