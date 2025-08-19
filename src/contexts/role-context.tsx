import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { useToast } from '../hooks/use-toast'

export type UserRole = 'agent' | 'chat_agent' | 'supervisor' | 'manager' | 'admin'

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
  chat_agent: {
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
      embeddedApps: true,
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
  supervisor: {
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
      'fraud_detection',
      'team_management'
    ],
    columns: {
      canCollapse: true,
      canResize: true,
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
      'fraud_detection',
      'team_management',
      'performance_analysis'
    ],
    columns: {
      canCollapse: true,
      canResize: true,
      persistLayout: true
    }
  },
  admin: {
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
      'fraud_detection',
      'team_management',
      'performance_analysis',
      'system_administration'
    ],
    columns: {
      canCollapse: true,
      canResize: true,
      persistLayout: true
    }
  }
}

interface RoleContextType {
  currentRole: UserRole
  config: RoleConfig
  isLoading: boolean
  updateRole: (newRole: UserRole, showNotification?: boolean) => Promise<void>
  resetRole: () => void
  canAccessWidget: (widget: keyof RoleConfig['widgets']) => boolean
  canAccessFeature: (feature: keyof RoleConfig['features']) => boolean
  getAvailableIntents: () => string[]
  canManageColumns: () => boolean
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

export function RoleProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('agent')
  const [config, setConfig] = useState<RoleConfig>(DEFAULT_CONFIGS['agent'])
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

    const newConfig = await fetchRoleConfig(newRole)
    
    setCurrentRole(newRole)
    setConfig(newConfig)
    
    // Persist role selection
    localStorage.setItem('ccaas-ui-role', newRole)
    
    
    // Only show notification if explicitly requested (not on initial load)
    if (showNotification) {
      const roleNames = {
        agent: 'Voice Agent',
        chat_agent: 'Chat Agent',
        supervisor: 'Supervisor',
        manager: 'Manager',
        admin: 'Administrator'
      }
      
      toast({
        title: "Role Updated",
        description: `Switched to ${roleNames[newRole]} role`,
      })
    }
  }

  const resetRole = () => {
    setCurrentRole('agent')
    setConfig(DEFAULT_CONFIGS['agent'])
    localStorage.removeItem('ccaas-ui-role')
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

  const value: RoleContextType = {
    currentRole,
    config,
    isLoading,
    updateRole,
    resetRole,
    // Helper functions
    canAccessWidget: (widget: keyof RoleConfig['widgets']) => config?.widgets?.[widget] ?? false,
    canAccessFeature: (feature: keyof RoleConfig['features']) => config?.features?.[feature] ?? false,
    getAvailableIntents: () => config?.intents ?? [],
    canManageColumns: () => {
      if (!config || !config.columns) return false
      return config.columns.canCollapse || config.columns.canResize
    }
  }

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRoleConfig() {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error('useRoleConfig must be used within a RoleProvider')
  }
  return context
}
