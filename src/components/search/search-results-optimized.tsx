import { memo, useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { FileText, Search, Loader2 } from 'lucide-react'
import { type SearchResult } from '../../hooks/use-search-api'

interface SearchResultsOptimizedProps {
  results: SearchResult[]
  loading?: boolean
  query?: string
  onResultClick?: (result: SearchResult) => void
  maxVisible?: number
}

// Removed category icons and colors for cleaner, minimal design
// Using simple gray text for categories instead

// Memoized skeleton component - Simplified
const SkeletonResult = memo(() => (
  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5"></div>
      </div>
    </div>
  </div>
))

// Memoized highlight function
const highlightText = (text: string, searchQuery: string) => {
  if (!searchQuery || !text) return text
  
  // Use a simpler approach without regex for better performance
  const lowerText = text.toLowerCase()
  const lowerQuery = searchQuery.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)
  
  if (index === -1) return text
  
  return (
    <>
      {text.slice(0, index)}
      <mark className="bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded">
        {text.slice(index, index + searchQuery.length)}
      </mark>
      {text.slice(index + searchQuery.length)}
    </>
  )
}

// Memoized search result item - Beautiful & Minimal
const SearchResultItem = memo(({ 
  result, 
  query, 
  onResultClick 
}: { 
  result: SearchResult
  query?: string
  onResultClick?: (result: SearchResult) => void
}) => {
  const handleClick = useCallback(() => {
    window.open(result.url, '_blank', 'noopener,noreferrer')
    onResultClick?.(result)
  }, [result, onResultClick])
  
  return (
    <div 
      className="search-result-card group p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <div className="flex items-start gap-3">
        {/* Simple document icon */}
        <div className="mt-0.5 text-gray-400">
          <FileText className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title and category on same line */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              {highlightText(result.title, query || '')}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
              {result.category}
            </span>
          </div>
          
          {/* Description */}
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
            {highlightText(result.snippet, query || '')}
          </p>
        </div>
      </div>
    </div>
  )
})

SearchResultItem.displayName = 'SearchResultItem'

// Empty state components
const NoResultsFound = memo(({ query }: { query?: string }) => (
  <div className="text-center py-8">
    <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
      No results found
    </h3>
    <p className="text-muted-foreground">
      {query 
        ? `No matches for "${query}". Try adjusting your search terms.`
        : 'Try adjusting your search terms or browse our knowledge categories'}
    </p>
  </div>
))

const SearchPrompt = memo(() => (
  <div className="text-center py-8">
    <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
    <h3 className="text-base font-normal text-gray-600 dark:text-gray-400 mb-2">
      Search Knowledge Base
    </h3>
    <p className="text-muted-foreground">
      Search procedures, policies, and guidelines instantly
    </p>
  </div>
))

export const SearchResultsOptimized = memo(({ 
  results, 
  loading, 
  query, 
  onResultClick,
  maxVisible = 10 
}: SearchResultsOptimizedProps) => {
  const [visibleCount, setVisibleCount] = useState(maxVisible)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Reset visible count when query changes
  useEffect(() => {
    setVisibleCount(maxVisible)
  }, [query, maxVisible])
  
  // Slice results for initial render performance
  const visibleResults = useMemo(
    () => results.slice(0, visibleCount),
    [results, visibleCount]
  )
  
  // Handle infinite scroll
  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLElement
    if (!target) return
    
    const scrollBottom = target.scrollTop + target.clientHeight
    const scrollThreshold = target.scrollHeight - 100 // 100px from bottom
    
    if (scrollBottom >= scrollThreshold && visibleCount < results.length && !isLoadingMore) {
      setIsLoadingMore(true)
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 10, results.length))
        setIsLoadingMore(false)
      }, 300)
    }
  }, [visibleCount, results.length, isLoadingMore])
  
  // Attach scroll listener to container
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const scrollContainer = document.querySelector('.max-h-\\[50vh\\].overflow-y-auto')
      
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', handleScroll)
        return () => scrollContainer.removeEventListener('scroll', handleScroll)
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [handleScroll])
  
  // Group results by category for better organization
  const groupedResults = useMemo(() => {
    return visibleResults.reduce((acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = []
      }
      acc[result.category].push(result)
      return acc
    }, {} as Record<string, SearchResult[]>)
  }, [visibleResults])

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonResult key={i} />
        ))}
      </div>
    )
  }

  if (results.length === 0 && query) {
    return <NoResultsFound query={query} />
  }

  if (results.length === 0) {
    return <SearchPrompt />
  }

  const hasMultipleCategories = Object.keys(groupedResults).length > 1

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found {results.length} result{results.length !== 1 ? 's' : ''} 
          {query && ` for "${query}"`}
          {results.length > visibleCount && ` (showing ${visibleCount})`}
        </p>
      </div>
      
      {Object.entries(groupedResults).map(([category, categoryResults]) => (
        <div key={category} className="space-y-3">
          {hasMultipleCategories && (
            <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span>{category}</span>
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                {categoryResults.length}
              </span>
            </h4>
          )}
          
          <div className="space-y-3">
            {categoryResults.map((result) => (
              <SearchResultItem
                key={result.id}
                result={result}
                query={query}
                onResultClick={onResultClick}
              />
            ))}
          </div>
        </div>
      ))}
      
      {/* Infinite scroll loading indicator */}
      {results.length > visibleCount && (
        <div className="h-10 flex items-center justify-center">
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading more results...</span>
            </div>
          )}
        </div>
      )}
      
      {/* Show count indicator */}
      {visibleCount === results.length && results.length > maxVisible && (
        <div className="text-center py-3 text-sm text-gray-500">
          All {results.length} results loaded
        </div>
      )}
    </div>
  )
})

SearchResultsOptimized.displayName = 'SearchResultsOptimized'
