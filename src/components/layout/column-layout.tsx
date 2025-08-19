import { useState, useEffect, useRef } from 'react'
import { GlobalHeader } from './global-header'
import { CustomerColumn } from '../columns/customer-column'
import { EmbeddedAppColumn } from '../columns/embedded-app-column'
import { SpaceCopilotColumn } from '../columns/space-copilot-column'
import { KMSColumn } from '../columns/kms-column'
import { ColumnHeader } from '../columns/column-header'
import { CollapsedColumnIndicator } from '../columns/collapsed-column-indicator'
import { MediaControlBar } from '../call-controls/media-control-bar'
import { ChatWindow } from '../chat/chat-window'
import { ResponseTemplates } from '../chat/response-templates'
import { TeamStatusGrid } from '../supervisor/team-status-grid'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { ResizableHandle } from './resizable-widget-container'
import { useMediaQuery } from '../../hooks/use-media-query'
import { useAgentSettings } from '../../hooks/use-agent-settings'
import { useColumnLayout } from '../../hooks/use-column-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Sheet, SheetContent, SheetTitle } from '../ui/sheet'
import { Button } from '../ui/button'
import { MessageSquare, Menu, Bot, Grid3x3, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAgentStore } from '../../stores/agent-store'
import { useAgentStatusStore } from '../../stores/agent-status-store'
import { initializeMockData } from '../../utils/mock-data'
import { useRoleConfig } from '../../contexts/role-context'

