import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { TranscriptWidget } from '../widgets/transcript'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { ResizableHandle } from '../layout/resizable-widget-container'
import { useWidgetLayout } from '../../hooks/use-widget-layout'
import { useAgentSettings } from '../../hooks/use-agent-settings'
import { 
  Bot,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  User,
  CreditCard,
  Shield,
  FileText,
  Copy,
  Wallet,
  ShieldAlert,
  AlertTriangle,
  Banknote,
  Building,
  Plane,
  BookOpen,
  ExternalLink,
  Target,
  X,
  Smile,
  Frown,
  Meh,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { useIntentStore } from '../../stores/intent-store'
import { useAgentStore } from '../../stores/agent-store'
import { useWebSocket } from '../../contexts/websocket-context'
import { intentRegistry, detectIntentsFromConversation } from '../../config/intent-registry'
import { ErrorBoundary, SpaceCopilotErrorFallback } from '../common/error-boundary'
import intentService from '../../services/intent-service'
import { useNotificationStore } from '../../stores/notification-store'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'

// Helper function to get icon component from string
const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    'credit-card': CreditCard,
    'wallet': Wallet,
    'shield-alert': ShieldAlert,
    'alert-triangle': AlertTriangle,
    'file-text': FileText,
    'banknote': Banknote,
    'shield': Shield,
    'user': User,
    'building': Building,
    'plane': Plane
  }
  return icons[iconName] || CreditCard
}

interface SpaceCopilotColumnProps {
  onKMSOpen?: (articleId: string, article?: any) => void
}

