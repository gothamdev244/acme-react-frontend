import { useState, useEffect, useRef } from 'react'
import { useToast } from './use-toast'

export type UserRole = 'agent' | 'chat' | 'manager'

export interface RoleConfig {
  widgets: {
    customer: boolean
    transcript: boolean
    sentiment: boolean
    summary: boolean
    intent: boolean
    actions: boolean
    knowledge: boolean
    priority: boolean
  }
  features: {
    spaceCopilot: boolean
    kmsAccess: boolean
    embeddedApps: boolean
    settingsAccess: boolean
    telemetryAccess: boolean
  }
  intents: string[]
  columns: {
    canCollapse: boolean
    canResize: boolean
    persistLayout: boolean
  }
}

const DEFAULT_CONFIGS: Record<UserRole, RoleConfig> = {
  agent: {
    widgets: {
      customer: true,
      transcript: true,
      sentiment: true,
      summary: true,
      intent: true,
      actions: true,
      knowledge: true,
      priority: true
    },
    features: {
      spaceCopilot: true,
      kmsAccess: true,
      embeddedApps: true,
      settingsAccess: true,
      telemetryAccess: false
    },
    intents: [
      'credit_card_transactions',
      'account_inquiry',
      'customer_details',
      'payment_issues',
      'general_support'
    ],
    columns: {
      canCollapse: true,
      canResize: true,
      persistLayout: true
    }
  },
  chat: {
    widgets: {
      customer: true,
      transcript: true,
      sentiment: true,
      summary: false,
      intent: true,
      actions: true,
      knowledge: true,
      priority: false
    },
    features: {
      spaceCopilot: true,
      kmsAccess: true,
      embeddedApps: false,
      settingsAccess: true,
      telemetryAccess: false
    },
    intents: [
      'customer_details',
      'general_support',
      'account_inquiry'
    ],
    columns: {
      canCollapse: false,
      canResize: false,
      persistLayout: true
    }
  },
  manager: {
    widgets: {
      customer: true,
      transcript: true,
      sentiment: true,
      summary: true,
      intent: true,
      actions: true,
      knowledge: true,
      priority: true
    },
    features: {
      spaceCopilot: true,
      kmsAccess: true,
      embeddedApps: true,
      settingsAccess: true,
      telemetryAccess: true
    },
    intents: [
      'credit_card_transactions',
      'account_inquiry',
      'customer_details',
      'payment_issues',
      'general_support',
      'dispute_resolution',
      'fraud_detection'
    ],
    columns: {
      canCollapse: true,
      canResize: true,
      persistLayout: true
    }
  }
}

export function useRoleConfig(initialRole: UserRole = 'agent') {
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole)
  const [config, setConfig] = useState<RoleConfig>(DEFAULT_CONFIGS[initialRole])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const isInitialMount = useRef(true)

  // Simulate fetching role config from API
  const fetchRoleConfig = async (role: UserRole): Promise<RoleConfig> => {
    setIsLoading(true)
    
    try {
      // Remove artificial delay for demo responsiveness
      // await new Promise(resolve => setTimeout(resolve, 500))
      
      // In production, this would be:
      // const response = await fetch(`/api/ui-config/roles/${role}`)
      // return await response.json()
      
      return DEFAULT_CONFIGS[role]
    } catch (error) {
      toast({
        title: "Configuration Error",
        description: "Failed to load role configuration. Using defaults.",
        variant: "destructive"
      })
      return DEFAULT_CONFIGS[role]
    } finally {
      setIsLoading(false)
    }
  }

  const updateRole = async (newRole: UserRole, showNotification = true) => {
    if (newRole === currentRole) return

    // Role changing
    const newConfig = await fetchRoleConfig(newRole)
    
    setCurrentRole(newRole)
    setConfig(newConfig)
    
    // Persist role selection
    localStorage.setItem('ccaas-ui-role', newRole)
    
    // Role changed
    
    // Only show notification if explicitly requested (not on initial load)
    if (showNotification) {
      toast({
        title: "Role Updated",
        description: `Switched to ${newRole === 'agent' ? 'Voice Agent' : newRole === 'chat' ? 'Chat Agent' : 'Supervisor'} role`,
      })
    }
  }

  // Load persisted role on mount
  useEffect(() => {
    // Only run once on initial mount
    if (!isInitialMount.current) return
    isInitialMount.current = false
    
    const savedRole = localStorage.getItem('ccaas-ui-role') as UserRole
    if (savedRole && savedRole !== currentRole) {
      // Don't show notification on initial load
      updateRole(savedRole, false)
    }
  }, [])

  return {
    currentRole,
    config,
    isLoading,
    updateRole,
    // Helper functions
    canAccessWidget: (widget: keyof RoleConfig['widgets']) => config.widgets[widget],
    canAccessFeature: (feature: keyof RoleConfig['features']) => config.features[feature],
    getAvailableIntents: () => config.intents,
    canManageColumns: () => config.columns.canCollapse || config.columns.canResize
  }
}
