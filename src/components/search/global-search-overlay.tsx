import { useRef, useEffect, useState } from 'react'
import { X, Search, Monitor, FileText } from 'lucide-react'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { SearchInput } from './search-input'
import { SearchResultsOptimized as SearchResults } from './search-results-optimized'
import { EmbeddedAppSearchResults } from './embedded-app-search-results'
import { useSearchAPI, type SearchResult } from '../../hooks/use-search-api'
import { useEmbeddedAppSearch } from '../../hooks/use-embedded-app-search'
import { useKeyboardShortcut } from '../../hooks/use-keyboard-shortcut'
import { type EmbeddedAppSearchResult } from '../../services/embedded-app-search.service'
import '../../styles/search-animations.css'

interface GlobalSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  onAppLaunch?: (app: EmbeddedAppSearchResult) => void
}

export function GlobalSearchOverlay({ isOpen, onClose, onAppLaunch }: GlobalSearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'knowledge' | 'apps'>('knowledge')
  
  // Knowledge base search
  const {
    query: knowledgeQuery,
    setQuery: setKnowledgeQuery,
    results: knowledgeResults,
    loading: knowledgeLoading,
    clearSearch: clearKnowledgeSearch,
    hasResults: hasKnowledgeResults,
    hasQuery: hasKnowledgeQuery
  } = useSearchAPI()

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
    hasQuery: hasAppQuery
  } = useEmbeddedAppSearch()

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

  // Handle result click for knowledge base
  const handleKnowledgeResultClick = (result: SearchResult) => {
    // Opening knowledge article
    // Knowledge articles open in new tab automatically via the SearchResults component
  }

  // Handle app launch
  const handleAppLaunch = async (app: EmbeddedAppSearchResult) => {
    try {
      const appWithContext = await launchApp(app)
      
      // Dispatch a custom event that the embedded column can listen to
      window.dispatchEvent(new CustomEvent('embedded-app:launch', { 
        detail: appWithContext 
      }))
      
      // Call the optional callback
      onAppLaunch?.(appWithContext)
      
      // Close the search overlay
      onClose()
    } catch (error) {
      // Failed to launch app
    }
  }

  // Clear all searches when closing overlay
  const handleClose = () => {
    clearKnowledgeSearch()
    clearAppSearch()
    onClose()
  }

  // Sync queries between tabs
  const handleTabChange = (value: string) => {
    const newTab = value as 'knowledge' | 'apps'
    setActiveTab(newTab)
    
    // Sync the query between tabs
    if (newTab === 'apps') {
      setAppQuery(knowledgeQuery)
    } else {
      setKnowledgeQuery(appQuery)
    }
  }

  // Get current values based on active tab
  const currentQuery = activeTab === 'knowledge' ? knowledgeQuery : appQuery
  const currentLoading = activeTab === 'knowledge' ? knowledgeLoading : appLoading
  const setCurrentQuery = activeTab === 'knowledge' ? setKnowledgeQuery : setAppQuery
  const clearCurrentSearch = activeTab === 'knowledge' ? clearKnowledgeSearch : clearAppSearch

  // Early return after all hooks have been called
  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)'
      }}
      onClick={handleBackdropClick}
    >
      {/* Search Container - Cleaner, more minimal */}
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-top-4 duration-300">
        
        {/* Content with Tabs on Top */}
        <div className="px-6 pt-4 pb-6 relative">
          {/* Close button positioned absolutely */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute right-4 top-4 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full z-10"
          >
            <X className="h-4 w-4" />
          </Button>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            {/* Clean tabs at the top */}
            <TabsList className="grid w-full grid-cols-2 mb-3 bg-transparent border-b border-gray-200 dark:border-gray-700 h-auto p-0 rounded-none">
              <TabsTrigger 
                value="knowledge" 
                className="search-tab pb-3 rounded-none border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-red-600 data-[state=active]:shadow-none"
              >
                <FileText className="h-4 w-4 mr-2" />
                Knowledge Base
                {hasKnowledgeResults && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({knowledgeResults.length})
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="apps" 
                className="search-tab pb-3 rounded-none border-0 bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-red-600 data-[state=active]:shadow-none"
              >
                <Monitor className="h-4 w-4 mr-2" />
                Applications
                {hasAppResults && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({appResults.length})
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Beautiful Search Input below tabs */}
            <div className="mb-4">
              <SearchInput
                ref={inputRef}
                value={currentQuery}
                onChange={setCurrentQuery}
                onClear={clearCurrentSearch}
                loading={currentLoading}
                placeholder={activeTab === 'knowledge' 
                  ? "Search procedures, policies, compliance guides, or banking regulations..." 
                  : "Search banking applications and tools..."}
              />
              {/* Search hints */}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {activeTab === 'knowledge' ? (
                  <p>Try searching for: "loan procedures", "account opening", "KYC guidelines", "compliance rules"</p>
                ) : (
                  <p>Try searching for: "balance check", "transaction history", "customer profile", "loan calculator"</p>
                )}
              </div>
            </div>

            {/* Results with fade-in animation */}
            <div className="max-h-[50vh] overflow-y-auto">
              <TabsContent value="knowledge" className="search-results-container mt-0">
                <SearchResults
                  results={knowledgeResults}
                  loading={knowledgeLoading}
                  query={knowledgeQuery}
                  onResultClick={handleKnowledgeResultClick}
                />
              </TabsContent>
              
              <TabsContent value="apps" className="search-results-container mt-0">
                <EmbeddedAppSearchResults
                  results={appResults}
                  loading={appLoading}
                  query={appQuery}
                  onAppLaunch={handleAppLaunch}
                  suggestedApps={suggestedApps}
                  showCategories={true}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer with keyboard shortcuts */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">↵</kbd>
              <span>to open</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">Tab</kbd>
              <span>to switch</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs">ESC</kbd>
              <span>to close</span>
            </div>
          </div>
          
          {(hasKnowledgeResults || hasAppResults) && (
            <div className="text-xs text-muted-foreground">
              {activeTab === 'knowledge' 
                ? `${knowledgeResults.length} result${knowledgeResults.length !== 1 ? 's' : ''}`
                : `${appResults.length} service${appResults.length !== 1 ? 's' : ''}`}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
