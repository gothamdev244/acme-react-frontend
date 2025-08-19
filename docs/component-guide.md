# HSBC CCAAS Platform - Component Development Guide

## Component Structure Overview

The HSBC CCAAS Platform uses a hierarchical component structure based on atomic design principles, organizing components from simple atoms to complex organisms.

## Component Categories

### 1. Layout Components
Location: `src/components/layout/`

#### SingleAgentLayout
- **Purpose**: Main container for single agent view
- **Key Props**: `children: ReactNode`
- **State Dependencies**: Agent status, call state
- **Usage**:
```typescript
<SingleAgentLayout>
  <Dashboard />
</SingleAgentLayout>
```

#### DashboardLayout
- **Purpose**: Grid-based layout for widget arrangement
- **Key Props**: `columns: number`, `gap: number`
- **State Dependencies**: Layout preferences
- **Features**: Responsive grid, collapsible sections

### 2. Call Control Components
Location: `src/components/call-controls/`

#### MediaControlBarV2
- **Purpose**: Primary call control interface
- **State Management**: Zustand (agent-status-store)
- **Key Features**:
  - Accept/reject incoming calls
  - Mute/hold controls
  - Call transfer capabilities
  - End call with confirmation
- **WebSocket Events**: 
  - `accept_call`
  - `end_call`
  - `transfer_call`

#### InlineCallNotification
- **Purpose**: Floating call notification UI
- **State Management**: Zustand (agent-status-store)
- **Features**:
  - Draggable positioning
  - Auto-accept timer
  - Priority visualization

### 3. Widget Components
Location: `src/components/widgets/`

#### CustomerWidget
- **Purpose**: Display customer information
- **Data Source**: WebSocket messages, PostgreSQL data
- **Key Fields**:
  - Customer details (name, email, phone)
  - Account information
  - History summary
- **Update Frequency**: On call start, real-time updates

#### SentimentWidget
- **Purpose**: Real-time sentiment analysis display
- **Data Source**: AI service via WebSocket
- **Visualization**: Gauge chart with color coding
- **Update Frequency**: Every 5 seconds during active call

#### TranscriptWidget
- **Purpose**: Live call transcription display
- **Features**:
  - Speaker identification
  - Auto-scroll
  - Search functionality
  - Export capability
- **Performance**: Virtual scrolling for long transcripts

#### ActionsWidget
- **Purpose**: Track and manage call actions
- **Features**:
  - Action checklist
  - Completion tracking
  - Priority indicators
  - Notes capability

#### IntentWidget
- **Purpose**: Display detected customer intent
- **AI Integration**: Intent classification from conversation
- **Categories**: 
  - Account inquiry
  - Technical support
  - Billing
  - General inquiry

#### SummaryWidget
- **Purpose**: AI-generated conversation summary
- **Update Trigger**: Every 30 seconds or on demand
- **Format**: Bullet points with key topics

#### MetricsWidget
- **Purpose**: Call and performance metrics
- **Metrics Tracked**:
  - Call duration
  - Handle time
  - Customer satisfaction prediction
  - First call resolution likelihood

#### KnowledgeWidget
- **Purpose**: Relevant knowledge base articles
- **Features**:
  - Context-aware suggestions
  - Search integration
  - Quick copy snippets

### 4. Chat Components
Location: `src/components/chat/`

#### ChatInterface
- **Purpose**: Customer chat interaction
- **Features**:
  - Message history
  - Typing indicators
  - File attachments
  - Quick responses
- **State Management**: Local state with WebSocket sync

#### ResponseTemplates
- **Purpose**: Pre-configured response templates
- **Categories**:
  - Greetings
  - Common issues
  - Escalation
  - Closing
- **Customization**: Editable templates with variables

### 5. Agent Status Components
Location: `src/components/agent-status/`

#### AgentStatusToggle
- **Purpose**: Agent availability control
- **States**: 
  - Available
  - On Call
  - Break
  - After Call Work
  - Do Not Disturb
  - Offline
- **Features**:
  - Timer for ACW and DND
  - Auto-status changes
  - Status history

### 6. Search Components
Location: `src/components/search/`

#### SearchBar
- **Purpose**: Unified search interface
- **Search Scope**:
  - Customers
  - Knowledge base
  - Transaction history
  - Notes
- **Features**:
  - Auto-complete
  - Recent searches
  - Filters

#### SearchResultsOptimized
- **Purpose**: Display paginated search results
- **Performance**: 
  - Virtual scrolling
  - Lazy loading
  - Result caching

### 7. Settings Components
Location: `src/components/settings/`

#### SettingsPanel
- **Purpose**: Application configuration UI
- **Settings Categories**:
  - Call preferences
  - Notification settings
  - Display options
  - Shortcuts
- **Persistence**: Local storage with sync

