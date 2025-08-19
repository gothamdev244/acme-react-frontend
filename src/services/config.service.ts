/**
 * Configuration Service
 * Handles loading and caching of JSON configuration files
 */

interface ConfigCache {
  [key: string]: {
    data: any
    timestamp: number
    expiry: number
  }
}

// Cache configuration data for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

class ConfigurationService {
  private cache: ConfigCache = {}
  private loadingPromises: Map<string, Promise<any>> = new Map()

  /**
   * Load configuration from JSON file with caching
   */
  async loadConfig<T = any>(configPath: string): Promise<T> {
    // Check cache first
    const cached = this.cache[configPath]
    if (cached && Date.now() < cached.expiry) {
      return cached.data as T
    }

    // Check if already loading to prevent duplicate requests
    if (this.loadingPromises.has(configPath)) {
      return this.loadingPromises.get(configPath)!
    }

    // Load configuration
    const loadPromise = this.fetchConfig<T>(configPath)
    this.loadingPromises.set(configPath, loadPromise)

    try {
      const data = await loadPromise
      
      // Cache the result
      this.cache[configPath] = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + CACHE_DURATION
      }

      return data
    } finally {
      this.loadingPromises.delete(configPath)
    }
  }

  /**
   * Fetch configuration from file
   */
  private async fetchConfig<T>(configPath: string): Promise<T> {
    try {
      const response = await fetch(`/config/${configPath}.json`)
      
      if (!response.ok) {
        throw new Error(`Failed to load config: ${configPath} (${response.status})`)
      }

      const data = await response.json()
      return data as T
    } catch (error) {
      throw error
    }
  }

  /**
   * Clear cache for specific config or all configs
   */
  clearCache(configPath?: string): void {
    if (configPath) {
      delete this.cache[configPath]
    } else {
      this.cache = {}
    }
  }

  /**
   * Get cached config without loading (returns null if not cached)
   */
  getCached<T = any>(configPath: string): T | null {
    const cached = this.cache[configPath]
    if (cached && Date.now() < cached.expiry) {
      return cached.data as T
    }
    return null
  }

  /**
   * Preload multiple configurations
   */
  async preloadConfigs(configPaths: string[]): Promise<void> {
    const promises = configPaths.map(path => 
      this.loadConfig(path).catch(error => {
        return null
      })
    )
    
    await Promise.all(promises)
  }
}

// Singleton instance
export const configService = new ConfigurationService()

// Type definitions for known configurations
export interface CustomerProfile {
  id: string
  name: string
  cin: string
  tier: string
  accountNumber: string
  email: string
  phone: string
  location: string
  joinDate: string
  totalInteractions: number
  lastCCAASDate: string
  segment: string
  gender: string
  careNeed: boolean
}

export interface CustomerProfilesConfig {
  customerProfiles: CustomerProfile[]
  randomCustomerTemplate: CustomerProfile
}

export interface AgentProfile {
  agentName: string
  department: string
  agentId: string
  specialization: string
  languages: string[]
  experience: string
  certifications: string[]
}

export interface AgentProfilesConfig {
  agentProfiles: Record<string, AgentProfile>
  defaultAgent: AgentProfile
}

export interface KnowledgeArticle {
  id: string
  title: string
  category: string
  relevance: number
  excerpt: string
  url: string
  content: string
  lastUpdated: string
  tags: string[]
}

export interface KnowledgeArticlesConfig {
  knowledgeArticles: KnowledgeArticle[]
  categories: string[]
}

export interface TranscriptMessage {
  id: string
  timestamp: string
  speaker: 'agent' | 'customer'
  text: string
}

export interface TranscriptScenario {
  id: string
  title: string
  category: string
  messages: TranscriptMessage[]
}

export interface TranscriptScenariosConfig {
  transcriptScenarios: TranscriptScenario[]
  messageTemplates: {
    greetings: string[]
    clarifications: string[]
    confirmations: string[]
    closings: string[]
  }
}

export interface InteractionTemplate {
  id: string
  type: string
  title: string
  status: string
  date: string | null
  details: string
  icon: string
  duration?: string | null
  priority: string
}

export interface InteractionTemplatesConfig {
  interactionTemplates: InteractionTemplate[]
  interactionTypes: Array<{
    type: string
    icon: string
    label: string
    color: string
  }>
  statusTypes: Array<{
    status: string
    label: string
    color: string
    description: string
  }>
}

// Convenience functions for specific configurations
export const loadCustomerProfiles = () => 
  configService.loadConfig<CustomerProfilesConfig>('customer-profiles')

export const loadAgentProfiles = () => 
  configService.loadConfig<AgentProfilesConfig>('agent-profiles')

export const loadKnowledgeArticles = () => 
  configService.loadConfig<KnowledgeArticlesConfig>('knowledge-articles')

export const loadTranscriptScenarios = () => 
  configService.loadConfig<TranscriptScenariosConfig>('transcript-scenarios')

export const loadInteractionTemplates = () => 
  configService.loadConfig<InteractionTemplatesConfig>('interaction-templates')

// Preload all configurations
export const preloadAllConfigs = () => configService.preloadConfigs([
  'customer-profiles',
  'agent-profiles', 
  'knowledge-articles',
  'transcript-scenarios',
  'interaction-templates'
])

export default configService
