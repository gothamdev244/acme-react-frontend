import { create } from 'zustand'
import { shallow } from 'zustand/shallow'

interface AgentData {
  // Agent Information
  agentId: string
  agentName: string
  department: string
  role?: 'call' | 'chat' | 'supervisor' | 'manager' // Job function role
  status: 'active' | 'idle' | 'offline'
  
  // Call Information
  callerId: string
  callDuration: number
  queuePosition: number
  
  // Real-time Metrics
  sentiment: {
    score: number
    label: 'positive' | 'neutral' | 'negative'
    trend: 'up' | 'down' | 'stable'
    change: number
  }
  // Rolling sentiment history (most recent last)
  sentimentHistory: number[]
  
  priority: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    waitTime: number
    estimatedResolution: number
    escalation: boolean
  }
  
  // AI-Generated Content
  summary: {
    text: string
    category: string
    lastUpdated: Date
    confidence: number
  }
  
  intent: {
    type: string
    confidence: number
    detectionMs?: number
    accuracy?: number | string
    appUrl?: string      // URL for embedded app (from WebSocket)
    appTitle?: string    // Display title for embedded app (from WebSocket)
  }
  
  actions: Array<{
    id: string
    action: string
    priority: 'low' | 'medium' | 'high'
    completed: boolean
    details?: string
  }>
  
  // Transcript
  transcript: Array<{
    id: string
    timestamp: Date
    speaker: 'agent' | 'customer'
    text: string
  }>
  
  // Knowledge Base Articles (AI-generated recommendations)
  knowledgeArticles: Array<{
    id: string
    title: string
    category: string
    relevance: number
    excerpt: string
    url: string
    content?: string
    isNew?: boolean
  }>
  
  // Customer Information
  customer: {
    name: string
    id: string
    tier: string
    accountNumber: string
    accountType?: string
    cin?: string
    email: string
    phone: string
    location: string
    joinDate: string
    totalInteractions: number
    lastCCAASDate: string
    verificationStatus?: 'verified' | 'pending'
    riskLevel?: 'low' | 'medium' | 'high'
    gender?: string
    careNeed?: boolean | string
    interactionHistory?: Array<{
      interaction_medium: string
      timestamp: string
      summary: string
      [key: string]: any
    }>
  }
  
  // Performance Metrics
  metrics: {
    avgHandleTime: number
    resolutionRate: number
    customerSatisfaction: number
    callsHandled: number
    firstCallResolution: number
  }
}

interface AgentStore {
  // State
  agentData: Partial<AgentData>
  isConnected: boolean
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  lastUpdate: Date | null
  
  // Actions
  updateAgentData: (data: Partial<AgentData>) => void
  updateSentiment: (sentiment: AgentData['sentiment']) => void
  updatePriority: (priority: AgentData['priority']) => void
  updateSummary: (summary: AgentData['summary']) => void
  updateIntent: (intent: AgentData['intent']) => void
  addTranscriptEntry: (entry: AgentData['transcript'][0]) => void
  updateActions: (actions: AgentData['actions']) => void
  setActionsDirectly: (actions: AgentData['actions']) => void  // For local checkbox updates
  updateKnowledgeArticles: (articles: AgentData['knowledgeArticles']) => void
  updateCustomer: (customer: AgentData['customer']) => void
  updateMetrics: (metrics: AgentData['metrics']) => void
  setConnectionStatus: (status: AgentStore['connectionStatus']) => void
  reset: () => void
  
  // Clear methods for refresh functionality
  clearSentiment: () => void
  clearPriority: () => void
  clearSummary: () => void
  clearIntent: () => void
  clearActions: () => void
  clearTranscript: () => void
  clearKnowledgeArticles: () => void
  clearCustomer: () => void
  clearMetrics: () => void
  clearAgentData: () => void
}

const initialState = {
  agentData: {},
  isConnected: false,
  connectionStatus: 'disconnected' as const,
  lastUpdate: null,
}

const isShallowEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true
  if (!obj1 || !obj2) return false
  
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  
  if (keys1.length !== keys2.length) return false
  
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) return false
  }
  
  return true
}

