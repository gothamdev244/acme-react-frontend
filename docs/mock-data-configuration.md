# HSBC CCAAS Platform - Mock Data Configuration Guide

## Overview

The HSBC CCAAS Platform supports both production and mock data modes, allowing developers to work without backend dependencies and enabling comprehensive testing scenarios. All mock data has been externalized to JSON configuration files for easy modification.

## Configuration Structure

### Directory Layout
```
frontend/
└── public/
    └── config/
        ├── chat-ai-responses.json      # AI personality and responses
        ├── mock-agents.json             # Team agent data
        ├── response-templates.json      # Quick response templates
        └── sample-notifications.json   # Notification examples
```

## Enabling Mock Data Mode

### Environment Configuration
Set the following environment variable to enable mock data:

```bash
# .env.local or .env
VITE_ENABLE_MOCK_DATA=true
VITE_ENABLE_DEBUG_LOGGING=false
```

### Runtime Toggle
Mock data can be toggled at runtime through the settings panel:

```typescript
// Access via settings panel or programmatically
const enableMockData = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true'
```

## Mock Data Files

### 1. Chat AI Responses
Location: `public/config/chat-ai-responses.json`

Structure:
```json
{
  "personalities": {
    "professional": {
      "traits": ["formal", "efficient", "knowledgeable"],
      "responses": {
        "greeting": ["Good day", "Hello"],
        "acknowledgment": ["Understood", "Certainly"],
        "closing": ["Thank you for ccaasing us", "Have a great day"]
      }
    },
    "friendly": {
      "traits": ["warm", "conversational", "helpful"],
      "responses": {
        "greeting": ["Hi there", "Hello"],
        "acknowledgment": ["Got it", "Sure thing"],
        "closing": ["Thanks for reaching out", "Take care"]
      }
    }
  },
  "scenarios": {
    "credit_card_fraud": {
      "customer_messages": [
        "I see a charge I didn't make",
        "There's a fraudulent transaction on my card"
      ],
      "agent_responses": [
        "I'll help you with that suspicious charge immediately",
        "Let me secure your account and investigate this transaction"
      ],
      "resolution_steps": [
        "Block the card",
        "Initiate dispute",
        "Issue replacement card"
      ]
    }
  },
  "customers": [
    {
      "id": "CUST001",
      "name": "Jonathan Mitchell",
      "email": "j.mitchell@example.com",
      "phone": "+44-20-7946-0958",
      "accountType": "Premier Banking",
      "accountNumber": "****4521",
      "location": "London, UK",
      "segment": "High Value",
      "history": {
        "lastCCAAS": "2024-01-10",
        "totalCCAASs": 12,
        "satisfactionScore": 4.8
      }
    }
  ]
}
```

### 2. Mock Agents
Location: `public/config/mock-agents.json`

Structure:
```json
{
  "agents": [
    {
      "id": "AGT001",
      "name": "Sarah Johnson",
      "status": "available",
      "team": "Premier Support",
      "skills": ["premier_banking", "investments", "loans"],
      "metrics": {
        "callsHandled": 45,
        "avgHandleTime": 240,
        "satisfaction": 4.8,
        "availability": 0.92
      },
      "currentActivity": {
        "type": "idle",
        "duration": 0,
        "customer": null
      }
    }
  ],
  "teams": [
    {
      "id": "TEAM001",
      "name": "Premier Support",
      "agentCount": 12,
      "activeAgents": 10,
      "queueSize": 3,
      "avgWaitTime": 45
    }
  ]
}
```

### 3. Response Templates
Location: `public/config/response-templates.json`

Structure:
```json
{
  "categories": [
    {
      "id": "greetings",
      "name": "Greetings",
      "templates": [
        {
          "id": "welcome_premier",
          "title": "Premier Welcome",
          "text": "Good [time_of_day], thank you for ccaasing HSBC Premier Banking. My name is [agent_name]. How may I assist you today?",
          "variables": ["time_of_day", "agent_name"],
          "tags": ["greeting", "premier"],
          "usage_count": 1250
        }
      ]
    },
    {
      "id": "common_issues",
      "name": "Common Issues",
      "templates": [
        {
          "id": "card_block",
          "title": "Card Blocked",
          "text": "I've successfully blocked your card ending in [card_last_four]. A replacement card will be sent to your registered address within [delivery_days] business days.",
          "variables": ["card_last_four", "delivery_days"],
          "tags": ["card", "security"],
          "usage_count": 890
        }
      ]
    }
  ]
}
```

