import { Customer, ChatMessage, AIResponseContext, CustomerPersonality, IssueCategory } from '../types/chat-types'

// ✅ EXTERNALIZED: All hardcoded chat responses moved to /public/config/chat-ai-responses.json
let chatResponsesConfig: any = null

// Initialize config loading when module is imported
loadChatResponsesConfig().catch(() => {})

async function loadChatResponsesConfig() {
  if (!chatResponsesConfig) {
    try {
      const response = await fetch('/config/chat-ai-responses.json')
      if (!response.ok) {
        throw new Error(`Failed to load chat responses config: ${response.status}`)
      }
      chatResponsesConfig = await response.json()
    } catch (error) {
      // Minimal fallback data
      chatResponsesConfig = {
        personalityResponses: {
          polite: {
            greeting: ["Hello, thank you for helping me today."],
            clarification: ["Of course, let me provide more details."],
            solution_positive: ["That's perfect, thank you!"],
            solution_negative: ["I understand, thank you for trying."]
          },
          frustrated: {
            greeting: ["I need help with this issue."],
            clarification: ["Let me explain again."],
            solution_positive: ["Finally, thank you."],
            solution_negative: ["This is frustrating."]
          },
          confused: {
            greeting: ["I'm not sure what's happening."],
            clarification: ["Could you explain that?"],
            solution_positive: ["Oh, I see now!"],
            solution_negative: ["I'm still confused."]
          },
          impatient: {
            greeting: ["I need this fixed quickly."],
            clarification: ["Can we speed this up?"],
            solution_positive: ["Good, thanks for being fast."],
            solution_negative: ["This is taking too long."]
          },
          friendly: {
            greeting: ["Hi there! Hope you're having a great day."],
            clarification: ["Sure thing! Let me explain."],
            solution_positive: ["That's fantastic! Thank you!"],
            solution_negative: ["Oh well, that's okay!"]
          }
        },
        issueResponses: {
          account: {
            details: ["I noticed this issue with my account balance."],
            resolution_request: ["Can you please fix this?"]
          },
          payments: {
            details: ["My payment didn't go through properly."],
            resolution_request: ["Can you process this payment?"]
          },
          loans: {
            details: ["I have a question about my loan."],
            resolution_request: ["Can you help with my loan terms?"]
          },
          technical: {
            details: ["I'm having trouble with the app."],
            resolution_request: ["Can you fix this technical issue?"]
          },
          cards: {
            details: ["My card isn't working properly."],
            resolution_request: ["Can you help with my card?"]
          },
          general: {
            details: ["I have a general question."],
            resolution_request: ["What are my options?"]
          }
        },
        closingResponses: [
          "Thank you for your help.",
          "That's all I needed.",
          "I appreciate your assistance."
        ],
        thankYouMessages: {
          polite: ["Thank you so much!"],
          frustrated: ["Thanks for finally getting that sorted."],
          confused: ["Thanks for explaining that clearly."],
          impatient: ["Thanks for handling this quickly."],
          friendly: ["You've been absolutely wonderful!"]
        },
        responseDelays: {
          frustrated: { base: 1500, variation: 500 },
          impatient: { base: 1500, variation: 300 },
          polite: { base: 1500, variation: 1500 },
          confused: { base: 1500, variation: 2000 },
          friendly: { base: 1500, variation: 1000 }
        },
        variables: {
          "[time]": "dynamic_time",
          "[date]": "dynamic_date", 
          "[amount]": "dynamic_amount",
          "[number]": "dynamic_number",
          "[location]": ["the grocery store", "a gas station", "Target"],
          "[merchant]": ["Amazon", "Walmart", "Target"],
          "[years]": "dynamic_years",
          "[error]": "Error Code 500: Internal Server Error"
        }
      }
    }
  }
  return chatResponsesConfig
}

function getRandomResponse(responses: string[]): string {
  return responses[Math.floor(Math.random() * responses.length)]
}

function replaceVariables(response: string, customer: Customer): string {
  const variables = {
    '[time]': new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    '[date]': new Date().toLocaleDateString('en-US'),
    '[amount]': `$${(Math.random() * 500 + 50).toFixed(2)}`,
    '[number]': Math.floor(1000 + Math.random() * 9000).toString(),
    '[location]': ['the grocery store', 'a gas station', 'Target', 'Amazon', 'the mall'][Math.floor(Math.random() * 5)],
    '[merchant]': ['Amazon', 'Walmart', 'Target', 'Starbucks', 'Shell Gas'][Math.floor(Math.random() * 5)],
    '[years]': Math.floor(2 + Math.random() * 8).toString(),
    '[error]': 'Error Code 500: Internal Server Error'
  }
  
  let result = response
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
  })
  
  return result
}

function determineConversationStage(messages: ChatMessage[]): 'greeting' | 'problem_identification' | 'troubleshooting' | 'resolution' | 'closing' {
  const messageCount = messages.length
  
  if (messageCount <= 2) return 'greeting'
  if (messageCount <= 4) return 'problem_identification'
  if (messageCount <= 8) return 'troubleshooting'
  if (messageCount <= 10) return 'resolution'
  return 'closing'
}

