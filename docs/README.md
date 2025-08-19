# Frontend Documentation

## Core Documentation

- [Architecture Overview](./architecture.md) - System design and key decisions
- [WebSocket Messages](./websocket-messages.md) - Real-time message formats and flow
- [State Management](./state-management.md) - Zustand stores and patterns
- [Three Column Layout](./three-column-architecture.md) - UI layout architecture
- [Component Guide](./component-guide.md) - Component development patterns

## Integration Guides

- [Embedded Apps](./embedded-apps-integration.md) - Integrating embedded applications
- [Mock Data Configuration](./mock-data-configuration.md) - Development data setup

## Technology Stack

- **React 19.1** - UI framework
- **TypeScript 5.9** - Type safety
- **Vite 6.0** - Build tool
- **Zustand 5.0** - State management
- **Tailwind CSS 3.4** - Styling
- **shadcn/ui** - Component library

## Key Features

### Real-time Updates
The frontend maintains a WebSocket connection to the gateway service for real-time data:
- Customer information from PostgreSQL
- AI-powered call analysis (sentiment, intent, summary)
- Recommended actions and knowledge articles
- Live call transcription

### State Management
Two primary Zustand stores manage application state:
- **Agent Store** - Dashboard data from WebSocket
- **Agent Status Store** - Call state and availability (persisted)

### Authentication
- Protected routes with default `requireAuth=true`
- Mock authentication for development
- WebSocket disconnect on logout
- Session persistence in localStorage

### UI Architecture
- 3-column responsive layout
- Collapsible columns with persistence
- Dark theme support
- Professional design with shadcn/ui

## Message Flow

```
Customer Call → AI Simulation (Python) → Kafka Topics → Gateway → WebSocket → Frontend
                                             ↓
                                        PostgreSQL
                                             ↓
                                       Customer Data
```

**Note**: The Python AI simulation service (`start-app.sh`/`stop-app.sh`) is used for development and will be replaced by Genesys integration in production.

## Kafka Topics Consumed

The gateway service processes these Kafka topics and forwards to frontend:

1. `sentiment_analysis` - Customer sentiment
2. `priority_scoring` - Call priority level
3. `call_summary` - AI-generated summary
4. `intent_classification` - Customer intent
5. `recommended_actions` - Agent guidance
6. `knowledge_suggestions` - Relevant articles
7. `call_transcription` - Real-time transcript

Note: Customer data comes from PostgreSQL, not Kafka.

## Development

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build
```

The frontend connects to:
- Gateway WebSocket (port 8080)
- AI simulation service (port 8000)
- Embedded apps (ports 3001-3003)

## Security Considerations

- All routes protected by default
- Input sanitization in forms
- No sensitive data in localStorage
- WebSocket requires agentId and callerId
- Message validation in gateway service
