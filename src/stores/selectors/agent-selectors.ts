import { useAgentStore } from '../agent-store'
import { shallow } from 'zustand/shallow'

// Constants for stable default values
const EMPTY_ARRAY: any[] = []
const DEFAULT_CUSTOMER_NAME = 'Customer'
const DEFAULT_AGENT_NAME = 'Agent'

// ===============================
// Granular Data Selectors
// ===============================

// Transcript selector - only re-renders when transcript changes
export const useTranscript = () => 
  useAgentStore(state => state.agentData.transcript || EMPTY_ARRAY)

// Customer selector - only re-renders when customer data changes
export const useCustomer = () => 
  useAgentStore(state => state.agentData.customer)

// Connection status selector
export const useConnectionStatus = () => 
  useAgentStore(state => state.connectionStatus)

// Sentiment selector
export const useSentiment = () => 
  useAgentStore(state => state.agentData.sentiment)

// Intent selector
export const useIntent = () => 
  useAgentStore(state => state.agentData.intent)

// Knowledge articles selector
export const useKnowledgeArticles = () => 
  useAgentStore(state => state.agentData.knowledgeArticles || EMPTY_ARRAY)

// Actions selector
export const useActions = () => 
  useAgentStore(state => state.agentData.actions || EMPTY_ARRAY)

// Priority selector
export const usePriority = () => 
  useAgentStore(state => state.agentData.priority)

// Summary selector
export const useSummary = () => 
  useAgentStore(state => state.agentData.summary)

// Metrics selector
export const useMetrics = () => 
  useAgentStore(state => state.agentData.metrics)

// Agent data selector (when you really need the whole object)
export const useAgentData = () => 
  useAgentStore(state => state.agentData)

// ===============================
// Computed Selectors
// ===============================

// Customer name selector - just the name string
export const useCustomerName = () => 
  useAgentStore(state => state.agentData.customer?.name || DEFAULT_CUSTOMER_NAME)

// Agent name selector - just the name string
export const useAgentName = () => 
  useAgentStore(state => state.agentData.agentName || DEFAULT_AGENT_NAME)

// Check if there's an active call
export const useHasActiveCall = () => 
  useAgentStore(state => 
    state.connectionStatus === 'connected' && 
    state.agentData.callerId !== undefined
  )

// Get transcript length (useful for scroll behavior)
export const useTranscriptLength = () => 
  useAgentStore(state => state.agentData.transcript?.length || 0)

// Check if connected
export const useIsConnected = () => 
  useAgentStore(state => state.isConnected)

// ===============================
// Grouped Action Selectors
// ===============================

// All clear actions grouped - using stable references
export const useClearActions = () => {
  const clearSentiment = useAgentStore(state => state.clearSentiment)
  const clearPriority = useAgentStore(state => state.clearPriority)
  const clearSummary = useAgentStore(state => state.clearSummary)
  const clearIntent = useAgentStore(state => state.clearIntent)
  const clearActionsFunc = useAgentStore(state => state.clearActions)
  const clearTranscript = useAgentStore(state => state.clearTranscript)
  const clearCustomer = useAgentStore(state => state.clearCustomer)
  const clearMetrics = useAgentStore(state => state.clearMetrics)
  const clearKnowledgeArticles = useAgentStore(state => state.clearKnowledgeArticles)
  const clearAgentData = useAgentStore(state => state.clearAgentData)
  
  return {
    clearSentiment,
    clearPriority,
    clearSummary,
    clearIntent,
    clearActions: clearActionsFunc,
    clearTranscript,
    clearCustomer,
    clearMetrics,
    clearKnowledgeArticles,
    clearAgentData
  }
}

// All update actions grouped - using stable references
export const useUpdateActions = () => {
  const updateAgentData = useAgentStore(state => state.updateAgentData)
  const updateSentiment = useAgentStore(state => state.updateSentiment)
  const updatePriority = useAgentStore(state => state.updatePriority)
  const updateSummary = useAgentStore(state => state.updateSummary)
  const updateIntent = useAgentStore(state => state.updateIntent)
  const updateActionsFunc = useAgentStore(state => state.updateActions)
  const setActionsDirectly = useAgentStore(state => state.setActionsDirectly)
  const updateKnowledgeArticles = useAgentStore(state => state.updateKnowledgeArticles)
  const updateCustomer = useAgentStore(state => state.updateCustomer)
  const updateMetrics = useAgentStore(state => state.updateMetrics)
  const addTranscriptEntry = useAgentStore(state => state.addTranscriptEntry)
  
  return {
    updateAgentData,
    updateSentiment,
    updatePriority,
    updateSummary,
    updateIntent,
    updateActions: updateActionsFunc,
    setActionsDirectly,
    updateKnowledgeArticles,
    updateCustomer,
    updateMetrics,
    addTranscriptEntry
  }
}

// Connection management actions - using stable references
export const useConnectionActions = () => {
  const setConnectionStatus = useAgentStore(state => state.setConnectionStatus)
  const reset = useAgentStore(state => state.reset)
  return { setConnectionStatus, reset }
}

// ===============================
// Combined Selectors for Common Use Cases
// ===============================

// For call control components that need priority and update function
export const useCallControl = () => {
  const priority = useAgentStore(state => state.agentData.priority)
  const updatePriority = useAgentStore(state => state.updatePriority)
  const agentData = useAgentStore(state => state.agentData)
  return { priority, updatePriority, agentData }
}

// For transcript components that need transcript and customer name
export const useTranscriptData = () => {
  const transcript = useAgentStore(state => state.agentData.transcript || EMPTY_ARRAY)
  const customerName = useAgentStore(state => state.agentData.customer?.name || DEFAULT_CUSTOMER_NAME)
  return { transcript, customerName }
}

// For customer column that needs customer and connection status
export const useCustomerColumnData = () => {
  const customer = useAgentStore(state => state.agentData.customer)
  const connectionStatus = useAgentStore(state => state.connectionStatus)
  return { customer, connectionStatus }
}

// For KMS column that needs knowledge articles
export const useKMSData = () => {
  const knowledgeArticles = useAgentStore(state => state.agentData.knowledgeArticles || EMPTY_ARRAY)
  return { knowledgeArticles }
}

// ===============================
// Performance Monitoring Selectors
// ===============================

// Last update time (useful for debugging)
export const useLastUpdate = () =>
  useAgentStore(state => state.lastUpdate)

// ===============================
// Subscription Pattern for Heavy Components
// ===============================

// Subscribe to specific parts of the store imperatively
// Usage: const unsubscribe = subscribeToTranscript(callback)
export const subscribeToTranscript = (callback: (transcript: any[]) => void) =>
  useAgentStore.subscribe(
    (state) => callback(state.agentData.transcript || EMPTY_ARRAY)
  )

export const subscribeToCustomer = (callback: (customer: any) => void) =>
  useAgentStore.subscribe(
    (state) => callback(state.agentData.customer)
  )

export const subscribeToConnectionStatus = (callback: (status: string) => void) =>
  useAgentStore.subscribe(
    (state) => callback(state.connectionStatus)
  )
