import { useEffect, useMemo, useRef, useState } from 'react'
import { useDebounce } from './use-debounce'
import { searchQuery, type RawSearchResult } from '../services/search.service'
import { useAuth } from '../contexts/auth-context'

export interface SearchResult {
  id: string
  title: string
  category: string
  product?: string
  url: string
  snippet: string
  score?: number
}

const MAX_QUERY_LENGTH = 256
const DEBOUNCE_MS = 200
const CACHE_SIZE = 10

function deriveEntitlementHeader(role?: string, department?: string): string | undefined {
  if (!role && !department) return undefined
  const groups: string[] = []
  // Match database entitlements (uppercase for roles)
  if (role === 'admin') groups.push('ADMIN')
  if (role === 'supervisor') groups.push('SUPERVISOR')
  if (role === 'manager') groups.push('MANAGER')
  if (role === 'chat_agent') groups.push('CHAT_AGENT')
  if (role === 'agent') groups.push('AGENT')
  // Map departments to database entitlements
  if (department) {
    const deptLower = department.toLowerCase()
    if (deptLower.includes('premier')) groups.push('premier')
    else if (deptLower.includes('retail')) groups.push('retail')
    else if (deptLower.includes('wealth')) groups.push('wealth')
    else if (deptLower.includes('business')) groups.push('business')
    else if (deptLower.includes('card')) groups.push('cards')
    else if (deptLower.includes('digital')) groups.push('digital')
    else if (deptLower.includes('experience')) groups.push('experience')
    else groups.push(department.replace(/\s+/g, '-').toLowerCase())
  }
  // Add common entitlements for all agents
  groups.push('basic')
  return groups.join(',') || undefined
}

export function useSearchAPI() {
  // Keep initial hook order stable: states first (prevents Fast Refresh hook order errors)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const { user } = useAuth()

  const entitlement = useMemo(
    () => deriveEntitlementHeader(user?.role, user?.department),
    [user?.role, user?.department]
  )

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS)
  const abortRef = useRef<AbortController | null>(null)

  // simple LRU-ish in-memory cache for the session
  const cacheRef = useRef<Map<string, { results: SearchResult[]; total: number }>>(new Map())

  useEffect(() => {
    const run = async () => {
      const trimmed = debouncedQuery.trim().slice(0, MAX_QUERY_LENGTH)
      if (!trimmed) {
        setResults([])
        setTotal(0)
        setLoading(false)
        setError(null)
        return
      }

      // Cache hit
      const cached = cacheRef.current.get(trimmed)
      if (cached) {
        setResults(cached.results)
        setTotal(cached.total)
      }

      // cancel previous
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)
      try {
        const { results: raw, total: t } = await searchQuery(
          { q: trimmed, topK: 20, offset: 0 },
          { signal: controller.signal, entitlement }
        )

        const normalized: SearchResult[] = raw.slice(0, 20).map((r: RawSearchResult) => ({
          id: r.id,
          title: r.title,
          category: r.category || 'Document',
          product: r.product,
          url: r.url,
          snippet: sanitizeSnippet(r.snippet),
          score: r.score
        }))

        // show top 5 by default; UI can choose to show more
        setResults(normalized)
        setTotal(typeof t === 'number' ? t : normalized.length)

        // maintain LRU-ish cache size
        cacheRef.current.set(trimmed, { results: normalized, total: t })
        if (cacheRef.current.size > CACHE_SIZE) {
          const firstKey = cacheRef.current.keys().next().value
          if (firstKey !== undefined) {
            cacheRef.current.delete(firstKey)
          }
        }
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return
        // optional fallback disabled per request (no mock)
        setResults([])
        setTotal(0)
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [debouncedQuery, entitlement])

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setTotal(0)
    setError(null)
  }

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    total,
    clearSearch,
    hasResults: results.length > 0,
    hasQuery: query.trim().length > 0
  }
}

function sanitizeSnippet(snippet: string | undefined): string {
  if (!snippet) return ''
  // Strip any HTML tags to avoid unsafe rendering
  return snippet.replace(/<[^>]*>/g, '')
}
