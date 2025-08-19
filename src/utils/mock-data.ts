/**
 * Mock data service - provides fallback data when WebSocket is not connected
 * Removed configuration file dependencies - uses WebSocket data primarily
 */

/**
 * Initialize mock data - simplified fallback when WebSocket data is unavailable
 */
export const initializeMockData = async () => {
  // Using fallback mock data (WebSocket not connected)
  
  // Simplified fallback data - no config file dependencies
  return {
    customer: {
      name: 'Demo Customer',
      id: 'demo-001',
      cin: 'CIN-DEMO-001',
      tier: 'Premier Banking',
      accountNumber: 'HSBC000DEMO',
      email: 'demo.customer@email.com',
      phone: '+44-20-7946-0000',
      location: 'London, UK',
      joinDate: '2020-01-01',
      totalInteractions: 5,
      lastCCAASDate: new Date().toISOString().split('T')[0],
      segment: 'Premier',
      gender: 'Unknown',
      careNeed: false,
      verificationStatus: 'verified',
      interactionHistory: [
        {
          interaction_type: 'call',
          channel: 'phone',
          subject: 'Account Balance Inquiry', 
          date: '2025-01-10',
          status: 'resolved',
          description: 'Customer called to check account balance and recent transactions.'
        },
        {
          interaction_type: 'chat',
          channel: 'web_portal',
          interaction_medium: 'web_portal',
          subject: 'Mobile Banking Setup',
          date: '2025-01-08', 
          status: 'resolved',
          description: 'Assisted customer with mobile banking app setup and biometric authentication.'
        }
      ]
    },
    transcript: [
      {
        id: 'demo-1',
        timestamp: new Date(Date.now() - 120000), // 2 minutes ago
        speaker: 'customer' as const,
        text: 'Hello, I need help with my account balance.'
      },
      {
        id: 'demo-2', 
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
        speaker: 'agent' as const,
        text: 'Of course! I can help you check your account balance. Let me pull up your account details.'
      }
    ],
    actions: [
      {
        id: 'demo-action-1',
        action: 'Verify customer identity',
        priority: 'high' as const,
        completed: true,
        details: 'Customer identity verified successfully'
      },
      {
        id: 'demo-action-2', 
        action: 'Check account balance',
        priority: 'medium' as const,
        completed: false,
        details: 'Retrieve current account balance and recent transactions'
      }
    ],
    knowledgeArticles: [
      {
        id: 'demo-kb-1',
        title: 'Account Balance Inquiry Process',
        category: 'Account Management',
        relevance: 95,
        excerpt: 'Step-by-step guide for checking customer account balances',
        url: '/knowledge/account-balance',
        content: 'To check account balance: 1. Verify customer identity, 2. Access account system, 3. Provide balance information',
        lastUpdated: new Date().toISOString(),
        tags: ['account', 'balance', 'inquiry']
      }
    ],
    interactions: [],
    callerId: 'demo-caller-123',
    status: 'active' as const,
    agentId: 'agent-demo',
    agentName: 'Demo Agent',
    department: 'Customer Service',
    sentiment: {
      score: 75,
      label: 'positive' as const,
      trend: 'stable' as const,
      change: 0.05
    },
    summary: {
      text: 'Customer inquiring about account balance and recent transaction history.',
      category: 'Account Management',
      lastUpdated: new Date(),
      confidence: 0.85
    },
    intent: {
      type: 'account_balance',
      confidence: 90,
      detectionMs: 800,
      accuracy: 0.90
    },
    priority: {
      level: 'MEDIUM' as const,
      waitTime: 120,
      estimatedResolution: 300,
      escalation: false
    }
  }
}
