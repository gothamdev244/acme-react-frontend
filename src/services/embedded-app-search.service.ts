export interface EmbeddedAppSearchRequest {
  query: string
  limit?: number
  category?: string
}

export interface EmbeddedAppSearchResult {
  id: string
  appKey: string
  title: string
  description: string
  category: string
  primaryKeywords: string[]
  secondaryKeywords: string[]
  searchAliases: string[]
  roleAccess: string[]
  supportedIntents: string[]
  iconUrl?: string
  url?: string
  averageRating?: number
  usageCount?: number
  relevanceScore?: number
}

export interface EmbeddedAppSearchResponse {
  results: EmbeddedAppSearchResult[]
  total: number
  query: string
  timeTaken: number
}

export interface UserContext {
  role?: string
  customerTier?: string
  currentIntent?: string
}

const DEFAULT_SEARCH_ENDPOINT = import.meta.env.VITE_SEARCH_API_URL 
  ? `${import.meta.env.VITE_SEARCH_API_URL}/apps` 
  : '/api/search/apps'

export async function searchEmbeddedApps(
  request: EmbeddedAppSearchRequest,
  userContext?: UserContext,
  options?: { signal?: AbortSignal }
): Promise<EmbeddedAppSearchResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  // Add context headers for enhanced search accuracy
  if (userContext?.role) {
    headers['X-Agent-Role'] = userContext.role
  }
  if (userContext?.customerTier) {
    headers['X-Customer-Tier'] = userContext.customerTier
  }
  if (userContext?.currentIntent) {
    headers['X-Current-Intent'] = userContext.currentIntent
  }
  
  // Sending request with headers

  // Convert frontend format to backend format
  const backendRequest = {
    q: request.query,
    topK: request.limit || 20,
    filters: request.category ? { category: request.category } : undefined
  }

  const response = await fetch(DEFAULT_SEARCH_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify(backendRequest),
    signal: options?.signal
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Embedded app search failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  
  // Transform backend response to frontend format
  return {
    results: data.results || [],
    total: data.total || 0,
    query: request.query,
    timeTaken: data.tookMs || 0
  }
}

export async function getEmbeddedApp(
  appKey: string,
  userContext?: UserContext,
  options?: { signal?: AbortSignal }
): Promise<EmbeddedAppSearchResult> {
  const headers: Record<string, string> = {}

  if (userContext?.role) {
    headers['X-Agent-Role'] = userContext.role
  }

  const response = await fetch(`${DEFAULT_SEARCH_ENDPOINT}/${appKey}`, {
    method: 'GET',
    headers,
    signal: options?.signal
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Failed to get embedded app (${response.status}): ${errorText}`)
  }

  return response.json()
}

export async function trackEmbeddedAppLaunch(
  appKey: string,
  userContext?: UserContext
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (userContext?.role) {
    headers['X-Agent-Role'] = userContext.role
  }

  await fetch(`${DEFAULT_SEARCH_ENDPOINT}/${appKey}/launch`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      context: userContext
    })
  }).catch(error => {
    // Track silently - don't fail app launch if tracking fails
  })
}

export async function getPopularEmbeddedApps(
  userContext?: UserContext,
  options?: { signal?: AbortSignal }
): Promise<EmbeddedAppSearchResult[]> {
  const headers: Record<string, string> = {}

  if (userContext?.role) {
    headers['X-Agent-Role'] = userContext.role
  }

  const response = await fetch(`${DEFAULT_SEARCH_ENDPOINT}/popular`, {
    method: 'GET',
    headers,
    signal: options?.signal
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Failed to get popular apps (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  // Handle both array and object response formats
  return Array.isArray(data) ? data : (data.results || [])
}

export async function getEmbeddedAppsByCategory(
  category: string,
  userContext?: UserContext,
  options?: { signal?: AbortSignal }
): Promise<EmbeddedAppSearchResult[]> {
  const headers: Record<string, string> = {}

  if (userContext?.role) {
    headers['X-Agent-Role'] = userContext.role
  }

  const response = await fetch(`${DEFAULT_SEARCH_ENDPOINT}/categories/${encodeURIComponent(category)}`, {
    method: 'GET',
    headers,
    signal: options?.signal
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Failed to get apps by category (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  // Handle both array and object response formats
  return Array.isArray(data) ? data : (data.results || [])
}
