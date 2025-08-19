import { useState, useEffect, useRef, useMemo } from 'react'
import { useDebounce } from './use-debounce'
import { useAuth } from '../contexts/auth-context'
import { useAgentStore } from '../stores/agent-store'
import { useIntentStore } from '../stores/intent-store'
import { useRoleConfig } from '../contexts/role-context'
import {
  searchEmbeddedApps,
  getPopularEmbeddedApps,
  getEmbeddedAppsByCategory,
  trackEmbeddedAppLaunch,
  type EmbeddedAppSearchResult,
  type EmbeddedAppSearchRequest,
  type UserContext
} from '../services/embedded-app-search.service'

const DEBOUNCE_MS = 300
const MAX_QUERY_LENGTH = 256
const CACHE_SIZE = 20

interface UseEmbeddedAppSearchOptions {
  autoSearch?: boolean
  minQueryLength?: number
}

export function useEmbeddedAppSearch(options: UseEmbeddedAppSearchOptions = {}) {
  const { autoSearch = true, minQueryLength = 2 } = options
  
  // State management
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<EmbeddedAppSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [popularApps, setPopularApps] = useState<EmbeddedAppSearchResult[]>([])

  // Context from stores
  const { user } = useAuth()
  const { agentData } = useAgentStore()
  const { embeddedAppIntent } = useIntentStore()
  const { currentRole } = useRoleConfig()

  // Build user context for enhanced search accuracy
  const userContext: UserContext = useMemo(() => {
    // Map auth roles to search roles (keep lowercase for database compatibility)
    const mapAuthRoleToSearchRole = (authRole?: string) => {
      switch (authRole) {
        case 'chat_agent':
          return 'chat_agent'
        case 'supervisor':
          return 'supervisor'
        case 'manager':
          return 'manager'
        case 'admin':
          return 'admin'
        case 'agent':
        default:
          return 'agent'
      }
    }

    const resolvedRole = mapAuthRoleToSearchRole(currentRole || user?.role || agentData?.role)
    
    return {
      role: resolvedRole,
      customerTier: agentData?.customer?.tier || 'standard',
      currentIntent: embeddedAppIntent
    }
  }, [currentRole, user?.role, agentData?.role, agentData?.customer?.tier, embeddedAppIntent])

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS)
  const abortRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<Map<string, EmbeddedAppSearchResult[]>>(new Map())

  // Load popular apps on mount
  useEffect(() => {
    let mounted = true
    const controller = new AbortController()

    const loadPopularApps = async () => {
      try {
        const apps = await getPopularEmbeddedApps(userContext, { signal: controller.signal })
        if (mounted) {
          setPopularApps(apps)
        }
      } catch (error) {
        if ((error as any)?.name !== 'AbortError' && mounted) {
        }
      }
    }

    loadPopularApps()

    return () => {
      mounted = false
      controller.abort()
    }
  }, [userContext.role]) // Reload when role changes

  // Main search effect
  useEffect(() => {
    if (!autoSearch) return

    const performSearch = async () => {
      const trimmedQuery = debouncedQuery.trim().slice(0, MAX_QUERY_LENGTH)
      
      // Clear results for empty or too short queries
      if (!trimmedQuery || trimmedQuery.length < minQueryLength) {
        setResults([])
        setTotal(0)
        setLoading(false)
        setError(null)
        return
      }

      // Check cache first
      const cacheKey = `${trimmedQuery}:${userContext.role}:${userContext.currentIntent}`
      const cached = cacheRef.current.get(cacheKey)
      if (cached) {
        setResults(cached)
        setTotal(cached.length)
        setLoading(false)
        return
      }

      // Cancel previous request
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)

      try {
        const searchRequest: EmbeddedAppSearchRequest = {
          query: trimmedQuery,
          limit: 20
        }

        const response = await searchEmbeddedApps(
          searchRequest,
          userContext,
          { signal: controller.signal }
        )

        if (!controller.signal.aborted) {
          setResults(response.results)
          setTotal(response.total)

          // Cache results
          cacheRef.current.set(cacheKey, response.results)
          if (cacheRef.current.size > CACHE_SIZE) {
            const firstKey = cacheRef.current.keys().next().value
            cacheRef.current.delete(firstKey)
          }
        }
      } catch (error) {
        if ((error as any)?.name !== 'AbortError') {
          setError(error instanceof Error ? error.message : 'Search failed')
          setResults([])
          setTotal(0)
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    performSearch()

    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [debouncedQuery, userContext.role, userContext.currentIntent, autoSearch, minQueryLength])

  // Manual search function
  const searchManual = async (searchQuery: string): Promise<EmbeddedAppSearchResult[]> => {
    try {
      const searchRequest: EmbeddedAppSearchRequest = {
        query: searchQuery.trim().slice(0, MAX_QUERY_LENGTH),
        limit: 20
      }

      const response = await searchEmbeddedApps(searchRequest, userContext)
      return response.results
    } catch (error) {
      throw error
    }
  }

  // Get apps by category
  const getByCategory = async (category: string): Promise<EmbeddedAppSearchResult[]> => {
    try {
      return await getEmbeddedAppsByCategory(category, userContext)
    } catch (error) {
      throw error
    }
  }

  // Launch app with tracking
  const launchApp = async (app: EmbeddedAppSearchResult) => {
    try {
      // Extract appKey from URL if not directly available
      const appKey = app.appKey || (app.url ? app.url.replace('/embedded-apps/', '') : app.id)
      
      // Track the launch (silently fail if tracking doesn't work)
      if (appKey) {
        await trackEmbeddedAppLaunch(appKey, userContext).catch(() => {})
      }
      
      // Return the app data with context for embedded column
      return {
        ...app,
        appKey, // Ensure appKey is included
        context: {
          customerId: agentData?.customer?.id,
          agentId: agentData?.agentId || `${currentRole}-001`,
          customerName: agentData?.customer?.name,
          intent: app.supportedIntents?.[0] || embeddedAppIntent || 'manual_launch',
          userContext
        }
      }
    } catch (error) {
      // Still return app data even if launch fails
      const appKey = app.appKey || (app.url ? app.url.replace('/embedded-apps/', '') : app.id)
      return {
        ...app,
        appKey,
        context: {
          customerId: agentData?.customer?.id,
          agentId: agentData?.agentId || `${currentRole}-001`,
          customerName: agentData?.customer?.name,
          intent: app.supportedIntents?.[0] || embeddedAppIntent || 'manual_launch',
          userContext
        }
      }
    }
  }

  // Clear search
  const clearSearch = () => {
    setQuery('')
    setResults([])
    setTotal(0)
    setError(null)
    if (abortRef.current) {
      abortRef.current.abort()
    }
  }

  // Get suggested apps based on current intent
  const getSuggestedApps = (): EmbeddedAppSearchResult[] => {
    const safePopularApps = popularApps || []
    if (!embeddedAppIntent) return safePopularApps.slice(0, 6)
    
    // Filter apps that support the current intent
    const intentMatchingApps = safePopularApps.filter(app => 
      app?.supportedIntents && Array.isArray(app.supportedIntents) && app.supportedIntents.includes(embeddedAppIntent)
    )
    
    // If we have intent-matching apps, return them, otherwise return popular apps
    return intentMatchingApps.length > 0 
      ? intentMatchingApps.slice(0, 6)
      : safePopularApps.slice(0, 6)
  }

  const hasQuery = query.trim().length >= minQueryLength
  const hasResults = results.length > 0
  
  return {
    // Search state
    query,
    setQuery,
    results,
    loading,
    error,
    total,
    
    // Popular/suggested apps
    popularApps,
    suggestedApps: getSuggestedApps(),
    
    // Functions
    searchManual,
    getByCategory,
    launchApp,
    clearSearch,
    
    // Computed state
    hasResults,
    hasQuery,
    isEmpty: !loading && !hasQuery && results.length === 0,
    
    // Context info
    userContext
  }
}
