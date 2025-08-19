import { create } from 'zustand'

interface Intent {
  id: string
  name: string
  icon: string
  context: Record<string, any>
  confidence: number
  appUrl?: string  // URL path to the embedded app (e.g., '/embedded-apps/credit_card_management')
  appTitle?: string  // Display title for the app (e.g., 'Credit Card Management')
}

interface IntentStore {
  // State
  availableIntents: Intent[]
  currentIntent: string | null
  embeddedAppIntent: string | null  // Intent currently displayed in embedded app
  intentHistory: Intent[]
  
  // Actions
  setAvailableIntents: (intents: Intent[] | ((prev: Intent[]) => Intent[])) => void
  selectIntent: (intentId: string) => void
  setEmbeddedAppIntent: (intentId: string) => void  // Manually set embedded app intent
  clearIntents: () => void
  updateIntentContext: (context: Record<string, any>) => void
}

export const useIntentStore = create<IntentStore>((set, get) => ({
  availableIntents: [],
  currentIntent: null,
  embeddedAppIntent: null,
  intentHistory: [],
  
  setAvailableIntents: (intents) => {
    try {
      // Handle both direct arrays and callback functions (like useState)
      const currentIntents = get().availableIntents || []
      const currentEmbeddedIntent = get().embeddedAppIntent
      
      let newIntents
      if (typeof intents === 'function') {
        try {
          newIntents = intents(currentIntents)
        } catch (error) {
          newIntents = currentIntents
        }
      } else {
        newIntents = intents
      }
      
      const validIntents = Array.isArray(newIntents) ? newIntents : []
      
      if (!Array.isArray(newIntents)) {
        // newIntents is not an array, defaulting to empty array
      }
      
      // Find which intent was newly added (instead of always selecting first)
      const newlyAddedIntent = validIntents.find(intent => 
        !currentIntents.some(existing => existing.id === intent.id)
      )
      
      // Use newly added intent if found, otherwise keep current selection, fallback to first
      const currentSelection = get().currentIntent
      const targetIntent = newlyAddedIntent?.id || currentSelection || validIntents[0]?.id || null
      
      
      // Only set embeddedAppIntent if it's not already set (first intent arrival)
      const embeddedIntent = currentEmbeddedIntent || targetIntent
      
      try {
        set({ 
          availableIntents: validIntents,
          currentIntent: targetIntent, // Select actual newly detected intent
          embeddedAppIntent: embeddedIntent // Keep embedded app on first intent unless manually changed
        })
      } catch (error) {
        // Error updating store state
      }
    } catch (error) {
      // Critical error in setAvailableIntents
    }
  },
  
  selectIntent: (intentId) => {
    try {
      
      const availableIntents = get().availableIntents || []
      
      const intent = availableIntents.find(i => i.id === intentId)
      
      if (intent) {
        try {
          set(state => ({
            currentIntent: intentId,
            intentHistory: [...state.intentHistory, intent]
            // NOTE: We do NOT change embeddedAppIntent here - that's only changed manually
          }))
        } catch (error) {
          return
        }
        
        // We do NOT notify embedded app here anymore - only when setEmbeddedAppIntent is called
      } else {
      }
    } catch (error) {
      // Critical error in selectIntent
    }
  },
  
  setEmbeddedAppIntent: (intentId) => {
    try {
      
      const availableIntents = get().availableIntents || []
      const intent = availableIntents.find(i => i.id === intentId)
      
      
      if (intent) {
        
        set({
          embeddedAppIntent: intentId,
          currentIntent: intentId // Also update dropdown selection
        })
      } else {
      }
    } catch (error) {
      // Error in setEmbeddedAppIntent
    }
  },
  
  updateIntentContext: (context) => {
    const currentId = get().currentIntent
    const availableIntents = get().availableIntents || []
    const currentIntent = availableIntents.find(i => i.id === currentId)
    if (currentIntent) {
      const updatedIntents = (get().availableIntents || []).map(intent =>
        intent.id === currentId 
          ? { ...intent, context: { ...intent.context, ...context } }
          : intent
      )
      set({ availableIntents: updatedIntents })
      
      // The embedded app column component will handle sending context updates to the iframe
    }
  },
  
  clearIntents: () => set({ 
    availableIntents: [], 
    currentIntent: null,
    embeddedAppIntent: null,
    intentHistory: []
  })
}))