export const useAgentStore = create<AgentStore>((set) => ({
  ...initialState,
  
  updateAgentData: (data) => {
    return set((state) => {
      const newAgentData = { ...state.agentData, ...data }
      if (isShallowEqual(state.agentData, newAgentData)) {
        return state
      }
      return {
        agentData: newAgentData,
        lastUpdate: new Date(),
      }
    })
  },
  
  updateSentiment: (sentiment) =>
    set((state) => {
      if (isShallowEqual(state.agentData.sentiment, sentiment)) {
        return state
      }
      const prevHistory = (state.agentData as any).sentimentHistory || []
      const newHistory = [...prevHistory, sentiment?.score ?? 0].slice(-100)
      return {
        agentData: { ...state.agentData, sentiment, sentimentHistory: newHistory },
        lastUpdate: new Date(),
      }
    }),
  
  updatePriority: (priority) =>
    set((state) => {
      if (isShallowEqual(state.agentData.priority, priority)) {
        return state
      }
      return {
        agentData: { ...state.agentData, priority },
        lastUpdate: new Date(),
      }
    }),
  
  updateSummary: (summary) =>
    set((state) => {
      if (isShallowEqual(state.agentData.summary, summary)) {
        return state
      }
      return {
        agentData: { ...state.agentData, summary },
        lastUpdate: new Date(),
      }
    }),
  
  updateIntent: (intent) =>
    set((state) => {
      if (isShallowEqual(state.agentData.intent, intent)) {
        return state
      }
      return {
        agentData: { ...state.agentData, intent },
        lastUpdate: new Date(),
      }
    }),
  
  addTranscriptEntry: (entry) =>
    set((state) => ({
      agentData: {
        ...state.agentData,
        transcript: [...(state.agentData.transcript || []), entry],
      },
      lastUpdate: new Date(),
    })),
  
  updateActions: (actions) =>
    set((state) => {
      // Preserve completed status from existing actions
      const existingActions = state.agentData.actions || []
      
      const completedMap = new Map(
        existingActions.map(action => [action.id, action.completed])
      )
      
      // Merge new actions with preserved completed status
      // Backend doesn't send completed field - it's managed entirely in frontend
      const mergedActions = actions.map(action => {
        const existingCompleted = completedMap.get(action.id)
        const newCompleted = existingCompleted !== undefined ? existingCompleted : false
        return {
          ...action,
          completed: newCompleted
        }
      })
      
      return {
        agentData: { ...state.agentData, actions: mergedActions },
        lastUpdate: new Date(),
      }
    }),
  
  // For local checkbox updates - use the actions directly without merging
  setActionsDirectly: (actions) =>
    set((state) => ({
      agentData: { ...state.agentData, actions },
      lastUpdate: new Date(),
    })),
  
  updateKnowledgeArticles: (knowledgeArticles) =>
    set((state) => {
      // Get existing articles
      const existingArticles = state.agentData.knowledgeArticles || []
      
      // Create a map of existing articles by ID for quick lookup
      const existingMap = new Map(
        existingArticles.map(article => [article.id, article])
      )
      
      // Process new articles
      const newArticles = knowledgeArticles.map((article: any) => ({
        ...article,
        isNew: !existingMap.has(article.id), // Mark as new if not seen before
        timestamp: new Date() // Add timestamp for sorting
      }))
      
      // Merge new articles with existing ones
      // New articles are added to the beginning for visibility
      const mergedArticles = [
        ...newArticles.filter((article: any) => !existingMap.has(article.id)), // New articles first
        ...existingArticles // Keep existing articles
      ]
      
      
      return {
        agentData: { ...state.agentData, knowledgeArticles: mergedArticles },
        lastUpdate: new Date(),
      }
    }),
  
  updateCustomer: (customer) =>
    set((state) => {
      if (isShallowEqual(state.agentData.customer, customer)) {
        return state
      }
      return {
        agentData: { ...state.agentData, customer },
        lastUpdate: new Date(),
      }
    }),
  
  updateMetrics: (metrics) =>
    set((state) => ({
      agentData: { ...state.agentData, metrics },
      lastUpdate: new Date(),
    })),
  
  setConnectionStatus: (connectionStatus) =>
    set({
      connectionStatus,
      isConnected: connectionStatus === 'connected',
    }),
  
  reset: () => set(initialState),
  
  // Clear methods for refresh functionality
  clearSentiment: () =>
    set((state) => ({
      agentData: { ...state.agentData, sentiment: undefined, sentimentHistory: [] },
      lastUpdate: new Date(),
    })),
  
  clearPriority: () =>
    set((state) => ({
      agentData: { ...state.agentData, priority: undefined },
      lastUpdate: new Date(),
    })),
  
  clearSummary: () =>
    set((state) => ({
      agentData: { ...state.agentData, summary: undefined },
      lastUpdate: new Date(),
    })),
  
  clearIntent: () =>
    set((state) => ({
      agentData: { ...state.agentData, intent: undefined },
      lastUpdate: new Date(),
    })),
  
  clearActions: () =>
    set((state) => ({
      agentData: { ...state.agentData, actions: [] },
      lastUpdate: new Date(),
    })),
  
  clearTranscript: () =>
    set((state) => ({
      agentData: { ...state.agentData, transcript: [] },
      lastUpdate: new Date(),
    })),
  
  clearKnowledgeArticles: () =>
    set((state) => ({
      agentData: { ...state.agentData, knowledgeArticles: [] },
      lastUpdate: new Date(),
    })),
  
  clearCustomer: () =>
    set((state) => ({
      agentData: { ...state.agentData, customer: undefined },
      lastUpdate: new Date(),
    })),
  
  clearMetrics: () =>
    set((state) => ({
      agentData: { ...state.agentData, metrics: undefined },
      lastUpdate: new Date(),
    })),
    
  clearAgentData: () => set(initialState),
}))