function SpaceCopilotColumnComponent({ onKMSOpen }: SpaceCopilotColumnProps) {
  const { 
    currentIntent, 
    availableIntents, 
    selectIntent,
    setEmbeddedAppIntent,
    setAvailableIntents,
    clearIntents 
  } = useIntentStore()
  const { agentData } = useAgentStore()
  const { settings } = useAgentSettings()
  const webSocketContext = useWebSocket()
  const isConnected = webSocketContext?.isConnected || false
  
  // Intent notification tracking for the entire column
  const hasShownNotificationForIntent = useRef<Set<string>>(new Set())
  const previousIntentRef = useRef<string | null>(null)
  const [newIntentTrigger, setNewIntentTrigger] = useState<{intentId: string, timestamp: number} | null>(null)
  
  // Widget layout hooks - only for transcript if enabled
  const transcriptLayout = useWidgetLayout({
    column: 'spaceCopilot',
    widgetId: 'transcript',
    defaultSize: 40,
    minSize: 25,
    maxSize: 60
  })
  
  const aiAssistanceLayout = useWidgetLayout({
    column: 'spaceCopilot',
    widgetId: 'ai-assistance',
    defaultSize: settings.interface.showTranscript ? 60 : 100,
    minSize: settings.interface.showTranscript ? 40 : 100,
    maxSize: settings.interface.showTranscript ? 75 : 100
  })

  // Clear intents when call ends (disconnected)
  useEffect(() => {
    if (!isConnected) {
      clearIntents()
      // Clear notification tracking for fresh notifications on new calls
      hasShownNotificationForIntent.current.clear()
      previousIntentRef.current = null
      // Clear any pending intent triggers
      setNewIntentTrigger(null)
    }
  }, [isConnected, clearIntents])
  
  // Initialize intents based on real agent data - accumulate multiple intents
  useEffect(() => {
    const processIntent = async () => {
      try {
        
        // Only show intent if we have real intent data from the agent
        if (agentData.intent && agentData.intent.type && agentData.intent.type !== 'UNKNOWN') {
          
          try {
            // Use WebSocket enriched intent data from Gateway
            const intentId = agentData.intent.type
            const hasEnrichedData = !!(agentData.intent.appUrl && agentData.intent.appTitle)
            
            if (!hasEnrichedData) {
              return
            }
            
            // Use enriched data from Gateway - this means the intent definitely has an embedded app
            const realIntent = {
              id: intentId,
              name: agentData.intent.appTitle || intentId,
              icon: 'target',
              context: {},
              confidence: agentData.intent.confidence || 0.9,
              hasEmbeddedApp: true,
              appUrl: agentData.intent.appUrl
            }
            
            // Add to available intents if not already present
            setAvailableIntents(prev => {
              // Check if this exact intent already exists
              const exactIntentExists = prev.some(intent => intent.id === realIntent.id)
              
              if (exactIntentExists) {
                // Update confidence if intent already exists
                return prev.map(intent => 
                  intent.id === realIntent.id 
                    ? { ...intent, confidence: realIntent.confidence }
                    : intent
                )
              }
              
              // DEDUPLICATION: Check if an intent with the same appUrl already exists
              // This prevents duplicate dropdown entries for different intents that map to the same app
              const sameAppExists = prev.some(intent => 
                intent.appUrl === realIntent.appUrl && intent.id !== realIntent.id
              )
              
              if (sameAppExists) {
                // Don't add this intent as it would create a duplicate dropdown entry
                // IMPORTANT: Also don't set embeddedAppIntent to prevent duplicate tab creation
                return prev
              }
              
              // Add new intent to the list
              const newArray = [...prev, realIntent]
              
              // Trigger visual feedback for new intent detection
              setNewIntentTrigger({
                intentId: realIntent.id,
                timestamp: Date.now()
              })
              
              // Only set embedded app intent if this is the first intent OR if no tabs exist yet
              // This prevents creating duplicate tabs for the same app
              if (prev.length === 0) {
                setEmbeddedAppIntent(realIntent.id)
              }
              
              return newArray
            })
            
            // Auto-select the first intent only
            if (availableIntents.length === 0) {
              selectIntent(realIntent.id)
            }
            
          } catch (error) {
          }
          
        } else if (!agentData.intent || agentData.intent.type === 'UNKNOWN') {
          // Clear intents if no existing intents AND not connected
          if (availableIntents.length === 0 && !isConnected) {
            setAvailableIntents([])
            selectIntent('')
          }
        }
      } catch (error) {
      }
    }
    
    processIntent()
  }, [agentData.intent, isConnected, availableIntents.length])
  
  // Get current intent details
  const intentDetails = currentIntent ? 
    intentRegistry[currentIntent as keyof typeof intentRegistry] : null
    
  // Get current intent object from available intents
  const currentIntentObj = currentIntent ? 
    availableIntents.find(i => i.id === currentIntent) : null
    
  
  // Conditionally render with or without transcript based on settings
  if (settings.interface.showTranscript) {
    return (
      <PanelGroup direction="vertical" className="h-full w-full">
        {/* Space Copilot Panel with Intent at top */}
        <Panel 
          defaultSize={aiAssistanceLayout.size}
          minSize={aiAssistanceLayout.minSize}
          maxSize={aiAssistanceLayout.maxSize}
          onResize={aiAssistanceLayout.handleResize}
        >
          <ErrorBoundary fallback={SpaceCopilotErrorFallback}>
            <SpaceCopilotContent 
              currentIntent={currentIntent}
              currentIntentObj={currentIntentObj}
              availableIntents={availableIntents}
              selectIntent={selectIntent}
              setEmbeddedAppIntent={setEmbeddedAppIntent}
              agentData={agentData}
              onKMSOpen={onKMSOpen}
              notificationTracker={hasShownNotificationForIntent}
              previousIntentTracker={previousIntentRef}
              newIntentTrigger={newIntentTrigger}
              isConnected={isConnected}
            />
          </ErrorBoundary>
        </Panel>
        
        <ResizableHandle direction="vertical" />
        
        {/* Transcript Panel at bottom - Only show if enabled */}
        <Panel 
          defaultSize={transcriptLayout.size}
          minSize={transcriptLayout.minSize}
          maxSize={transcriptLayout.maxSize}
          onResize={transcriptLayout.handleResize}
        >
          <div className="h-full flex flex-col border-t">
            <div className="flex-1 overflow-hidden">
              <TranscriptWidget />
            </div>
          </div>
        </Panel>
      </PanelGroup>
    )
  }

  // No transcript - full height Space Copilot
  return (
    <div className="h-full">
      <ErrorBoundary fallback={SpaceCopilotErrorFallback}>
        <SpaceCopilotContent 
          currentIntent={currentIntent}
          currentIntentObj={currentIntentObj}
          availableIntents={availableIntents}
          selectIntent={selectIntent}
          setEmbeddedAppIntent={setEmbeddedAppIntent}
          agentData={agentData}
          onKMSOpen={onKMSOpen}
          notificationTracker={hasShownNotificationForIntent}
          previousIntentTracker={previousIntentRef}
          newIntentTrigger={newIntentTrigger}
          isConnected={isConnected}
        />
      </ErrorBoundary>
    </div>
  )
}

