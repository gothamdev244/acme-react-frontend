import { useState, useEffect } from 'react'

interface AgentSettings {
  calls: {
    autoAccept: boolean
    afterCallWorkTime: number
    doNotDisturb: {
      enabled: boolean
      duration: 15 | 30 | 60
      originalStatus?: string
    }
    confirmBeforeEnd: boolean
    requireActionsCompletion: boolean
  }
  audio: {
    ringtone: string
    volume: number
    outputDevice: string
  }
  notifications: {
    desktop: boolean
    sounds: {
      incoming: boolean
      end: boolean
      error: boolean
    }
  }
  privacy: {
    lastCacheCleared?: string
    screenshotProtection?: boolean
    idleTimeout: number
    rememberCallHistory: boolean
  }
  accessibility: {
    textSize: 'small' | 'medium' | 'large'
    highContrast: boolean
  }
  interface: {
    spaceCopilotMode: 'column' | 'overlay'
    spaceCopilotOverlayPosition: 'right' | 'left'
    showWidgetBorders: boolean
    compactMode: boolean
    showTranscript: boolean
    autoCloseKnowledgeOnCallEnd: boolean
  }
  language: string
}

const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  calls: {
    autoAccept: false,
    afterCallWorkTime: 30,
    doNotDisturb: {
      enabled: false,
      duration: 15
    },
    confirmBeforeEnd: true,
    requireActionsCompletion: false
  },
  audio: {
    ringtone: 'default',
    volume: 70,
    outputDevice: 'default'
  },
  notifications: {
    desktop: true,
    sounds: {
      incoming: true,
      end: true,
      error: true
    }
  },
  privacy: {
    idleTimeout: 30,
    rememberCallHistory: false
  },
  accessibility: {
    textSize: 'medium',
    highContrast: false
  },
  interface: {
    spaceCopilotMode: 'column',
    spaceCopilotOverlayPosition: 'right',
    showWidgetBorders: true,
    compactMode: false,
    showTranscript: true,
    autoCloseKnowledgeOnCallEnd: true
  },
  language: 'en'
}

// Custom event for real-time settings updates within the same tab
const SETTINGS_CHANGE_EVENT = 'agent-settings-changed'

// Helper function to dispatch settings change event
export function dispatchSettingsChange() {
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT))
}

export function useAgentSettings() {
  const [settings, setSettings] = useState<AgentSettings>(() => {
    const saved = localStorage.getItem('agent-settings')
    return saved ? { ...DEFAULT_AGENT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_AGENT_SETTINGS
  })

  // Function to update settings from localStorage
  const updateSettingsFromStorage = () => {
    const saved = localStorage.getItem('agent-settings')
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved)
        setSettings({ ...DEFAULT_AGENT_SETTINGS, ...parsedSettings })
      } catch (error) {
        // Failed to parse agent settings
      }
    }
  }

  // Function to update settings and save to localStorage
  const updateSettings = (updates: Partial<AgentSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates }
      localStorage.setItem('agent-settings', JSON.stringify(newSettings))
      dispatchSettingsChange() // Dispatch for real-time updates
      return newSettings
    })
  }

  // Helper function to update nested settings
  const updateNestedSettings = <K extends keyof AgentSettings>(
    section: K,
    updates: Partial<AgentSettings[K]>
  ) => {
    const currentSection = settings[section]
    updateSettings({
      [section]: { ...(currentSection as object), ...updates }
    } as Partial<AgentSettings>)
  }

  // Listen for both storage events (cross-tab) and custom events (same-tab)
  useEffect(() => {
    // Handle storage events (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'agent-settings') {
        updateSettingsFromStorage()
      }
    }

    // Handle custom events (same-tab real-time updates)
    const handleCustomEvent = () => {
      updateSettingsFromStorage()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleCustomEvent)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleCustomEvent)
    }
  }, [])

  return {
    settings,
    updateSettings,
    updateNestedSettings
  }
}
