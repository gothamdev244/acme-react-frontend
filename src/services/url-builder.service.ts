/**
 * URL Builder Service for Embedded Applications
 * Handles context-aware and manual mode URL generation for third-party apps
 */

import { traceLog } from '../utils/debug'

export interface CustomerContext {
  customerId: string
  accountNumber?: string
  customerName?: string
  customerTier?: string
  intent?: string
  callerId?: string
  email?: string
  phone?: string
  location?: string
  cin?: string
  accountType?: string
}

export interface AppUrlConfig {
  appKey: string
  baseUrl: string
  routes: {
    home: string
    search?: string
    customer?: string
    transactions?: string
    balance?: string
    fraud?: string
    [key: string]: string | undefined
  }
  paramMapping: {
    [key: string]: string | undefined
  }
}

// Base URL for embedded apps - use environment variable with fallback
const EMBEDDED_APP_BASE_URL = import.meta.env.VITE_EMBEDDED_APP_URL || 'http://localhost:5175'

// Configuration for each embedded app
// In production, this would come from a configuration service
const appConfigs: Record<string, AppUrlConfig> = {
  // Card Management Apps
  'credit_card_management': {
    appKey: 'credit_card_management',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/',
      search: '/search',
      customer: '/customer/:customerId',
      transactions: '/customer/:customerId/transactions',
      disputes: '/customer/:customerId/disputes',
      limits: '/customer/:customerId/limits'
    },
    paramMapping: {
      customerId: 'cust_id',
      accountId: 'acct_num',
      intent: 'context'
    }
  },
  'credit_card_transactions': {
    appKey: 'credit_card_transactions',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/',
      customer: '/customer/:customerId/transactions',
      search: '/transactions/search'
    },
    paramMapping: {
      customerId: 'cust_id',
      accountId: 'card_number'
    }
  },
  
  // Security Apps
  'fraud_alert': {
    appKey: 'fraud_alert',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/fraud',
      alerts: '/fraud/alerts',
      customer: '/fraud/customer/:customerId/alerts'
    },
    paramMapping: {
      customerId: 'customer',
      alertId: 'alert_id'
    }
  },
  
  // Loan Apps
  'mortgage_application': {
    appKey: 'mortgage_application',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/mortgage',
      customer: '/mortgage/customer/:customerId',
      application: '/mortgage/application/:customerId'
    },
    paramMapping: {
      customerId: 'cust_id',
      applicationId: 'app_id'
    }
  },
  'student_loan': {
    appKey: 'student_loan',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/loans/student',
      customer: '/loans/student/:customerId'
    },
    paramMapping: {
      customerId: 'cust_id',
      loanId: 'loan_id'
    }
  },
  
  // Account Apps
  'account_balance_inquiry': {
    appKey: 'account_balance_inquiry',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/balance',
      customer: '/balance/:customerId',
      quick: '/balance/quick/:customerId'
    },
    paramMapping: {
      customerId: 'cust_id',
      accountId: 'acct_id'
    }
  },
  
  'account_balance': {
    appKey: 'account_balance',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/',
      customer: '/:customerId',
      balance: '/balance/:customerId'
    },
    paramMapping: {
      customerId: 'customerId',
      accountId: 'accountNumber',
      intent: 'intent'
    }
  },
  
  // Wealth Management (Supervisor Only)
  'wealth_management': {
    appKey: 'wealth_management',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/wealth',
      customer: '/wealth/customer/:customerId',
      portfolio: '/wealth/customer/:customerId/portfolio',
      advisory: '/wealth/customer/:customerId/advisory'
    },
    paramMapping: {
      customerId: 'client_id',
      tier: 'client_tier'
    }
  },
  
  // Manager Tools
  'team_performance': {
    appKey: 'team_performance',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/team/dashboard',
      metrics: '/team/metrics',
      agents: '/team/agents'
    },
    paramMapping: {
      teamId: 'team_id',
      date: 'report_date'
    }
  },
  'quality_assurance': {
    appKey: 'quality_assurance',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/quality',
      review: '/quality/review',
      scoring: '/quality/scoring/:agentId'
    },
    paramMapping: {
      agentId: 'agent_id',
      callId: 'call_id'
    }
  },
  
  // Admin Tools
  'system_admin': {
    appKey: 'system_admin',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/admin/system',
      config: '/admin/system/config',
      monitoring: '/admin/system/monitoring'
    },
    paramMapping: {
      service: 'service_name'
    }
  },
  
  // Chat Agent Tools
  'quick_balance': {
    appKey: 'quick_balance',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/quick/balance',
      customer: '/quick/balance/:customerId'
    },
    paramMapping: {
      customerId: 'cust_id'
    }
  },
  'chat_templates': {
    appKey: 'chat_templates',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/chat/templates',
      category: '/chat/templates/:category'
    },
    paramMapping: {
      category: 'template_category'
    }
  },
  
  // Default configuration for unknown apps
  'default': {
    appKey: 'default',
    baseUrl: EMBEDDED_APP_BASE_URL,
    routes: {
      home: '/'
    },
    paramMapping: {
      customerId: 'customer_id',
      accountId: 'account_id'
    }
  }
}

