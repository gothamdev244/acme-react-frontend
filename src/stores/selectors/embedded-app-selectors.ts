// Granular selectors for embedded app column to prevent unnecessary re-renders
import { useAgentStore } from '../agent-store'
import { useIntentStore } from '../intent-store'

// Constants for stable default values
const EMPTY_CUSTOMER = null
const EMPTY_INTENT = null

// Agent data selectors
export const useCustomerData = () => 
  useAgentStore(state => state.agentData.customer || EMPTY_CUSTOMER)

export const useCallerId = () => 
  useAgentStore(state => state.agentData.callerId || '')

export const useAgentId = () => 
  useAgentStore(state => state.agentData.agentId || '')

export const useWebSocketIntent = () => 
  useAgentStore(state => state.agentData.intent || EMPTY_INTENT)

// Combined selector for customer context - memoized to prevent object recreation
export const useCustomerContext = () => {
  const customer = useCustomerData()
  const callerId = useCallerId()
  
  if (!customer) return null
  
  return {
    customerId: customer.id || '',
    accountNumber: customer.accountNumber,
    customerName: customer.name,
    customerTier: customer.tier,
    callerId: callerId,
    email: customer.email,
    phone: customer.phone,
    location: customer.location,
    cin: customer.cin,
    accountType: customer.accountType
  }
}

// Intent store selectors
export const useEmbeddedAppIntent = () => 
  useIntentStore(state => state.embeddedAppIntent)

export const useAvailableIntents = () => 
  useIntentStore(state => state.availableIntents)
