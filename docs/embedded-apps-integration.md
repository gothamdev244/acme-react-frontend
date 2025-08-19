# Embedded Apps Integration Guide

Complete guide for integrating external applications into the HSBC CCAAS Platform with dynamic intent mapping, context passing, state management, and troubleshooting.

## Table of Contents
- [Overview](#overview)
- [Complete Architecture Flow](#complete-architecture-flow)
- [State Management Architecture](#state-management-architecture)
- [Intent-to-App Mapping System](#intent-to-app-mapping-system)
- [Tab Lifecycle Management](#tab-lifecycle-management)
- [Context Propagation](#context-propagation)
- [Role-based Access Control](#role-based-access-control)
- [Integration Steps](#integration-steps)
- [Code Implementation](#code-implementation)
- [Performance Considerations](#performance-considerations)
- [Advanced Debugging](#advanced-debugging)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Common Issues & Solutions](#common-issues--solutions)
- [Developer Tools](#developer-tools)

## Overview

The HSBC CCAAS Platform supports embedding external applications that automatically load based on detected customer intents. These apps receive full customer context and can communicate bidirectionally with the main platform.

### Key Features
- **Automatic Intent Detection**: Apps load automatically when specific intents are detected
- **WebSocket Enrichment**: Real-time intent-to-app mapping via Gateway service
- **Context Preservation**: Customer data flows seamlessly to embedded apps
- **Tab Management**: Multiple apps can run simultaneously in tabs
- **Resilient Architecture**: Main app remains functional even if embedded apps fail

## Complete Architecture Flow

### System Overview

The embedded apps system follows a sophisticated multi-layer architecture with real-time state management, WebSocket enrichment, and dynamic tab management:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HSBC CCAAS Platform                              │
│                                                                             │
│  ┌─────────────────────────┐    ┌─────────────────────────┐                 │
│  │     AI Service          │    │    Gateway Service      │                 │
│  │  • Intent Detection     │    │  • WebSocket Router     │                 │
│  │  • Confidence Scoring   │────┤  • App URL Enrichment   │                 │
│  │  • Real-time Analysis   │    │  • Database Queries     │                 │
│  └─────────────────────────┘    └──────────┬──────────────┘                 │
│                                            │                                │
│  ┌─────────────────────────────────────────▼─────────────────────────────┐  │
│  │                    Frontend State Management                          │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │  │
│  │  │   Agent Store   │  │  Intent Store   │  │  WebSocket Context  │   │  │
│  │  │ • Customer Data │  │ • Available     │  │ • Connection Mgmt   │   │  │
│  │  │ • Call Context  │  │   Intents       │  │ • Message Routing   │   │  │
│  │  │ • Sentiment     │  │ • Embedded App  │  │ • Intent Enrichment │   │  │
│  │  │ • Transcripts   │  │   Intent        │  │ • Context Updates   │   │  │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘   │  │
│  └───────────────────────────────┬───────────────────────────────────────┘  │
│                                  │                                          │
│  ┌───────────────────────────────▼───────────────────────────────────────┐  │
│  │                    EmbeddedAppColumn Component                        │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │  │
│  │  │                   Tab Management System                         │ │  │
│  │  │  • Dynamic Tab Creation     • Context Propagation              │ │  │
│  │  │  • Lifecycle Management     • Error Recovery                   │ │  │
│  │  │  • User Interactions        • Performance Optimization         │ │  │
│  │  └─────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │  │
│  │  │  Tab 1      │  │  Tab 2      │  │  Tab N      │                   │  │
│  │  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │                   │  │
│  │  │ │ iframe  │ │  │ │ iframe  │ │  │ │ iframe  │ │                   │  │
│  │  │ │ App A   │ │  │ │ App B   │ │  │ │ App C   │ │                   │  │
│  │  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │                   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Communication Channels                           │ │
│  │  • URL Parameters (Initial Load)                                       │ │
│  │  • postMessage API (Real-time Updates)                                 │ │
│  │  • Custom Events (Cross-Component Communication)                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Sequence

1. **Intent Detection**: AI Service detects customer intent (e.g., "credit_card_transactions")
2. **Gateway Enrichment**: Gateway queries `embedded_apps` table and enriches intent with `appUrl` and `appTitle`
3. **WebSocket Delivery**: Enriched intent sent via WebSocket to frontend
4. **State Updates**: Intent and Agent stores updated with new data
5. **Tab Creation**: EmbeddedAppColumn creates new tab if needed
6. **URL Building**: Context-aware URL built with customer data
7. **Iframe Loading**: Embedded app loads in iframe with full context
8. **Handshake**: App signals ready, parent sends current state
9. **Real-time Updates**: Context changes propagate to all active tabs

## State Management Architecture

The embedded apps system uses a sophisticated state management architecture based on Zustand stores with reactive updates and cross-component communication.

### Core Stores Overview

```typescript
┌─────────────────────────────────────────────────────────────────┐
│                     Zustand Store Architecture                   │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   AgentStore    │  │  IntentStore    │  │ WebSocketContext│ │
│  │                 │  │                 │  │                 │ │
│  │ • Customer Data │  │ • Available     │  │ • Connection    │ │
│  │ • Call Context  │  │   Intents       │  │   Management    │ │
│  │ • Sentiment     │◄─┤ • Current Intent│◄─┤ • Message       │ │
│  │ • Summary       │  │ • Embedded App  │  │   Routing       │ │
│  │ • Actions       │  │   Intent        │  │ • Intent        │ │
│  │ • Transcripts   │  │ • Intent History│  │   Enrichment    │ │
│  │ • Knowledge     │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│           │                     │                     │        │
│           └─────────────────────┼─────────────────────┘        │
│                                 │                              │
│  ┌─────────────────────────────▼─────────────────────────────┐ │
│  │              EmbeddedAppColumn Component                  │ │
│  │  • Subscribes to all stores                              │ │
│  │  • Manages tab state locally                             │ │
│  │  • Propagates context to iframes                         │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### AgentStore (Primary Context Provider)

**Purpose**: Central repository for all call-related data and customer context.

```typescript
interface AgentData {
  // Agent Information
  agentId: string
  agentName: string
  department: string
  role?: 'call' | 'chat' | 'supervisor' | 'manager'
  status: 'active' | 'idle' | 'offline'
  
  // Call Information
  callerId: string
  callDuration: number
  queuePosition: number
  
  // Real-time Analytics
  sentiment: {
    score: number
    label: 'positive' | 'neutral' | 'negative'
    trend: 'up' | 'down' | 'stable'
    change: number
  }
  
  // WebSocket Enriched Intent (contains appUrl/appTitle)
  intent: {
    type: string
    confidence: number
    appUrl?: string      // From Gateway: "/embedded-apps/credit_card_management"
    appTitle?: string    // From Gateway: "Credit Card Management"
  }
  
  // Customer Context (Primary data for embedded apps)
  customer: {
    id: string
    name: string
    tier: string
    accountNumber: string
    email: string
    phone: string
    location: string
    // ... additional fields
  }
  
  // AI-Generated Content
  summary: { text: string, category: string, confidence: number }
  actions: Array<{ id: string, action: string, completed: boolean }>
  transcript: Array<{ speaker: string, text: string, timestamp: Date }>
  knowledgeArticles: Array<{ title: string, relevance: number, url: string }>
}
```

**Key Methods**:
- `updateCustomer()` - Triggers customer context updates to all embedded apps
- `updateIntent()` - Receives WebSocket enriched intent data
- `clearAll()` - Resets all data when call ends

### IntentStore (App Selection Manager)

**Purpose**: Manages available intents and tracks which intent is displayed in embedded apps.

```typescript
interface IntentStore {
  availableIntents: Intent[]      // All detected intents
  currentIntent: string | null    // Selected in dropdown
  embeddedAppIntent: string | null // Actually displayed in embedded app
  intentHistory: Intent[]         // Past intents for this call
  
  // Key distinction: currentIntent ≠ embeddedAppIntent
  // User can select different intent in dropdown without changing embedded app
}

interface Intent {
  id: string
  name: string
  confidence: number
  appUrl?: string    // WebSocket enriched data
  appTitle?: string  // WebSocket enriched data
}
```

**Key Behaviors**:
```typescript
// New intent detected → Auto-set as embeddedAppIntent (creates tab)
setAvailableIntents([newIntent]) 
// ↓
// embeddedAppIntent = newIntent.id (triggers tab creation)

// User manually selects intent → Only updates dropdown
selectIntent(intentId) 
// ↓  
// currentIntent = intentId (no tab change)

// User explicitly launches intent → Updates both
setEmbeddedAppIntent(intentId)
// ↓
// embeddedAppIntent = intentId (creates/switches tab)
// currentIntent = intentId (updates dropdown)
```

### WebSocketContext (Communication Layer)

**Purpose**: Manages WebSocket connection and intent enrichment from Gateway.

```typescript
interface WebSocketContextValue {
  connect: (agentId: string, callerId: string) => void
  disconnect: () => void
  sendMessage: (message: any) => void
  isConnected: boolean
  hasCustomerContext: boolean
}
```

**Intent Enrichment Process**:
```typescript
// In handleMessage function (websocket-context.tsx)
case 'intent': {
  // Raw intent from AI Service
  const intentData = {
    type: data.intent || 'UNKNOWN',
    confidence: data.confidence || 0,
    
    // Gateway enrichment (if available)
    appUrl: data.appUrl,      // "/embedded-apps/credit_card_management"  
    appTitle: data.appTitle   // "Credit Card Management"
  }
  
  // Update AgentStore with enriched intent
  updateIntent(intentData)
  break
}
```

### State Flow Examples

#### 1. New Intent Detection Flow
```typescript
// 1. WebSocket receives enriched intent
WebSocketContext: handleMessage('intent') 
↓
// 2. AgentStore updated with enriched data
AgentStore: updateIntent({ 
  type: 'credit_card_transactions',
  appUrl: '/embedded-apps/credit_card_management',
  appTitle: 'Credit Card Management'
})
↓
// 3. EmbeddedAppColumn detects new intent
EmbeddedAppColumn: useEffect([websocketIntent]) 
↓
// 4. Tab created with enriched URL
createTabForIntent('credit_card_transactions')
URL: http://localhost:5175/embedded-apps/credit_card_management?customerId=123...
```

#### 2. Customer Context Update Flow
```typescript
// 1. Customer identified via WebSocket
WebSocketContext: handleMessage('customer')
↓ 
// 2. AgentStore updated
AgentStore: updateCustomer(customerData)
↓
// 3. Custom event dispatched
window.dispatchEvent('customer-context:updated', { customer, hasContext: true })
↓
// 4. All tabs receive new context
EmbeddedAppColumn: handleCustomerContextUpdate()
↓
// 5. URLs rebuilt with customer data
buildAppUrl(appKey, true, customerContext) // Switch to context mode
↓
// 6. Iframes reload with customer context
iframe.src = newContextualUrl
```

#### 3. User Manual Intent Selection Flow
```typescript
// 1. User clicks intent dropdown
IntentWidget: onClick(intentId)
↓
// 2. Intent store updated (dropdown only)
IntentStore: selectIntent(intentId) // currentIntent = intentId
↓
// 3. User clicks "Launch App" button  
IntentWidget: onLaunchApp(intentId)
↓
// 4. Embedded app intent updated
IntentStore: setEmbeddedAppIntent(intentId) // embeddedAppIntent = intentId
↓
// 5. Tab created/switched
EmbeddedAppColumn: createTabForIntent(intentId, switchToTab: true)
```

### Performance Optimizations

#### Memoization and Selective Updates
```typescript
// Only re-render when specific fields change
const customer = useAgentStore(state => state.customer)
const intent = useAgentStore(state => state.intent)

// Avoid full re-renders on unrelated updates
const contextData = useMemo(() => ({
  customerId: customer?.id,
  customerName: customer?.name,
  intent: intent?.type
}), [customer?.id, customer?.name, intent?.type])
```

#### Ref-based State Access
```typescript
// Avoid stale closures in event listeners
const agentDataRef = useRef(agentData)
useEffect(() => { agentDataRef.current = agentData }, [agentData])

const handleMessage = useCallback((event) => {
  // Always access current state
  const currentCustomer = agentDataRef.current.customer
}, [])
```

## Tab Lifecycle Management

The tab management system handles the complete lifecycle of embedded apps from creation to cleanup, with sophisticated state tracking and error recovery.

### Tab State Model

```typescript
interface EmbeddedAppTab {
  id: string                    // Unique identifier
  intent: string               // Associated intent
  label: string                // Display name
  url: string                  // Full iframe URL with context
  isLoading: boolean           // Loading state
  error: string | null         // Error message
  handshakeComplete: boolean   // Communication established
  appKey?: string              // For search-launched apps
  context?: any                // Additional metadata
}
```

### Tab Creation Triggers

1. **Intent Detection** (Automatic)
```typescript
// In embedded-app-column.tsx
useEffect(() => {
  const currentIntent = websocketIntent?.type || embeddedAppIntent
  
  if (currentIntent && !closedIntents.has(currentIntent)) {
    createTabForIntent(currentIntent, false) // Don't auto-switch
  }
}, [websocketIntent, embeddedAppIntent])
```

2. **Manual App Launch** (Search)
```typescript
// Global event listener
window.addEventListener('embedded-app:launch', (event) => {
  const app = event.detail
  const newTab = createTabFromSearchResult(app)
  setActiveTabId(newTab.id) // Switch to new tab
})
```

3. **Dropdown Selection** (User Choice)
```typescript
// Intent dropdown interaction
window.addEventListener('intent:dropdown-clicked', (event) => {
  const intentId = event.detail.intent
  
  if (closedIntents.has(intentId)) {
    // Reopen previously closed tab
    closedIntents.delete(intentId)
    createTabForIntent(intentId, true) // Switch to reopened tab
  }
})
```

### Tab Lifecycle Phases

#### 1. Creation Phase
```typescript
const createTabForIntent = (intent: string, switchToTab: boolean) => {
  // Check for duplicates
  const existingTab = tabs.find(tab => tab.intent === intent)
  if (existingTab) return existingTab.id
  
  // Build URL with current context
  const appUrl = buildAppUrl(intent, hasContext, customerContext)
  
  // Create tab object
  const newTab: EmbeddedAppTab = {
    id: `tab-${intent}-${Date.now()}`,
    intent,
    label: getIntentLabel(intent),
    url: appUrl,
    isLoading: true,
    error: null,
    handshakeComplete: false
  }
  
  setTabs(prev => [...prev, newTab])
  if (switchToTab) setActiveTabId(newTab.id)
}
```

#### 2. Loading Phase
```typescript
const handleIframeLoad = (tabId: string) => {
  // Send ping to establish communication
  setTimeout(() => {
    const pingMessage = { type: 'host.ping', tabId }
    iframe.contentWindow?.postMessage(pingMessage, '*')
  }, 300)
  
  // Set handshake timeout (3 seconds)
  handshakeTimeoutRefs.current[tabId] = setTimeout(() => {
    setTabs(prev => prev.map(t => 
      t.id === tabId 
        ? { ...t, error: 'Banking service temporarily unavailable', isLoading: false }
        : t
    ))
  }, 3000)
}
```

#### 3. Ready Phase
```typescript
// When iframe signals ready
case 'embed.ready':
  setTabs(prev => prev.map(tab => 
    tab.id === tabId 
      ? { ...tab, handshakeComplete: true, isLoading: false, error: null }
      : tab
  ))
  
  // Clear timeout
  clearTimeout(handshakeTimeoutRefs.current[tabId])
  
  // Send initial context
  const contextMessage = {
    type: 'host.state',
    context: {
      customerId: agentData.customer?.id,
      customerName: agentData.customer?.name,
      mode: hasContext ? 'context' : 'manual',
      // ... full context
    }
  }
  iframe.contentWindow.postMessage(contextMessage, '*')
```

#### 4. Active Phase
```typescript
// Handle ongoing communication
case 'kms.open':
  // Open knowledge article request
  window.dispatchEvent(new CustomEvent('kms:open-article', {
    detail: { articleId: event.data.articleId }
  }))
  break

case 'action.execute':
  // Execute action in parent context
  handleActionExecution(event.data.action, event.data.params)
  break
```

#### 5. Cleanup Phase
```typescript
const handleCloseTab = (tabId: string) => {
  // Track closed intent
  const tab = tabs.find(t => t.id === tabId)
  if (tab) {
    setClosedIntents(prev => new Set([...prev, tab.intent]))
  }
  
  // Clean up resources
  clearTimeout(handshakeTimeoutRefs.current[tabId])
  delete handshakeTimeoutRefs.current[tabId]
  delete iframeRefs.current[tabId]
  
  // Remove tab
  setTabs(prev => prev.filter(t => t.id !== tabId))
  
  // Switch to another tab if this was active
  if (activeTabId === tabId) {
    const remainingTabs = tabs.filter(t => t.id !== tabId)
    setActiveTabId(remainingTabs[0]?.id || null)
  }
}
```

### Error Recovery Mechanisms

#### 1. Handshake Timeout Recovery
```typescript
const handleRetry = (tabId: string) => {
  // Reset tab state
  setTabs(prev => prev.map(tab => 
    tab.id === tabId 
      ? { ...tab, error: null, isLoading: true, handshakeComplete: false }
      : tab
  ))
  
  // Clear existing timeout
  clearTimeout(handshakeTimeoutRefs.current[tabId])
  
  // Reload iframe
  const iframe = iframeRefs.current[tabId]
  if (iframe) iframe.src = iframe.src
}
```

#### 2. Context Update Recovery
```typescript
// When customer context changes, update all tabs
const handleCustomerContextUpdate = (event: CustomEvent) => {
  const { customer, hasContext } = event.detail
  
  setTabs(prev => prev.map(tab => {
    const newUrl = buildAppUrl(tab.appKey || tab.intent, hasContext, customerContext)
    
    // Only reload if URL actually changed
    if (newUrl !== tab.url) {
      return {
        ...tab,
        url: newUrl,
        isLoading: true,
        handshakeComplete: false // Will re-establish communication
      }
    }
    return tab
  }))
}
```

#### 3. Connection Cleanup
```typescript
// Clean up all tabs when call ends
useEffect(() => {
  if (!isConnected) {
    setTabs([])
    setActiveTabId(null)
    setClosedIntents(new Set())
    
    // Clear all timeouts
    Object.values(handshakeTimeoutRefs.current).forEach(timeout => {
      if (timeout) clearTimeout(timeout)
    })
    handshakeTimeoutRefs.current = {}
    iframeRefs.current = {}
  }
}, [isConnected])
```

## Intent-to-App Mapping System

### Database Schema

Apps are registered in the `embedded_apps` table:

```sql
CREATE TABLE embedded_apps (
    id SERIAL PRIMARY KEY,
    app_key VARCHAR(100) UNIQUE NOT NULL,      -- Unique identifier (e.g., 'credit_card_management')
    title VARCHAR(200) NOT NULL,               -- Display title
    description TEXT,                           -- App description
    category VARCHAR(100),                      -- Category (Cards, Loans, etc.)
    tags TEXT[],                               -- Search tags
    keywords TEXT[],                           -- Search keywords
    search_phrases TEXT[],                      -- Common search phrases
    allowed_roles TEXT[],                       -- ['agent', 'supervisor', 'manager']
    supported_intents TEXT[],                   -- ['credit_card_transactions', 'fraud_alert']
    display_mode VARCHAR(50) DEFAULT 'tab',     -- 'tab', 'modal', 'sidebar'
    priority INTEGER DEFAULT 100,               -- Display priority
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Gateway Enrichment Process

The Gateway service (`BroadcastMessageRouter.java`) enriches intents in real-time:

```java
// 1. Intent detected by AI Service
String intent = "credit_card_transactions";

// 2. Gateway queries database
Optional<EmbeddedApp> app = embeddedAppRepository.findByIntentAndRole(intent, "agent");

// 3. Enriches WebSocket message
if (app.isPresent()) {
    message.put("appUrl", "/embedded-apps/" + app.getAppKey());
    message.put("appTitle", app.getTitle());
}

// 4. Sends to frontend with enrichment
websocket.send(enrichedMessage);
```

## Context Propagation

The context propagation system ensures embedded apps receive customer data through multiple synchronized channels with automatic fallback and real-time updates.

### Three-Channel Context Delivery

#### 1. URL Parameters (Initial Bootstrap)
**Purpose**: Provide immediate context when iframe loads
**Timing**: During iframe creation/reload
**Content**: Essential customer identifiers and metadata

```typescript
// URL structure example
http://localhost:5175/embedded-apps/credit_card_management?
  customerId=CUST-123456&
  customerName=Sophie%20Anderson&
  email=sophie@example.com&
  phone=%2B44%2020%207123%204567&
  accountNumber=ACC-789012&
  accountType=PREMIUM&
  customerTier=GOLD&
  intent=credit_card_transactions&
  callerId=CALL-567890&
  mode=context&
  role=agent&
  tabId=tab-credit_card_transactions-1692188400123
```

#### 2. PostMessage API (Real-time Updates)
**Purpose**: Deliver full context object and handle updates
**Timing**: After iframe handshake completion
**Content**: Complete customer object plus system state

```typescript
// Message structure sent to iframe
{
  type: 'host.state',
  context: {
    // Customer identification
    customerId: 'CUST-123456',
    customerName: 'Sophie Anderson',
    email: 'sophie@example.com',
    phone: '+44 20 7123 4567',
    location: 'London, UK',
    
    // Account details
    accountNumber: 'ACC-789012',
    accountType: 'PREMIUM',
    customerTier: 'GOLD',
    cin: 'CIN-345678',
    
    // Call context
    agentId: 'HSB-001',
    callerId: 'CALL-567890',
    intent: 'credit_card_transactions',
    
    // System state
    mode: 'context', // or 'manual'
    hasCustomerContext: true,
    
    // App-specific metadata
    appKey: 'credit_card_management',
    launchedFromSearch: false,
    tabId: 'tab-credit_card_transactions-1692188400123',
    
    // Additional context for advanced apps
    additionalContext: {
      // Intent confidence, detection time, etc.
    }
  }
}
```

#### 3. Custom Events (System-wide Updates)
**Purpose**: Broadcast context changes to all components
**Timing**: When customer identification state changes
**Content**: Delta updates and mode transitions

```typescript
// Dispatched when customer context changes
window.dispatchEvent(new CustomEvent('customer-context:updated', {
  detail: {
    customer: newCustomerData,
    hasContext: true, // Changed from false to true
    previousMode: 'manual',
    newMode: 'context'
  }
}))
```

### Context Update Flow Examples

#### Scenario 1: Customer Identification During Call
```typescript
// 1. Call starts - no customer identified yet
Initial State: { hasContext: false, mode: 'manual' }
URL: http://localhost:5175/embedded-apps/credit_card_management?mode=manual&appKey=credit_card_management

// 2. Customer provides ID - WebSocket receives customer data
WebSocket Message: { type: 'customer', customer: { id: 'CUST-123', name: 'John' } }

// 3. AgentStore updated
AgentStore.updateCustomer(customerData)

// 4. Custom event dispatched
window.dispatchEvent('customer-context:updated', { hasContext: true })

// 5. All tabs receive new context-aware URLs
New URL: http://localhost:5175/embedded-apps/credit_card_management?customerId=CUST-123&customerName=John&mode=context

// 6. Iframes reload with customer context
// 7. New postMessage sent with full customer object
```

#### Scenario 2: Customer Details Updated
```typescript
// Customer address or phone changes during call
// No iframe reload needed - postMessage only

// 1. WebSocket receives updated customer data
WebSocket: { type: 'customer', customer: { ...existing, phone: 'new-number' } }

// 2. AgentStore updates customer object
AgentStore.customer = { ...existing, phone: 'new-number' }

// 3. PostMessage sent to all active tabs
tabs.forEach(tab => {
  iframe.postMessage({
    type: 'host.state',
    context: { ...fullContext, phone: 'new-number' }
  })
})
```

### URL Parameter Structure

Customer context is passed via URL parameters to embedded apps:

```typescript
// URL builder service (url-builder.service.ts)
export function buildAppUrl(
  appKey: string,
  hasContext: boolean,
  context: CustomerContext,
  additionalParams?: Record<string, string>
): string {
  const baseUrl = EMBEDDED_APP_URL || 'http://localhost:5175'
  const params = new URLSearchParams()
  
  // Core context parameters
  if (hasContext && context) {
    params.append('customerId', context.customerId || '')
    params.append('customerName', context.customerName || '')
    params.append('email', context.email || '')
    params.append('phone', context.phone || '')
    params.append('location', context.location || '')
    params.append('accountNumber', context.accountNumber || '')
    params.append('accountType', context.accountType || '')
    params.append('customerTier', context.customerTier || '')
    params.append('cin', context.cin || '')
  }
  
  // Intent and metadata
  params.append('intent', context.intent || appKey)
  params.append('callerId', context.callerId || '')
  params.append('mode', hasContext ? 'context' : 'manual')
  
  // Additional parameters
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      params.append(key, value)
    })
  }
  
  return `${baseUrl}/embedded-apps/${appKey}?${params.toString()}`
}
```

### Available Context Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `customerId` | string | Unique customer ID | `CUST-123456` |
| `customerName` | string | Full name | `Sophie Anderson` |
| `email` | string | Email address | `sophie@example.com` |
| `phone` | string | Phone number | `+44 20 7123 4567` |
| `location` | string | Customer location | `London, UK` |
| `accountNumber` | string | Bank account | `ACC-789012` |
| `accountType` | string | Account type | `PREMIUM` |
| `customerTier` | string | Service tier | `GOLD`, `SILVER`, `BRONZE` |
| `cin` | string | Customer ID number | `CIN-345678` |
| `intent` | string | Current intent | `credit_card_transactions` |
| `callerId` | string | Call session ID | `CALL-567890` |
| `mode` | string | Operation mode | `context` or `manual` |

## Role-based Access Control

The embedded apps system implements sophisticated role-based access control at multiple layers to ensure agents only access appropriate applications for their role and customer tier.

### Role Hierarchy and App Access

```typescript
// Role definitions with app access levels
interface RoleDefinition {
  role: string
  displayName: string
  allowedApps: string[]
  restrictedCustomerTiers?: string[]
  permissions: string[]
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    role: 'chat_agent',
    displayName: 'Chat Agent',
    allowedApps: [
      'quick_balance',
      'chat_templates', 
      'faq_assistant',
      'account_balance_inquiry'
    ],
    permissions: ['view_basic_info', 'create_support_tickets']
  },
  {
    role: 'agent',
    displayName: 'Call Agent', 
    allowedApps: [
      'credit_card_management',
      'fraud_alert',
      'mortgage_application',
      'account_balance_inquiry',
      'international_transfer',
      'student_loan',
      'account_upgrade',
      'business_loan'
    ],
    permissions: ['view_customer_details', 'process_transactions', 'create_disputes']
  },
  {
    role: 'supervisor',
    displayName: 'Supervisor',
    allowedApps: [
      'wealth_management',
      'escalation_hub',
      'team_overview',
      'credit_card_management',
      'fraud_alert'
    ],
    restrictedCustomerTiers: ['PLATINUM', 'DIAMOND'],
    permissions: ['view_all_customers', 'approve_transactions', 'manage_escalations']
  },
  {
    role: 'manager',
    displayName: 'Manager',
    allowedApps: [
      'team_performance',
      'quality_assurance', 
      'audit_dashboard',
      'escalation_hub'
    ],
    permissions: ['view_reports', 'manage_team', 'approve_policies']
  },
  {
    role: 'admin',
    displayName: 'Administrator',
    allowedApps: [
      'system_admin',
      'user_management',
      'audit_logs',
      'security_center'
    ],
    permissions: ['full_access']
  }
]
```

### Multi-layer Access Control

#### 1. Database Level (Gateway Service)
```java
// In BroadcastMessageRouter.java
Optional<EmbeddedApp> app = embeddedAppRepository.findByIntentAndRole(intent, userRole);

// SQL query with role filtering
SELECT * FROM embedded_apps 
WHERE 'credit_card_transactions' = ANY(supported_intents)
AND 'agent' = ANY(allowed_roles)
AND active = true;
```

#### 2. Frontend Search Filtering
```typescript
// In use-embedded-app-search.ts
const userContext: UserContext = useMemo(() => {
  const mapAuthRoleToSearchRole = (authRole?: string) => {
    switch (authRole) {
      case 'chat_agent': return 'chat_agent'
      case 'supervisor': return 'supervisor'  
      case 'manager': return 'manager'
      case 'admin': return 'admin'
      case 'agent':
      default: return 'agent'
    }
  }

  return {
    role: mapAuthRoleToSearchRole(currentRole || user?.role),
    customerTier: agentData?.customer?.tier || 'standard',
    currentIntent: embeddedAppIntent
  }
}, [currentRole, user?.role, agentData?.customer?.tier, embeddedAppIntent])
```

#### 3. Component Level Access
```typescript
// In embedded-app-column.tsx - Role-based app availability check
const isAppAvailableForRole = useCallback((appKey: string, role: string) => {
  const roleApps: Record<string, string[]> = {
    'chat_agent': ['quick_balance', 'chat_templates'],
    'agent': ['credit_card_management', 'fraud_alert', 'mortgage_application'], 
    'supervisor': ['wealth_management', 'escalation_hub', 'team_overview'],
    'manager': ['team_performance', 'quality_assurance'],
    'admin': ['system_admin', 'user_management']
  }
  
  return roleApps[role]?.includes(appKey) || false
}, [])
```

### Customer Tier-based Restrictions

```typescript
// Enhanced role checking with customer tier validation
const validateAppAccess = (appKey: string, userRole: string, customerTier: string) => {
  // Check basic role access
  if (!isAppAvailableForRole(appKey, userRole)) {
    return { allowed: false, reason: 'INSUFFICIENT_ROLE' }
  }
  
  // Check customer tier restrictions
  const tierRestrictions = {
    'wealth_management': ['PLATINUM', 'DIAMOND'], // Supervisor+ only for high-value customers
    'private_banking': ['DIAMOND'],               // Manager+ only for ultra-high-value
    'business_loan': ['BUSINESS', 'CORPORATE']    // Only for business customers
  }
  
  const requiredTiers = tierRestrictions[appKey]
  if (requiredTiers && !requiredTiers.includes(customerTier)) {
    return { allowed: false, reason: 'CUSTOMER_TIER_RESTRICTION' }
  }
  
  return { allowed: true }
}
```

### Role Context Propagation

#### 1. URL Parameters
```typescript
// Role included in app URLs
const appUrl = buildAppUrl(appKey, hasContext, customerContext, {
  role: currentRole, // 'agent', 'supervisor', etc.
  tabId: `tab-${intent}-${Date.now()}`
})
```

#### 2. PostMessage Context
```typescript
// Role sent via postMessage to embedded apps
const contextMessage = {
  type: 'host.state',
  context: {
    // ... customer data
    agentRole: currentRole,
    permissions: getRolePermissions(currentRole),
    allowedActions: getAllowedActions(currentRole, customerTier)
  }
}
```

#### 3. Search Headers
```typescript
// Role-based search filtering
const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Agent-Role': userContext.role,
  'X-Customer-Tier': userContext.customerTier
}
```

### Access Control Examples

#### Example 1: Chat Agent Restrictions
```typescript
// Chat agent tries to access wealth management
Role: 'chat_agent'
Requested App: 'wealth_management'
Customer Tier: 'PLATINUM'

// Validation result
validateAppAccess('wealth_management', 'chat_agent', 'PLATINUM')
// Returns: { allowed: false, reason: 'INSUFFICIENT_ROLE' }

// Available apps for chat agent
getAllowedApps('chat_agent')
// Returns: ['quick_balance', 'chat_templates', 'faq_assistant']
```

#### Example 2: Supervisor with High-Value Customer
```typescript
// Supervisor accessing wealth management for platinum customer
Role: 'supervisor'
Requested App: 'wealth_management'  
Customer Tier: 'PLATINUM'

// Validation result
validateAppAccess('wealth_management', 'supervisor', 'PLATINUM')
// Returns: { allowed: true }

// App loads with full wealth management features
```

#### Example 3: Agent with Business Customer
```typescript
// Agent trying to access business loan app
Role: 'agent'
Requested App: 'business_loan'
Customer Tier: 'BUSINESS'

// Validation result  
validateAppAccess('business_loan', 'agent', 'BUSINESS')
// Returns: { allowed: true }

// Business-specific features enabled in app
```

### Security Headers and Validation

```typescript
// Enhanced security validation in WebSocket context
const validateWebSocketAccess = (userRole: string, requestedAction: string) => {
  const rolePermissions = {
    'chat_agent': ['view_basic_info', 'create_tickets'],
    'agent': ['view_customer_details', 'process_basic_transactions'],
    'supervisor': ['view_all_customers', 'approve_transactions'],
    'manager': ['view_reports', 'manage_team'],
    'admin': ['full_access']
  }
  
  const permissions = rolePermissions[userRole] || []
  return permissions.includes(requestedAction) || permissions.includes('full_access')
}
```

## Integration Steps

### Step 1: Register Your App in Database

```sql
-- Add your app to embedded_apps table
INSERT INTO embedded_apps (
    app_key,
    title,
    description,
    category,
    supported_intents,
    allowed_roles,
    priority
) VALUES (
    'your_app_key',           -- Unique identifier
    'Your App Title',         -- Display name
    'App description',        -- Description
    'Category',              -- Category
    ARRAY['intent1', 'intent2'],  -- Supported intents
    ARRAY['agent', 'supervisor'],  -- Allowed roles
    100                      -- Priority
);
```

### Step 2: Create Your Embedded App

Create a React app that reads URL parameters:

```jsx
// App.jsx in your embedded app
import React, { useState, useEffect } from 'react';

export const AppContext = React.createContext({});

function App() {
  const [context, setContext] = useState({});
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    const initialContext = {
      customerId: urlParams.get('customerId') || '',
      customerName: urlParams.get('customerName') || '',
      email: urlParams.get('email') || '',
      phone: urlParams.get('phone') || '',
      location: urlParams.get('location') || '',
      accountNumber: urlParams.get('accountNumber') || '',
      accountType: urlParams.get('accountType') || '',
      customerTier: urlParams.get('customerTier') || '',
      intent: urlParams.get('intent') || '',
      mode: urlParams.get('mode') || 'manual',
    };
    
    setContext(initialContext);
    
    // Send ready signal to parent
    window.parent.postMessage({ type: 'embed.ready' }, '*');
    
    // Listen for updates from parent
    const handleMessage = (event) => {
      if (event.data.type === 'host.state') {
        setContext(prev => ({ ...prev, ...event.data.context }));
      }
    };
    
    window.addEventListener('message', handleMessage);
    setIsReady(true);
    
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  if (!isReady) {
    return <div>Loading...</div>;
  }
  
  return (
    <AppContext.Provider value={{ context, setContext }}>
      <YourAppContent />
    </AppContext.Provider>
  );
}
```

### Step 3: Handle Communication

```jsx
// Component in your embedded app
import { useContext } from 'react';
import { AppContext } from './App';

function YourComponent() {
  const { context } = useContext(AppContext);
  
  // Send message to parent
  const openKnowledgeArticle = (articleId) => {
    window.parent.postMessage({
      type: 'kms.open',
      articleId: articleId
    }, '*');
  };
  
  // Execute action in parent
  const executeAction = (action, params) => {
    window.parent.postMessage({
      type: 'action.execute',
      action: action,
      params: params
    }, '*');
  };
  
  return (
    <div>
      <h1>Welcome {context.customerName || 'Guest'}</h1>
      <p>Email: {context.email || 'Not provided'}</p>
      <p>Mode: {context.mode}</p>
      
      <button onClick={() => openKnowledgeArticle('ARTICLE-123')}>
        Open Help Article
      </button>
    </div>
  );
}
```

## Code Implementation

### Frontend Integration (embedded-app-column.tsx)

Key sections of the integration code:

```typescript
// 1. Listen for intent detection
useEffect(() => {
  const currentIntent = websocketIntent?.type || embeddedAppIntent;
  const hasEnrichedAppData = !!(websocketIntent?.appUrl && websocketIntent?.appTitle);
  
  if (!currentIntent || !isConnected) return;
  
  // Check if user closed this intent
  if (closedIntents.has(currentIntent)) return;
  
  // Check for existing tab
  const existingTab = tabs.find(tab => tab.intent === currentIntent);
  if (existingTab) return;
  
  let appUrl: string;
  let appTitle: string;
  
  if (hasEnrichedAppData) {
    // Use WebSocket enriched data
    appUrl = `${EMBEDDED_APP_URL}${websocketIntent.appUrl}`;
    appTitle = websocketIntent.appTitle!;
    
    // Prevent duplicate tabs for same app
    const existingAppTab = tabs.find(tab => 
      tab.url.startsWith(`${EMBEDDED_APP_URL}${websocketIntent.appUrl}`)
    );
    if (existingAppTab) return;
  } else {
    // Fallback to traditional URL building
    const customerContext: CustomerContext = {
      customerId: agentData.customer?.id || '',
      customerName: agentData.customer?.name,
      email: agentData.customer?.email,
      phone: agentData.customer?.phone,
      location: agentData.customer?.location,
      // ... other fields
    };
    
    appUrl = buildAppUrl(currentIntent, hasContext, customerContext, {
      role: 'agent',
      tabId: `tab-${currentIntent}-${Date.now()}`
    });
    appTitle = getIntentLabel(currentIntent);
  }
  
  // Create new tab
  const newTab: EmbeddedAppTab = {
    id: `tab-${currentIntent}-${Date.now()}`,
    intent: currentIntent,
    label: appTitle,
    url: appUrl,
    isLoading: true,
    error: null,
    handshakeComplete: false
  };
  
  setTabs(prev => [...prev, newTab]);
}, [embeddedAppIntent, websocketIntent, isConnected]);

// 2. Handle iframe communication
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    // Verify origin
    if (!ALLOWED_ORIGINS.includes(event.origin)) return;
    
    switch (event.data.type) {
      case 'embed.ready':
        // App loaded successfully
        setTabs(prev => prev.map(tab => 
          tab.id === event.data.tabId 
            ? { ...tab, handshakeComplete: true, isLoading: false }
            : tab
        ));
        
        // Send initial state
        const message = {
          type: 'host.state',
          context: {
            customerId: agentData.customer?.id,
            customerName: agentData.customer?.name,
            // ... other context
          }
        };
        iframe.contentWindow.postMessage(message, '*');
        break;
        
      case 'kms.open':
        // Open knowledge article
        window.dispatchEvent(new CustomEvent('kms:open-article', {
          detail: { articleId: event.data.articleId }
        }));
        break;
    }
  };
  
  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, [agentData]);
```

## Troubleshooting Guide

### Enable Debug Mode

Add debug logging to track issues:

```typescript
// In embedded-app-column.tsx
const DEBUG = import.meta.env.DEV || window.location.search.includes('debug=true');

if (DEBUG) {
  console.log('[EmbeddedAppColumn] Intent detected:', {
    intent: currentIntent,
    appUrl: websocketIntent?.appUrl,
    appTitle: websocketIntent?.appTitle,
    customer: agentData.customer,
    timestamp: new Date().toISOString()
  });
}
```

### Browser Console Commands

```javascript
// Check current tabs
document.querySelectorAll('iframe').forEach(f => console.log(f.src))

// Check WebSocket connection
window.__WEBSOCKET_STATE__ // If exposed by app

// Manually trigger intent
window.dispatchEvent(new CustomEvent('intent:detected', {
  detail: { intent: 'credit_card_transactions' }
}));

// Check postMessage communication
window.addEventListener('message', (e) => console.log('Message:', e.data));
```

## Common Issues & Solutions

### Issue 1: App Not Loading

**Symptoms**: Blank iframe or loading spinner stuck

**Debugging Steps**:
```javascript
// 1. Check if app is registered in database
SELECT * FROM embedded_apps WHERE app_key = 'your_app_key';

// 2. Check WebSocket enrichment
// In browser console, look for:
[EmbeddedAppColumn] Using WebSocket enriched app data: {
  intent: "credit_card_transactions",
  appUrl: "/embedded-apps/credit_card_management",
  appTitle: "Credit Card Management"
}

// 3. Check iframe URL
// Should be: http://localhost:5175/embedded-apps/your_app?customerId=123&...
```

**Solutions**:
- Ensure app is registered in `embedded_apps` table
- Verify `supported_intents` includes the detected intent
- Check if embedded service is running (port 5175)
- Verify CORS/origin settings

### Issue 2: No Customer Context

**Symptoms**: App shows "Guest" or default values

**Debugging Steps**:
```javascript
// 1. Check URL parameters
const urlParams = new URLSearchParams(window.location.search);
console.log('Customer ID:', urlParams.get('customerId'));
console.log('Customer Name:', urlParams.get('customerName'));

// 2. Check parent context
// In parent app console:
console.log('Agent Data:', agentData.customer);

// 3. Verify mode
console.log('Mode:', urlParams.get('mode')); // Should be 'context' if customer identified
```

**Solutions**:
- Ensure customer is identified before intent detection
- Check if `buildAppUrl` is called with `hasContext = true`
- Verify customer data is available in `agentData.customer`

### Issue 3: Duplicate Tabs

**Symptoms**: Same app opens multiple times

**Debugging**:
```javascript
// Check for duplicate prevention
const existingAppTab = tabs.find(tab => 
  tab.url.startsWith(`${EMBEDDED_APP_URL}${websocketIntent.appUrl}`)
);
console.log('Existing tab found:', existingAppTab);
```

**Solutions**:
- Ensure deduplication check is in place (lines 331-337 in embedded-app-column.tsx)
- Verify `appUrl` is consistent for same app
- Check if multiple intents map to same app

### Issue 4: Communication Failures

**Symptoms**: postMessage not working

**Debugging**:
```javascript
// In embedded app:
window.parent.postMessage({ type: 'test' }, '*');

// In parent:
window.addEventListener('message', (e) => {
  console.log('Origin:', e.origin);
  console.log('Data:', e.data);
});
```

**Solutions**:
- Check ALLOWED_ORIGINS configuration
- Verify iframe sandbox attributes allow scripts
- Ensure both apps are on same protocol (http/https)

### Issue 5: WebSocket Not Enriching

**Symptoms**: No appUrl/appTitle in intent

**Debugging**:
```java
// Check Gateway logs
[BroadcastRouter] Intent enriched: credit_card_transactions -> /embedded-apps/credit_card_management

// Check database query
SELECT * FROM embedded_apps 
WHERE 'credit_card_transactions' = ANY(supported_intents)
AND 'agent' = ANY(allowed_roles);
```

**Solutions**:
- Restart Gateway service after database changes
- Clear intent cache in Gateway (if implemented)
- Verify role matches allowed_roles in database

## Debugging Tools

### 1. Network Inspector

Monitor iframe loading:
```javascript
// Add to embedded-app-column.tsx
const monitorIframe = (iframe) => {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes('embedded-apps')) {
        console.log('Iframe load time:', entry.duration, 'ms');
      }
    }
  });
  observer.observe({ entryTypes: ['resource'] });
};
```

### 2. Context Validator

Validate context completeness:
```javascript
// Add to embedded app
const validateContext = (context) => {
  const required = ['customerId', 'customerName', 'intent'];
  const missing = required.filter(field => !context[field]);
  
  if (missing.length > 0) {
    console.warn('Missing required context fields:', missing);
    console.log('Current context:', context);
  }
  
  return missing.length === 0;
};
```

### 3. Intent Flow Tracer

Track intent through the system:
```javascript
// Add trace logging
const traceIntent = (intent, stage) => {
  console.log(`[TRACE] Intent: ${intent} | Stage: ${stage} | Time: ${new Date().toISOString()}`);
};

// Use throughout the flow:
traceIntent('credit_card_transactions', 'AI_DETECTED');
traceIntent('credit_card_transactions', 'GATEWAY_ENRICHED');
traceIntent('credit_card_transactions', 'FRONTEND_RECEIVED');
traceIntent('credit_card_transactions', 'TAB_CREATED');
traceIntent('credit_card_transactions', 'IFRAME_LOADED');
```

### 4. Database Verification Script

```sql
-- Check app configuration
SELECT 
  app_key,
  title,
  supported_intents,
  allowed_roles,
  active
FROM embedded_apps
WHERE active = true
ORDER BY priority DESC;

-- Check intent coverage
SELECT 
  unnest(supported_intents) as intent,
  COUNT(*) as app_count,
  array_agg(app_key) as apps
FROM embedded_apps
WHERE active = true
GROUP BY intent
ORDER BY app_count DESC;

-- Find unmapped intents (requires intent list)
WITH all_intents AS (
  SELECT unnest(ARRAY[
    'credit_card_transactions',
    'fraud_alert',
    'loan_application',
    -- ... add all intents
  ]) as intent
)
SELECT 
  ai.intent,
  ea.app_key
FROM all_intents ai
LEFT JOIN embedded_apps ea 
  ON ai.intent = ANY(ea.supported_intents)
WHERE ea.app_key IS NULL;
```

## Performance Optimization

### 1. Lazy Loading

Load apps only when needed:
```typescript
const loadApp = async (appKey: string) => {
  // Dynamic import for code splitting
  const module = await import(`./apps/${appKey}`);
  return module.default;
};
```

### 2. Context Caching

Cache customer context to avoid redundant fetches:
```typescript
const contextCache = new Map();

const getCachedContext = (customerId: string) => {
  if (contextCache.has(customerId)) {
    const cached = contextCache.get(customerId);
    if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
      return cached.data;
    }
  }
  return null;
};
```

### 3. Iframe Pooling

Reuse iframes for better performance:
```typescript
const iframePool = [];
const MAX_POOL_SIZE = 5;

const getIframe = () => {
  return iframePool.pop() || createNewIframe();
};

const releaseIframe = (iframe) => {
  if (iframePool.length < MAX_POOL_SIZE) {
    iframe.src = 'about:blank';
    iframePool.push(iframe);
  }
};
```

## Security Considerations

### Origin Validation

Always validate message origins:
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:5175',
  'https://embedded.hsbc.com'
];

window.addEventListener('message', (event) => {
  if (!ALLOWED_ORIGINS.includes(event.origin)) {
    console.warn('Rejected message from untrusted origin:', event.origin);
    return;
  }
  // Process message
});
```

### Input Sanitization

Sanitize URL parameters:
```javascript
const sanitizeParam = (value) => {
  return value
    .replace(/[<>]/g, '')  // Remove potential HTML
    .replace(/javascript:/gi, '')  // Remove JS protocol
    .substring(0, 200);  // Limit length
};
```

### Content Security Policy

Set appropriate CSP headers:
```html
<meta http-equiv="Content-Security-Policy" 
      content="frame-src 'self' http://localhost:5175 https://embedded.hsbc.com;">
```

## Performance Considerations

### Memory Management

Monitor memory usage with multiple tabs:
```typescript
// Memory leak prevention
const cleanupTab = (tabId: string) => {
  // Clear iframe references
  delete iframeRefs.current[tabId]
  
  // Clear timeout references
  if (handshakeTimeoutRefs.current[tabId]) {
    clearTimeout(handshakeTimeoutRefs.current[tabId])
    delete handshakeTimeoutRefs.current[tabId]
  }
  
  // Force garbage collection hint
  if (window.gc && process.env.NODE_ENV === 'development') {
    window.gc()
  }
}
```

### Bundle Size Optimization

Keep embedded apps lightweight:
```json
// package.json optimization
{
  "scripts": {
    "analyze": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js"
  },
  "dependencies": {
    // Prefer lighter alternatives
    "date-fns": "^2.0.0", // instead of moment.js
    "react-virtual": "^2.0.0" // for large lists
  }
}
```

### Connection Pooling

Optimize WebSocket connections:
```typescript
// Shared connection management
class ConnectionManager {
  private static instance: ConnectionManager
  private connections: Map<string, WebSocket> = new Map()
  
  getConnection(url: string): WebSocket {
    if (!this.connections.has(url)) {
      const ws = new WebSocket(url)
      this.connections.set(url, ws)
    }
    return this.connections.get(url)!
  }
  
  closeConnection(url: string) {
    const ws = this.connections.get(url)
    if (ws) {
      ws.close()
      this.connections.delete(url)
    }
  }
}
```

### Performance Monitoring

Track key metrics:
```typescript
// Performance monitoring
const performanceMonitor = {
  trackTabLoad: (tabId: string, startTime: number) => {
    const loadTime = Date.now() - startTime
    
    // Report to analytics
    if (window.gtag) {
      window.gtag('event', 'embedded_app_load', {
        custom_parameter_1: tabId,
        custom_parameter_2: loadTime,
        custom_parameter_3: loadTime > 3000 ? 'slow' : 'fast'
      })
    }
    
    // Log for debugging
    console.log(`Tab ${tabId} loaded in ${loadTime}ms`)
  },
  
  trackHandshakeTimeout: (tabId: string) => {
    console.warn(`Handshake timeout for tab ${tabId}`)
    
    // Report timeout issue
    if (window.gtag) {
      window.gtag('event', 'embedded_app_timeout', {
        custom_parameter_1: tabId
      })
    }
  }
}
```

## Advanced Debugging

### Debug Mode Configuration

Enable comprehensive debugging:
```typescript
// Debug configuration
const DEBUG_CONFIG = {
  enabled: process.env.NODE_ENV === 'development' || localStorage.getItem('debug-embedded-apps') === 'true',
  logLevel: 'trace', // 'error', 'warn', 'info', 'debug', 'trace'
  enablePerformanceTracking: true,
  enableNetworkMonitoring: true
}

// Enhanced trace logging
export const traceLog = (message: string, data?: any) => {
  if (!DEBUG_CONFIG.enabled) return
  
  const timestamp = new Date().toISOString()
  const caller = new Error().stack?.split('\n')[2]?.trim()
  
  console.group(`🔍 [TRACE] ${timestamp}`)
  console.log(message)
  if (data) console.log('Data:', data)
  if (caller) console.log('Caller:', caller)
  console.groupEnd()
}
```

### Development Tools

Browser extension for debugging:
```typescript
// Developer tools integration
declare global {
  interface Window {
    __HSBC_DEBUG__: {
      embeddedApps: {
        tabs: EmbeddedAppTab[]
        activeTabId: string | null
        closedIntents: Set<string>
        getTabState: (tabId: string) => EmbeddedAppTab | undefined
        forceReload: (tabId: string) => void
        simulateIntent: (intent: string) => void
        clearAllTabs: () => void
      }
    }
  }
}

// Expose debug interface
if (DEBUG_CONFIG.enabled) {
  window.__HSBC_DEBUG__ = {
    embeddedApps: {
      get tabs() { return tabs },
      get activeTabId() { return activeTabId },
      get closedIntents() { return closedIntents },
      getTabState: (tabId: string) => tabs.find(t => t.id === tabId),
      forceReload: (tabId: string) => handleRetry(tabId),
      simulateIntent: (intent: string) => createTabForIntent(intent, true),
      clearAllTabs: () => {
        setTabs([])
        setActiveTabId(null)
        setClosedIntents(new Set())
      }
    }
  }
}
```

### Network Monitoring

Track iframe communication:
```typescript
// Message logging
const originalPostMessage = window.postMessage
window.postMessage = function(message, targetOrigin, transfer) {
  if (DEBUG_CONFIG.enableNetworkMonitoring) {
    console.log('📤 [IFRAME] Outgoing message:', {
      message,
      targetOrigin,
      timestamp: new Date().toISOString()
    })
  }
  return originalPostMessage.call(this, message, targetOrigin, transfer)
}

// Incoming message logging
window.addEventListener('message', (event) => {
  if (DEBUG_CONFIG.enableNetworkMonitoring) {
    console.log('📥 [IFRAME] Incoming message:', {
      type: event.data.type,
      origin: event.origin,
      data: event.data,
      timestamp: new Date().toISOString()
    })
  }
})
```

### Error Tracking

Comprehensive error monitoring:
```typescript
// Error boundary for embedded apps
class EmbeddedAppErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('🚨 [EMBEDDED-APP] Error boundary caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      tabId: this.props.tabId,
      timestamp: new Date().toISOString()
    })
    
    // Report to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        tags: {
          component: 'embedded-app-column',
          tabId: this.props.tabId
        },
        extra: errorInfo
      })
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <Alert className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Banking service encountered an error. 
            <Button onClick={() => this.setState({ hasError: false, error: null })}>
              Reset View
            </Button>
          </AlertDescription>
        </Alert>
      )
    }
    
    return this.props.children
  }
}
```

### Diagnostic Commands

Console commands for debugging:
```typescript
// Diagnostic utilities
const debugCommands = {
  // Get system state
  getState: () => ({
    tabs: tabs.length,
    activeTab: activeTabId,
    connectedApps: tabs.filter(t => t.handshakeComplete).length,
    erroredApps: tabs.filter(t => t.error).length,
    loadingApps: tabs.filter(t => t.isLoading).length,
    closedIntents: Array.from(closedIntents),
    agentData: {
      hasCustomer: !!agentData.customer?.id,
      customerTier: agentData.customer?.tier,
      intent: agentData.intent?.type
    }
  }),
  
  // Test handshake
  testHandshake: (tabId: string) => {
    const iframe = iframeRefs.current[tabId]
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'host.ping', tabId }, '*')
      console.log(`🏓 Sent ping to tab ${tabId}`)
    }
  },
  
  // Simulate context change
  simulateContext: (customerId: string, customerName: string) => {
    window.dispatchEvent(new CustomEvent('customer-context:updated', {
      detail: {
        customer: { id: customerId, name: customerName },
        hasContext: true
      }
    }))
  }
}

// Expose to console
if (DEBUG_CONFIG.enabled) {
  Object.assign(window, { debugEmbeddedApps: debugCommands })
}
```

## Testing Checklist

Before deploying a new embedded app:

- [ ] App registered in `embedded_apps` table
- [ ] Supported intents configured correctly
- [ ] URL parameter parsing works
- [ ] Context displays correctly
- [ ] postMessage handshake completes
- [ ] App loads in under 3 seconds
- [ ] Error states handled gracefully
- [ ] Works in both context and manual modes
- [ ] Tab closing/reopening works
- [ ] No duplicate tabs created
- [ ] Security origins validated
- [ ] Performance acceptable with multiple tabs

## Support

For additional help:
- Check browser console for detailed logs
- Review Gateway logs for enrichment issues
- Verify database configuration
- Test with debug mode enabled
- CCAAS platform team for infrastructure issues
