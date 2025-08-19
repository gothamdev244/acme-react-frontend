/**
 * Intent Configuration Service
 * Manages dynamic intent configuration loaded from JSON
 */

export interface IntentConfig {
  displayName: string
  icon: string
  category: string
  hasEmbeddedApp: boolean
  description: string
}

export interface IntentConfigData {
  version: string
  lastUpdated: string
  intents: Record<string, IntentConfig>
  categories: Record<string, {
    name: string
    color: string
  }>
}

class IntentService {
  private config: IntentConfigData | null = null
  private configPromise: Promise<IntentConfigData> | null = null
  private lastFetchTime: number = 0
  private readonly CACHE_DURATION = 60000 // 1 minute cache in production

  /**
   * Load intent configuration from JSON file
   */
  async loadConfig(forceReload = false): Promise<IntentConfigData> {
    // Return cached config if still valid - clear cache to reload new intents
    if (this.config && !forceReload) {
      return this.config
    }

    // If already loading, return the existing promise
    if (this.configPromise && !forceReload) {
      return this.configPromise
    }

    // Load from JSON file
    this.configPromise = fetch('/intent-config.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to load intent config: ${response.statusText}`)
        }
        return response.json()
      })
      .then((data: IntentConfigData) => {
        this.config = data
        this.configPromise = null
        return data
      })
      .catch(error => {
        this.configPromise = null
        throw error // Don't hide the error - let it propagate
      })

    return this.configPromise
  }

  /**
   * Get intent configuration by ID
   */
  async getIntent(intentId: string): Promise<IntentConfig | null> {
    const config = await this.loadConfig()
    return config.intents[intentId] || config.intents['unknown'] || null
  }

  /**
   * Get all intents that have embedded apps
   */
  async getEmbeddedAppIntents(): Promise<Record<string, IntentConfig>> {
    const config = await this.loadConfig()
    const result: Record<string, IntentConfig> = {}
    
    for (const [id, intent] of Object.entries(config.intents)) {
      if (intent.hasEmbeddedApp) {
        result[id] = intent
      }
    }
    
    return result
  }

  /**
   * Map intent from AI service to display info
   * Handles both "Account Inquiry" and "account_inquiry" formats
   */
  async mapIntent(intentName: string): Promise<{
    id: string
    displayName: string
    icon: string
    hasEmbeddedApp: boolean
  }> {
    // Convert to snake_case for lookup
    const intentId = this.toSnakeCase(intentName)
    const intent = await this.getIntent(intentId)
    
    if (!intent) {
      // Unknown intent - return with formatted name
      return {
        id: intentId,
        displayName: this.formatIntentName(intentId),
        icon: 'help-circle',
        hasEmbeddedApp: false
      }
    }

    return {
      id: intentId,
      displayName: intent.displayName,
      icon: intent.icon,
      hasEmbeddedApp: intent.hasEmbeddedApp
    }
  }

  /**
   * Format intent ID to human-readable name
   */
  private formatIntentName(intentId: string): string {
    return intentId
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Convert intent name from AI service format to snake_case ID
   * e.g., "Account Inquiry" -> "account_inquiry"
   */
  private toSnakeCase(intentName: string): string {
    return intentName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
  }

  /**
   * Check if intent has embedded app support
   */
  async hasEmbeddedApp(intentId: string): Promise<boolean> {
    const intent = await this.getIntent(intentId)
    return intent?.hasEmbeddedApp || false
  }

  /**
   * Get category information for an intent
   */
  async getIntentCategory(intentId: string): Promise<{ name: string; color: string } | null> {
    const config = await this.loadConfig()
    const intent = config.intents[intentId]
    
    if (!intent) return null
    
    return config.categories[intent.category] || null
  }

  /**
   * Reload configuration (useful for development)
   */
  async reload(): Promise<IntentConfigData> {
    return this.loadConfig(true)
  }
}

// Export singleton instance
export const intentService = new IntentService()

// Export for component usage
export default intentService