export function ColumnLayout() {
  const [isKMSOpen, setIsKMSOpen] = useState(false)
  const [selectedArticleId, setSelectedArticleId] = useState<string>('')
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [spaceCopilotOverlayOpen, setSpaceCopilotOverlayOpen] = useState(false)
  // Call state is now managed by Zustand store - components can subscribe directly
  // const [callState, setCallState] = useState<'idle' | 'incoming' | 'active' | 'ended'>('idle')
  const [embeddedAppsOpen, setEmbeddedAppsOpen] = useState(false) // New state for chat agents
  const { updateAgentData } = useAgentStore()
  const { settings } = useAgentSettings()
  const { currentRole } = useRoleConfig()
  
  // Debug: Log component mount/unmount and role changes
  useEffect(() => {
    return () => {
    }
  }, [])
  
  useEffect(() => {
  }, [currentRole])
  
  // Sample notifications disabled to prevent random notifications on login
  
  
  // Initialize layout hook first
  const { 
    layout, 
    updateColumn,
    applyLayout, 
    resetLayout, 
    getColumnClasses, 
    canManageColumns,
    hasMaximizedColumn 
  } = useColumnLayout()
  
  // No longer auto-expand KMS when opened - let user control the state
  // The column will remember its previous state (normal/collapsed/maximized)
  
  // No longer auto-expand Space Copilot - let user control the state
  // Users can manually expand/collapse the Space Copilot column as needed
  
  // Initialize with empty data - widgets will show watermarks until call starts
  useEffect(() => {
    // Start with empty agent data - widgets show watermarks
    updateAgentData({
      customer: null,
      sentiment: null,
      summary: null,
      intent: null,
      actions: [],
      transcript: [],
      knowledgeArticles: [],
      priority: null,
      metrics: null
    })
  }, [])
  
  // Handle call state changes and auto-close KMS if enabled - subscribe to Zustand store
  const callState = useAgentStatusStore(state => state.callState)
  useEffect(() => {
    if (callState === 'idle' && settings.interface.autoCloseKnowledgeOnCallEnd) {
      // Close KMS when call ends if setting is enabled
      setIsKMSOpen(false)
      setSelectedArticleId('')
      setSelectedArticle(null)
    }
  }, [callState, settings.interface.autoCloseKnowledgeOnCallEnd])
  
  // Responsive breakpoints - adjusted for better larger screen support
  const isMobile = useMediaQuery('(max-width: 768px)')
  const isTablet = useMediaQuery('(max-width: 1024px)')  // Reduced from 1280px
  const isLaptop = useMediaQuery('(max-width: 1440px)')  // Reduced from 1640px
  
  // Mobile: Tab layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <GlobalHeader 
          onMenuClick={() => setCustomerOpen(true)}
          onCopilotClick={() => setCopilotOpen(true)}
          isMobile={true}
          isKMSOpen={isKMSOpen}
          setIsKMSOpen={setIsKMSOpen}
        />
        
        <Tabs defaultValue={isKMSOpen ? "kms" : "app"} className="flex-1 flex flex-col">
          <TabsList className={cn(
            "grid w-full rounded-none",
            isKMSOpen ? "grid-cols-4" : "grid-cols-3"
          )}>
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="app">Application</TabsTrigger>
            <TabsTrigger value="copilot">AI Assistant</TabsTrigger>
            {isKMSOpen && <TabsTrigger value="kms">Knowledge</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="customer" className="flex-1 m-0">
            <CustomerColumn />
          </TabsContent>
          
          <TabsContent value="app" className="flex-1 m-0">
            <EmbeddedAppColumn />
          </TabsContent>
          
          <TabsContent value="copilot" className="flex-1 m-0">
            <SpaceCopilotColumn onKMSOpen={(articleId, article) => {
              setSelectedArticleId(articleId)
              setSelectedArticle(article)
              setIsKMSOpen(true)
            }} />
          </TabsContent>
          
          {isKMSOpen && (
            <TabsContent value="kms" className="flex-1 m-0">
              <KMSColumn onBack={() => setIsKMSOpen(false)} articleId={selectedArticleId} article={selectedArticle} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    )
  }
  
  // Tablet: 2 columns + drawer
  if (isTablet) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <GlobalHeader 
          onMenuClick={() => setCustomerOpen(true)}
          onCopilotClick={() => setCopilotOpen(true)}
          isKMSOpen={isKMSOpen}
          setIsKMSOpen={setIsKMSOpen}
        />
        
        <div className="flex-1 grid grid-cols-1 overflow-hidden">
          <EmbeddedAppColumn />
        </div>
        
        {/* Customer drawer */}
        <Sheet open={customerOpen} onOpenChange={setCustomerOpen}>
          <SheetContent side="left" className="w-[320px] p-0">
            <SheetTitle className="sr-only">Customer Information</SheetTitle>
            <CustomerColumn />
          </SheetContent>
        </Sheet>
        
        {/* Space Copilot drawer */}
        <Sheet open={copilotOpen} onOpenChange={setCopilotOpen}>
          <SheetContent side="right" className="w-[400px] p-0">
            <SheetTitle className="sr-only">Space Copilot AI Assistant</SheetTitle>
            <SpaceCopilotColumn onKMSOpen={(articleId, article) => {
              setSelectedArticleId(articleId)
              setSelectedArticle(article)
              setIsKMSOpen(true)
            }} />
          </SheetContent>
        </Sheet>
        
        {/* KMS drawer - opens separately */}
        <Sheet open={isKMSOpen} onOpenChange={setIsKMSOpen}>
          <SheetContent side="right" className="w-[600px] p-0 sm:max-w-[600px]">
            <SheetTitle className="sr-only">Knowledge Management System</SheetTitle>
            <KMSColumn onBack={() => setIsKMSOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    )
  }
  
  // Desktop: Dynamic layout based on KMS state, user settings, and column states
  const canShow4Columns = !isLaptop // Only show 4 columns on larger screens (remove hasMaximizedColumn check)
  
  // When KMS is open, it ALWAYS gets its own column
  // Space Copilot goes to overlay if we can't fit all 4 columns
  const showSpaceCopilotColumn = settings.interface.spaceCopilotMode === 'column' && (!isKMSOpen || canShow4Columns)
  const forceSpaceCopilotOverlay = settings.interface.spaceCopilotMode === 'overlay' || (isKMSOpen && !canShow4Columns)
  
  
  // Determine visible columns based on collapse state
  const showCustomer = layout.customer !== 'collapsed'
  const showEmbedded = layout.embedded !== 'collapsed'
  const showKMS = isKMSOpen && layout.kms !== 'collapsed' // Show full KMS column only when open AND not collapsed
  const showSpaceCopilot = showSpaceCopilotColumn && layout.spaceCopilot !== 'collapsed' // Show full Space Copilot column
  const showChatAgentEmbedded = currentRole === 'chat_agent' && embeddedAppsOpen // Chat agent's embedded apps column
  
  // Calculate dynamic panel sizes based on visible columns
  const visiblePanelCount = [showCustomer, showEmbedded, showChatAgentEmbedded, showKMS, showSpaceCopilot].filter(Boolean).length
  
  // Dynamic size calculation to ensure panels add up to 100%
  const getPanelSizes = () => {
    if (visiblePanelCount === 0) return { customer: 25, embedded: 35, kms: 20, spaceCopilot: 20 }
    
    if (visiblePanelCount === 1) {
      return { customer: 100, embedded: 100, kms: 100, spaceCopilot: 100 }
    }
    
    if (visiblePanelCount === 2) {
      if (showCustomer && showEmbedded) return { customer: 40, embedded: 60, kms: 50, spaceCopilot: 50 }
      if (showCustomer && showKMS) return { customer: 60, embedded: 50, kms: 40, spaceCopilot: 50 }
      if (showCustomer && showSpaceCopilot) return { customer: 60, embedded: 50, kms: 50, spaceCopilot: 40 }
      if (showEmbedded && showKMS) return { customer: 50, embedded: 60, kms: 40, spaceCopilot: 50 }
      if (showEmbedded && showSpaceCopilot) return { customer: 50, embedded: 60, kms: 50, spaceCopilot: 40 }
      if (showKMS && showSpaceCopilot) return { customer: 50, embedded: 50, kms: 50, spaceCopilot: 50 }
      return { customer: 50, embedded: 50, kms: 50, spaceCopilot: 50 }
    }
    
    if (visiblePanelCount === 3) {
      if (!showCustomer) return { customer: 33, embedded: 40, kms: 30, spaceCopilot: 30 }
      if (!showEmbedded) return { customer: 40, embedded: 33, kms: 30, spaceCopilot: 30 }
      if (!showKMS) return { customer: 35, embedded: 40, kms: 33, spaceCopilot: 25 }
      if (!showSpaceCopilot) return { customer: 35, embedded: 40, kms: 25, spaceCopilot: 33 }
      return { customer: 33, embedded: 34, kms: 33, spaceCopilot: 33 }
    }
    
    // All 4 columns visible
    return { customer: 25, embedded: 35, kms: 20, spaceCopilot: 20 }
  }
  
  const panelSizes = getPanelSizes()
  
  return (
    <div className="h-screen flex flex-col bg-background relative">
      <GlobalHeader 
        onCopilotClick={() => setSpaceCopilotOverlayOpen(true)}
        showCopilotButton={forceSpaceCopilotOverlay}
        isKMSOpen={isKMSOpen}
        setIsKMSOpen={setIsKMSOpen}
      />
      
      <PanelGroup direction="horizontal" className="flex-1">
        {/* Collapsed Customer Indicator */}
        {layout.customer === 'collapsed' && (
          <CollapsedColumnIndicator
            title="Customer"
            columnId="customer"
            position="left"
            onExpand={() => updateColumn('customer', 'normal')}
            canManageColumns={canManageColumns}
          />
        )}
        
        {/* Column 1: Role-based content */}
        {showCustomer && (
          <Panel 
            defaultSize={panelSizes.customer}
            minSize={15}
            maxSize={40}
            className="flex"
          >
            <div className="w-full bg-background overflow-hidden flex flex-col">
              {/* Chat agents get response templates on left, others get their respective views */}
              {currentRole === 'chat_agent' ? (
                <ResponseTemplates />
              ) : (
                <>
                  <ColumnHeader
                    title={currentRole === 'manager' ? 'Team Status' : 'Customer Info'}
                    columnId="customer"
                    currentState={layout.customer}
                    canManageColumns={canManageColumns}
                    onStateChange={(state) => updateColumn('customer', state)}
                    onResetAll={resetLayout}
                  />
                  <div className="flex-1 overflow-hidden">
                    {currentRole === 'manager' ? (
                      <TeamStatusGrid />
                    ) : (
                      <CustomerColumn />
                    )}
                  </div>
                </>
              )}
            </div>
          </Panel>
        )}
        
        {/* Resize Handle between Customer and Embedded */}
        {showCustomer && showEmbedded && (
          <ResizableHandle direction="horizontal" />
        )}
        
        {/* Collapsed Embedded Indicator */}
        {layout.embedded === 'collapsed' && (
          <CollapsedColumnIndicator
            title="Application"
            columnId="embedded"
            position="left"
            onExpand={() => updateColumn('embedded', 'normal')}
            canManageColumns={canManageColumns}
          />
        )}
        
        {/* Column 2: Role-based content */}
        {showEmbedded && (
          <Panel 
            defaultSize={panelSizes.embedded}
            minSize={20}
            maxSize={60}
            className="flex"
          >
            <div className="w-full bg-background overflow-hidden flex flex-col">
              {/* Media bar for call agents only */}
              {currentRole === 'agent' && <MediaControlBar />}
              {/* Role-based content */}
              {currentRole === 'chat_agent' ? (
                <>
                  {/* Chat window with button to open embedded apps */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <h3 className="text-sm font-semibold">Customer Chat</h3>
                      {!embeddedAppsOpen && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEmbeddedAppsOpen(true)}
                          className="text-xs"
                        >
                          <Grid3x3 className="h-3 w-3 mr-1" />
                          Open Tools
                        </Button>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <ChatWindow />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-hidden">
                  <EmbeddedAppColumn />
                </div>
              )}
            </div>
          </Panel>
        )}
        
        {/* Resize Handle between Embedded and EmbeddedApps (for chat agents) */}
        {showEmbedded && currentRole === 'chat_agent' && embeddedAppsOpen && (
          <ResizableHandle direction="horizontal" />
        )}
        
        {/* Column 3: Embedded Apps for Chat Agents (when open) */}
        {currentRole === 'chat_agent' && embeddedAppsOpen && (
          <Panel 
            defaultSize={25}
            minSize={20}
            maxSize={40}
            className="flex"
          >
            <div className="w-full bg-background overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <h3 className="text-sm font-semibold">Customer Tools</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEmbeddedAppsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <EmbeddedAppColumn />
              </div>
            </div>
          </Panel>
        )}
        
        {/* Resize Handle between Embedded/EmbeddedApps and KMS/SpaceCopilot */}
        {((showEmbedded && !currentRole.includes('chat_agent')) || (currentRole === 'chat_agent' && embeddedAppsOpen)) && (showKMS || showSpaceCopilot) && (
          <ResizableHandle direction="horizontal" />
        )}
        
        {/* Collapsed KMS Indicator */}
        {isKMSOpen && layout.kms === 'collapsed' && (
          <CollapsedColumnIndicator
            title="Knowledge"
            columnId="kms"
            position="right"
            onExpand={() => updateColumn('kms', 'normal')}
            canManageColumns={canManageColumns}
          />
        )}
        
        {/* Column 3: KMS (when open) */}
        {showKMS && (
          <Panel 
            defaultSize={panelSizes.kms}
            minSize={15}
            maxSize={35}
            className="flex"
          >
            <div className="w-full bg-background overflow-hidden flex flex-col">
              <ColumnHeader
                title="Knowledge Management"
                columnId="kms"
                currentState={layout.kms}
                canManageColumns={canManageColumns}
                onStateChange={(state) => updateColumn('kms', state)}
              />
              <div className="flex-1 overflow-hidden">
                <KMSColumn onBack={() => setIsKMSOpen(false)} articleId={selectedArticleId} article={selectedArticle} />
              </div>
            </div>
          </Panel>
        )}
        
        {/* Resize Handle between KMS and Space Copilot */}
        {showKMS && showSpaceCopilot && (
          <ResizableHandle direction="horizontal" />
        )}
        
        {/* Collapsed Space Copilot Indicator */}
        {showSpaceCopilotColumn && layout.spaceCopilot === 'collapsed' && (
          <CollapsedColumnIndicator
            title="Space Copilot"
            columnId="spaceCopilot"
            position="right"
            onExpand={() => updateColumn('spaceCopilot', 'normal')}
            canManageColumns={canManageColumns}
          />
        )}
        
        {/* Column 4 (or 3 if no KMS): Space Copilot */}
        {showSpaceCopilot && (
          <Panel 
            defaultSize={panelSizes.spaceCopilot}
            minSize={15}
            maxSize={35}
            className="flex"
          >
            <div className="w-full bg-background overflow-hidden flex flex-col">
              <ColumnHeader
                title="Space Copilot"
                columnId="spaceCopilot"
                currentState={layout.spaceCopilot}
                canManageColumns={canManageColumns}
                onStateChange={(state) => updateColumn('spaceCopilot', state)}
                showAIBadge={true}
              />
              <div className="flex-1 overflow-hidden">
                <SpaceCopilotColumn onKMSOpen={(articleId, article) => {
                      setSelectedArticleId(articleId)
                  setSelectedArticle(article)
                  setIsKMSOpen(true)
                }} />
              </div>
            </div>
          </Panel>
        )}
      </PanelGroup>

      {/* Space Copilot Overlay (when in overlay mode or forced due to space constraints) */}
      {forceSpaceCopilotOverlay && (
        <>
          {/* Overlay Toggle Button */}
          {!spaceCopilotOverlayOpen && (
            <Button
              onClick={() => setSpaceCopilotOverlayOpen(true)}
              className={cn(
                "fixed z-50 p-3 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 icon-button-red-hover",
                "top-1/2 -translate-y-1/2",
                settings.interface.spaceCopilotOverlayPosition === 'right' 
                  ? "right-4" 
                  : "left-4"
              )}
            >
              <Bot className="h-5 w-5" />
            </Button>
          )}

          {/* Overlay Panel */}
          <Sheet 
            open={spaceCopilotOverlayOpen} 
            onOpenChange={setSpaceCopilotOverlayOpen}
          >
            <SheetContent 
              side={settings.interface.spaceCopilotOverlayPosition}
              className="w-[640px] p-0 sm:max-w-[640px]"
            >
              <SheetTitle className="sr-only">
                Space Copilot AI Assistant
              </SheetTitle>
              <SpaceCopilotColumn onKMSOpen={(articleId, article) => {
                  setSelectedArticleId(articleId)
                setSelectedArticle(article)
                setIsKMSOpen(true)
              }} />
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  )
}