// Intent to route mapping
const intentRouteMap: Record<string, (config: AppUrlConfig) => string> = {
  'credit_card_transactions': (config) => config.routes.transactions || config.routes.customer || config.routes.home,
  'fraud_alert': (config) => config.routes.alerts || config.routes.customer || config.routes.home,
  'account_balance_inquiry': (config) => config.routes.balance || config.routes.customer || config.routes.home,
  'account_balance': (config) => config.routes.balance || config.routes.customer || config.routes.home,
  'mortgage_application': (config) => config.routes.application || config.routes.customer || config.routes.home,
  'portfolio_analysis_request': (config) => config.routes.portfolio || config.routes.customer || config.routes.home,
  'investment_advice': (config) => config.routes.advisory || config.routes.customer || config.routes.home,
  'dispute_charge': (config) => config.routes.disputes || config.routes.customer || config.routes.home,
  'account_upgrade': (config) => config.routes.customer || config.routes.home,
  'loan_application': (config) => config.routes.customer || config.routes.home
}

/**
 * Build URL for embedded app based on context
 */
export function buildAppUrl(
  appKey: string,
  hasContext: boolean,
  context?: CustomerContext,
  additionalParams?: Record<string, string>
): string {
  traceLog('🛠️ [TRACE] buildAppUrl called with:', {
    appKey,
    hasContext,
    customerId: context?.customerId,
    customerName: context?.customerName,
    context,
    additionalParams,
    timestamp: new Date().toISOString(),
    callStack: new Error().stack?.split('\n').slice(1, 4).map(line => line.trim())
  })
  
  const config = appConfigs[appKey] || appConfigs['default']
  
  // No context - return home or search page
  if (!hasContext || !context?.customerId) {
    traceLog('🏠 [TRACE] buildAppUrl - No context detected, building manual mode URL:', {
      hasContext,
      contextExists: !!context,
      customerId: context?.customerId,
      decision: 'MANUAL_MODE'
    })
    const baseUrl = `${config.baseUrl}${config.routes.home}`
    
    // Add role and mode parameters for manual navigation
    const params = new URLSearchParams()
    params.append('mode', 'manual')
    params.append('appKey', appKey) // Always pass the appKey so the app knows which view to show
    if (additionalParams?.role) {
      params.append('role', additionalParams.role)
    }
    
    const url = `${baseUrl}?${params.toString()}`
    traceLog('🏠 [TRACE] buildAppUrl - Manual mode URL generated:', url)
    return url
  }
  
  // With context - build deep link
  traceLog('🎯 [TRACE] buildAppUrl - Has context, building context mode URL with deep link:', {
    hasContext,
    customerId: context?.customerId,
    decision: 'CONTEXT_MODE'
  })
  return buildDeepLink(config, context, { ...additionalParams, appKey })
}

/**
 * Build deep link with customer context
 */
