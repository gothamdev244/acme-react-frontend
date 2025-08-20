import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '../ui/card'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Phone, X } from 'lucide-react'
import { useWebSocket } from '../../contexts/websocket-context'
import { useToast } from '../../hooks/use-toast'
import { useAgentData, useClearActions, useUpdateActions } from '../../stores/selectors/agent-selectors'
import { useAgentStatusStore } from '../../stores/agent-status-store'
import { audioService } from '../../services/audio.service'
import { useAgentSettings } from '../../hooks/use-agent-settings'
import { EndCallConfirmation } from '../dialogs/end-call-confirmation'
import { getAppConfig } from '../../config/app-config'

interface InlineCallNotificationProps {
  // Props simplified - state is now managed by Zustand store
  // Components can subscribe directly to the store for state updates
}

export function InlineCallNotification({}: InlineCallNotificationProps) {
  // Use Zustand store for all call state management
  const agentStatus = useAgentStatusStore(state => state.status)
  const callState = useAgentStatusStore(state => state.callState)
  const callerInfo = useAgentStatusStore(state => state.callerInfo)
  const callDuration = useAgentStatusStore(state => state.callDuration)
  const currentCallerId = useAgentStatusStore(state => state.currentCallerId)
  
  // Zustand actions
  const acceptCall = useAgentStatusStore(state => state.acceptCall)
  const endCall = useAgentStatusStore(state => state.endCall)
  const setCallerInfo = useAgentStatusStore(state => state.setCallerInfo)
  const updateHandleTime = useAgentStatusStore(state => state.updateHandleTime)
  
  const { settings: agentSettings, updateNestedSettings } = useAgentSettings()
  const callStartTime = useRef<Date | null>(null)
  // Remove local state since we're using Zustand store
  // const currentCallerInfoRef = useRef(callerInfo)
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false)
  const { connect, disconnect, sendMessage } = useWebSocket()
  const { toast } = useToast()
  
  // Use optimized selectors to reduce re-renders
  const agentData = useAgentData()
  const clearActions = useClearActions()
  const { updatePriority, updateAgentData } = useUpdateActions()
  
  // Draggable state - position next to "Simulate Call" button initially
  const savedPosition = localStorage.getItem('callNotificationPosition')
  const defaultPosition = { x: window.innerWidth / 2 + 100, y: 65 }
  const initialPosition = savedPosition ? JSON.parse(savedPosition) : defaultPosition
  
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const notificationRef = useRef<HTMLDivElement>(null)

  // No longer needed - using Zustand store directly

  // Simulate different callers, play ringtone, and auto-accept if available
  useEffect(() => {
    if (callState === 'incoming') {
      const callers = [
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
        
        // HSBC Personal
        { name: 'Maria Santos', number: '+34-91-123-4567', location: 'Madrid, Spain', priority: 'LOW' as const },
        { name: 'Carlos Rodriguez', number: '+34-93-234-5678', location: 'Barcelona, Spain', priority: 'MEDIUM' as const },
        { name: 'Isabella Martinez', number: '+34-96-345-6789', location: 'Valencia, Spain', priority: 'LOW' as const },
        
        // Business Banking
        { name: 'Marcus Johnson', number: '+44-20-7234-5678', location: 'London, UK', priority: 'HIGH' as const },
        { name: 'Sophie Anderson', number: '+33-1-4234-5678', location: 'Paris, France', priority: 'MEDIUM' as const },
        
        // Student Banking
        { name: 'Oliver Chen', number: '+44-1865-234567', location: 'Oxford, UK', priority: 'LOW' as const },
        { name: 'Emma Thompson', number: '+44-1223-345678', location: 'Cambridge, UK', priority: 'LOW' as const }
      ]
      const randomCaller = callers[Math.floor(Math.random() * callers.length)]
      setCallerInfo(randomCaller)
      
      // Play HSBC electro ringtone when call comes in
      audioService.playRingtone().then((result) => {
        if (!result.success) {
          // Failed to play ringtone
          // Could show a visual indicator that audio is blocked
        }
      })
      
      // Auto-accept if agent is available AND auto-accept is enabled in settings
      if (agentStatus === 'available' && agentSettings.calls.autoAccept) {
        const timer = setTimeout(() => {
          handleAccept()
        }, 5000) // 5 second delay to view call before auto-accept
        
        return () => clearTimeout(timer)
      }
    } else {
      // Stop ringtone when call state changes from incoming
      audioService.stopRingtone()
    }
    
    // Cleanup: Stop ringtone when component unmounts or call state changes
    return () => {
      audioService.stopRingtone()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState, agentStatus, agentSettings.calls.autoAccept])

  // Call duration timer - now handled by Zustand store
  useEffect(() => {
    // Call duration is now managed by Zustand store
    // This effect is kept for any future cleanup needs
  }, [callState, currentCallerId])

  const handleReject = () => {
    // Stop ringtone immediately when call is rejected
    audioService.forceStopAllAudio()
    
    // Use Zustand store to reset call state
    setCallerInfo(null)
    // Note: setCallState should be handled by the store's logic
    
    toast({
      title: 'Call Declined',
      description: `Declined call from ${callerInfo?.name || 'Unknown'}`,
    })
    
    // No longer need to call onReject prop - state is managed by Zustand
  }

  const handleAccept = () => {
    
    if (!callerInfo) return
    
    // Stop ringtone immediately when call is accepted (force stop all audio)
    audioService.forceStopAllAudio()
    
    callStartTime.current = new Date()
    
    // Use Zustand action to accept the call
    acceptCall()
    
    const callerId = callerInfo.number // Use phone as callerId
    
    // First disconnect any existing WebSocket connection
    disconnect()
    
    // Clear all data AFTER disconnect to ensure clean state
    setTimeout(() => {
      clearActions.clearSentiment()
      clearActions.clearIntent()
      clearActions.clearActions()
      clearActions.clearTranscript()
      clearActions.clearCustomer()
      clearActions.clearKnowledgeArticles()
      clearActions.clearPriority()
      updateAgentData({ queuePosition: undefined })
      
      // Connect with new callerId after clearing
      setTimeout(() => {
        connect('agent-001', callerId, 8080)
      }, 100)
    }, 50)
    
    // Try to stop any existing simulation for this caller (ignore 404 errors)
    const config = getAppConfig()
    fetch(`${config.services.aiService.baseUrl}/api/calls/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callerId: callerId
      })
    }).catch(() => {
      // Silently ignore errors - simulation might not exist (404 is expected)
    }).finally(() => {
      // Now start new AI simulation for this call
      const aiRequestBody = {
        callerId: callerId,
        agentId: 'agent-001',
        callerName: callerInfo.name,
        callerNumber: callerInfo.number,
        callerLocation: 'Location not available' // Location not part of CallerInfo type
      }
      
      fetch(`${config.services.aiService.baseUrl}/api/calls/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aiRequestBody)
      }).then(async response => {
        if (response.ok) {
        } else {
          const errorText = await response.text()
          // Failed to start AI simulation
        }
      }).catch(error => {
        // Failed to start AI simulation
      })
    })
    
    // Send accept call message with current caller info
    setTimeout(() => {
      sendMessage({
        type: 'accept_call',
        callerId: callerId,
        agentId: 'agent-001',
        callerName: callerInfo.name,
        timestamp: new Date().toISOString()
      })
    }, 500)

    // Also update the store with initial priority data for demo
    updatePriority({
      level: callerInfo.priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      waitTime: Math.floor(Math.random() * 300) + 60, // Random wait time 1-6 minutes
      estimatedResolution: Math.floor(Math.random() * 600) + 300, // 5-15 minutes
      escalation: callerInfo.priority === 'HIGH' || callerInfo.priority === 'URGENT'
    })
    updateAgentData({ queuePosition: Math.floor(Math.random() * 5) + 1 }) // Queue position 1-5
    
    // Customer data will come from PostgreSQL via WebSocket
    // No need to create hardcoded customer data here
    // The Java service will fetch real customer data from DB and send it
    // AI simulation already started above, no need to start again

    toast({
      title: 'Call Connected',
      description: `Connected with ${callerInfo.name}`,
    })

    // No longer need to call onAccept prop - state is managed by Zustand
  }

  
  const performEndCall = async () => {
    // Calculate call duration
    let actualDuration = callDuration // Use the actual tracked duration
    if (callStartTime.current) {
      actualDuration = Math.floor((new Date().getTime() - callStartTime.current.getTime()) / 1000)
      callStartTime.current = null
    }
    
    // Stop AI simulation for this call
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
      }).then(response => {
        if (response.ok) {
        }
      }).catch(error => {
        // Failed to stop AI simulation
      })
    }
    
    // Update metrics in the store (calls handled is incremented by useAgentStatus hook)
    updateHandleTime(actualDuration)
    // Send end call message first
    sendMessage({
      type: 'end_call',
      callerId: currentCallerId,
      agentId: 'agent-001',
      duration: callDuration,
      timestamp: new Date().toISOString()
    })

    // Clear all agent data for fresh start
    setTimeout(() => {
      clearActions.clearSentiment()
      clearActions.clearIntent()
      clearActions.clearActions()
      clearActions.clearTranscript()
      clearActions.clearCustomer()
      clearActions.clearPriority()
      updateAgentData({ queuePosition: undefined })
      // Clear the stored customer data
      window.localStorage.removeItem('currentCallCustomer')
    }, 300)

    // Disconnect WebSocket after a short delay to ensure messages are sent
    setTimeout(() => {
      disconnect()
    }, 500)

    // Use Zustand action to end the call
    endCall()
    
    toast({
      title: 'Call Ended',
      description: `Call duration: ${formatDuration(callDuration)}`,
    })

    // No longer need to call onEnd prop - state is managed by Zustand
  }
  
  const handleConfirmedEndCall = () => {
    setShowEndCallConfirm(false)
    performEndCall()
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
      e.preventDefault()
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      
      // Keep within viewport bounds
      const maxX = window.innerWidth - (notificationRef.current?.offsetWidth || 400)
      const maxY = window.innerHeight - (notificationRef.current?.offsetHeight || 100)
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    // Save position to localStorage
    localStorage.setItem('callNotificationPosition', JSON.stringify(position))
  }

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // Save position when it changes (after drag ends)
  useEffect(() => {
    if (!isDragging && position !== initialPosition) {
      localStorage.setItem('callNotificationPosition', JSON.stringify(position))
    }
  }, [position, isDragging])

  if (callState === 'incoming') {
    const isAutoAccepting = agentStatus === 'available' && agentSettings.calls.autoAccept
    
    return (
      <div className="fixed inset-0 z-40 flex items-start justify-center pt-24 pointer-events-none">
        {/* Subtle dark overlay for contrast */}
        <div className="fixed inset-0 bg-black/10 pointer-events-none" />
        
        <div className="pointer-events-auto animate-in slide-in-from-top-4 duration-500">
          <div className="relative">
            {/* Soft ambient glow */}
            <div className="absolute -inset-8 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 rounded-[3rem] blur-3xl" />
            
            {/* Main liquid glass card */}
            <div className="relative w-[380px] backdrop-blur-[100px] bg-white/[0.05] dark:bg-white/[0.02] border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden rounded-[2rem]">
              {/* Multiple gradient layers for depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.04] to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/[0.05] via-transparent to-purple-400/[0.05] pointer-events-none" />
              
              {/* Subtle noise texture */}
              <div className="absolute inset-0 opacity-[0.01] mix-blend-overlay pointer-events-none" 
                   style={{
                     backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' /%3E%3C/filter%3E%3Crect width='60' height='60' filter='url(%23noise)' opacity='0.4' /%3E%3C/svg%3E")`,
                   }} />
              
              <div className="relative p-6 backdrop-saturate-150">
              {/* Caller Info Section */}
              <div className="flex flex-col items-center text-center mb-6">
                {/* Liquid glass avatar */}
                <div className="w-20 h-20 mb-4 relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/80 to-blue-600/80 blur-md" />
                  <div className="relative w-full h-full rounded-full backdrop-blur-xl bg-gradient-to-br from-blue-400/60 to-blue-600/60 ring-2 ring-white/20 shadow-xl flex items-center justify-center">
                    <span className="text-white/95 text-2xl font-semibold drop-shadow-sm">
                      {callerInfo?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white/95">
                    {callerInfo?.name || 'Unknown Caller'}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-white/75">
                    {callerInfo?.number || 'Unknown Number'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-white/60">
                    {callerInfo?.location || 'Unknown Location'}
                  </p>
                </div>
                
                {/* Liquid glass badge */}
                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full backdrop-blur-xl bg-white/10 border border-white/20">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    callerInfo?.priority === 'URGENT' ? 'bg-red-400' :
                    callerInfo?.priority === 'HIGH' ? 'bg-orange-400' :
                    callerInfo?.priority === 'MEDIUM' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <span className="text-xs font-medium text-gray-700 dark:text-white/80">
                    {callerInfo?.priority || 'UNKNOWN'} Priority
                  </span>
                </div>
              </div>
              
              {/* Auto Accept Indicator with liquid glass */}
              {isAutoAccepting ? (
                <div className="flex items-center justify-between py-3 px-4 backdrop-blur-xl bg-green-400/10 rounded-2xl mb-4 border border-green-400/20">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-gray-700 dark:text-green-300/90">
                      Auto-accepting call...
                    </span>
                  </div>
                  <button
                    onClick={() => updateNestedSettings('calls', { autoAccept: false })}
                    className="text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-700 dark:text-white/70 border border-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
              
              {/* Action Buttons */}
              {!isAutoAccepting && (
                <div className="flex items-center justify-center gap-6">
                  {/* Decline Button - Liquid Glass */}
                  <button
                    onClick={handleReject}
                    className="group relative w-16 h-16 rounded-full backdrop-blur-2xl bg-red-500/20 hover:bg-red-500/30 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 border border-red-400/30 hover:border-red-400/50"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent" />
                    <X className="w-7 h-7 text-red-600 dark:text-red-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </button>
                  
                  {/* Accept Button - Liquid Glass with pulse */}
                  <button
                    onClick={handleAccept}
                    data-accept-call="true"
                    className="group relative w-20 h-20 rounded-full backdrop-blur-2xl bg-green-500/20 hover:bg-green-500/30 shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300 border border-green-400/30 hover:border-green-400/50"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/10 to-transparent" />
                    <div className="absolute inset-0 rounded-full animate-ping bg-green-400/20" />
                    <Phone className="w-9 h-9 text-green-600 dark:text-green-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </button>
                </div>
              )}
              
              {/* Button Labels with better visibility */}
              {!isAutoAccepting && (
                <div className="flex items-center justify-center gap-12 mt-3">
                  <span className="text-xs text-gray-600 dark:text-white/60 font-medium">Decline</span>
                  <span className="text-xs text-gray-600 dark:text-white/60 font-medium ml-2">Accept</span>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Active call is now handled inline in the dashboard header
  // if (callState === 'active') {
  //   return null
  // }

  return (
    <>
      {/* End Call Confirmation Dialog */}
      <EndCallConfirmation
        isOpen={showEndCallConfirm}
        onConfirm={handleConfirmedEndCall}
        onCancel={() => setShowEndCallConfirm(false)}
        callerName={callerInfo?.name || 'Unknown Caller'}
        duration={callDuration}
        incompleteActions={agentData.actions?.filter(action => !action.completed).length || 0}
        requireActionsCompletion={agentSettings.calls.requireActionsCompletion}
      />
    </>
  )
}
