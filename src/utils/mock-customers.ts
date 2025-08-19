import { Customer, CustomerPriority, CustomerPersonality, IssueCategory } from '../types/chat-types'

const CUSTOMER_NAMES = [
  'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Williams', 'Jessica Lee',
  'Robert Thompson', 'Amanda Davis', 'Christopher Brown', 'Jennifer Wilson', 'Matthew Garcia',
  'Lisa Anderson', 'Kevin Martinez', 'Rachel Taylor', 'James Moore', 'Ashley Jackson',
  'Daniel White', 'Nicole Harris', 'Ryan Clark', 'Stephanie Lewis', 'Andrew Walker'
]

const CUSTOMER_EMAILS = [
  'sarah.j@email.com', 'michael.c@gmail.com', 'emily.r@yahoo.com', 'david.w@outlook.com',
  'jessica.l@email.com', 'robert.t@gmail.com', 'amanda.d@yahoo.com', 'chris.b@outlook.com',
  'jennifer.w@email.com', 'matthew.g@gmail.com', 'lisa.a@yahoo.com', 'kevin.m@outlook.com',
  'rachel.t@email.com', 'james.m@gmail.com', 'ashley.j@yahoo.com', 'daniel.w@outlook.com',
  'nicole.h@email.com', 'ryan.c@gmail.com', 'stephanie.l@yahoo.com', 'andrew.w@outlook.com'
]

const BANKING_ISSUES = {
  account: {
    titles: [
      'Account Balance Discrepancy',
      'Unauthorized Transaction',
      'Account Locked',
      'Statement Not Received',
      'Account Closure Request',
      'Direct Deposit Issue'
    ],
    descriptions: [
      'I see transactions on my account that I didn\'t make. Need help understanding these charges.',
      'My account balance doesn\'t match what I expected. There\'s a difference of $150.',
      'I can\'t access my account online. It says it\'s been locked due to security reasons.',
      'I haven\'t received my monthly statement for two months now. Can you help me get it?',
      'I want to close my savings account and transfer the funds to my checking account.',
      'My salary should have been deposited yesterday but I don\'t see it in my account.'
    ]
  },
  payments: {
    titles: [
      'Payment Not Processed',
      'Automatic Payment Setup',
      'Failed Wire Transfer',
      'Bill Pay Issue',
      'Refund Request',
      'Payment Declined'
    ],
    descriptions: [
      'I made a payment three days ago but it\'s still showing as pending. When will it clear?',
      'I want to set up automatic payments for my mortgage. Can you help me with that?',
      'My wire transfer to my business partner failed. I need to understand why and resend it.',
      'The bill pay feature isn\'t working. It keeps giving me an error message.',
      'I was charged twice for the same service. I need a refund for the duplicate charge.',
      'My card was declined at the store but I have sufficient funds. What\'s wrong?'
    ]
  },
  loans: {
    titles: [
      'Mortgage Payment Question',
      'Loan Application Status',
      'Interest Rate Inquiry',
      'Early Payment Options',
      'Loan Document Request',
      'Payment Extension Request'
    ],
    descriptions: [
      'I want to know if I can change my mortgage payment date to better align with my salary.',
      'I applied for a personal loan two weeks ago. Can you check the status of my application?',
      'I heard interest rates have dropped. Can I refinance my existing loan at a lower rate?',
      'I want to make an extra payment toward my car loan principal. How do I do that?',
      'I need copies of my loan documents for tax purposes. Can you email them to me?',
      'I\'m facing temporary financial difficulty. Can I get an extension on my loan payment?'
    ]
  },
  technical: {
    titles: [
      'Mobile App Login Issues',
      'Online Banking Error',
      'Card Not Working',
      'PIN Reset Request',
      'App Feature Not Working',
      'Security Alert Question'
    ],
    descriptions: [
      'I can\'t log into the mobile app. It keeps saying my credentials are incorrect.',
      'When I try to transfer money online, I get an error message. Can you help?',
      'My debit card isn\'t working at ATMs. It keeps getting rejected.',
      'I forgot my PIN and need to reset it. What\'s the process for that?',
      'The mobile deposit feature in the app isn\'t working. Photos won\'t upload.',
      'I received a security alert about my account. Is this legitimate or a scam?'
    ]
  },
  cards: {
    titles: [
      'Credit Card Application',
      'Card Replacement Request',
      'Dispute Transaction',
      'Credit Limit Increase',
      'Rewards Points Question',
      'Card Activation Issue'
    ],
    descriptions: [
      'I\'d like to apply for a rewards credit card. What options do you have available?',
      'My credit card is damaged and won\'t swipe. I need a replacement card urgently.',
      'There\'s a charge on my card for $89.99 that I didn\'t authorize. I want to dispute it.',
      'I\'d like to request a credit limit increase on my current card. What\'s required?',
      'I have accumulated rewards points but don\'t know how to redeem them. Can you help?',
      'I received my new card but the activation process isn\'t working online.'
    ]
  },
  general: {
    titles: [
      'Branch Hours Question',
      'Service Fee Inquiry',
      'Account Upgrade Options',
      'International Transfer',
      'Tax Document Request',
      'Account Security Review'
    ],
    descriptions: [
      'What are the hours for the downtown branch? I need to visit in person.',
      'I was charged a service fee on my account. Can you explain what this is for?',
      'I want to upgrade from basic checking to premium. What are the benefits?',
      'I need to send money to my family overseas. What are my options and fees?',
      'I need my tax documents from last year for filing. How can I get copies?',
      'I want to review the security settings on my account to make sure it\'s protected.'
    ]
  }
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}


