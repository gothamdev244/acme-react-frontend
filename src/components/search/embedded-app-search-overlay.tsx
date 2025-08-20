import { useRef, useEffect } from 'react'
import { X, Monitor, Zap, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { SearchInput } from './search-input'
import { EmbeddedAppSearchResults } from './embedded-app-search-results'
import { SearchResultsOptimized as SearchResults } from './search-results-optimized'
import { useEmbeddedAppSearch } from '../../hooks/use-embedded-app-search'
import { useSearchAPI } from '../../hooks/use-search-api'
import { useKeyboardShortcut } from '../../hooks/use-keyboard-shortcut'
import { type EmbeddedAppSearchResult } from '../../services/embedded-app-search.service'

interface EmbeddedAppSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  onAppLaunch?: (app: EmbeddedAppSearchResult & { context?: any }) => void
  defaultTab?: 'apps' | 'knowledge'
}

export function EmbeddedAppSearchOverlay({ 
  isOpen, 
  onClose, 
  onAppLaunch,
  defaultTab = 'apps'
}: EmbeddedAppSearchOverlayProps) {
  // Early return before any hooks to avoid hook-order issues when closed
  if (!isOpen) return null

  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  
  // Embedded app search
  const {
    query: appQuery,
    setQuery: setAppQuery,
    results: appResults,
    loading: appLoading,
    suggestedApps,
    launchApp,
    clearSearch: clearAppSearch,
    hasResults: hasAppResults,
    hasQuery: hasAppQuery,
    userContext
  } = useEmbeddedAppSearch()

  // General knowledge search
  const {
    query: knowledgeQuery,
    setQuery: setKnowledgeQuery,
    results: knowledgeResults,
    loading: knowledgeLoading,
    clearSearch: clearKnowledgeSearch,
    hasResults: hasKnowledgeResults,
    hasQuery: hasKnowledgeQuery
  } = useSearchAPI()

  // Handle ESC key to close overlay
  useKeyboardShortcut(
    { key: 'Escape' },
    () => {
      if (isOpen) {
        onClose()
      }
    },
    [isOpen, onClose]
  )

  // Focus management: trap focus and prevent iframe from stealing it
  useEffect(() => {
    if (!isOpen) return

    // Focus the input when overlay opens
    const focusTimer = setTimeout(() => {
      inputRef.current?.focus()
    }, 100)

    // Prevent focus from escaping to iframe
    const handleFocusIn = (e: FocusEvent) => {
      // If focus goes outside the overlay, bring it back to the input
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        e.preventDefault()
        e.stopPropagation()
        inputRef.current?.focus()
      }
    }

    // Add focusin listener to trap focus
    document.addEventListener('focusin', handleFocusIn, true)

    // Disable all iframes while overlay is open
    const iframes = document.querySelectorAll('iframe')
    iframes.forEach(iframe => {
      iframe.setAttribute('data-prev-tabindex', iframe.tabIndex.toString())
      iframe.tabIndex = -1
      iframe.style.pointerEvents = 'none'
    })

    return () => {
      clearTimeout(focusTimer)
      document.removeEventListener('focusin', handleFocusIn, true)
      
      // Restore iframe interactivity
      iframes.forEach(iframe => {
        const prevTabIndex = iframe.getAttribute('data-prev-tabindex')
        iframe.tabIndex = prevTabIndex ? parseInt(prevTabIndex) : 0
        iframe.style.pointerEvents = ''
        iframe.removeAttribute('data-prev-tabindex')
      })
    }
  }, [isOpen])

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  // Handle app launch
  const handleAppLaunch = async (app: EmbeddedAppSearchResult) => {
    try {
      const appWithContext = await launchApp(app)
      onAppLaunch?.(appWithContext)
      onClose() // Close overlay after launching app
    } catch (error) {
      // Failed to launch app
      // Still try to launch without context
      onAppLaunch?.(app)
      onClose()
    }
  }

  // Handle result click for knowledge base
  const handleKnowledgeResultClick = () => {
    // Optional: Close overlay after clicking a knowledge result
    // onClose()
  }

  // Clear all searches when closing overlay
  const handleClose = () => {
    clearAppSearch()
    clearKnowledgeSearch()
    onClose()
  }

  // Handle tab change - sync queries
  const handleTabChange = (tab: string) => {
    if (tab === 'apps') {
      setAppQuery(knowledgeQuery)
    } else {
      setKnowledgeQuery(appQuery)
    }
  }

  // Current tab values
  const currentQuery = defaultTab === 'apps' ? appQuery : knowledgeQuery
  const currentLoading = defaultTab === 'apps' ? appLoading : knowledgeLoading
  const setCurrentQuery = defaultTab === 'apps' ? setAppQuery : setKnowledgeQuery
  const clearCurrentSearch = defaultTab === 'apps' ? clearAppSearch : clearKnowledgeSearch

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] px-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }}
      onClick={handleBackdropClick}
    >
      {/* Search Container */}
      <div className="w-full max-w-4xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-top-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Enhanced Search
              </h2>
              <p className="text-sm text-muted-foreground">
                Find embedded applications and knowledge resources with context awareness
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {userContext.role && (
              <div className="text-xs text-muted-foreground px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                {userContext.role} • {userContext.customerTier}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <SearchInput
            ref={inputRef}
            value={currentQuery}
            onChange={setCurrentQuery}
            onClear={clearCurrentSearch}
            loading={currentLoading}
            placeholder="Search for embedded apps, procedures, knowledge articles..."
          />
          
          {/* Quick tip */}
          <div className="mt-3 text-xs text-muted-foreground">
            <span className="font-medium">Search examples:</span> "credit card management", "fraud detection", "customer profile", "mortgage calculator"
          </div>
        </div>

        {/* Tabs for different search types */}
        <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start rounded-none border-b dark:border-gray-700 h-12 p-0">
            <TabsTrigger 
              value="apps" 
              className="px-6 py-3 data-[state=active]:bg-background rounded-none border-r dark:border-gray-700"
            >
              <Monitor className="h-4 w-4 mr-2" />
              Embedded Apps
              {hasAppResults && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  {appResults.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="knowledge" 
              className="px-6 py-3 data-[state=active]:bg-background rounded-none"
            >
              <Zap className="h-4 w-4 mr-2" />
              Knowledge Base
              {hasKnowledgeResults && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                  {knowledgeResults.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          
          <div className="h-[60vh]">
            <TabsContent value="apps" className="h-full p-6 mt-0">
              <EmbeddedAppSearchResults
                results={appResults}
                loading={appLoading}
                query={appQuery}
                onAppLaunch={handleAppLaunch}
                suggestedApps={suggestedApps}
                showCategories={true}
              />
            </TabsContent>
            
            <TabsContent value="knowledge" className="h-full p-6 mt-0">
              <SearchResults
                results={knowledgeResults}
                loading={knowledgeLoading}
                query={knowledgeQuery}
                onResultClick={handleKnowledgeResultClick}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer with keyboard shortcuts and context info */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">↵</kbd>
              <span>to open</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">ESC</kbd>
              <span>to close</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">Tab</kbd>
              <span>to switch</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {userContext.currentIntent && (
              <div className="flex items-center gap-1">
                <span>Intent:</span>
                <span className="font-medium">{userContext.currentIntent}</span>
              </div>
            )}
            {(hasAppResults || hasKnowledgeResults) && (
              <div>
                {hasAppResults && appResults.length} apps{hasAppResults && hasKnowledgeResults && ', '}
                {hasKnowledgeResults && knowledgeResults.length} articles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
