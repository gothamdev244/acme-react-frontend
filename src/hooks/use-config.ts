/**
 * Configuration Hook
 * React hook for loading and accessing JSON configuration files
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  configService,
  CustomerProfilesConfig,
  AgentProfilesConfig,
  KnowledgeArticlesConfig,
  TranscriptScenariosConfig,
  InteractionTemplatesConfig,
  loadCustomerProfiles,
  loadAgentProfiles,
  loadKnowledgeArticles,
  loadTranscriptScenarios,
  loadInteractionTemplates
} from '../services/config.service'

interface UseConfigResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  reload: () => Promise<void>
}

/**
 * Generic hook for loading any configuration
 */
export function useConfig<T = any>(configPath: string): UseConfigResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const configData = await configService.loadConfig<T>(configPath)
      setData(configData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load configuration'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [configPath])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const reload = useCallback(async () => {
    configService.clearCache(configPath)
    await loadConfig()
  }, [configPath, loadConfig])

  return { data, loading, error, reload }
}

/**
 * Hook for customer profiles configuration
 */
export function useCustomerProfiles(): UseConfigResult<CustomerProfilesConfig> {
  const [data, setData] = useState<CustomerProfilesConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const configData = await loadCustomerProfiles()
      setData(configData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load customer profiles'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const reload = useCallback(async () => {
    configService.clearCache('customer-profiles')
    await loadConfig()
  }, [loadConfig])

  return { data, loading, error, reload }
}

/**
 * Hook for agent profiles configuration
 */
export function useAgentProfiles(): UseConfigResult<AgentProfilesConfig> {
  const [data, setData] = useState<AgentProfilesConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const configData = await loadAgentProfiles()
      setData(configData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load agent profiles'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const reload = useCallback(async () => {
    configService.clearCache('agent-profiles')
    await loadConfig()
  }, [loadConfig])

  return { data, loading, error, reload }
}

/**
 * Hook for knowledge articles configuration
 */
export function useKnowledgeArticles(): UseConfigResult<KnowledgeArticlesConfig> {
  const [data, setData] = useState<KnowledgeArticlesConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const configData = await loadKnowledgeArticles()
      setData(configData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load knowledge articles'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const reload = useCallback(async () => {
    configService.clearCache('knowledge-articles')
    await loadConfig()
  }, [loadConfig])

  return { data, loading, error, reload }
}

/**
 * Hook for transcript scenarios configuration
 */
export function useTranscriptScenarios(): UseConfigResult<TranscriptScenariosConfig> {
  const [data, setData] = useState<TranscriptScenariosConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const configData = await loadTranscriptScenarios()
      setData(configData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load transcript scenarios'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const reload = useCallback(async () => {
    configService.clearCache('transcript-scenarios')
    await loadConfig()
  }, [loadConfig])

  return { data, loading, error, reload }
}

/**
 * Hook for interaction templates configuration
 */
export function useInteractionTemplates(): UseConfigResult<InteractionTemplatesConfig> {
  const [data, setData] = useState<InteractionTemplatesConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const configData = await loadInteractionTemplates()
      setData(configData)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load interaction templates'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const reload = useCallback(async () => {
    configService.clearCache('interaction-templates')
    await loadConfig()
  }, [loadConfig])

  return { data, loading, error, reload }
}

/**
 * Utility hook for getting a specific customer profile by ID
 */
export function useCustomerProfile(customerId: string) {
  const { data: profiles, loading, error } = useCustomerProfiles()
  
  const customer = profiles?.customerProfiles.find(p => p.id === customerId) || null
  
  return { customer, loading, error }
}

/**
 * Utility hook for getting a specific agent profile by ID
 */
export function useAgentProfile(agentId: string) {
  const { data: profiles, loading, error } = useAgentProfiles()
  
  const agent = profiles?.agentProfiles[agentId] || profiles?.defaultAgent || null
  
  return { agent, loading, error }
}

/**
 * Utility hook for getting random mock data
 */
export function useMockData() {
  const customerProfiles = useCustomerProfiles()
  const agentProfiles = useAgentProfiles()
  const knowledgeArticles = useKnowledgeArticles()
  const transcriptScenarios = useTranscriptScenarios()
  const interactionTemplates = useInteractionTemplates()

  const loading = [
    customerProfiles.loading,
    agentProfiles.loading,
    knowledgeArticles.loading,
    transcriptScenarios.loading,
    interactionTemplates.loading
  ].some(Boolean)

  const error = [
    customerProfiles.error,
    agentProfiles.error,
    knowledgeArticles.error,
    transcriptScenarios.error,
    interactionTemplates.error
  ].find(Boolean)

  const getRandomCustomer = useCallback(() => {
    if (!customerProfiles.data) return null
    const profiles = customerProfiles.data.customerProfiles
    return profiles[Math.floor(Math.random() * profiles.length)]
  }, [customerProfiles.data])

  const getRandomAgent = useCallback((agentId?: string) => {
    if (!agentProfiles.data) return null
    if (agentId && agentProfiles.data.agentProfiles[agentId]) {
      return agentProfiles.data.agentProfiles[agentId]
    }
    const profiles = Object.values(agentProfiles.data.agentProfiles)
    return profiles[Math.floor(Math.random() * profiles.length)]
  }, [agentProfiles.data])

  const getRandomKnowledgeArticles = useCallback((count = 3) => {
    if (!knowledgeArticles.data) return []
    const articles = knowledgeArticles.data.knowledgeArticles
    const shuffled = [...articles].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }, [knowledgeArticles.data])

  const getRandomTranscriptScenario = useCallback(() => {
    if (!transcriptScenarios.data) return null
    const scenarios = transcriptScenarios.data.transcriptScenarios
    return scenarios[Math.floor(Math.random() * scenarios.length)]
  }, [transcriptScenarios.data])

  const getRandomInteractions = useCallback((count = 3) => {
    if (!interactionTemplates.data) return []
    const templates = interactionTemplates.data.interactionTemplates
    const shuffled = [...templates].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }, [interactionTemplates.data])

  return {
    loading,
    error,
    getRandomCustomer,
    getRandomAgent,
    getRandomKnowledgeArticles,
    getRandomTranscriptScenario,
    getRandomInteractions,
    // Direct access to all data
    customerProfiles: customerProfiles.data,
    agentProfiles: agentProfiles.data,
    knowledgeArticles: knowledgeArticles.data,
    transcriptScenarios: transcriptScenarios.data,
    interactionTemplates: interactionTemplates.data
  }
}