### 4. Sample Notifications
Location: `public/config/sample-notifications.json`

Structure:
```json
{
  "notifications": [
    {
      "id": "NOT001",
      "type": "system",
      "priority": "high",
      "title": "System Maintenance",
      "message": "Scheduled maintenance window: Tonight 2 AM - 4 AM GMT",
      "timestamp": "2024-01-15T14:00:00Z",
      "actions": [
        {
          "label": "View Details",
          "action": "view_maintenance"
        }
      ]
    },
    {
      "id": "NOT002",
      "type": "customer",
      "priority": "medium",
      "title": "VIP Customer in Queue",
      "message": "Jonathan Mitchell (Premier Banking) is waiting - Priority: URGENT",
      "timestamp": "2024-01-15T14:30:00Z",
      "actions": [
        {
          "label": "Accept Call",
          "action": "accept_priority_call"
        }
      ]
    }
  ]
}
```

## Loading Mock Data

### Automatic Loading
Mock data is automatically loaded when enabled:

```typescript
// src/services/config.service.ts
export class ConfigService {
  private static async loadMockData() {
    if (import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      const responses = await Promise.all([
        fetch('/config/chat-ai-responses.json'),
        fetch('/config/mock-agents.json'),
        fetch('/config/response-templates.json'),
        fetch('/config/sample-notifications.json')
      ])
      
      return {
        chatResponses: await responses[0].json(),
        agents: await responses[1].json(),
        templates: await responses[2].json(),
        notifications: await responses[3].json()
      }
    }
    return null
  }
}
```

### Manual Loading
Load specific mock data on demand:

```typescript
// Load specific mock data file
const loadMockAgents = async () => {
  const response = await fetch('/config/mock-agents.json')
  const data = await response.json()
  return data.agents
}

// Use in component
useEffect(() => {
  if (useMockData) {
    loadMockAgents().then(agents => {
      setAgents(agents)
    })
  }
}, [useMockData])
```

## Mock Data Scenarios

### 1. Simulating Incoming Calls
```typescript
const simulateIncomingCall = () => {
  const mockCallers = mockData.chatResponses.customers
  const randomCaller = mockCallers[Math.floor(Math.random() * mockCallers.length)]
  
  startCall(randomCaller.phone, {
    id: randomCaller.id,
    name: randomCaller.name,
    phone: randomCaller.phone,
    priority: randomCaller.segment === 'High Value' ? 'high' : 'medium',
    issueCategory: 'general',
    issueDescription: 'Customer inquiry'
  })
}
```

### 2. Generating AI Responses
```typescript
const generateAIResponse = (customerMessage: string) => {
  const scenario = detectScenario(customerMessage)
  const responses = mockData.chatResponses.scenarios[scenario].agent_responses
  return responses[Math.floor(Math.random() * responses.length)]
}
```

### 3. Populating Team Status
```typescript
const populateTeamStatus = () => {
  const teams = mockData.agents.teams
  return teams.map(team => ({
    ...team,
    agents: mockData.agents.agents.filter(a => a.team === team.name)
  }))
}
```

## Customizing Mock Data

### Adding New Customers
Edit `public/config/chat-ai-responses.json`:

```json
{
  "customers": [
    {
      "id": "CUST999",
      "name": "New Customer",
      "email": "new.customer@example.com",
      "phone": "+44-20-7999-9999",
      "accountType": "Personal Banking",
      "accountNumber": "****9999",
      "location": "Manchester, UK",
      "segment": "Standard",
      "history": {
        "lastCCAAS": "2024-01-15",
        "totalCCAASs": 1,
        "satisfactionScore": 0
      }
    }
  ]
}
```

### Creating Custom Scenarios
Add new scenarios to handle specific cases:

```json
{
  "scenarios": {
    "custom_scenario": {
      "trigger_keywords": ["specific", "issue"],
      "customer_messages": [
        "I have a specific issue with..."
      ],
      "agent_responses": [
        "I'll help you with that specific issue..."
      ],
      "resolution_steps": [
        "Step 1",
        "Step 2"
      ],
      "estimated_duration": 300
    }
  }
}
```

### Modifying Response Templates
Customize templates for your organization:

```json
{
  "templates": [
    {
      "id": "custom_greeting",
      "title": "Custom Greeting",
      "text": "Welcome to [company_name]. This is [agent_name], how can I help?",
      "variables": ["company_name", "agent_name"],
      "tags": ["greeting", "custom"]
    }
  ]
}
```