function analyzeAgentMessage(message: string): {
  isGreeting: boolean
  isAsking: boolean
  isOffering: boolean
  isClosing: boolean
} {
  const lowerMessage = message.toLowerCase()
  
  return {
    isGreeting: /^(hi|hello|good|thank you|welcome)/.test(lowerMessage),
    isAsking: lowerMessage.includes('?') || /^(can you|could you|what|how|when|where|why)/.test(lowerMessage),
    isOffering: /^(i can|let me|i'll|i will)/.test(lowerMessage) || lowerMessage.includes('help you'),
    isClosing: lowerMessage.includes('resolved') || lowerMessage.includes('anything else') || lowerMessage.includes('goodbye')
  }
}

export function generateCustomerResponse(context: AIResponseContext): string {
  const { customer, conversation, lastAgentMessage } = context
  const stage = determineConversationStage(conversation)
  const agentAnalysis = analyzeAgentMessage(lastAgentMessage)
  
  // Try to load config if not available (synchronous fallback for first call)
  if (!chatResponsesConfig) {
    // Initialize config asynchronously in background, but use fallback for this call
    loadChatResponsesConfig().catch(() => {})
  }
  
  // Get personality-based responses from config (with fallbacks)
  const config = chatResponsesConfig || {}
  const personalityResponses = config.personalityResponses?.[customer.personality]
  
  if (!personalityResponses) {
    // Simple fallback responses if config not loaded
    const fallbackResponses = {
      greeting: "Hello, I need help with my account.",
      clarification: "Let me provide more details about that.",
      solution_positive: "Thank you, that helps!",
      solution_negative: "I'm not sure that works for me."
    }
    return fallbackResponses.greeting
  }
  
  // Determine response type based on conversation stage and agent message
  let responseCategory: keyof typeof personalityResponses
  
  if (stage === 'greeting' || agentAnalysis.isGreeting) {
    responseCategory = 'greeting'
  } else if (agentAnalysis.isAsking || stage === 'problem_identification') {
    // Provide issue details
    if (Math.random() < 0.7) {
      const issueDetails = config.issueResponses[customer.issueCategory]?.details
      if (issueDetails) {
        return replaceVariables(getRandomResponse(issueDetails), customer)
      }
    }
    responseCategory = 'clarification'
  } else if (stage === 'resolution' || agentAnalysis.isOffering) {
    // Randomly decide if customer accepts the solution
    const isPositive = Math.random() < 0.75 // 75% chance of positive response
    responseCategory = isPositive ? 'solution_positive' : 'solution_negative'
  } else if (stage === 'closing' || agentAnalysis.isClosing) {
    // Closing responses from config
    return getRandomResponse(config.closingResponses)
  } else {
    // Default to clarification responses
    responseCategory = 'clarification'
  }
  
  let baseResponse = getRandomResponse(personalityResponses[responseCategory])
  
  // Add issue-specific context occasionally
  if (Math.random() < 0.3 && config.issueResponses[customer.issueCategory]) {
    const issueContext = getRandomResponse(config.issueResponses[customer.issueCategory].details)
    baseResponse += ` ${replaceVariables(issueContext, customer)}`
  }
  
  return replaceVariables(baseResponse, customer)
}

export function getResponseDelay(personality: CustomerPersonality): number {
  // Use fallback delays if config not loaded yet
  const fallbackDelays = {
    frustrated: { base: 1500, variation: 500 },
    impatient: { base: 1500, variation: 300 },
    polite: { base: 1500, variation: 1500 },
    confused: { base: 1500, variation: 2000 },
    friendly: { base: 1500, variation: 1000 }
  }
  
  const delayConfig = chatResponsesConfig?.responseDelays?.[personality] || fallbackDelays[personality]
  
  if (!delayConfig) {
    return 1500 + Math.random() * 1000 // Default delay
  }
  
  return delayConfig.base + Math.random() * delayConfig.variation
}

export function shouldCustomerEndConversation(
  conversation: ChatMessage[],
  customer: Customer
): boolean {
  const messageCount = conversation.length
  
  // Never end too early
  if (messageCount < 6) return false
  
  // Higher chance to end for impatient customers
  if (customer.personality === 'impatient' && messageCount > 8) {
    return Math.random() < 0.4
  }
  
  // Standard ending chance based on conversation length
  if (messageCount > 10) {
    return Math.random() < 0.3
  }
  
  if (messageCount > 15) {
    return Math.random() < 0.6
  }
  
  return false
}

export function generateThankYouMessage(customer: Customer): string {
  // Try to load config if not available (synchronous fallback for first call)
  if (!chatResponsesConfig) {
    loadChatResponsesConfig().catch(() => {})
  }
  
  const config = chatResponsesConfig || {}
  const thankYouMessages = config.thankYouMessages?.[customer.personality]
  
  if (!thankYouMessages) {
    return "Thank you for your help."
  }
  
  return getRandomResponse(thankYouMessages)
}
