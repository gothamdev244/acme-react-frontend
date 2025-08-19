export type CustomerStatus = 'waiting' | 'in_progress' | 'completed'
export type CustomerPriority = 'high' | 'medium' | 'low'
export type CustomerPersonality = 'frustrated' | 'polite' | 'confused' | 'impatient' | 'friendly'
export type IssueCategory = 'account' | 'payments' | 'loans' | 'technical' | 'cards' | 'general'

export interface Customer {
  id: string
  name: string
  avatar?: string
  email: string
  phone?: string
  accountNumber?: string
  status: CustomerStatus
  priority: CustomerPriority
  personality: CustomerPersonality
  issueCategory: IssueCategory
  issueTitle: string
  issueDescription: string
  waitTime: number // in minutes
  joinedAt: Date
  assignedAgentId?: string
  estimatedResolutionTime?: number // in minutes
}

export interface ChatMessage {
  id: string
  text: string
  sender: 'customer' | 'agent'
  timestamp: Date
  customerId: string
  agentId?: string
  isTyping?: boolean
}

export interface ChatConversation {
  id: string
  customerId: string
  agentId: string
  messages: ChatMessage[]
  startTime: Date
  endTime?: Date
  status: 'active' | 'completed' | 'abandoned'
  satisfactionRating?: number
  resolutionNotes?: string
}

export interface QueueMetrics {
  totalWaiting: number
  averageWaitTime: number
  highPriorityCount: number
  mediumPriorityCount: number
  lowPriorityCount: number
  longestWaitTime: number
}

export interface AIResponseContext {
  customer: Customer
  conversation: ChatMessage[]
  lastAgentMessage: string
  conversationStage: 'greeting' | 'problem_identification' | 'troubleshooting' | 'resolution' | 'closing'
}

export interface CustomerQueueSettings {
  maxQueueSize: number
  newCustomerInterval: number // seconds between new customers joining
  responseDelayMin: number // minimum seconds for customer response
  responseDelayMax: number // maximum seconds for customer response
  autoCompleteChance: number // probability (0-1) that customer will be satisfied and end chat
}
