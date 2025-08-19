# State Management Guide

## Overview

The frontend uses **Zustand 5.0** for state management, chosen for its simplicity, TypeScript support, and built-in persistence middleware.

## Stores

### 1. Agent Store (`agent-store.ts`)

Primary store for agent dashboard data received via WebSocket.

#### State Structure
```typescript
interface AgentState {
  agentData: {
    agentName: string
    agentId: string
    callerId: string
    status: 'available' | 'busy' | 'offline'
    callDuration: number
    queuePosition: number
    department: string
    customer?: Customer
    sentiment?: Sentiment
    priority?: Priority
    summary?: Summary
    intent?: Intent
    actions: Action[]
    knowledgeArticles: KnowledgeArticle[]
    transcript: TranscriptEntry[]
  }
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error'
  isConnected: boolean
}
```

#### Key Actions
- `updateCustomer(customer)` - Update customer information
- `updateSentiment(sentiment)` - Update sentiment analysis
- `updatePriority(priority)` - Update call priority
- `updateSummary(summary)` - Update call summary
- `updateIntent(intent)` - Update intent classification
- `updateActions(actions)` - Update recommended actions
- `addTranscriptEntry(entry)` - Add transcript entry
- `setConnectionStatus(status)` - Update WebSocket connection status

#### Usage Example
```typescript
import { useAgentStore } from '@/stores/agent-store'

function CustomerInfo() {
  // Subscribe to specific slice
  const customer = useAgentStore(state => state.agentData.customer)
  
  // Get multiple values
  const { sentiment, priority } = useAgentStore(state => ({
    sentiment: state.agentData.sentiment,
    priority: state.agentData.priority
  }))
  
  // Get actions
  const updateCustomer = useAgentStore(state => state.updateCustomer)
  
  return <div>{customer?.name}</div>
}
```

### 2. Agent Status Store (`agent-status-store.ts`)

Manages agent availability and call state with localStorage persistence.

#### State Structure
```typescript
interface AgentStatusState {
  status: 'available' | 'on-call' | 'break' | 'offline' | 'do-not-disturb'
  callState: 'idle' | 'incoming' | 'ringing' | 'active' | 'hold' | 'ended'
  currentCallerId: string | null
  callerInfo: CallerInfo | null
  isOnCall: boolean
  isMuted: boolean
  isOnHold: boolean
  callStartTime: Date | null
  callDuration: number
}
```

#### Persistence
```typescript
persist(
  (set, get) => ({...}),
  {
    name: 'agent-status-storage',
    partialize: (state) => ({
      status: state.status,
      // Excludes call-specific data
    })
  }
)
```

#### Key Actions
- `setStatus(status)` - Update agent availability
- `startCall(callerId, callerInfo)` - Begin new call
- `acceptCall()` - Accept incoming call
- `endCall()` - End current call
- `toggleMute()` - Toggle mute state
- `toggleHold()` - Toggle hold state

#### Usage Example
```typescript
import { useAgentStatusStore } from '@/stores/agent-status-store'

function CallControls() {
  const { 
    callState, 
    acceptCall, 
    endCall,
    toggleMute,
    isMuted 
  } = useAgentStatusStore()
  
  if (callState === 'incoming') {
    return <Button onClick={acceptCall}>Accept</Button>
  }
  
  if (callState === 'active') {
    return (
      <>
        <Button onClick={toggleMute}>
          {isMuted ? 'Unmute' : 'Mute'}
        </Button>
        <Button onClick={endCall}>End Call</Button>
      </>
    )
  }
}
```

## Best Practices

### 1. Selective Subscriptions
```typescript
// ✅ Good - Only re-renders when customer changes
const customer = useAgentStore(state => state.agentData.customer)

// ❌ Bad - Re-renders on any state change
const store = useAgentStore()
const customer = store.agentData.customer
```

