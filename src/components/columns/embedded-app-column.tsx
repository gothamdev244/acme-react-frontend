import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { Skeleton } from '../ui/skeleton'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { AlertCircle, RefreshCw, Monitor, X } from 'lucide-react'
import { 
  useCustomerData, 
  useCallerId, 
  useAgentId, 
  useWebSocketIntent,
  useEmbeddedAppIntent,
  useAvailableIntents
} from '../../stores/selectors/embedded-app-selectors'
import { useIframeHealthMonitor } from '../../hooks/use-iframe-health-monitor'
import { useWebSocket } from '../../contexts/websocket-context'
import { buildAppUrl, CustomerContext } from '../../services/url-builder.service'
import { useRoleConfig } from '../../contexts/role-context'
import { traceLog } from '../../utils/debug'

// ✅ FIXED: Embedded app URL and allowed origins now configurable via environment variables
const EMBEDDED_APP_URL = import.meta.env.VITE_EMBEDDED_APP_URL || ''
const ALLOWED_ORIGINS = import.meta.env.VITE_ALLOWED_ORIGINS 
  ? import.meta.env.VITE_ALLOWED_ORIGINS.split(',').map((origin: string) => origin.trim())
  : []


interface EmbeddedAppTab {
  id: string
  intent: string
  label: string
  url: string
  isLoading: boolean
  error: string | null
  handshakeComplete: boolean
  appKey?: string // For launched apps from search
  context?: any // Additional context for the app
}

