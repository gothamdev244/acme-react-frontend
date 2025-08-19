# HSBC CCAAS Platform - Frontend Architecture

## Overview

The HSBC CCAAS Platform frontend is a modern React-based ccaas center application built with TypeScript, providing a comprehensive agent interface for handling customer interactions across multiple channels.

## Technology Stack

### Core Technologies
- **React 19.1** - Component-based UI framework
- **TypeScript 5.9** - Type-safe JavaScript
- **Vite 6.0** - Fast build tool and development server
- **TailwindCSS 3.4** - Utility-first CSS framework
- **Zustand 5.0** - Lightweight state management
- **WebSocket** - Real-time bidirectional communication

### Key Libraries
- **Shadcn/UI** - Accessible component library
- **Radix UI** - Unstyled, accessible components
- **React Query** - Server state management
- **React Hook Form** - Form validation and handling
- **Lucide React** - Icon library
- **Recharts** - Data visualization

## Application Structure

```
frontend/
├── src/
│   ├── components/       # React components
│   ├── stores/           # Zustand state stores
│   ├── services/         # Business logic and API services
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React context providers
│   ├── utils/            # Utility functions
│   ├── lib/              # Third-party integrations
│   ├── config/           # Application configuration
│   └── types/            # TypeScript type definitions
├── public/
│   └── config/           # Externalized JSON configurations
├── docs/                 # Documentation
└── dist/                 # Production build output
```

## Core Architecture Principles

### 1. Component-Based Architecture
- **Atomic Design Pattern**: Components organized from atoms to organisms
- **Single Responsibility**: Each component handles one specific concern
- **Composition over Inheritance**: Complex UI built through component composition

### 2. State Management Strategy
- **Zustand for Global State**: Centralized store for agent status, call state, and application data
- **React Query for Server State**: Caching and synchronization of server data
- **Local Component State**: UI-specific state kept in components
- **Context for Cross-Cutting Concerns**: WebSocket connections, themes, authentication

### 3. Real-Time Communication
- **WebSocket Architecture**: Persistent connections for real-time updates
- **Event-Driven Updates**: Message-based communication pattern
- **Connection Resilience**: Automatic reconnection with exponential backoff
- **Message Queue**: Buffering for offline scenarios

### 4. Performance Optimization
- **Code Splitting**: Dynamic imports for route-based splitting
- **Lazy Loading**: Components loaded on demand
- **Memoization**: Strategic use of React.memo and useMemo
- **Virtual Scrolling**: Efficient rendering of large lists

## Key Architectural Patterns

### 1. Container/Presenter Pattern
```typescript
// Container Component - Handles logic
const CustomerListContainer = () => {
  const customers = useCustomerStore()
  const { filter, sort } = useFilterStore()
  
  return <CustomerList data={customers} filter={filter} sort={sort} />
}

// Presenter Component - Pure UI
const CustomerList = ({ data, filter, sort }) => {
  // Pure rendering logic
}
```

### 2. Custom Hook Pattern
```typescript
// Encapsulate complex logic in hooks
const useCallManagement = () => {
  const { callState, startCall, endCall } = useAgentStatusStore()
  const { connect, disconnect } = useWebSocket()
  
  // Complex call handling logic
  return { callState, handleCall, handleEndCall }
}
```

### 3. Service Layer Pattern
```typescript
// Services handle external communication
class CustomerService {
  async getCustomer(id: string): Promise<Customer> {
    // API calls, caching, error handling
  }
}
```

## Data Flow Architecture

### 1. Unidirectional Data Flow
```
User Action → Event Handler → Store Action → State Update → UI Re-render
```

### 2. WebSocket Message Flow
```
Server Message → WebSocket Context → Message Router → Store Updates → Component Updates
```

### 3. API Request Flow
```
Component → Service Layer → HTTP Client → API → Response Processing → State Update
```

## Module Organization

### Component Categories
1. **Layout Components**: Frame, headers, navigation
2. **Feature Components**: Call controls, chat interface, customer details
3. **Widget Components**: Metrics, sentiment, actions, transcripts
4. **Common Components**: Buttons, inputs, modals, cards

### Service Categories
1. **API Services**: REST API communication
2. **WebSocket Services**: Real-time messaging
3. **Storage Services**: Local/session storage management
4. **Utility Services**: Audio, notifications, formatting

## Build and Deployment

### Development Build
```bash
npm run dev        # Start development server on port 5173
npm run dev:host  # Expose to network for testing
```

### Production Build
```bash
npm run build     # Create optimized production build
npm run preview   # Preview production build locally
```

### Build Optimization
- **Tree Shaking**: Removes unused code
- **Minification**: Reduces file sizes
- **Compression**: Gzip/Brotli compression
- **Asset Optimization**: Image and font optimization

## Environment Configuration

### Environment Variables
```
VITE_API_BASE_URL          # Backend API endpoint
VITE_WS_URL                # WebSocket server URL
VITE_AI_SERVICE_URL        # AI service endpoint
VITE_ENABLE_MOCK_DATA      # Toggle mock data mode
VITE_ENABLE_DEBUG_LOGGING  # Control debug output
```

### Configuration Hierarchy
1. Environment variables (highest priority)
2. Configuration files (app-config.ts)
3. Default values (fallback)

## Security Considerations

### 1. Authentication & Authorization
- JWT token-based authentication
- Role-based access control (RBAC)
- Secure token storage (httpOnly cookies)

### 2. Data Protection
- Input validation and sanitization
- XSS prevention through React's built-in escaping
- CSRF protection via tokens

### 3. Communication Security
- HTTPS enforcement in production
- WSS (WebSocket Secure) for real-time data
- API request signing for sensitive operations

## Performance Metrics

### Target Metrics
- **Initial Load**: < 3 seconds
- **Time to Interactive**: < 5 seconds
- **API Response**: < 500ms (p95)
- **WebSocket Latency**: < 100ms
- **Frame Rate**: 60 FPS for animations

### Monitoring
- Performance monitoring via browser APIs
- Error tracking and reporting
- User session recording for debugging
- Real-time performance dashboards

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- CDN for static assets
- Load balancing for API requests

### Vertical Scaling
- Efficient memory management
- Optimized bundle sizes
- Progressive enhancement

## Future Architecture Enhancements

### Planned Improvements
1. **Micro-Frontend Architecture**: Independent deployment of features
2. **Module Federation**: Dynamic module loading
3. **Service Workers**: Offline capabilities
4. **WebAssembly Integration**: Performance-critical computations
5. **Server-Side Rendering**: Initial page load optimization

### Technology Upgrades
1. Migration to React Server Components
2. Adoption of React Suspense for data fetching
3. Implementation of React Concurrent Features
4. Progressive Web App capabilities

## Architecture Decision Records (ADRs)

### ADR-001: Zustand for State Management
**Decision**: Use Zustand instead of Redux
**Rationale**: Simpler API, smaller bundle size, TypeScript-first design
**Consequences**: Less ecosystem, custom middleware needed

### ADR-002: Vite as Build Tool
**Decision**: Use Vite instead of Webpack
**Rationale**: Faster development builds, better HMR, simpler configuration
**Consequences**: Less mature ecosystem, some plugin compatibility

### ADR-003: Component Library Strategy
**Decision**: Use Shadcn/UI with Radix primitives
**Rationale**: Full control over components, accessibility built-in
**Consequences**: More setup required, custom theming needed
