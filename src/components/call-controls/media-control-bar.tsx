import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  Phone, 
  PhoneIncoming,
  PhoneCall,
  Mic, 
  MicOff, 
  Pause, 
  Play, 
  PhoneOff,
  PhoneForwarded,
  X
} from 'lucide-react'
import { useAgentData, useClearActions, useUpdateActions } from '../../stores/selectors/agent-selectors'
import { useAgentStatusStore, CallState } from '../../stores/agent-status-store'
import { useWebSocket } from '../../contexts/websocket-context'
import { useToast } from '../../hooks/use-toast'
import { audioService } from '../../services/audio.service'
import { useAgentSettings } from '../../hooks/use-agent-settings'
import { EndCallConfirmation } from '../dialogs/end-call-confirmation'
import { AgentStatusToggle } from '../agent-status/agent-status-toggle'
import { useAgentStatus } from '../../hooks/use-agent-status'
import { cn } from '../../lib/utils'
import { getAppConfig } from '../../config/app-config'

interface MediaControlBarProps {
  // Props will be removed as we use centralized state
}

// Sample callers for simulation
const SAMPLE_CALLERS = [
  // Premier Banking (High Value)
  { name: 'Jonathan Mitchell', number: '+44-20-7946-0958', location: 'London, UK', priority: 'URGENT' as const },
  { name: 'Alexander Sterling', number: '+44-20-7123-4567', location: 'Edinburgh, UK', priority: 'HIGH' as const },
  { name: 'Victoria Pemberton', number: '+44-161-234-5678', location: 'Manchester, UK', priority: 'MEDIUM' as const },
  
  // Jade Banking (Ultra High Value)
  { name: 'Sarah Chen Wei', number: '+852-2234-5678', location: 'Hong Kong', priority: 'HIGH' as const },
  { name: 'Michael Zhang', number: '+86-21-6234-5678', location: 'Shanghai, China', priority: 'URGENT' as const },
  { name: 'Jennifer Liu', number: '+65-6234-5678', location: 'Singapore', priority: 'HIGH' as const },
  
  // HSBC Advance
  { name: 'Robert Thompson', number: '+1-212-555-0198', location: 'New York, NY', priority: 'MEDIUM' as const },
  { name: 'Emily Davis', number: '+1-617-555-0234', location: 'Boston, MA', priority: 'LOW' as const },
  { name: 'James Wilson', number: '+1-312-555-0345', location: 'Chicago, IL', priority: 'MEDIUM' as const },
  
  // Business Banking
  { name: 'Marcus Johnson', number: '+44-20-7234-5678', location: 'London, UK', priority: 'HIGH' as const },
  { name: 'Sophie Anderson', number: '+33-1-4234-5678', location: 'Paris, France', priority: 'MEDIUM' as const },
]