function buildDeepLink(
  config: AppUrlConfig,
  context: CustomerContext,
  additionalParams?: Record<string, string>
): string {
  const { intent, customerId, accountNumber, customerTier, email, phone, location, cin, accountType } = context
  traceLog('🔗 [TRACE] buildDeepLink called with:', {
    intent,
    customerId,
    accountNumber,
    customerTier,
    additionalParams,
    config: config.appKey,
    timestamp: new Date().toISOString()
  })
  
  // Get appropriate route based on intent
  let route = config.routes.home
  if (intent && intentRouteMap[intent]) {
    route = intentRouteMap[intent](config)
  } else if (config.routes.customer) {
    route = config.routes.customer
  }
  
  // Replace path parameters
  let url = `${config.baseUrl}${route}`
  url = url.replace(':customerId', encodeURIComponent(customerId))
  
  // Build query parameters
  const params = new URLSearchParams()
  
  // Add mode
  params.append('mode', 'context')
  
  // Add appKey if provided
  if (additionalParams?.appKey) {
    params.append('appKey', additionalParams.appKey)
  }
  
  // Add mapped parameters
  if (accountNumber && config.paramMapping.accountId) {
    params.append(config.paramMapping.accountId, accountNumber)
  }
  if (intent && config.paramMapping.intent) {
    params.append(config.paramMapping.intent, intent)
  }
  if (customerTier && config.paramMapping.tier) {
    params.append(config.paramMapping.tier, customerTier)
  }
  
  // Add customer name
  if (context.customerName) {
    params.append('customerName', context.customerName)
  }
  
  // Add customer email
  if (email) {
    params.append('email', email)
  }
  
  // Add customer phone
  if (phone) {
    params.append('phone', phone)
  }
  
  // Add customer location
  if (location) {
    params.append('location', location)
  }
  
  // Add CIN
  if (cin) {
    params.append('cin', cin)
  }
  
  // Add account type
  if (accountType) {
    params.append('accountType', accountType)
  }
  
  // Add any additional parameters
  if (additionalParams) {
    Object.entries(additionalParams).forEach(([key, value]) => {
      if (!params.has(key)) {
        params.append(key, value)
      }
    })
  }
  
  const queryString = params.toString()
  const finalUrl = queryString ? `${url}?${queryString}` : url
  traceLog('🎯 [TRACE] buildDeepLink - Final context mode URL generated:', {
    finalUrl,
    route,
    queryString,
    timestamp: new Date().toISOString()
  })
  return finalUrl
}

/**
 * Extract app key from URL
 */
export function extractAppKeyFromUrl(url: string): string {
  // Try to extract from /embedded-apps/{appKey} pattern
  const match = url.match(/\/embedded-apps\/([^/?]+)/)
  if (match) {
    return match[1]
  }
  
  // Try to extract from query parameters
  const urlObj = new URL(url, 'http://localhost')
  const appKey = urlObj.searchParams.get('appKey')
  if (appKey) {
    return appKey
  }
  
  // Default fallback
  return 'default'
}

/**
 * Check if an app requires customer context
 */
export function requiresCustomerContext(appKey: string): boolean {
  const contextRequiredApps = [
    'credit_card_management',
    'credit_card_transactions',
    'fraud_alert',
    'account_balance_inquiry',
    'account_balance',
    'mortgage_application',
    'student_loan',
    'wealth_management',
    'quick_balance'
  ]
  
  return contextRequiredApps.includes(appKey)
}

/**
 * Get app configuration
 */
export function getAppConfig(appKey: string): AppUrlConfig {
  return appConfigs[appKey] || appConfigs['default']
}

/**
 * Check if app is available for role
 */
export function isAppAvailableForRole(appKey: string, role: string): boolean {
  // This would typically check against the database
  // For now, we'll use a simple mapping
  const roleApps: Record<string, string[]> = {
    'chat_agent': ['quick_balance', 'chat_templates', 'faq_assistant', 'account_balance_inquiry'],
    'agent': ['credit_card_management', 'fraud_alert', 'mortgage_application', 'account_balance_inquiry', 'international_transfer', 'student_loan', 'account_upgrade', 'business_loan'],
    'supervisor': ['wealth_management', 'escalation_hub', 'team_overview', 'credit_card_management', 'fraud_alert'],
    'manager': ['team_performance', 'quality_assurance', 'audit_dashboard', 'escalation_hub'],
    'admin': ['system_admin', 'user_management', 'audit_logs', 'security_center']
  }
  
  return roleApps[role]?.includes(appKey) || false
}