## Mock WebSocket Messages

### Simulating Real-time Updates
```typescript
class MockWebSocketService {
  private interval: NodeJS.Timeout
  
  startSimulation() {
    this.interval = setInterval(() => {
      this.sendMockMessage()
    }, 5000)
  }
  
  sendMockMessage() {
    const messageTypes = [
      'sentiment_update',
      'transcript_entry',
      'customer_data',
      'metrics_update'
    ]
    
    const type = messageTypes[Math.floor(Math.random() * messageTypes.length)]
    const message = this.generateMockMessage(type)
    
    this.broadcast(message)
  }
  
  generateMockMessage(type: string) {
    switch(type) {
      case 'sentiment_update':
        return {
          type,
          data: {
            score: Math.random() * 2 - 1,
            trend: Math.random() > 0.5 ? 'improving' : 'declining',
            confidence: Math.random() * 0.3 + 0.7
          }
        }
      case 'transcript_entry':
        return {
          type,
          data: {
            speaker: Math.random() > 0.5 ? 'agent' : 'customer',
            text: this.getRandomTranscriptText(),
            timestamp: new Date().toISOString()
          }
        }
      default:
        return { type, data: {} }
    }
  }
}
```

## Testing with Mock Data

### Unit Tests
```typescript
describe('Mock Data Integration', () => {
  beforeEach(() => {
    // Enable mock mode
    process.env.VITE_ENABLE_MOCK_DATA = 'true'
  })
  
  it('loads mock customers correctly', async () => {
    const customers = await loadMockCustomers()
    expect(customers).toHaveLength(16)
    expect(customers[0].name).toBe('Jonathan Mitchell')
  })
  
  it('generates appropriate AI responses', () => {
    const response = generateAIResponse('credit card fraud')
    expect(response).toContain('secure your account')
  })
})
```

### E2E Tests
```typescript
describe('Mock Call Flow', () => {
  it('simulates complete call lifecycle', async () => {
    // Enable mock data
    await page.evaluate(() => {
      localStorage.setItem('use-mock-data', 'true')
    })
    
    // Trigger mock call
    await page.click('[data-testid="simulate-call"]')
    
    // Verify call appears
    await expect(page.locator('.incoming-call')).toBeVisible()
    
    // Accept call
    await page.click('[data-testid="accept-call"]')
    
    // Verify mock data populates
    await expect(page.locator('.customer-name')).toContainText('Jonathan Mitchell')
  })
})
```

## Performance Considerations

### Caching Mock Data
```typescript
class MockDataCache {
  private cache = new Map<string, any>()
  private timestamps = new Map<string, number>()
  private ttl = 5 * 60 * 1000 // 5 minutes
  
  async get(key: string, loader: () => Promise<any>) {
    const cached = this.cache.get(key)
    const timestamp = this.timestamps.get(key)
    
    if (cached && timestamp && Date.now() - timestamp < this.ttl) {
      return cached
    }
    
    const data = await loader()
    this.cache.set(key, data)
    this.timestamps.set(key, Date.now())
    return data
  }
  
  clear() {
    this.cache.clear()
    this.timestamps.clear()
  }
}
```

### Lazy Loading Mock Data
```typescript
const useMockData = (type: string) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_MOCK_DATA === 'true') {
      setLoading(true)
      import(`/config/${type}.json`)
        .then(module => setData(module.default))
        .finally(() => setLoading(false))
    }
  }, [type])
  
  return { data, loading }
}
```

## Transitioning to Production

### Feature Flags
```typescript
const features = {
  useMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
  mockDataFallback: import.meta.env.VITE_MOCK_FALLBACK === 'true'
}

// Use mock data as fallback when API fails
const fetchCustomerData = async (id: string) => {
  try {
    const response = await api.getCustomer(id)
    return response.data
  } catch (error) {
    if (features.mockDataFallback) {
      const mockData = await loadMockCustomers()
      return mockData.find(c => c.id === id)
    }
    throw error
  }
}
```

### Gradual Migration
```typescript
const DataService = {
  async getData(type: string) {
    if (features.useMockData) {
      return this.getMockData(type)
    }
    
    try {
      return await this.getApiData(type)
    } catch (error) {
      if (features.mockDataFallback) {
        console.warn('API failed, using mock data', error)
        return this.getMockData(type)
      }
      throw error
    }
  }
}
```
