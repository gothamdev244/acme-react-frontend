# WebSocket Message Documentation

## Connection

### URL Format
```
ws://localhost:8080/ws/agent?callerId={callerId}&agentId={agentId}&role={role}
```

### Parameters
- `callerId` - Unique identifier for the call session
- `agentId` - Agent identifier
- `role` - Optional role (agent, supervisor, manager)

## Incoming Messages (Gateway → Frontend)

### sentiment
Customer sentiment analysis from AI service.

```json
{
  "type": "sentiment",
  "sentiment": "positive", // positive, negative, neutral
  "confidence": 0.85,
  "trend": "stable",
  "change": 0
}
```

### priority
Call priority and queue information.

```json
{
  "type": "priority",
  "level": "HIGH", // HIGH, MEDIUM, LOW
  "waitTime": 120,
  "estimatedResolution": 300,
  "escalation": false,
  "queuePosition": 3
}
```

### summary
AI-generated call summary.

```json
{
  "type": "summary",
  "summary": "Customer calling about billing issue",
  "category": "Billing",
  "confidence": 0.92
}
```

### intent
Customer intent classification with embedded app mapping.

```json
{
  "type": "intent",
  "intent": "CHECK_BALANCE",
  "confidence": 0.88,
  "accuracy": "High",
  "appUrl": "/embedded/billing",
  "appTitle": "Billing Dashboard",
  "timestamp": "2025-01-17T10:30:00Z"
}
```

### actions
Recommended actions for the agent.

```json
{
  "type": "actions",
  "actions": [
    {
      "id": "1",
      "action": "Verify customer identity",
      "priority": "HIGH",
      "completed": false
    },
    {
      "id": "2", 
      "action": "Check account status",
      "priority": "MEDIUM",
      "completed": false
    }
  ]
}
```

### knowledge_articles
Relevant knowledge base articles.

```json
{
  "type": "knowledge_articles",
  "articles": [
    {
      "id": "KB001",
      "title": "How to reset password",
      "relevance": 0.95,
      "url": "/kb/reset-password"
    }
  ]
}
```

### transcript
Real-time call transcription.

```json
{
  "type": "transcript",
  "speaker": "customer", // customer or agent
  "text": "I need help with my account",
  "timestamp": "2025-01-17T10:30:45Z"
}
```

### customer
Customer information from PostgreSQL.

```json
{
  "type": "customer",
  "customer": {
    "id": "CUST-12345",
    "customerId": "12345",
    "name": "John Smith",
    "email": "john.smith@example.com",
    "phone": "+1-555-0123",
    "accountType": "Premium",
    "accountNumber": "ACC-98765",
    "memberSince": "2020-01-15",
    "lifetimeValue": 15000,
    "riskScore": 10,
    "preferredChannel": "phone",
    "lastInteraction": "2025-01-10"
  }
}
```

## Outgoing Messages (Frontend → Gateway)

### heartbeat
Keep-alive message sent every 15 seconds.

```json
{
  "type": "heartbeat"
}
```

### accept_call
Accept an incoming call.

```json
{
  "type": "accept_call",
  "callerId": "call-123",
  "agentId": "agent-001",
  "callerName": "John Smith" // Optional, triggers customer data refresh
}
```

### end_call
End the current call.

```json
{
  "type": "end_call",
  "callerId": "call-123",
  "agentId": "agent-001"
}
```

## Connection Management

### Reconnection
- Automatic reconnection with exponential backoff
- Max 5 reconnection attempts
- Delays: 3s, 6s, 12s, 24s, 30s

### Connection States
- `connecting` - WebSocket connecting
- `connected` - WebSocket open
- `disconnected` - WebSocket closed
- `error` - Connection error

### Heartbeat
- Sent every 15 seconds
- Maintains connection health
- Prevents timeout disconnection

## Error Handling

Connection errors result in automatic reconnection unless:
- Intentional disconnect (logout)
- Max reconnection attempts reached
- Service shutdown in progress
- Rate limit exceeded

## Data Flow

1. **Connection established** with agentId and callerId
2. **Initial data** sent:
   - Customer data from PostgreSQL
   - Agent metrics from database
3. **Real-time updates** via Kafka topics:
   - AI analysis results
   - Transcription updates
   - Knowledge suggestions
4. **User actions** sent to gateway:
   - Accept/end call
   - Heartbeat for connection health

## Security

- Parameters validated for injection attacks
- Message size limited to 10KB
- Rate limiting per IP address
- Malicious pattern detection
- Control character filtering
