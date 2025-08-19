# Frontend Architecture

## Technology Stack

- **React 19.1** - UI framework with concurrent features
- **TypeScript 5.9** - Type safety and developer experience  
- **Vite 6.0** - Fast build tool and dev server
- **Zustand 5.0** - State management with persistence
- **Tailwind CSS 3.4** - Utility-first styling
- **shadcn/ui** - Component library built on Radix UI
- **Lucide React** - Icon library

## Project Structure

```
src/
├── components/          # UI components
│   ├── auth/           # Authentication components
│   ├── columns/        # 3-column layout components
│   ├── layout/         # Layout components
│   ├── chat/           # Chat interface
│   ├── call-controls/  # Call management
│   └── ui/            # shadcn/ui base components
├── contexts/           # React contexts
│   ├── auth-context    # Authentication state
│   ├── websocket-context # WebSocket connection
│   ├── role-context    # Role-based features
│   └── theme-context   # Theme management
├── stores/            # Zustand stores
│   ├── agent-store    # Agent dashboard data
│   └── agent-status-store # Call state & status
├── hooks/             # Custom React hooks
├── config/            # App configuration
├── lib/              # Utilities
└── pages/            # Route components
```

## Key Design Decisions

### 1. State Management

**Zustand over Redux/Context API**
- Simpler API with less boilerplate
- Built-in persistence middleware for localStorage
- Better TypeScript support
- Selective subscriptions prevent unnecessary re-renders

### 2. WebSocket Architecture

**Native WebSocket over Socket.io**
- Lighter weight, no additional protocol overhead
- Direct message passing without event emitters
- Automatic reconnection with exponential backoff
- Heartbeat mechanism for connection health

### 3. Component Architecture

**Compound Components Pattern**
- Column components manage their own state
- Collapsible behavior via custom hook
- Persistent column visibility in localStorage

**Composition over Inheritance**
- Functional components exclusively
- Custom hooks for shared logic
- Props drilling minimized via context

### 4. Authentication

**Mock Authentication (Development)**
- Simple username/password for testing
- Protected routes with requireAuth flag
- Session persistence in localStorage
- WebSocket disconnect on logout

### 5. Real-time Data Flow

```
Gateway WebSocket → WebSocket Context → Zustand Store → UI Components
```

**Message Types Consumed:**
- `sentiment` - Customer sentiment analysis
- `priority` - Call priority and queue position
- `summary` - AI-generated call summary
- `intent` - Customer intent detection
- `actions` - Recommended agent actions
- `knowledge` - Knowledge base articles
- `transcript` - Call transcription
- `customer` - Customer data from PostgreSQL

### 6. Performance Optimizations

**Code Splitting**
- Route-based lazy loading
- Dynamic imports for heavy components

**Memoization**
- React.memo for expensive components
- useMemo for computed values
- useCallback for stable function references

**Virtual Scrolling**
- Long transcript lists virtualized
- Prevents DOM node explosion

## Critical Components

### WebSocketProvider
- Manages WebSocket lifecycle
- Handles reconnection logic
- Routes messages to store
- Provides connection status

### ProtectedRoute
- Guards authenticated routes
- Default requireAuth = true (security fix)
- Redirects to login when unauthorized

### ColumnLayout
- 3-column responsive layout
- Collapsible columns with animation
- Persistent visibility state
- Mobile-responsive behavior

### AgentStatusStore
- Call state management
- Media control bar state
- Persisted with Zustand middleware
- Cleared on logout

## Data Flow

### Customer Context
1. Customer data fetched from PostgreSQL
2. Sent via WebSocket message type `customer`
3. Stored in agent-store
4. UI components subscribe to updates
5. Embedded apps notified via custom event

### AI Processing Pipeline

#### Current Implementation
- **AI Simulation Service** (Port 8000): Python FastAPI service that simulates call processing
- **Embedded Apps** (Ports 3001-3003): Intent-specific micro frontends
- Generates mock transcriptions and AI analysis
- Publishes to Kafka topics for real-time updates
- Will be replaced by Genesys integration in production

#### Production Flow (Future Genesys Integration)
1. Audio → Genesys transcription service
2. Transcript → AI service for analysis
3. Results broadcast via Kafka topics:
   - `sentiment_analysis`
   - `priority_scoring`
   - `call_summary`
   - `intent_classification`
   - `recommended_actions`
   - `knowledge_suggestions`
   - `call_transcription`

## Security Considerations

- All routes protected by default
- WebSocket requires agentId and callerId
- Input sanitization in forms
- No sensitive data in localStorage
- CORS configured for production domains

## Testing Strategy

- Unit tests with Vitest
- Component testing with React Testing Library
- E2E tests with Playwright (planned)
- Type checking with TypeScript strict mode

## Future Improvements

- Implement real authentication (JWT/OAuth)
- Add WebSocket message encryption
- Implement proper error boundaries
- Add performance monitoring (Sentry)
- Migrate to React Server Components
- Add offline support with Service Workers