function generateAccountNumber(): string {
  return Math.floor(100000000 + Math.random() * 900000000).toString()
}

function generatePhoneNumber(): string {
  const area = Math.floor(200 + Math.random() * 800)
  const exchange = Math.floor(200 + Math.random() * 800)
  const number = Math.floor(1000 + Math.random() * 9000)
  return `(${area}) ${exchange}-${number}`
}

function getRandomWaitTime(): number {
  const weights = [
    { min: 1, max: 5, weight: 40 },    // 1-5 minutes (40% chance)
    { min: 6, max: 15, weight: 35 },   // 6-15 minutes (35% chance)
    { min: 16, max: 30, weight: 20 },  // 16-30 minutes (20% chance)
    { min: 31, max: 60, weight: 5 }    // 31-60 minutes (5% chance)
  ]
  
  const random = Math.random() * 100
  let cumulative = 0
  
  for (const range of weights) {
    cumulative += range.weight
    if (random <= cumulative) {
      return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min
    }
  }
  
  return 5 // fallback
}

function getPriorityFromWaitTime(waitTime: number, issueCategory: IssueCategory): CustomerPriority {
  if (issueCategory === 'account' && waitTime > 20) return 'high'
  if (issueCategory === 'technical' && waitTime > 30) return 'high'
  if (waitTime > 45) return 'high'
  if (waitTime > 20) return 'medium'
  return 'low'
}

function getPersonalityFromPriorityAndWaitTime(priority: CustomerPriority, waitTime: number): CustomerPersonality {
  const personalities: CustomerPersonality[] = ['frustrated', 'polite', 'confused', 'impatient', 'friendly']
  
  if (priority === 'high' || waitTime > 30) {
    return Math.random() < 0.6 ? 'frustrated' : (Math.random() < 0.7 ? 'impatient' : 'polite')
  }
  
  if (priority === 'medium') {
    return Math.random() < 0.3 ? 'confused' : (Math.random() < 0.5 ? 'polite' : 'friendly')
  }
  
  return getRandomElement(['polite', 'friendly', 'confused'])
}

export function generateMockCustomer(): Customer {
  const id = `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const name = getRandomElement(CUSTOMER_NAMES)
  const email = getRandomElement(CUSTOMER_EMAILS)
  const phone = generatePhoneNumber()
  const accountNumber = generateAccountNumber()
  const issueCategory = getRandomElement(Object.keys(BANKING_ISSUES)) as IssueCategory
  const categoryData = BANKING_ISSUES[issueCategory]
  const issueIndex = Math.floor(Math.random() * categoryData.titles.length)
  const issueTitle = categoryData.titles[issueIndex]
  const issueDescription = categoryData.descriptions[issueIndex]
  const waitTime = getRandomWaitTime()
  const priority = getPriorityFromWaitTime(waitTime, issueCategory)
  const personality = getPersonalityFromPriorityAndWaitTime(priority, waitTime)
  const joinedAt = new Date(Date.now() - waitTime * 60 * 1000)
  
  // Estimated resolution time based on issue complexity
  const estimatedResolutionTime = issueCategory === 'account' ? 
    Math.floor(10 + Math.random() * 15) : // 10-25 minutes for account issues
    issueCategory === 'loans' ?
    Math.floor(15 + Math.random() * 20) : // 15-35 minutes for loan issues
    Math.floor(5 + Math.random() * 10)    // 5-15 minutes for other issues

  return {
    id,
    name,
    email,
    phone,
    accountNumber,
    status: 'waiting',
    priority,
    personality,
    issueCategory,
    issueTitle,
    issueDescription,
    waitTime,
    joinedAt,
    estimatedResolutionTime
  }
}

export function generateInitialCustomerQueue(size: number = 8): Customer[] {
  const customers: Customer[] = []
  
  for (let i = 0; i < size; i++) {
    customers.push(generateMockCustomer())
  }
  
  // Sort by priority (high first), then by wait time (longest first)
  return customers.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    return b.waitTime - a.waitTime
  })
}

export function getCustomerAvatarInitials(name: string): string {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()
}

export function getPriorityColor(priority: CustomerPriority): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
  }
}

export function getPriorityIcon(priority: CustomerPriority): 'alert-triangle' | 'alert-circle' | 'check-circle' {
  switch (priority) {
    case 'high':
      return 'alert-triangle'
    case 'medium':
      return 'alert-circle'
    case 'low':
      return 'check-circle'
  }
}

export function getCategoryIcon(category: IssueCategory): 'building-2' | 'credit-card' | 'home' | 'monitor' | 'help-circle' {
  switch (category) {
    case 'account':
      return 'building-2'
    case 'payments':
      return 'credit-card'
    case 'loans':
      return 'home'
    case 'technical':
      return 'monitor'
    case 'cards':
      return 'credit-card'
    case 'general':
      return 'help-circle'
  }
}