// Modern Space Copilot Content Component
function SpaceCopilotContent({ currentIntent, currentIntentObj, availableIntents, selectIntent, setEmbeddedAppIntent, agentData, onKMSOpen, notificationTracker, previousIntentTracker, newIntentTrigger, isConnected }: {
  currentIntent: string | null
  currentIntentObj: any | null
  availableIntents: any[]
  selectIntent: (id: string) => void
  setEmbeddedAppIntent: (id: string) => void
  agentData: any
  onKMSOpen?: (articleId: string, article?: any) => void
  notificationTracker: React.MutableRefObject<Set<string>>
  previousIntentTracker: React.MutableRefObject<string | null>
  newIntentTrigger: {intentId: string, timestamp: number} | null
  isConnected: boolean
}) {
  // Extract AI coaching messages from actions data
  const aiCoachingActions = (agentData?.actions || []).filter((action: any) => action.type === 'ai_coaching')
  const customerProfile = agentData?.customer || {}
  const knowledgeArticles = agentData?.knowledgeArticles || []
  const [viewedArticles, setViewedArticles] = useState<Set<string>>(new Set())
  const { addNotification } = useNotificationStore()
  const lastArticleCountRef = useRef(0)
  const lastCoachingCountRef = useRef(0)
  
  // Intent detection visual feedback states
  const [newIntentDetected, setNewIntentDetected] = useState(false)
  const [dropdownGlow, setDropdownGlow] = useState(false)
  
  // Refs for sticky scrolling
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const aiMessagesEndRef = useRef<HTMLDivElement>(null)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Count new articles
  const newArticleCount = knowledgeArticles.filter((article: any) => 
    article.isNew && !viewedArticles.has(article.id)
  ).length
  
  // Show notification when new articles arrive
  useEffect(() => {
    const currentCount = knowledgeArticles.length
    if (currentCount > lastArticleCountRef.current && lastArticleCountRef.current > 0) {
      const newCount = currentCount - lastArticleCountRef.current
      const newArticles = knowledgeArticles.slice(0, newCount)
      
      addNotification({
        type: 'knowledge',
        title: "New Knowledge Articles",
        description: `${newCount} new article${newCount > 1 ? 's' : ''} available: ${newArticles.map((a: any) => a.title).join(', ')}`,
        icon: 'sparkles',
        actionLabel: 'View',
        actionCallback: () => {
          // Scroll to knowledge articles section
          if (scrollAreaRef.current) {
            const knowledgeSection = document.querySelector('[data-section="knowledge"]')
            if (knowledgeSection) {
              knowledgeSection.scrollIntoView({ behavior: 'smooth' })
            }
          }
        }
      })
    }
    lastArticleCountRef.current = currentCount
  }, [knowledgeArticles.length, addNotification])
  
  // Show notification for AI coaching messages
  useEffect(() => {
    const currentCount = aiCoachingActions.length
    if (currentCount > lastCoachingCountRef.current && lastCoachingCountRef.current > 0) {
      const newCoaching = aiCoachingActions[0] // Most recent coaching
      
      if (newCoaching && newCoaching.stage === 'resolution') {
        addNotification({
          type: 'ai_coaching',
          title: "AI Resolution Guidance",
          description: newCoaching.action.substring(0, 100) + '...',
          icon: 'bot'
        })
      } else if (newCoaching && ['greeting', 'discovery'].includes(newCoaching.stage)) {
        // Don't notify for early stage coaching
      } else if (newCoaching) {
        addNotification({
          type: 'ai_coaching',
          title: "AI Assistant Update",
          description: `New ${newCoaching.stage} guidance available`,
          icon: 'bot'
        })
      }
    }
    lastCoachingCountRef.current = currentCount
  }, [aiCoachingActions.length, addNotification])
  
  // Detect intent changes and trigger visual feedback ONLY for WebSocket-detected intents
  useEffect(() => {
    // Only process intents if we're connected
    if (!isConnected) {
      return
    }
    
    if (currentIntent && currentIntent !== previousIntentTracker.current) {
      // Only show notifications for intents we haven't already notified about
      if (previousIntentTracker.current !== null && !notificationTracker.current.has(currentIntent)) {
        // Mark this intent as having been notified
        notificationTracker.current.add(currentIntent)
        
        setNewIntentDetected(true)
        setDropdownGlow(true)
        
        // Add notification to notification center (only once per intent) - NO TOAST
        addNotification({
          type: 'system',
          title: 'New Intent Detected',
          description: `Customer intent identified: ${currentIntentObj?.name || currentIntent}`,
          icon: 'target',
          metadata: { intent: currentIntent, confidence: currentIntentObj?.confidence }
        })
        
        // Auto-dismiss alert after 5 seconds
        setTimeout(() => {
          setNewIntentDetected(false)
        }, 5000)
        
        // Remove dropdown glow after 3 seconds
        setTimeout(() => {
          setDropdownGlow(false)
        }, 3000)
      }
      previousIntentTracker.current = currentIntent
    }
  }, [currentIntent, currentIntentObj, addNotification, isConnected])
  
  // Handle immediate intent detection feedback from parent trigger (when new intents arrive)
  useEffect(() => {
    // Only process intent triggers if we're connected
    if (!isConnected || !newIntentTrigger) {
      return
    }
    
    const { intentId } = newIntentTrigger
    
    // Only show notifications for intents we haven't already notified about
    if (!notificationTracker.current.has(intentId)) {
      // Mark this intent as having been notified
      notificationTracker.current.add(intentId)
      
      // Find the intent object for display information
      const intentObj = availableIntents.find(i => i.id === intentId)
      
      setNewIntentDetected(true)
      setDropdownGlow(true)
      
      // Scroll to top to show the intent dropdown
      // Small delay to ensure DOM updates are applied first
      setTimeout(() => {
        if (scrollAreaRef.current) {
          // Stop user scrolling mode to allow auto-scroll
          setIsUserScrolling(false)
          
          // Scroll to top smoothly
          const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
          if (scrollElement) {
            scrollElement.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }
      }, 100)
      
      // Add notification to notification center (only once per intent) - NO TOAST
      addNotification({
        type: 'system',
        title: 'New Intent Detected',
        description: `Customer intent identified: ${intentObj?.name || intentId}`,
        icon: 'target',
        metadata: { intent: intentId, confidence: intentObj?.confidence }
      })
      
      // Auto-dismiss alert after 5 seconds
      setTimeout(() => {
        setNewIntentDetected(false)
      }, 5000)
      
      // Remove dropdown glow after 3 seconds
      setTimeout(() => {
        setDropdownGlow(false)
      }, 3000)
    }
  }, [newIntentTrigger, availableIntents, addNotification, isConnected])
  
  // Handle scroll events to detect user scrolling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    setIsUserScrolling(true)
    
    // Reset after user stops scrolling for 1 second
    scrollTimeoutRef.current = setTimeout(() => {
      const scrollContainer = e.currentTarget
      const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100
      
      // Only auto-follow if user scrolls near the AI messages area (not down to knowledge articles)
      if (isNearBottom && aiMessagesEndRef.current) {
        const aiMessagesBottom = aiMessagesEndRef.current.offsetTop + aiMessagesEndRef.current.offsetHeight
        const currentScroll = scrollContainer.scrollTop + scrollContainer.clientHeight
        
        // If we're looking at the AI messages area (not scrolled down to knowledge), resume auto-scroll
        if (currentScroll < aiMessagesBottom + 200) {
          setIsUserScrolling(false)
        }
      }
    }, 1000)
  }, [])
  
  // Auto-scroll to latest AI coaching message (but not to knowledge articles)
  useEffect(() => {
    if (!isUserScrolling && aiMessagesEndRef.current && scrollAreaRef.current) {
      // Scroll to the end of AI messages, not the bottom of the entire container
      aiMessagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [aiCoachingActions.length, isUserScrolling])
  
  // Handle knowledge article click
  const handleKnowledgeClick = (article: any) => {
    // Mark as viewed
    setViewedArticles(prev => new Set(prev).add(article.id))
    if (onKMSOpen) {
      onKMSOpen(article.id, article)
    }
  }
  
  try {
  } catch (error) {
    // Return safe fallback UI
    return (
      <div className="h-full bg-background p-4">
        <div className="text-red-500">Error loading Space Copilot content</div>
      </div>
    )
  }
  
  // Note: Intent changes are now handled by the intent store's setEmbeddedAppIntent
  // which sends the postMessage to the embedded app
  
  // Helper to get embedded app for intent
  const getEmbeddedAppForIntent = (intent: string) => {
    const intentMapping = {
      'credit_card_transactions': 'credit_card_management',
      'fraud_alert': 'fraud_alert', 
      'mortgage_inquiry': 'mortgage_application',
      'loan_application': 'business_loan',
      'account_balance_inquiry': 'account_upgrade'
    }
    return intentMapping[intent as keyof typeof intentMapping] || 'credit_card_management'
  }
  // Get current sentiment data
  const currentSentiment = agentData?.sentiment || null
  // Convert confidence (0-1) to percentage if needed, or use score directly if already percentage
  const sentimentScore = currentSentiment?.score || (currentSentiment?.confidence ? Math.round(currentSentiment.confidence * 100) : 0)
  
  // Determine sentiment emoji and color
  const getSentimentDisplay = () => {
    if (!currentSentiment) return { icon: Meh, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Neutral' }
    
    // Use sentiment field directly, or fall back to label field
    const sentiment = (currentSentiment.sentiment || currentSentiment.label || 'neutral').toLowerCase()
    if (sentiment === 'positive') {
      return { 
        icon: Smile, 
        color: 'text-green-600', 
        bg: 'bg-green-50', 
        border: 'border-green-200',
        label: 'Positive',
        trend: TrendingUp
      }
    } else if (sentiment === 'negative') {
      return { 
        icon: Frown, 
        color: 'text-red-600', 
        bg: 'bg-red-50', 
        border: 'border-red-200',
        label: 'Negative',
        trend: TrendingDown
      }
    }
    return { 
      icon: Meh, 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50', 
      border: 'border-yellow-200',
      label: 'Neutral',
      trend: null
    }
  }
  
  const sentimentDisplay = getSentimentDisplay()
  const SentimentIcon = sentimentDisplay.icon
  const TrendIcon = sentimentDisplay.trend
  
  // If no AI coaching, show full-height empty state
  if (aiCoachingActions.length === 0) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md mx-auto px-4">
          <div className="text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground">AI Copilot Ready</p>
            <p className="text-sm opacity-75 leading-relaxed">Your intelligent assistant will provide real-time insights, suggestions, and knowledge support during customer interactions</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background">
      <ScrollArea className="h-full" onScroll={handleScroll} ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {/* Real-time Sentiment Indicator - Simple one-line */}
          {isConnected && currentSentiment && (
            <div className="animate-in fade-in-50 duration-500">
              <div className={`${sentimentDisplay.bg} ${sentimentDisplay.border} border rounded-lg px-3 py-2 flex items-center gap-2`}>
                <span className="text-xs font-medium text-muted-foreground">Sentiment:</span>
                <SentimentIcon className={`h-4 w-4 ${sentimentDisplay.color} animate-pulse`} />
                <span className={`text-sm font-medium ${sentimentDisplay.color}`}>
                  {sentimentDisplay.label}
                </span>
                {TrendIcon && (
                  <TrendIcon className={`h-3 w-3 ${sentimentDisplay.color} ml-auto`} />
                )}
              </div>
            </div>
          )}
          
          {/* New Intent Detection Alert Banner */}
          {newIntentDetected && currentIntentObj && (
            <div className="animate-in slide-in-from-top-4 fade-in duration-500">
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400 rounded-lg p-4 relative overflow-hidden shadow-lg shadow-green-500/20">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 animate-pulse" />
                <div className="relative flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Target className="h-4 w-4 text-green-600 animate-pulse" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-green-900">New Intent Detected</h4>
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        {Math.round(currentIntentObj.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Customer intent: <span className="font-medium">{currentIntentObj.name}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setNewIntentDetected(false)}
                    className="flex-shrink-0 p-1 hover:bg-green-100 rounded transition-colors"
                  >
                    <X className="h-4 w-4 text-green-600" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Intent Selection - Only show after Phase 3 */}
          {availableIntents.length > 0 && (
            <div className="animate-in fade-in-50 duration-500">
              <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                <span>Detected Intent</span>
                {dropdownGlow && (
                  <span className="inline-flex h-3 w-3 rounded-full bg-green-500 animate-ping shadow-lg shadow-green-500/50" />
                )}
              </label>
              <Select 
                value={currentIntent || ''} 
                onValueChange={(value) => {
                  // Dispatch custom event to indicate this is a user dropdown selection
                  window.dispatchEvent(new CustomEvent('intent:dropdown-selected', { 
                    detail: { intent: value } 
                  }))
                  setEmbeddedAppIntent(value)  // This will update both embedded app and dropdown
                }}
              >
                <SelectTrigger 
                  className={cn(
                    "w-full transition-all duration-500",
                    dropdownGlow && "ring-4 ring-green-500 ring-offset-2 shadow-lg shadow-green-500/30 border-green-500 bg-green-50/50 animate-pulse"
                  )}
                  onPointerDown={(e) => {
                    // Fire event on every click, even if selecting the same value
                    // This ensures closed tabs can be reopened by clicking the dropdown
                    if (currentIntent) {
                      window.dispatchEvent(new CustomEvent('intent:dropdown-clicked', { 
                        detail: { intent: currentIntent } 
                      }))
                    }
                  }}
                >
                  <SelectValue placeholder="Analyzing conversation..." />
                </SelectTrigger>
                <SelectContent>
                  {availableIntents.map((intent) => (
                    <SelectItem key={intent.id} value={intent.id}>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const IconComponent = getIconComponent(intent.icon)
                          return <IconComponent className="h-4 w-4" />
                        })()}
                        <span>{intent.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {currentIntentObj && (
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-xs">
                    {Math.round(currentIntentObj.confidence * 100)}% confidence
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* AI Assistant Messages - Progressive Display */}
          <div className="space-y-3">
            {/* Show phase indicator if no intent yet */}
            {!currentIntent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
                  <span className="text-sm text-blue-800 font-medium">Discovering customer needs...</span>
                </div>
              </div>
            )}
            
            {/* AI Coaching Messages */}
            {aiCoachingActions.map((coaching: any, index: number) => {
              // Extract timestamp from coaching if available, otherwise use current time
              const timestamp = coaching.timestamp || new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
              })
              
              // Determine coaching type based on stage
              const isGreeting = coaching.stage === 'greeting'
              const isDiscovery = ['discovery', 'verification'].includes(coaching.stage)
              const isAnalysis = ['investigation', 'analysis', 'assessment'].includes(coaching.stage)
              const isResolution = ['resolution', 'advisory', 'options', 'processing'].includes(coaching.stage)
              const isClosing = ['next_steps', 'closing', 'follow_up'].includes(coaching.stage)
              
              // Color coding based on phase
              let bgColor = 'bg-red-50 border-red-100'
              let iconBg = 'bg-red-600'
              let textColor = 'text-red-800'
              
              if (isGreeting || isDiscovery) {
                bgColor = 'bg-blue-50 border-blue-100'
                iconBg = 'bg-blue-600'
                textColor = 'text-blue-800'
              } else if (isAnalysis) {
                bgColor = 'bg-amber-50 border-amber-100'
                iconBg = 'bg-amber-600'
                textColor = 'text-amber-800'
              } else if (isResolution) {
                bgColor = 'bg-green-50 border-green-100'
                iconBg = 'bg-green-600'
                textColor = 'text-green-800'
              } else if (isClosing) {
                bgColor = 'bg-purple-50 border-purple-100'
                iconBg = 'bg-purple-600'
                textColor = 'text-purple-800'
              }
              
              return (
                <div key={`${coaching.id || `coaching_${index}`}`} className="animate-in slide-in-from-bottom-2 duration-300">
                  {/* AI Coaching Message */}
                  <div className={`${bgColor} border rounded-lg p-3`}>
                    <div className="flex items-start gap-2">
                      <div className={`${iconBg} rounded-full p-1 mt-0.5`}>
                        <Bot className="h-3 w-3 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className={`text-xs ${textColor} font-medium mb-1 flex items-center gap-2`}>
                          <span>AI Assistant</span>
                          <span className="opacity-60">•</span>
                          <span className="opacity-60">{timestamp}</span>
                          {coaching.stage && (
                            <>
                              <span className="opacity-60">•</span>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {coaching.stage}
                              </Badge>
                            </>
                          )}
                        </div>
                        <div className="text-sm">
                          {coaching.action}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Suggested Response if available */}
                  {coaching.details && (
                    <Card className="bg-gray-50 border-gray-200 ml-7 mt-2">
                      <CardContent className="p-3">
                        <div className="text-xs text-gray-500 mb-1">Suggested response:</div>
                        <div className="text-sm italic">
                          "{coaching.details}"
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ThumbsUp className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <ThumbsDown className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Invisible marker for end of AI messages section */}
          <div ref={aiMessagesEndRef} />

          {/* Knowledge Articles - Show progressively after intent detected */}
          {knowledgeArticles.length > 0 && (
            <div className="animate-in fade-in-50 duration-500" data-section="knowledge">
              <label className="text-xs font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                <span>Knowledge Base Articles</span>
                {newArticleCount > 0 && (
                  <Badge className="text-xs bg-green-100 text-green-800 animate-pulse">
                    <Sparkles className="h-2.5 w-2.5 mr-1" />
                    {newArticleCount} new
                  </Badge>
                )}
              </label>
              <div className="space-y-2">
                {knowledgeArticles.map((article: any, index: number) => {
                  const isNewUnviewed = article.isNew && !viewedArticles.has(article.id)
                  return (
                  <Card 
                    key={article.id || index} 
                    className={`hover:shadow-md transition-shadow cursor-pointer animate-in slide-in-from-bottom-2 duration-300 ${
                      isNewUnviewed ? 'border-green-500 bg-green-50/50' : ''
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => handleKnowledgeClick(article)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <BookOpen className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate flex items-center gap-2">
                              {isNewUnviewed && (
                                <Sparkles className="h-3 w-3 text-green-600 animate-pulse flex-shrink-0" />
                              )}
                              {article.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] px-1 py-0 ${
                                  article.priority === 'urgent' ? 'border-red-500 text-red-600' :
                                  article.priority === 'high' ? 'border-orange-500 text-orange-600' :
                                  article.priority === 'medium' ? 'border-yellow-500 text-yellow-600' :
                                  article.priority === 'low' ? 'border-green-500 text-green-600' : ''
                                }`}
                              >
                                {article.priority}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {article.category}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation() // Prevent card click
                            window.open(article.url, '_blank', 'noopener,noreferrer')
                          }}
                          title="Open in new tab"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}


export const SpaceCopilotColumn = memo(SpaceCopilotColumnComponent)
