export interface SearchQueryFilters {
  category?: string
  product?: string
  country_code?: string
  locale?: string
}

export interface SearchQueryRequest {
  q: string
  filters?: SearchQueryFilters
  topK?: number
  offset?: number
}

export interface RawSearchResult {
  id: string
  title: string
  url: string
  snippet: string
  category?: string
  product?: string
  score?: number
  locale?: string
  country_code?: string
}

export interface SearchQueryResponse {
  results: RawSearchResult[]
  total: number
  tookMs?: number
}

const DEFAULT_ENDPOINT: string = (import.meta as any)?.env?.VITE_SEARCH_API_URL || '/api/search/query'

export async function searchQuery(
  body: SearchQueryRequest,
  options?: { signal?: AbortSignal; entitlement?: string; endpoint?: string }
): Promise<SearchQueryResponse> {
  const endpoint = options?.endpoint || DEFAULT_ENDPOINT

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (options?.entitlement) {
    headers['X-Agent-Entitlement'] = options.entitlement
  }

  const startedAt = performance.now()

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: options?.signal
  })

  const tookMs = Math.round(performance.now() - startedAt)

  if (!response.ok) {
    const message = await safeReadError(response)
    throw new Error(`Search request failed (${response.status}): ${message}`)
  }

  const data = (await response.json()) as Partial<SearchQueryResponse>
  return {
    results: Array.isArray(data?.results) ? (data!.results as RawSearchResult[]) : [],
    total: typeof data?.total === 'number' ? (data!.total as number) : 0,
    tookMs: typeof data?.tookMs === 'number' ? (data!.tookMs as number) : tookMs
  }
}

async function safeReadError(res: Response): Promise<string> {
  try {
    const text = await res.text()
    return text?.slice(0, 512) || 'Unknown error'
  } catch {
    return 'Unknown error'
  }
}


