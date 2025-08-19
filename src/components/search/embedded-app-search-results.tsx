import { 
  Search,
  Monitor,
  Play,
  AppWindow,
  Star,
  Loader2
} from 'lucide-react'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { Button } from '../ui/button'
import { type EmbeddedAppSearchResult } from '../../services/embedded-app-search.service'
import '../../styles/search-animations.css'

interface EmbeddedAppSearchResultsProps {
  results: EmbeddedAppSearchResult[]
  loading?: boolean
  query?: string
  onAppLaunch?: (app: EmbeddedAppSearchResult) => void
  showCategories?: boolean
  suggestedApps?: EmbeddedAppSearchResult[]
}

// Removed category icons and colors for cleaner, minimal design

const SkeletonResult = () => (
  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse">
    <div className="flex items-start gap-3">
      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
      </div>
      <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
)

const EmbeddedAppResultItem = ({ 
  app, 
  query, 
  onAppLaunch 
}: { 
  app: EmbeddedAppSearchResult
  query?: string
  onAppLaunch?: (app: EmbeddedAppSearchResult) => void
}) => {
  const handleLaunch = () => {
    onAppLaunch?.(app)
  }

  // Highlight matching text
  const highlightText = (text: string, searchQuery: string) => {
    if (!text) return ''
    if (!searchQuery) return text
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) => (
      index % 2 === 1 ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">{part}</mark>
      ) : (
        <span key={index}>{part}</span>
      )
    ))
  }

  return (
    <div 
      className="search-result-card group p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer"
      onClick={handleLaunch}
    >
      <div className="flex items-start gap-3">
        {/* Simple app icon */}
        <div className="mt-0.5 text-gray-400">
          <AppWindow className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title and category on same line */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              {highlightText(app.title, query || '')}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {app.category.replace(/_/g, ' ')}
              </span>
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  handleLaunch()
                }}
                size="sm"
                variant="ghost"
                className="h-5 px-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Play className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
            {highlightText(app.description || '', query || '')}
          </p>
        </div>
      </div>
    </div>
  )
}

export function EmbeddedAppSearchResults({ 
  results, 
  loading, 
  query, 
  onAppLaunch,
  showCategories = true,
  suggestedApps = []
}: EmbeddedAppSearchResultsProps) {
  const maxVisible = 10
  const [visibleCount, setVisibleCount] = useState(maxVisible)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // Reset visible count when query changes
  useEffect(() => {
    setVisibleCount(maxVisible)
  }, [query, maxVisible])
  
  // Slice results for performance
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
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonResult key={i} />
        ))}
      </div>
    )
  }

  // Show suggested apps when no query
  if (!query && suggestedApps.length > 0) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Star className="h-4 w-4 text-gray-400" />
          <span>Suggested Services</span>
        </h4>
        <div className="space-y-3">
          {suggestedApps.map((app) => (
            <EmbeddedAppResultItem
              key={app.id}
              app={app}
              query=""
              onAppLaunch={onAppLaunch}
            />
          ))}
        </div>
      </div>
    )
  }

  if (results.length === 0 && query) {
    return (
      <div className="text-center py-8">
        <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No services found
        </h3>
        <p className="text-muted-foreground">
          Try adjusting your search terms or browse our service categories
        </p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <Monitor className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Search Banking Services
        </h3>
        <p className="text-muted-foreground">
          Find and launch specialized tools for customer service tasks
        </p>
      </div>
    )
  }

  // Group results by category if enabled
  const groupedResults = showCategories 
    ? visibleResults.reduce((acc, result) => {
        const category = result.category
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(result)
        return acc
      }, {} as Record<string, EmbeddedAppSearchResult[]>)
    : { 'Services': visibleResults }

  return (
    <div className="space-y-6" style={{ transform: 'translateZ(0)' }}>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Found {results.length} service{results.length !== 1 ? 's' : ''} {query && `for "${query}"`}
            {results.length > visibleCount && ` (showing ${visibleCount})`}
          </p>
        </div>
        
        {Object.entries(groupedResults).map(([category, categoryResults]) => (
          <div key={category} className="space-y-3">
            {Object.keys(groupedResults).length > 1 && (
              <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <AppWindow className="h-4 w-4 text-gray-400" />
                <span>{category.replace(/_/g, ' ')}</span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                  {categoryResults.length}
                </span>
              </h4>
            )}
            
            <div className="space-y-3">
              {categoryResults.map((app) => (
                <EmbeddedAppResultItem
                  key={app.id}
                  app={app}
                  query={query}
                  onAppLaunch={onAppLaunch}
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
                <span>Loading more services...</span>
              </div>
            )}
          </div>
        )}
        
        {/* Show count indicator */}
        {visibleCount === results.length && results.length > maxVisible && (
          <div className="text-center py-3 text-sm text-gray-500">
            All {results.length} services loaded
          </div>
        )}
    </div>
  )
}
