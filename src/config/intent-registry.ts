// Intent registry defines all possible intents and their mappings
export const intentRegistry = {
  // Original intents
  'credit_card_transactions': {
    id: 'credit_card_transactions',
    name: 'Credit card transactions',
    icon: 'credit-card',
    embedRoute: '/credit-card',
    description: 'View and manage credit card transactions',
    keywords: ['credit', 'card', 'transaction', 'payment', 'charge', 'recurring', 'subscription']
  },
  'customer_details': {
    id: 'customer_details', 
    name: 'Customer details',
    icon: 'user',
    embedRoute: '/customer-info',
    description: 'View and update customer information',
    keywords: ['customer', 'profile', 'details', 'information', 'ccaas', 'address']
  },
  'account_inquiry': {
    id: 'account_inquiry',
    name: 'Account inquiry',
    icon: 'building',
    embedRoute: '/account',
    description: 'View account balances and details',
    keywords: ['account', 'balance', 'statement', 'savings', 'checking']
  },
  'dispute_resolution': {
    id: 'dispute_resolution',
    name: 'Dispute resolution',
    icon: 'alert-triangle',
    embedRoute: '/disputes',
    description: 'Handle transaction disputes',
    keywords: ['dispute', 'chargeback', 'fraud', 'unauthorized', 'complaint']
  },
  'loan_services': {
    id: 'loan_services',
    name: 'Loan services',
    icon: 'wallet',
    embedRoute: '/loans',
    description: 'Manage loans and mortgages',
    keywords: ['loan', 'mortgage', 'interest', 'payment', 'refinance']
  },
  'travel_notification': {
    id: 'travel_notification',
    name: 'Travel notification',
    icon: 'plane',
    embedRoute: '/travel',
    description: 'Set travel notifications for cards',
    keywords: ['travel', 'overseas', 'abroad', 'international', 'notification']
  },
  
  // Banking scenario intents
  'fraud_alert': {
    id: 'fraud_alert',
    name: 'Fraud alert',
    icon: 'shield-alert',
    embedRoute: '/fraud-alert',
    description: 'Handle security fraud alerts and suspicious transactions',
    keywords: ['fraud', 'suspicious', 'security', 'alert', 'unauthorized', 'scam', 'phishing']
  },
  'mortgage_application': {
    id: 'mortgage_application',
    name: 'Mortgage application',
    icon: 'home',
    embedRoute: '/mortgage',
    description: 'Process mortgage applications and property financing',
    keywords: ['mortgage', 'home', 'property', 'loan', 'financing', 'house', 'first-time', 'buyer']
  },
  'account_upgrade': {
    id: 'account_upgrade',
    name: 'Account upgrade',
    icon: 'trending-up',
    embedRoute: '/account-upgrade',
    description: 'Upgrade customer account tiers and benefits',
    keywords: ['upgrade', 'premier', 'advance', 'jade', 'benefits', 'tier', 'account', 'level']
  },
  'international_transfer': {
    id: 'international_transfer',
    name: 'International transfer',
    icon: 'globe',
    embedRoute: '/international-transfer',
    description: 'Process international wire transfers and currency exchange',
    keywords: ['international', 'wire', 'transfer', 'overseas', 'currency', 'exchange', 'swift', 'foreign']
  },
  'investment_advice': {
    id: 'investment_advice',
    name: 'Investment advice',
    icon: 'trending-up',
    embedRoute: '/investment',
    description: 'Provide investment guidance and portfolio advice',
    keywords: ['investment', 'portfolio', 'stocks', 'bonds', 'funds', 'wealth', 'advisor', 'market']
  },
  'business_loan': {
    id: 'business_loan',
    name: 'Business loan',
    icon: 'briefcase',
    embedRoute: '/business-loan',
    description: 'Process business loan applications and commercial lending',
    keywords: ['business', 'commercial', 'loan', 'enterprise', 'company', 'corporate', 'finance', 'lending']
  },
  'student_overdraft': {
    id: 'student_overdraft',
    name: 'Student overdraft',
    icon: 'graduation-cap',
    embedRoute: '/student-overdraft',
    description: 'Manage student overdraft facilities and education banking',
    keywords: ['student', 'overdraft', 'education', 'university', 'college', 'graduate', 'study']
  },
  'credit_increase': {
    id: 'credit_increase',
    name: 'Credit increase',
    icon: 'credit-card',
    embedRoute: '/credit-increase',
    description: 'Process credit limit increase requests',
    keywords: ['credit', 'limit', 'increase', 'raise', 'higher', 'expand', 'boost']
  },
  'portfolio_review': {
    id: 'portfolio_review',
    name: 'Portfolio review',
    icon: 'pie-chart',
    embedRoute: '/portfolio-review',
    description: 'Review and analyze investment portfolios',
    keywords: ['portfolio', 'review', 'analysis', 'performance', 'allocation', 'rebalance', 'investment']
  },
  'student_loan': {
    id: 'student_loan',
    name: 'Student loan',
    icon: 'graduation-cap',
    embedRoute: '/student-loan',
    description: 'Process student loan applications and education financing',
    keywords: ['student', 'loan', 'education', 'tuition', 'university', 'college', 'study', 'finance']
  },
  'standing_order': {
    id: 'standing_order',
    name: 'Standing order',
    icon: 'repeat',
    embedRoute: '/standing-order',
    description: 'Set up and manage recurring payment orders',
    keywords: ['standing', 'order', 'recurring', 'automatic', 'regular', 'payment', 'schedule']
  },
  'overdraft_request': {
    id: 'overdraft_request',
    name: 'Overdraft request',
    icon: 'minus-circle',
    embedRoute: '/overdraft',
    description: 'Process overdraft facility requests and arrangements',
    keywords: ['overdraft', 'facility', 'arrangement', 'buffer', 'protection', 'negative', 'balance']
  },
  'first_credit_card': {
    id: 'first_credit_card',
    name: 'First credit card',
    icon: 'credit-card',
    embedRoute: '/first-credit-card',
    description: 'Guide first-time credit card applications',
    keywords: ['first', 'credit', 'card', 'new', 'application', 'initial', 'starter', 'beginner']
  }
}

export type IntentId = keyof typeof intentRegistry

// Helper function to get intent details
export function getIntentDetails(intentId: string) {
  return intentRegistry[intentId as IntentId] || null
}

// Helper function to detect intent from text (simplified)
export function detectIntentFromText(text: string): IntentId | null {
  const lowerText = text.toLowerCase()
  
  for (const [id, intent] of Object.entries(intentRegistry)) {
    const hasKeyword = intent.keywords.some(keyword => 
      lowerText.includes(keyword.toLowerCase())
    )
    if (hasKeyword) {
      return id as IntentId
    }
  }
  
  return null
}

// Mock AI intent detection (in real app, this would call AI service)
export function detectIntentsFromConversation(transcript: string[]): Array<{
  id: string
  confidence: number
}> {
  const intentScores = new Map<string, number>()
  
  // Analyze transcript for keywords
  transcript.forEach(message => {
    const intent = detectIntentFromText(message)
    if (intent) {
      const current = intentScores.get(intent) || 0
      intentScores.set(intent, current + 1)
    }
  })
  
  // Convert to array with confidence scores
  const results = Array.from(intentScores.entries()).map(([id, count]) => ({
    id,
    confidence: Math.min(95, 50 + (count * 15)) // Mock confidence calculation
  }))
  
  // Sort by confidence
  return results.sort((a, b) => b.confidence - a.confidence)
}
