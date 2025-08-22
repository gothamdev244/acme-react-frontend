# EC2 Deployment Instructions for ACME React Frontend

This file contains all the changes needed to deploy the ACME React Frontend on EC2 with only port 5173 exposed.

## Step 1: Create .env file on EC2

SSH into your EC2 instance and navigate to the acme-react-frontend folder, then run:

```bash
cd acme-react-frontend

# Create .env file with these exact values
cat > .env << 'EOF'
VITE_WEBSOCKET_BASE_URL=/ws
VITE_AI_SERVICE_BASE_URL=/api
VITE_SEARCH_SERVICE_BASE_URL=/api/search
VITE_GATEWAY_SERVICE_BASE_URL=/api
VITE_KNOWLEDGE_PORTAL_BASE_URL=/api/knowledge
VITE_EMBEDDED_APP_URL=/embedded
VITE_ALLOWED_ORIGINS=*
EOF
```

## Step 2: Update vite.config.js

Add these proxy configurations to the `server` section in `vite.config.js`:

```javascript
// vite.config.js
export default defineConfig({
  // ... existing config ...
  server: {
    host: '0.0.0.0',  // Add this to allow external access
    port: 5173,       // Add this to ensure port 5173
    hmr: {
      overlay: false,
      timeout: 60000,
    },
    proxy: {
      '/api/search': {
        target: 'http://localhost:8091',
        changeOrigin: true,
        secure: false,
      },
      // ADD THESE NEW PROXY ENTRIES:
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/config': {
        target: 'http://localhost:5173',
        changeOrigin: true,
      },
    },
  },
  // ... rest of config ...
})
```

## Step 3: Update src/config/app-config.ts

### 3.1: Fix WebSocket URL construction (around line 151)

Replace the existing `getWebSocketUrl` function with:

```typescript
export const getWebSocketUrl = (params?: { 
  callerId?: string 
  agentId?: string 
  role?: string
  port?: number 
}): string => {
  const config = getAppConfig()
  
  // Handle relative path for EC2 proxy (NO HTTPS/WSS)
  if (config.services.websocket.baseUrl === '/ws') {
    // Always use ws:// (no wss since no certificates)
    const protocol = 'ws:'
    const host = window.location.host
    const path = config.services.websocket.callCenterPath || '/call-center'
    const baseUrl = `${protocol}//${host}/ws${path}`
    
    if (params?.callerId || params?.agentId || params?.role) {
      const searchParams = new URLSearchParams()
      if (params.callerId) searchParams.set('callerId', params.callerId)
      if (params.agentId) searchParams.set('agentId', params.agentId)
      if (params.role) searchParams.set('role', params.role)
      return `${baseUrl}?${searchParams.toString()}`
    }
    return baseUrl
  }
  
  // Keep existing logic for local development
  const port = params?.port || config.services.websocket.defaultPort
  const baseUrl = `${config.services.websocket.baseUrl}:${port}${config.services.websocket.callCenterPath}`
  
  if (params?.callerId || params?.agentId || params?.role) {
    const searchParams = new URLSearchParams()
    if (params.callerId) searchParams.set('callerId', params.callerId)
    if (params.agentId) searchParams.set('agentId', params.agentId)
    if (params.role) searchParams.set('role', params.role)
    return `${baseUrl}?${searchParams.toString()}`
  }
  
  return baseUrl
}
```

### 3.2: Fix AI Service URL (around line 175)

Replace the existing `getAIServiceStopUrl` function with:

```typescript
export const getAIServiceStopUrl = (): string => {
  const config = getAppConfig()
  // If using relative path for EC2, return simple API path
  if (config.services.aiService.baseUrl === '/api') {
    return '/api/calls/stop'
  }
  return `${config.services.aiService.baseUrl}${config.services.aiService.stopCallPath}`
}
```

### 3.3: Fix other service URL helpers (around lines 183-210)

Update these functions to handle relative paths:

```typescript
export const getSearchServiceUrls = () => {
  const config = getAppConfig()
  // Handle relative paths for EC2
  if (config.services.searchService.baseUrl === '/api/search') {
    return {
      embeddedApps: '/api/search/embedded-apps/search',
      documents: '/api/search/documents/search'
    }
  }
  return {
    embeddedApps: `${config.services.searchService.baseUrl}${config.services.searchService.embeddedAppsPath}`,
    documents: `${config.services.searchService.baseUrl}${config.services.searchService.documentsPath}`
  }
}

export const getGatewayServiceUrls = () => {
  const config = getAppConfig()
  // Handle relative paths for EC2
  if (config.services.gatewayService.baseUrl === '/api') {
    return {
      health: '/api/health',
      metrics: '/api/metrics'
    }
  }
  return {
    health: `${config.services.gatewayService.baseUrl}${config.services.gatewayService.healthPath}`,
    metrics: `${config.services.gatewayService.baseUrl}${config.services.gatewayService.metricsPath}`
  }
}

export const getKnowledgePortalUrls = () => {
  const config = getAppConfig()
  // Handle relative paths for EC2
  if (config.services.knowledgePortal.baseUrl === '/api/knowledge') {
    return {
      articles: '/api/knowledge/articles'
    }
  }
  return {
    articles: `${config.services.knowledgePortal.baseUrl}${config.services.knowledgePortal.articlesPath}`
  }
}
```

## Step 4: Add health check file

Create a file `public/health.txt` with just:
```
OK
```

## Step 5: Start the application on EC2

```bash
# Make sure you're in the acme-react-frontend directory
cd acme-react-frontend

# Install dependencies if not already done
npm install

# Start the development server with host binding
npm run dev -- --host 0.0.0.0
```

## Step 6: Configure ALB Health Check

In AWS ALB settings, set the health check:
- **Path**: `/health.txt`
- **Port**: `5173`
- **Protocol**: `HTTP`
- **Success codes**: `200`

## Important Notes

1. **DO NOT commit the .env file** - it should be in .gitignore
2. **No HTTPS/WSS** - This setup uses only HTTP/WS since there are no certificates
3. **All services proxied** - Everything goes through port 5173 via Vite's proxy
4. **Search already works** - The `/api/search` proxy is already configured and working

## Testing

After deployment, test these endpoints from your browser:
1. Open `http://<EC2-PUBLIC-IP>:5173` - Should load the UI
2. Check Network tab - WebSocket should connect to `/ws/call-center`
3. Search functionality should work (already confirmed working)
4. AI service calls should go through `/api`

## Troubleshooting

If WebSocket doesn't connect:
- Check that port 8080 service is running locally on EC2
- Verify .env file has correct values
- Check browser console for connection errors

If AI service doesn't work:
- Verify port 8000 service is running locally on EC2
- Check that `/api` proxy is correctly configured

## File Changes Summary

1. **.env** - Create new file (don't commit)
2. **vite.config.js** - Add proxy entries
3. **src/config/app-config.ts** - Update URL helper functions
4. **public/health.txt** - Create health check file