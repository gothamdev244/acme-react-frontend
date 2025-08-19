/**
 * Application Configuration
 * Centralized configuration management with environment-based settings
 */

export interface ServiceEndpoints {
  websocket: {
    baseUrl: string
    path: string
    callCenterPath: string
    defaultPort: number
  }
  aiService: {
    baseUrl: string
    stopCallPath: string
  }
  searchService: {
    baseUrl: string
    embeddedAppsPath: string
    documentsPath: string
  }
  gatewayService: {
    baseUrl: string
    healthPath: string
    metricsPath: string
  }
  knowledgePortal: {
    baseUrl: string
    articlesPath: string
  }
}

export interface AppConfig {
  environment: 'development' | 'staging' | 'production'
  services: ServiceEndpoints
  features: {
    enableMockData: boolean
    enableAISimulation: boolean
    enableDebugLogging: boolean
    autoConnectWebSocket: boolean
  }
  ui: {
    defaultTheme: 'light' | 'dark' | 'system'
    animationsEnabled: boolean
    toastDuration: number
  }
  websocket: {
    reconnectInterval: number
    heartbeatInterval: number
    maxReconnectAttempts: number
    maxReconnectDelay: number
  }
}

// Environment variable helpers
const getEnvVar = (key: string, defaultValue: string): string => {
  if (typeof window !== 'undefined') {
    // Client-side: check for Vite environment variables
    return import.meta.env[`VITE_${key}`] || defaultValue
  }
  return defaultValue
}

const getEnvBool = (key: string, defaultValue: boolean): boolean => {
  const value = getEnvVar(key, defaultValue.toString())
  return value.toLowerCase() === 'true'
}

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = getEnvVar(key, defaultValue.toString())
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

// Default configuration with environment variable fallbacks
const createDefaultConfig = (): AppConfig => ({
  environment: (getEnvVar('NODE_ENV', 'development') as any) || 'development',
  
  services: {
    websocket: {
      baseUrl: getEnvVar('WEBSOCKET_BASE_URL', 'ws://localhost'),
      path: getEnvVar('WEBSOCKET_PATH', '/ws'),
      callCenterPath: getEnvVar('WEBSOCKET_CALL_CENTER_PATH', '/ws/call-center'),
      defaultPort: getEnvNumber('WEBSOCKET_PORT', 8080)
    },
    
    aiService: {
      baseUrl: getEnvVar('AI_SERVICE_BASE_URL', 'http://localhost:8000'),
      stopCallPath: getEnvVar('AI_SERVICE_STOP_CALL_PATH', '/api/calls/stop')
    },
    
    searchService: {
      baseUrl: getEnvVar('SEARCH_SERVICE_BASE_URL', 'http://localhost:8081'),
      embeddedAppsPath: getEnvVar('SEARCH_EMBEDDED_APPS_PATH', '/api/embedded-apps/search'),
      documentsPath: getEnvVar('SEARCH_DOCUMENTS_PATH', '/api/documents/search')
    },
    
    gatewayService: {
      baseUrl: getEnvVar('GATEWAY_SERVICE_BASE_URL', 'http://localhost:8080'),
      healthPath: getEnvVar('GATEWAY_HEALTH_PATH', '/health'),
      metricsPath: getEnvVar('GATEWAY_METRICS_PATH', '/metrics')
    },
    
    knowledgePortal: {
      baseUrl: getEnvVar('KNOWLEDGE_PORTAL_BASE_URL', 'http://localhost:3001'),
      articlesPath: getEnvVar('KNOWLEDGE_ARTICLES_PATH', '/api/articles')
    }
  },
  
  features: {
    enableMockData: getEnvBool('ENABLE_MOCK_DATA', true),
    enableAISimulation: getEnvBool('ENABLE_AI_SIMULATION', true),
    enableDebugLogging: getEnvBool('ENABLE_DEBUG_LOGGING', true),
    autoConnectWebSocket: getEnvBool('AUTO_CONNECT_WEBSOCKET', false)
  },
  
  ui: {
    defaultTheme: (getEnvVar('DEFAULT_THEME', 'system') as any) || 'system',
    animationsEnabled: getEnvBool('ANIMATIONS_ENABLED', true),
    toastDuration: getEnvNumber('TOAST_DURATION', 3000)
  },
  
  websocket: {
    reconnectInterval: getEnvNumber('WS_RECONNECT_INTERVAL', 3000),
    heartbeatInterval: getEnvNumber('WS_HEARTBEAT_INTERVAL', 15000),
    maxReconnectAttempts: getEnvNumber('WS_MAX_RECONNECT_ATTEMPTS', 10),
    maxReconnectDelay: getEnvNumber('WS_MAX_RECONNECT_DELAY', 30000)
  }
})

// Configuration instance
let appConfig: AppConfig | null = null

/**
 * Get the application configuration
 * Initializes config on first access
 */
export const getAppConfig = (): AppConfig => {
  if (!appConfig) {
    appConfig = createDefaultConfig()
    
    // Configuration loaded
  }
  
  return appConfig
}

/**
 * Get WebSocket URL with parameters
 */
export const getWebSocketUrl = (params?: { 
  callerId?: string 
  agentId?: string 
  role?: string
  port?: number 
}): string => {
  const config = getAppConfig()
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

/**
 * Get AI Service stop call URL
 */
export const getAIServiceStopUrl = (): string => {
  const config = getAppConfig()
  return `${config.services.aiService.baseUrl}${config.services.aiService.stopCallPath}`
}

/**
 * Get Search Service URLs
 */
export const getSearchServiceUrls = () => {
  const config = getAppConfig()
  return {
    embeddedApps: `${config.services.searchService.baseUrl}${config.services.searchService.embeddedAppsPath}`,
    documents: `${config.services.searchService.baseUrl}${config.services.searchService.documentsPath}`
  }
}

/**
 * Get Gateway Service URLs
 */
export const getGatewayServiceUrls = () => {
  const config = getAppConfig()
  return {
    health: `${config.services.gatewayService.baseUrl}${config.services.gatewayService.healthPath}`,
    metrics: `${config.services.gatewayService.baseUrl}${config.services.gatewayService.metricsPath}`
  }
}

/**
 * Get Knowledge Portal URLs
 */
export const getKnowledgePortalUrls = () => {
  const config = getAppConfig()
  return {
    articles: `${config.services.knowledgePortal.baseUrl}${config.services.knowledgePortal.articlesPath}`
  }
}

/**
 * Override configuration for testing or dynamic changes
 */
export const setAppConfig = (overrides: Partial<AppConfig>): void => {
  if (!appConfig) {
    appConfig = createDefaultConfig()
  }
  
  // Deep merge configuration
  appConfig = {
    ...appConfig,
    ...overrides,
    services: {
      ...appConfig.services,
      ...overrides.services
    },
    features: {
      ...appConfig.features,
      ...overrides.features
    },
    ui: {
      ...appConfig.ui,
      ...overrides.ui
    },
    websocket: {
      ...appConfig.websocket,
      ...overrides.websocket
    }
  }
}

// Export default config for convenience
export default getAppConfig