// Memoized iframe component to prevent unnecessary re-renders
const IframeTab = memo(({ 
  tab, 
  isActive, 
  onLoad, 
  onRetry,
  iframeRef 
}: { 
  tab: EmbeddedAppTab
  isActive: boolean
  onLoad: () => void
  onRetry: () => void
  iframeRef: (el: HTMLIFrameElement | null) => void
}) => {
  return (
    <div className={`absolute inset-0 ${isActive ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
      {tab.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 cursor-wait">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary pointer-events-none" />
        </div>
      )}
      
      {tab.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10 p-4">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {tab.error}
              <Button 
                onClick={onRetry} 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry Connection
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={tab.url}
        className="w-full h-full border-0"
        style={{ pointerEvents: tab.isLoading ? 'none' : 'auto' }}
        tabIndex={tab.isLoading ? -1 : 0}
        title={`HSBC ${tab.label}`}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        allow="clipboard-write"
        onLoad={onLoad}
        onError={() => onRetry()}
      />
    </div>
  )
})

IframeTab.displayName = 'IframeTab'

function EmbeddedAppColumnComponent() {
  const [tabs, setTabs] = useState<EmbeddedAppTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [iframeHeight, setIframeHeight] = useState('800px')
  const [closedIntents, setClosedIntents] = useState<Set<string>>(new Set())
  const iframeRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({})
  // Use granular selectors to prevent unnecessary re-renders
  const customer = useCustomerData()
  const callerId = useCallerId()
  const agentId = useAgentId()
  const embeddedAppIntent = useEmbeddedAppIntent()
  const availableIntents = useAvailableIntents()
  const { isConnected } = useWebSocket()
  const { currentRole } = useRoleConfig()
  const handshakeTimeoutRefs = useRef<{ [key: string]: NodeJS.Timeout | null }>({})
  const embeddedAppIntentRef = useRef(embeddedAppIntent)
  const closedIntentsRef = useRef(closedIntents)
  const tabsRef = useRef(tabs)
  
  // Get WebSocket enriched intent data with appUrl and appTitle
  const websocketIntent = useWebSocketIntent()
  
  
  
  // Helper to get intent display name
  const getIntentLabel = (intent: string) => {
    const intentLabels: { [key: string]: string } = {
      'credit_card_transactions': 'Credit Card',
      'fraud_alert': 'Fraud Alert',
      'credit_card_management': 'Card Management',
      'portfolio_analysis_request': 'Portfolio Review',
      'investment_advice': 'Investment Advice',
      'international_transfer': 'International Transfer',
      'mortgage_inquiry': 'Mortgage',
      'mortgage_application': 'Mortgage Application',
      'student_loan': 'Student Loan',
      'account_balance_inquiry': 'Account Balance',
      'loan_application': 'Loan Application',
      'business_loan': 'Business Loan',
      'account_upgrade': 'Account Upgrade',
      'account_upgrade_eligibility': 'Account Upgrade',
      'approval_process': 'Approval Process',
      'eligibility_check': 'Eligibility Assessment',
      'wealth_management': 'Wealth Management'
    }
    
    // If specific mapping exists, use it, otherwise format snake_case to Title Case
    return intentLabels[intent] || intent
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }
  
  // Keep refs updated - removed agentData ref
  useEffect(() => {
    embeddedAppIntentRef.current = embeddedAppIntent
    closedIntentsRef.current = closedIntents
    tabsRef.current = tabs
  }, [embeddedAppIntent, closedIntents, tabs])

  // Listen for customer context changes to update app URLs
  useEffect(() => {
    const handleCustomerContextUpdate = (event: CustomEvent) => {
      const { customer, hasContext } = event.detail
      traceLog('🔔 [TRACE] EmbeddedAppColumn received customer-context:updated event:', { 
        hasContext, 
        customer, 
        customerId: customer?.id,
        customerName: customer?.name,
        currentTabs: tabs.length,
        agentDataCustomer: customer,
        timestamp: new Date().toISOString()
      })
      
      // Update all tabs with new context-aware URLs
      setTabs(prev => prev.map(tab => {
        const customerContext: CustomerContext = {
          customerId: customer?.id || '',
          accountNumber: customer?.accountNumber,
          customerName: customer?.name,
          customerTier: customer?.tier,
          intent: tab.intent,
          callerId: callerId,
          email: customer?.email,
          phone: customer?.phone,
          location: customer?.location,
          cin: customer?.cin,
          accountType: customer?.accountType
        }
        
        // Build new URL based on updated context
        const newUrl = buildAppUrl(
          tab.appKey || tab.intent,
          hasContext,
          customerContext,
          { 
            role: 'agent',
            tabId: tab.id,
            launchedFromSearch: tab.appKey ? 'true' : 'false'
          }
        )
        
        // Only update if URL has changed (switching between modes)
        if (newUrl !== tab.url) {
          traceLog(`🔄 [TRACE] EmbeddedAppColumn updating tab ${tab.id} URL:`, {
            tabId: tab.id,
            fromMode: hasContext ? 'manual' : 'context',
            toMode: hasContext ? 'context' : 'manual',
            oldUrl: tab.url,
            newUrl,
            customerContext,
            hasContext
          })
          
          // Reset handshake state for reload
          return {
            ...tab,
            url: newUrl,
            isLoading: true,
            handshakeComplete: false,
            context: { ...tab.context, hasContext, mode: hasContext ? 'context' : 'manual' }
          }
        }
        
        return tab
      }))
    }
    
    window.addEventListener('customer-context:updated', handleCustomerContextUpdate as EventListener)
    
    return () => {
      window.removeEventListener('customer-context:updated', handleCustomerContextUpdate as EventListener)
    }
  }, [callerId, customer])
  
  // Listen for app launch events from global search
  useEffect(() => {
    const handleAppLaunch = (event: CustomEvent) => {
      const app = event.detail
      
      // Check if tab already exists for this app
      const existingTab = tabs.find(tab => tab.appKey === app.appKey)
      if (existingTab) {
        setActiveTabId(existingTab.id)
        return
      }
      
      // Build customer context for URL generation
      const customerContext: CustomerContext = {
        customerId: customer?.id || '',
        accountNumber: customer?.accountNumber,
        customerName: customer?.name,
        customerTier: customer?.tier,
        intent: app.supportedIntents?.[0] || app.intent,
        callerId: callerId,
        email: customer?.email,
        phone: customer?.phone,
        location: customer?.location,
        cin: customer?.cin,
        accountType: customer?.accountType
      }
      
      // Determine if we have customer context
      const hasContext = !!(customer?.id)
      
      // Build appropriate URL based on context availability
      const appUrl = buildAppUrl(
        app.appKey || app.id,
        hasContext,
        customerContext,
        { 
          role: 'agent',
          tabId: `app-${app.appKey || app.id}-${Date.now()}`,
          launchedFromSearch: 'true'
        }
      )
      
      // Create new tab for the launched app
      const newTabId = `app-${app.appKey || app.id}-${Date.now()}`
      const newTab: EmbeddedAppTab = {
        id: newTabId,
        intent: app.appKey || app.supportedIntents?.[0] || app.intent || 'manual_launch', // Use appKey as intent
        label: app.title || app.label || 'App',
        url: appUrl,
        isLoading: true,
        error: null,
        handshakeComplete: false,
        appKey: app.appKey,
        context: { ...app.context, hasContext, mode: hasContext ? 'context' : 'manual' }
      }
      
      setTabs(prev => [...prev, newTab])
      setActiveTabId(newTabId)
    }

    window.addEventListener('embedded-app:launch', handleAppLaunch as EventListener)
    
    return () => {
      window.removeEventListener('embedded-app:launch', handleAppLaunch as EventListener)
    }
  }, [tabs, customer, callerId])
  
  // Handle call end - reset all tabs when disconnected
  useEffect(() => {
    if (!isConnected) {
      // Clear all tabs
      setTabs([])
      setActiveTabId(null)
      setClosedIntents(new Set()) // Reset closed intents for next call
      
      // Clear all timeouts
      Object.values(handshakeTimeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout)
      })
      handshakeTimeoutRefs.current = {}
      
      // Clear iframe refs
      iframeRefs.current = {}
    }
  }, [isConnected])
  
  // DON'T create default tab automatically - only create tabs when:
  // 1. Intent is detected
  // 2. App is launched from search
  // This prevents card management from opening by default
  useEffect(() => {
    // Removed automatic default tab creation
    // Tabs should only be created through explicit intent detection or app launch
  }, [currentRole, isConnected, tabs.length])
  
  // Extract tab creation logic into reusable function
  const createTabForIntent = useCallback((intentToCreate: string, switchToTab: boolean = false) => {
    // Check if tab already exists for this intent
    const existingTab = tabs.find(tab => tab.intent === intentToCreate)
    if (existingTab) {
      if (switchToTab) {
        setActiveTabId(existingTab.id)
      }
      return existingTab.id
    }
    
    // Check for WebSocket enriched data
    const hasEnrichedAppData = !!(websocketIntent?.type === intentToCreate && websocketIntent?.appUrl && websocketIntent?.appTitle)
    
    let appUrl: string
    let appTitle: string
    
    if (hasEnrichedAppData) {
      // Use enriched data from Gateway intent-to-app mapping
      appUrl = `${EMBEDDED_APP_URL}${websocketIntent.appUrl}`
      appTitle = websocketIntent.appTitle!
      
      
      // DEDUPLICATION: Check if a tab with the same appUrl already exists
      const existingAppTab = tabs.find(tab => tab.url.startsWith(`${EMBEDDED_APP_URL}${websocketIntent.appUrl}`))
      if (existingAppTab) {
        if (switchToTab) {
          setActiveTabId(existingAppTab.id)
        }
        return existingAppTab.id
      }
    } else {
      // Fallback to traditional URL building
      const customerContext: CustomerContext = {
        customerId: customer?.id || '',
        accountNumber: customer?.accountNumber,
        customerName: customer?.name,
        customerTier: customer?.tier,
        intent: intentToCreate,
        callerId: callerId,
        email: customer?.email,
        phone: customer?.phone,
        location: customer?.location,
        cin: customer?.cin,
        accountType: customer?.accountType
      }
      
      const hasContext = !!(customer?.id)
      
      appUrl = buildAppUrl(
        intentToCreate,
        hasContext,
        customerContext,
        { role: 'agent', tabId: `tab-${intentToCreate}-${Date.now()}` }
      )
      appTitle = getIntentLabel(intentToCreate)
      
    }
    
    // Create new tab
    const newTabId = `tab-${intentToCreate}-${Date.now()}`
    const newTab: EmbeddedAppTab = {
      id: newTabId,
      intent: intentToCreate,
      label: appTitle,
      url: appUrl,
      isLoading: true,
      error: null,
      handshakeComplete: false
    }
    
    
    setTabs(prev => {
      const newTabs = [...prev, newTab]
      
      // Switch to new tab if requested or if no tab is currently active
      if (switchToTab || !activeTabId) {
        setActiveTabId(newTabId)
      }
      
      return newTabs
    })
    
    return newTabId
  }, [tabs, websocketIntent, customer, callerId, activeTabId])
  
  // Add new tab when new intent is detected - use WebSocket enriched data when available
  useEffect(() => {
    // Prioritize WebSocket enriched intent data, fallback to intent store
    const currentIntent = websocketIntent?.type || embeddedAppIntent
    
    if (!currentIntent || !isConnected) {
      return
    }
    
    // Check if user previously closed this intent
    if (closedIntents.has(currentIntent)) {
      return
    }
    
    // Use the extracted function to create the tab
    createTabForIntent(currentIntent, false) // Don't auto-switch for preservation of free navigation
  }, [embeddedAppIntent, websocketIntent, isConnected, closedIntents, createTabForIntent])
  
  // Listen for dropdown selections - using refs to avoid recreating listeners
  useEffect(() => {
    const handleDropdownSelection = (event: CustomEvent) => {
      const selectedIntent = event.detail.intent
      if (!selectedIntent || !isConnected) return
      
      // Check if this intent was previously closed (using ref)
      if (closedIntentsRef.current.has(selectedIntent)) {
        // Remove from closed intents so it can be recreated
        setClosedIntents(prev => {
          const next = new Set(prev)
          next.delete(selectedIntent)
          return next
        })
        // Create tab directly to avoid race conditions
        createTabForIntent(selectedIntent, true)
        return
      }
      
      // Find existing tab for this intent (using ref)
      const existingTab = tabsRef.current.find(tab => tab.intent === selectedIntent)
      if (existingTab) {
        setActiveTabId(existingTab.id)
      } else {
        // No existing tab and not closed - create a new one
        createTabForIntent(selectedIntent, true)
      }
    }
    
    // Also listen for dropdown clicks to handle reopening closed tabs
    const handleDropdownClick = (event: CustomEvent) => {
      const clickedIntent = event.detail.intent
      if (!clickedIntent || !isConnected) return
      
      // Check if this intent was previously closed (using ref)
      if (closedIntentsRef.current.has(clickedIntent)) {
        // Remove from closed intents so it can be recreated
        setClosedIntents(prev => {
          const next = new Set(prev)
          next.delete(clickedIntent)
          return next
        })
        
        // Create tab directly using extracted function to avoid race condition
        // This bypasses the embeddedAppIntent store entirely for reopened tabs
        createTabForIntent(clickedIntent, true) // Switch to the reopened tab
        return
      }
      
      // Find existing tab for this intent (using ref)
      const existingTab = tabsRef.current.find(tab => tab.intent === clickedIntent)
      if (existingTab) {
        setActiveTabId(existingTab.id)
      }
    }
    
    window.addEventListener('intent:dropdown-selected', handleDropdownSelection as EventListener)
    window.addEventListener('intent:dropdown-clicked', handleDropdownClick as EventListener)
    return () => {
      window.removeEventListener('intent:dropdown-selected', handleDropdownSelection as EventListener)
      window.removeEventListener('intent:dropdown-clicked', handleDropdownClick as EventListener)
    }
  }, [isConnected, createTabForIntent]) // Include createTabForIntent for dropdown reopening
  
  // Handle iframe communication for each tab
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      
      // Security: Verify origin
      if (!ALLOWED_ORIGINS.includes(event.origin)) {
        return
      }
      
      // Get the tab ID from the message if available
      const tabId = event.data.tabId || activeTabId
      
      switch (event.data.type) {
        case 'embed.ready':
          
          // Update the specific tab's state
          setTabs(prev => prev.map(tab => 
            tab.id === tabId 
              ? { ...tab, handshakeComplete: true, isLoading: false, error: null }
              : tab
          ))
          
          // Clear the timeout for this tab
          if (handshakeTimeoutRefs.current[tabId]) {
            clearTimeout(handshakeTimeoutRefs.current[tabId])
            delete handshakeTimeoutRefs.current[tabId]
          }
          
          // Send initial state to the iframe
          const tab = tabs.find(t => t.id === tabId)
          if (tab && iframeRefs.current[tabId]?.contentWindow) {
            try {
              const hasContext = !!(customer?.id)
              const message = {
                type: 'host.state',
                context: {
                  customerId: customer?.id,
                  agentId: agentId,
                  customerName: customer?.name,
                  accountNumber: customer?.accountNumber,
                  customerTier: customer?.tier,
                  email: customer?.email,
                  phone: customer?.phone,
                  location: customer?.location,
                  cin: customer?.cin,
                  accountType: customer?.accountType,
                  intent: tab.intent,
                  intentContext: {},
                  // Include additional context for launched apps
                  appKey: tab.appKey,
                  launchedFromSearch: !!tab.appKey,
                  additionalContext: tab.context,
                  // Dual mode support
                  mode: hasContext ? 'context' : 'manual',
                  hasCustomerContext: hasContext
                }
              }
              iframeRefs.current[tabId].contentWindow.postMessage(message, '*')
            } catch (error) {
              // Don't let iframe communication errors affect the main app
            }
          }
          break
          
        case 'kms.open':
          // Request to open KMS article
          // Dispatch event that Space Copilot listens for
          window.dispatchEvent(new CustomEvent('kms:open-article', { 
            detail: { articleId: event.data.articleId } 
          }))
          break
          
        case 'action.execute':
          // Execute an action from embedded app
          break
          
        case 'resize':
          // Handle iframe resize request
          if (event.data.height) {
            setIframeHeight(`${event.data.height}px`)
          }
          break
        
        case 'call.ended':
          // Reset all tabs when call ends
          setTabs([])
          setActiveTabId(null)
          break
          
        default:
          break
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [activeTabId, tabs, customer, agentId])
  
  // Handle iframe load event for each tab
  const handleIframeLoad = (tabId: string) => {
    const iframe = iframeRefs.current[tabId]
    const tab = tabs.find(t => t.id === tabId)
    
    if (iframe?.contentWindow) {
      // Send ping to establish connection
      setTimeout(() => {
        try {
          const pingMessage = { type: 'host.ping', tabId }
          iframe.contentWindow?.postMessage(pingMessage, '*')
        } catch (error) {
          // Don't let iframe errors affect the main app
        }
      }, 100) // Reduced from 300ms to 100ms for faster handshake
      
      // Set timeout for handshake (reduced from 10s to 3s for faster feedback)
      handshakeTimeoutRefs.current[tabId] = setTimeout(() => {
        const tab = tabs.find(t => t.id === tabId)
        if (tab && !tab.handshakeComplete) {
          setTabs(prev => prev.map(t => 
            t.id === tabId 
              ? { ...t, error: 'Banking service temporarily unavailable', isLoading: false }
              : t
          ))
        }
      }, 2000) // Reduced from 3000ms to 2000ms for faster feedback
    }
  }
  
  // Handle retry for a specific tab
  const handleRetry = (tabId: string) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, error: null, isLoading: true, handshakeComplete: false }
        : tab
    ))
    
    // Clear existing timeout
    if (handshakeTimeoutRefs.current[tabId]) {
      clearTimeout(handshakeTimeoutRefs.current[tabId])
      delete handshakeTimeoutRefs.current[tabId]
    }
    
    // Reload the iframe
    const iframe = iframeRefs.current[tabId]
    if (iframe) {
      iframe.src = iframe.src
    }
  }
  
  // Handle tab close
  const handleCloseTab = (tabId: string) => {
    // Track which intent was closed
    const tabToClose = tabs.find(t => t.id === tabId)
    if (tabToClose) {
      setClosedIntents(prev => new Set([...prev, tabToClose.intent]))
    }
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId))
    
    // Clear timeout
    if (handshakeTimeoutRefs.current[tabId]) {
      clearTimeout(handshakeTimeoutRefs.current[tabId])
      delete handshakeTimeoutRefs.current[tabId]
    }
    
    // Clear iframe ref
    delete iframeRefs.current[tabId]
    
    // Switch to another tab if this was active
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId)
      setActiveTabId(remainingTabs.length > 0 ? remainingTabs[0].id : null)
    }
  }


  // Show empty state if no tabs
  if (tabs.length === 0) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md mx-auto px-4">
          <div className="text-muted-foreground">
            <Monitor className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground">Banking Services Ready</p>
            <p className="text-sm opacity-75 leading-relaxed">Customer service tools will appear here automatically when banking needs are identified during the call</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background flex flex-col">
      <Tabs value={activeTabId || ''} onValueChange={setActiveTabId} className="flex-1 flex flex-col">
        {/* Header container to match other columns */}
        <div className="h-12 bg-muted/30 border-b">
          <TabsList className="h-full w-full justify-start rounded-none border-0 p-0 px-2 bg-transparent">
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="relative h-full px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none border-r last:border-r-0"
              >
                <span className="mr-2">{tab.label}</span>
                <span
                  className="inline-flex items-center justify-center h-4 w-4 p-0 hover:bg-muted rounded cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCloseTab(tab.id)
                  }}
                >
                  <X className="h-3 w-3" />
                </span>
                {tab.isLoading && (
                  <div className="absolute right-1 top-1">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                  </div>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        <div className="flex-1 relative overflow-hidden">
          {tabs.map(tab => (
            <IframeTab
              key={tab.id}
              tab={tab}
              isActive={activeTabId === tab.id}
              onLoad={() => handleIframeLoad(tab.id)}
              onRetry={() => handleRetry(tab.id)}
              iframeRef={(el) => {
                if (el) {
                  iframeRefs.current[tab.id] = el
                }
              }}
            />
          ))}
        </div>
      </Tabs>
    </div>
  )
}


export const EmbeddedAppColumn = memo(EmbeddedAppColumnComponent)