### 8. Embedded App Components
Location: `src/components/columns/`

#### EmbeddedAppColumn
- **Purpose**: Iframe container for external applications
- **Security**: 
  - Origin validation
  - Sandboxing
  - Message validation
- **Communication**: PostMessage API

## Component Development Standards

### TypeScript Requirements

#### Interface Definition
```typescript
interface ComponentProps {
  // Required props
  id: string
  data: DataType
  
  // Optional props
  className?: string
  onUpdate?: (data: DataType) => void
  
  // Children
  children?: ReactNode
}
```

#### Component Template
```typescript
import { FC, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  // Props definition
}

export const MyComponent: FC<MyComponentProps> = ({
  prop1,
  prop2,
  className,
  ...props
}) => {
  // State management
  const [state, setState] = useState<StateType>()
  
  // Store subscriptions
  const storeValue = useStore(state => state.value)
  
  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies])
  
  // Event handlers
  const handleEvent = () => {
    // Handler logic
  }
  
  // Render
  return (
    <div className={cn('base-classes', className)} {...props}>
      {/* Component content */}
    </div>
  )
}
```

### Styling Guidelines

#### TailwindCSS Usage
```typescript
// Prefer utility classes
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">

// Use cn() for conditional classes
<div className={cn(
  "base-class",
  isActive && "active-class",
  isDisabled && "disabled-class"
)}>
```

#### Responsive Design
```typescript
// Mobile-first approach
<div className="p-2 sm:p-4 md:p-6 lg:p-8">
  <span className="text-sm md:text-base lg:text-lg">
    Responsive text
  </span>
</div>
```

### Performance Optimization

#### Memoization
```typescript
// Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data)
}, [data])

// Memoize components
export const MyComponent = memo(({ prop1, prop2 }) => {
  // Component implementation
})
```

#### Lazy Loading
```typescript
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Use with Suspense
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### State Management Integration

#### Zustand Store Usage
```typescript
// Subscribe to store
const { value, setValue } = useAgentStatusStore(state => ({
  value: state.value,
  setValue: state.setValue
}))

// Selective subscriptions for performance
const callState = useAgentStatusStore(state => state.callState)
```

#### Local vs Global State
```typescript
// Local state for UI-only concerns
const [isOpen, setIsOpen] = useState(false)

// Global state for shared data
const agentStatus = useAgentStatusStore(state => state.status)
```

### Testing Requirements

#### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent prop1="value" />)
    expect(screen.getByText('Expected text')).toBeInTheDocument()
  })
  
  it('handles user interaction', () => {
    const handleClick = jest.fn()
    render(<MyComponent onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### Accessibility Standards

#### ARIA Attributes
```typescript
<button
  aria-label="End call"
  aria-pressed={isActive}
  role="button"
  tabIndex={0}
>
  <PhoneOff />
</button>
```

#### Keyboard Navigation
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  switch(e.key) {
    case 'Enter':
    case ' ':
      handleAction()
      break
    case 'Escape':
      handleCancel()
      break
  }
}
```

## Component Communication Patterns

### Props Drilling Prevention
```typescript
// Use context for deeply nested data
const ThemeContext = createContext<Theme>('light')

// Or use Zustand store
const useThemeStore = create<ThemeState>()
```

### Event Bubbling
```typescript
// Child component
const Child = ({ onAction }) => {
  const handleClick = () => {
    onAction({ type: 'CHILD_ACTION', payload: data })
  }
}

// Parent component
const Parent = () => {
  const handleChildAction = (action) => {
    // Handle action from child
  }
  
  return <Child onAction={handleChildAction} />
}
```

### WebSocket Integration
```typescript
const MyComponent = () => {
  const { sendMessage, lastMessage } = useWebSocket()
  
  useEffect(() => {
    if (lastMessage?.type === 'relevant_type') {
      // Handle message
    }
  }, [lastMessage])
  
  const sendUpdate = () => {
    sendMessage({
      type: 'component_update',
      data: componentData
    })
  }
}
```

## Common Patterns and Solutions

### Loading States
```typescript
const MyComponent = () => {
  const { data, isLoading, error } = useQuery()
  
  if (isLoading) return <Skeleton />
  if (error) return <ErrorMessage error={error} />
  
  return <Content data={data} />
}
```

### Error Boundaries
```typescript
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    // Log error to service
    console.error('Component error:', error, errorInfo)
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    
    return this.props.children
  }
}
```

### Optimistic Updates
```typescript
const MyComponent = () => {
  const [items, setItems] = useState([])
  
  const addItem = async (newItem) => {
    // Optimistic update
    setItems(prev => [...prev, newItem])
    
    try {
      await api.addItem(newItem)
    } catch (error) {
      // Revert on error
      setItems(prev => prev.filter(item => item.id !== newItem.id))
    }
  }
}
```