export function MediaControlBar({}: MediaControlBarProps) {
  const agentData = useAgentData()
  const clearActions = useClearActions()
  const { updatePriority, updateAgentData } = useUpdateActions()
  const { settings: agentSettings } = useAgentSettings()
  const { connect, disconnect, sendMessage } = useWebSocket()
  const { toast } = useToast()
  
  // Use Zustand store for call state instead of local React state
  const callState = useAgentStatusStore(state => state.callState)
  const isMuted = useAgentStatusStore(state => state.isMuted)
  const isOnHold = useAgentStatusStore(state => state.isOnHold)
  const callDuration = useAgentStatusStore(state => state.callDuration)
  const callerInfo = useAgentStatusStore(state => state.callerInfo)
  const currentCallerId = useAgentStatusStore(state => state.currentCallerId)
  
  // Zustand actions for call state management
  const setIsMuted = useAgentStatusStore(state => state.setIsMuted)
  const setIsOnHold = useAgentStatusStore(state => state.setIsOnHold)
  const setCallDuration = useAgentStatusStore(state => state.setCallDuration)
  const setCallerInfo = useAgentStatusStore(state => state.setCallerInfo)
  const setCurrentCallerId = useAgentStatusStore(state => state.setCurrentCallerId)
  const startCall = useAgentStatusStore(state => state.startCall)
  const acceptCall = useAgentStatusStore(state => state.acceptCall)
  const endCall = useAgentStatusStore(state => state.endCall)
  
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false)
  
  const callStartTime = useRef<Date | null>(null)
  const autoAcceptTimer = useRef<NodeJS.Timeout | null>(null)
  const isProcessingCall = useRef<boolean>(false)
  const callCounter = useRef<number>(0) // Track number of calls for rotation
  
  // Refs to track current state (avoids closure issues)
  const currentCallStateRef = useRef<CallState>(callState)
  const currentCallerInfoRef = useRef<typeof callerInfo>(callerInfo)
  
  // Update refs whenever state changes
  useEffect(() => {
    currentCallStateRef.current = callState
  }, [callState])
  
  useEffect(() => {
    currentCallerInfoRef.current = callerInfo
  }, [callerInfo])
  
  // Simulate incoming call
  const simulateIncomingCall = useCallback(() => {
    // Prevent duplicate calls
    if (isProcessingCall.current) {
      return
    }
    
    if (currentCallStateRef.current !== 'idle') {
      toast({
        title: 'Call in Progress',
        description: 'Please end the current call first',
        variant: 'destructive'
      })
      return
    }
    
    // Mark as processing
    isProcessingCall.current = true
    
    // Increment call counter
    callCounter.current += 1
    
    let selectedCaller;
    
    // Every 3rd call should be Jonathan Mitchell (credit card fraud)
    if (callCounter.current % 3 === 0) {
      // Find Jonathan Mitchell in the list
      selectedCaller = SAMPLE_CALLERS.find(c => c.name === 'Jonathan Mitchell') || SAMPLE_CALLERS[0]
    } else {
      // Pick a random caller from the others (excluding Jonathan Mitchell)
      const otherCallers = SAMPLE_CALLERS.filter(c => c.name !== 'Jonathan Mitchell')
      selectedCaller = otherCallers[Math.floor(Math.random() * otherCallers.length)]
    }
    
    // Use Zustand action to start call
    startCall(selectedCaller.number, selectedCaller)
    
    // Reset processing flag after a short delay
    setTimeout(() => {
      isProcessingCall.current = false
    }, 1000)
    
    // Play ringtone
    audioService.playRingtone().then((result) => {
      if (!result.success) {
        // Failed to play ringtone
      }
    })
  }, [toast, startCall])
  
  // Create a ref for the auto-call trigger function
  const autoCallTriggerRef = useRef<(() => void) | null>(null)
  
  // Use agent status hook with ref-based auto-call
  const { 
    handleCallEnded: handleStatusCallEnded, 
    status: agentStatus, 
    getStatusColor,
    canAcceptCalls,
    getStatusLabel,
    setStatus: setAgentStatus,
    afterCallWorkSecondsRemaining,
    doNotDisturbSecondsRemaining
  } = useAgentStatus({
    onAutoCall: () => autoCallTriggerRef.current?.()
  })
  
  // Trigger auto-call when agent becomes available
  const triggerAutoCall = useCallback(() => {
    // Check if agent can accept calls (respects DND, after-call work, etc.)
    if (!canAcceptCalls()) {
      return
    }
    
    // Double-check that we're truly idle with no active caller (using refs to avoid closure issues)
    if (currentCallStateRef.current === 'idle' && !currentCallerInfoRef.current) {
      simulateIncomingCall()
    } else if (currentCallStateRef.current === 'idle' && currentCallerInfoRef.current) {
      setCallerInfo(null)
      setCurrentCallerId('')
    }
  }, [simulateIncomingCall, canAcceptCalls])
  
  // Set the auto-call trigger function in the ref
  useEffect(() => {
    autoCallTriggerRef.current = triggerAutoCall
  }, [triggerAutoCall])
  
  
  
  
  // Update call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (callState === 'active' && callStartTime.current) {
      interval = setInterval(() => {
        const now = new Date()
        const diff = Math.floor((now.getTime() - callStartTime.current!.getTime()) / 1000)
        setCallDuration(diff)
      }, 1000)
    } else if (callState !== 'active') {
      setCallDuration(0)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [callState])
  
  // Format duration to MM:SS or HH:MM:SS
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])
  
  // Clear all widget data
  const clearAllData = useCallback(() => {
    clearActions.clearSentiment()
    clearActions.clearIntent()
    clearActions.clearActions()
    clearActions.clearTranscript()
    clearActions.clearCustomer()
    clearActions.clearKnowledgeArticles()
    clearActions.clearPriority()
    updateAgentData({ queuePosition: undefined })
  }, [clearActions, updatePriority, updateAgentData])
  
  // Handle accept call
  const handleAcceptCall = useCallback(() => {
    if (!callerInfo) return
    
    // Stop ringtone
    audioService.forceStopAllAudio()
    
    // Clear auto-accept timer
    if (autoAcceptTimer.current) {
      clearTimeout(autoAcceptTimer.current)
      autoAcceptTimer.current = null
    }
    
    callStartTime.current = new Date()
    const callerId = callerInfo.number // Keep original phone format for database lookup
    setCurrentCallerId(callerId)
    
    // Clear all data first
    clearAllData()
    
    // Connect WebSocket
    setTimeout(() => {
      connect('agent-001', callerId, 8080)
    }, 100)
    
    // Start AI simulation
    const config = getAppConfig()
    fetch(`${config.services.aiService.baseUrl}/api/calls/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callerId: callerId,
        agentId: 'agent-001',
        callerName: callerInfo.name,
        callerNumber: callerInfo.number,
        callerLocation: callerInfo.location
      })
    }).catch(error => {
      // Failed to start AI simulation
    })
    
    // Update priority data
    updatePriority({
      level: callerInfo.priority,
      waitTime: Math.floor(Math.random() * 300) + 60,
      estimatedResolution: Math.floor(Math.random() * 600) + 300,
      escalation: callerInfo.priority === 'URGENT'
    })
    updateAgentData({ queuePosition: Math.floor(Math.random() * 5) + 1 })
    
    // Use Zustand action to accept call
    acceptCall()
    
    // IMPORTANT: Set agent status to on-call when call becomes active
    setAgentStatus('on-call')
  }, [callerInfo, clearAllData, connect, updatePriority, updateAgentData, setAgentStatus, acceptCall])
  
  // Auto-accept incoming calls if agent is available
  useEffect(() => {
    if (callState === 'incoming' && agentStatus === 'available' && agentSettings.calls.autoAccept) {
      autoAcceptTimer.current = setTimeout(() => {
        handleAcceptCall()
      }, 5000) // 5 second delay
      
      return () => {
        if (autoAcceptTimer.current) {
          clearTimeout(autoAcceptTimer.current)
          autoAcceptTimer.current = null
        }
      }
    }
  }, [callState, agentStatus, agentSettings.calls.autoAccept, handleAcceptCall])
  
  // Handle reject call
  const handleRejectCall = useCallback(() => {
    audioService.forceStopAllAudio()
    
    if (autoAcceptTimer.current) {
      clearTimeout(autoAcceptTimer.current)
      autoAcceptTimer.current = null
    }
    
    const declinedCallerName = callerInfo?.name
    
    // Use Zustand action to end call
    endCall()
    
    toast({
      title: 'Call Declined',
      description: declinedCallerName ? `Declined call from ${declinedCallerName}` : 'Call declined',
    })
    
    // Use handleCallEnded to trigger next call through the agent status hook
    // This ensures proper queue management and delay timing
    // Increased delay to ensure React has time to process state updates
    setTimeout(() => {
      handleStatusCallEnded(0) // Pass 0 duration for declined calls
    }, 500) // Increased from 100ms to 500ms
  }, [callState, callerInfo, handleStatusCallEnded, endCall])
  
  // Handle end call
  const handleEndCall = useCallback(async () => {
    const incompleteActions = agentData.actions?.filter(action => !action.completed).length || 0
    
    if (agentSettings.calls.confirmBeforeEnd || 
        (agentSettings.calls.requireActionsCompletion && incompleteActions > 0)) {
      setShowEndCallConfirm(true)
      return
    }
    
    performEndCall()
  }, [agentData.actions, agentSettings.calls])
  
  // Perform actual end call
  const performEndCall = useCallback(async () => {
    const actualDuration = callDuration
    
    // Stop AI simulation
    if (currentCallerId) {
      const config = getAppConfig()
      fetch(`${config.services.aiService.baseUrl}/api/calls/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callerId: currentCallerId,
          agentId: 'agent-001'
        })
      }).catch(error => {
        // Failed to stop AI simulation
      })
    }
    
    // Send end call message before disconnecting
    sendMessage({
      type: 'end_call',
      callerId: currentCallerId,
      agentId: 'agent-001',
      duration: actualDuration,
      timestamp: new Date().toISOString()
    })
    
    // Clear all data
    setTimeout(() => {
      clearAllData()
    }, 300)
    
    // Disconnect WebSocket
    setTimeout(() => {
      disconnect()
    }, 500)
    
    // Use Zustand action to end call (handles all state reset)
    endCall()
    callStartTime.current = null
    
    toast({
      title: 'Call Ended',
      description: `Call duration: ${formatDuration(actualDuration)}`,
    })
    
    // Update metrics through status hook - this will trigger the next call
    // IMPORTANT: Call this AFTER resetting state to avoid conflicts
    // Increased delay to ensure React has time to process state updates
    setTimeout(() => {
      handleStatusCallEnded(actualDuration)
    }, 500) // Increased from 100ms to 500ms
  }, [callDuration, currentCallerId, handleStatusCallEnded, sendMessage, clearAllData, disconnect, formatDuration, endCall])
  
  // Handle confirmed end call
  const handleConfirmedEndCall = useCallback(() => {
    setShowEndCallConfirm(false)
    performEndCall()
  }, [performEndCall])
  
  // Handle transfer (placeholder)
  const handleTransfer = useCallback(() => {
    toast({
      title: 'Transfer',
      description: 'Transfer functionality coming soon',
    })
  }, [])
  
  // Render incoming call notification with clean liquid glass design
  if (callState === 'incoming' && callerInfo) {
    const isAutoAccepting = agentStatus === 'available' && agentSettings.calls.autoAccept
    
    return (
      <>
        <div className="sticky top-0 z-50 overflow-hidden">
          {/* Clean liquid glass background */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/60 to-white/70 backdrop-blur-2xl" />
          
          {/* Subtle shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 animate-shimmer" />
          
          {/* Animated fluid border effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
          </div>
          
          {/* Glass morphism container - clean and professional with rounded edges */}
          <div className="relative bg-white/30 backdrop-blur-xl shadow-lg animate-in slide-in-from-top-2 duration-500 rounded-2xl mx-2 mt-2 border-2 animate-wave-border">
            {/* Beautiful animated border */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-green-400/20 to-purple-400/20 animate-gradient-x" />
              <div className="absolute inset-[2px] bg-white/40 rounded-2xl backdrop-blur-xl" />
            </div>
            
            <div className="relative flex flex-wrap items-center justify-between h-16 gap-2 md:gap-3 px-3 sm:px-4 md:px-6">
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                {/* Clean phone icon with subtle pulse */}
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-lg animate-pulse" />
                  <PhoneIncoming className="relative h-5 w-5 text-blue-600" />
                </div>
                
                <div className="space-y-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 tracking-wide text-[15px] truncate">
                      <span className="hidden sm:inline">{callerInfo.name}</span>
                      <span className="sm:hidden">{callerInfo.name.split(' ')[0]}</span>
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] sm:text-[11px] font-medium px-1.5 sm:px-2 py-0.5 border flex-shrink-0",
                        callerInfo.priority === 'URGENT' && "border-red-500 text-red-600 bg-red-50/50 animate-pulse",
                        callerInfo.priority === 'HIGH' && "border-orange-500 text-orange-600 bg-orange-50/50",
                        callerInfo.priority === 'MEDIUM' && "border-yellow-500 text-yellow-600 bg-yellow-50/50",
                        callerInfo.priority === 'LOW' && "border-green-500 text-green-600 bg-green-50/50"
                      )}
                    >
                      <span className="hidden sm:inline">{callerInfo.priority}</span>
                      <span className="sm:hidden">{callerInfo.priority.charAt(0)}</span>
                    </Badge>
                  </div>
                  <div className="text-[12px] sm:text-[13px] text-gray-600 font-normal truncate">
                    <span className="hidden lg:inline">{callerInfo?.number || 'Unknown Number'} • </span>
                    <span className="hidden sm:inline lg:hidden">{callerInfo?.number?.slice(-4) || 'Unknown'} • </span>
                    <span className="sm:hidden">{callerInfo?.number?.slice(-4) || 'Unknown'} • </span>
                    <span className="hidden lg:inline">{callerInfo?.location || 'Unknown Location'}</span>
                    <span className="hidden sm:inline lg:hidden">{callerInfo?.location?.split(',')[0] || 'Unknown'}</span>
                    <span className="sm:hidden">{callerInfo?.location?.split(',')[0]?.split(' ')[0] || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0">
                {isAutoAccepting && (
                  <Badge 
                    variant="secondary" 
                    className="text-[10px] sm:text-[11px] bg-blue-100/60 text-blue-700 border border-blue-200/30 whitespace-nowrap max-w-[45vw] md:max-w-[320px] truncate"
                  >
                    <span className="hidden md:inline">Auto-accepting in 5s...</span>
                    <span className="hidden sm:inline md:hidden">Auto 5s...</span>
                    <span className="sm:hidden">5s</span>
                  </Badge>
                )}
                
                {/* Clean Decline button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectCall}
                  className="gap-1 sm:gap-2 bg-white/50 backdrop-blur-sm border-gray-300/50 hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-200 text-gray-700 font-medium shrink-0 whitespace-nowrap"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Decline</span>
                  <span className="sm:hidden">✗</span>
                </Button>
                
                {/* Clean Accept button */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAcceptCall}
                  className="gap-1 sm:gap-2 bg-green-600 hover:bg-green-700 border-green-600 shadow-sm transition-all duration-200 text-white font-medium shrink-0 whitespace-nowrap"
                >
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">Accept</span>
                  <span className="inline sm:hidden">✓</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* End Call Confirmation Dialog */}
        <EndCallConfirmation
          isOpen={showEndCallConfirm}
          onConfirm={handleConfirmedEndCall}
          onCancel={() => setShowEndCallConfirm(false)}
          callerName={callerInfo.name}
          duration={callDuration}
          incompleteActions={agentData.actions?.filter(action => !action.completed).length || 0}
          requireActionsCompletion={agentSettings.calls.requireActionsCompletion}
        />
      </>
    )
  }
  
  // Render active call controls
  if (callState === 'active') {
    return (
      <>
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between h-10 px-3">
            {/* Left: Call Timer and Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <PhoneCall className="h-3 w-3 text-green-600" />
                <span className="font-mono text-sm font-semibold text-green-700 dark:text-green-400">
                  {formatDuration(callDuration)}
                </span>
              </div>
              
              <Badge variant="secondary" className="text-xs h-5 px-2">
                {callerInfo?.name || 'Connected'}
              </Badge>
              
              {isOnHold && (
                <Badge variant="outline" className="text-xs h-5 px-2 border-amber-500 text-amber-600">
                  Hold
                </Badge>
              )}
            </div>
            
            {/* Center: Compact Controls */}
            <div className="flex items-center gap-1">
              {/* Mute Button */}
              <Button
                variant={isMuted ? "destructive" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              </Button>
              
              {/* Hold Button */}
              <Button
                variant={isOnHold ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  if (isOnHold) {
                    acceptCall() // Resume call
                  } else {
                    // For hold functionality, we can extend the store or handle locally
                    // For now, keeping the hold state management local until store is extended
                    setIsOnHold(true)
                  }
                }}
                title={isOnHold ? "Resume" : "Hold"}
              >
                {isOnHold ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              </Button>
              
              {/* Transfer Button */}
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7"
                onClick={handleTransfer}
                title="Transfer"
              >
                <PhoneForwarded className="h-3 w-3" />
              </Button>
              
              {/* End Call Button */}
              <Button 
                variant="destructive" 
                size="icon"
                className="h-7 w-7 bg-red-500 hover:bg-red-600"
                onClick={handleEndCall}
                title="End call"
              >
                <PhoneOff className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Right: Agent Status */}
            <div className="flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(agentStatus))} />
              <span className="text-xs text-muted-foreground">
                {getStatusLabel(agentStatus)}
              </span>
            </div>
          </div>
        </div>
        
        {/* End Call Confirmation Dialog */}
        <EndCallConfirmation
          isOpen={showEndCallConfirm}
          onConfirm={handleConfirmedEndCall}
          onCancel={() => setShowEndCallConfirm(false)}
          callerName={callerInfo?.name || 'Unknown'}
          duration={callDuration}
          incompleteActions={agentData.actions?.filter(action => !action.completed).length || 0}
          requireActionsCompletion={agentSettings.calls.requireActionsCompletion}
        />
      </>
    )
  }
  
  // Render idle state with status toggle (no simulate button - calls auto-trigger)
  return (
    <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b">
      <div className="flex items-center justify-between h-10 px-3">
        {/* Left: Agent Status Toggle */}
        <AgentStatusToggle 
          compact={true} 
          onAutoCall={triggerAutoCall}
        />
        
        {/* Right: Call status with special states */}
        <div className="flex items-center gap-2 text-sm">
          {agentStatus === 'after-call-work' ? (
            <div className="flex items-center gap-2 text-purple-600">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <span>After Call Work - {afterCallWorkSecondsRemaining}s remaining</span>
            </div>
          ) : agentStatus === 'do-not-disturb' ? (
            <div className="flex items-center gap-2 text-orange-600">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>Do Not Disturb - {Math.floor(doNotDisturbSecondsRemaining / 60)}:{(doNotDisturbSecondsRemaining % 60).toString().padStart(2, '0')} remaining</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>No active call - Waiting for calls</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