### 2. Multiple Selections
```typescript
// ✅ Good - Single subscription with shallow equality
const { sentiment, priority } = useAgentStore(
  state => ({
    sentiment: state.agentData.sentiment,
    priority: state.agentData.priority
  }),
  shallow // Import from 'zustand/shallow'
)
```

### 3. Actions Outside Components
```typescript
// ✅ Can call actions outside React
import { useAgentStore } from '@/stores/agent-store'

// In WebSocket handler
function handleCustomerUpdate(data) {
  useAgentStore.getState().updateCustomer(data)
}
```

### 4. Computed Values
```typescript
// ✅ Use selectors for derived state
const hasCustomerContext = useAgentStore(
  state => !!state.agentData.customer?.id
)

// Or with custom hook
function useHasCustomerContext() {
  return useAgentStore(state => !!state.agentData.customer?.id)
}
```

## Persistence

### Local Storage
Agent status persists across sessions:
```typescript
// Saved to localStorage
{
  "agent-status-storage": {
    "state": {
      "status": "available"
    },
    "version": 0
  }
}
```

### Clearing on Logout
```typescript
// In logout hook
localStorage.removeItem('agent-status-storage')
useAgentStatusStore.getState().endCall()
useAgentStatusStore.getState().setStatus('offline')
```

## WebSocket Integration

### Message Flow
```
WebSocket Message → WebSocket Context → Store Action → UI Update
```

### Example Handler
```typescript
// In websocket-context.tsx
const handleMessage = useCallback((event: MessageEvent) => {
  const data = JSON.parse(event.data)
  
  switch (data.type) {
    case 'customer':
      updateCustomer(data.customer)
      break
    case 'sentiment':
      updateSentiment({
        score: Math.round(data.confidence * 100),
        label: data.sentiment,
        trend: data.trend || 'stable'
      })
      break
  }
}, [updateCustomer, updateSentiment])
```

## TypeScript Integration

### Store Types
```typescript
// Define types
interface Customer {
  id: string
  name: string
  email: string
  // ...
}

// Type-safe store
interface AgentState {
  agentData: {
    customer?: Customer
  }
  updateCustomer: (customer: Customer) => void
}

// Full type safety in components
const customer = useAgentStore(state => state.agentData.customer)
// customer is typed as Customer | undefined
```

### Custom Hooks with Types
```typescript
export function useCustomer(): Customer | undefined {
  return useAgentStore(state => state.agentData.customer)
}

export function useUpdateCustomer(): (customer: Customer) => void {
  return useAgentStore(state => state.updateCustomer)
}
```

## Performance Tips

1. **Use shallow equality for multiple selections**
2. **Create custom hooks for complex selectors**
3. **Avoid unnecessary spreads in actions**
4. **Use `immer` middleware for complex updates (if needed)**
5. **Implement proper memoization in components**

## Testing

### Testing Stores
```typescript
import { renderHook, act } from '@testing-library/react'
import { useAgentStore } from '@/stores/agent-store'

test('updates customer', () => {
  const { result } = renderHook(() => useAgentStore())
  
  act(() => {
    result.current.updateCustomer({
      id: '123',
      name: 'John Doe'
    })
  })
  
  expect(result.current.agentData.customer?.name).toBe('John Doe')
})
```

### Mocking in Tests
```typescript
// Mock the store
jest.mock('@/stores/agent-store', () => ({
  useAgentStore: jest.fn()
}))

// Provide mock implementation
useAgentStore.mockReturnValue({
  agentData: { customer: mockCustomer },
  updateCustomer: jest.fn()
})
```

## Migration Notes

### From Context API
```typescript
// Before (Context)
const { customer } = useAgentContext()

// After (Zustand)
const customer = useAgentStore(state => state.agentData.customer)
```

### From Redux
```typescript
// Before (Redux)
const customer = useSelector(state => state.agent.customer)
const dispatch = useDispatch()
dispatch(updateCustomer(data))

// After (Zustand)  
const customer = useAgentStore(state => state.agentData.customer)
const updateCustomer = useAgentStore(state => state.updateCustomer)
updateCustomer(data)
```
