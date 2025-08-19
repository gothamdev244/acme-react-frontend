import { useEffect, useCallback, useRef } from 'react'
import { useAgentStatusStore, AgentStatus } from '../stores/agent-status-store'
import { useAgentSettings } from './use-agent-settings'
import { useToast } from './use-toast'

interface UseAgentStatusOptions {
  onStatusChange?: (status: AgentStatus) => void
  onAutoCall?: () => void
  autoCallDelay?: number // Delay before auto-triggering call (ms)
  betweenCallDelay?: number // Delay between calls (ms)
}

export function useAgentStatus({
  onStatusChange,
  onAutoCall,
  autoCallDelay = 4000, // 4 seconds default
  betweenCallDelay = 10000 // 10 seconds between calls as requested
}: UseAgentStatusOptions = {}) {
  const { toast } = useToast()
  const { settings } = useAgentSettings()
  const autoCallTimerRef = useRef<NodeJS.Timeout | null>(null)
  const betweenCallTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const {
    status,
    statusSince,
    callsHandledToday,
    totalHandleTime,
    callsInQueue,
    autoCallEnabled,
    lastCallEndTime,
    timeInStatus,
    afterCallWorkSecondsRemaining,
    doNotDisturbSecondsRemaining,
    setStatus: setStoreStatus,
    incrementCallsHandled,
    updateHandleTime,
    setCallsInQueue,
    setAutoCallEnabled,
    setLastCallEndTime,
    startAfterCallWork,
    cancelAfterCallWork,
    startDoNotDisturb,
    cancelDoNotDisturb,
    canAcceptCalls
  } = useAgentStatusStore()
  
  
  // Calculate average handle time
  const averageHandleTime = callsHandledToday > 0 
    ? Math.round(totalHandleTime / callsHandledToday) 
    : 0
  
  // Format time for display (seconds to MM:SS)
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [])
  
  // Get status color
  const getStatusColor = useCallback((s: AgentStatus): string => {
    switch (s) {
      case 'available':
        return 'bg-green-500'
      case 'on-call':
        return 'bg-blue-500'
      case 'break':
        return 'bg-yellow-500'
      case 'offline':
        return 'bg-red-500'
      case 'after-call-work':
        return 'bg-purple-500'
      case 'do-not-disturb':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }, [])
  
  // Get status icon
  const getStatusIcon = useCallback((s: AgentStatus): string => {
    switch (s) {
      case 'available':
        return '●'
      case 'on-call':
        return '●'
      case 'break':
        return '●'
      case 'offline':
        return '●'
      case 'after-call-work':
        return '●'
      case 'do-not-disturb':
        return '●'
      default:
        return '○'
    }
  }, [])
  
  // Get status label
  const getStatusLabel = useCallback((s: AgentStatus): string => {
    switch (s) {
      case 'available':
        return 'Available'
      case 'on-call':
        return 'On Call'
      case 'break':
        return 'On Break'
      case 'offline':
        return 'Offline'
      case 'after-call-work':
        return 'After Call Work'
      case 'do-not-disturb':
        return 'Do Not Disturb'
      default:
        return 'Unknown'
    }
  }, [])
  
  // Set agent status with notifications
  const setStatus = useCallback((newStatus: AgentStatus) => {
    const previousStatus = status
    
    // Validate the new status
    const validStatuses: AgentStatus[] = ['available', 'on-call', 'break', 'offline', 'after-call-work', 'do-not-disturb']
    if (!validStatuses.includes(newStatus)) {
      return
    }
    
    // Don't do anything if status hasn't changed
    if (previousStatus === newStatus) {
      return
    }
    
    // Don't allow manual status changes while on a call (except to on-call)
    if (previousStatus === 'on-call' && newStatus !== 'available' && newStatus !== 'after-call-work') {
      toast({
        title: 'Cannot change status',
        description: 'Please end the current call first',
        variant: 'destructive'
      })
      return
    }
    
    // Clear any existing timers
    if (autoCallTimerRef.current) {
      clearTimeout(autoCallTimerRef.current)
      autoCallTimerRef.current = null
    }
    if (betweenCallTimerRef.current) {
      clearTimeout(betweenCallTimerRef.current)
      betweenCallTimerRef.current = null
    }
    
    setStoreStatus(newStatus)
    
    // Only show toast for manual status changes, not automatic ones
    // Don't show toast when coming from after-call-work (automatic transition) or when going on-call
    if (previousStatus !== 'after-call-work' && newStatus !== 'on-call') {
      const description = newStatus === 'available' 
        ? 'You are now available to receive calls' 
        : newStatus === 'break'
        ? 'You are on break - no calls will be routed'
        : newStatus === 'offline'
        ? 'You are offline - sign back in when ready'
        : newStatus === 'after-call-work'
        ? 'Wrapping up call - new calls blocked'
        : newStatus === 'do-not-disturb'
        ? 'Do Not Disturb enabled'
        : 'Status updated'
        
      toast({
        title: `Status: ${getStatusLabel(newStatus)}`,
        description
      })
    }
    
    // Trigger callback
    onStatusChange?.(newStatus)
    
    // Start auto-call timer if becoming available
    if (newStatus === 'available' && autoCallEnabled && onAutoCall) {
      // Simulate queue of calls
      const queueSize = Math.floor(Math.random() * 5) + 2 // 2-6 calls in queue
      setCallsInQueue(queueSize)
      
      autoCallTimerRef.current = setTimeout(() => {
        if (useAgentStatusStore.getState().status === 'available') {
          onAutoCall()
        }
      }, autoCallDelay)
    } else {
      // Clear queue when not available
      setCallsInQueue(0)
    }
  }, [status, setStoreStatus, toast, onStatusChange, onAutoCall, autoCallEnabled, autoCallDelay, getStatusLabel, setCallsInQueue])
  
  // Handle call ended - integrate with after-call work
  const handleCallEnded = useCallback((callDuration: number) => {
    incrementCallsHandled()
    updateHandleTime(callDuration)
    setLastCallEndTime(new Date())
    
    // Decrement queue
    const currentQueue = useAgentStatusStore.getState().callsInQueue
    if (currentQueue > 0) {
      setCallsInQueue(currentQueue - 1)
    }
    
    // Start after-call work if configured and enabled
    if (settings.calls.afterCallWorkTime > 0) {
      startAfterCallWork(settings.calls.afterCallWorkTime)
      
      // Show toast notification
      toast({
        title: 'After-call work started',
        description: `Work time: ${settings.calls.afterCallWorkTime} seconds. New calls will be blocked.`,
      })
      
      return // Don't schedule next call - timer will handle it
    }
    
    // No after-call work - set to available only if not already set
    // This prevents conflicts with immediate status reset in call controls
    const currentStatus = useAgentStatusStore.getState().status
    if (currentStatus === 'on-call') {
      setStatus('available')
    } else {
    }
    
    // Get updated status after potential change and check auto-call
    const updatedStatus = useAgentStatusStore.getState().status
    const currentAutoCallEnabled = useAgentStatusStore.getState().autoCallEnabled
    
    // If still available and auto-call enabled, trigger next call after delay
    if (updatedStatus === 'available' && currentAutoCallEnabled && onAutoCall) {
      betweenCallTimerRef.current = setTimeout(() => {
        if (useAgentStatusStore.getState().status === 'available') {
          // Add more calls to queue randomly
          if (Math.random() > 0.3) { // 70% chance of new calls
            const currentQueue = useAgentStatusStore.getState().callsInQueue
            const newCalls = Math.floor(Math.random() * 3) + 1 // 1-3 new calls
            setCallsInQueue(currentQueue + newCalls)
          }
          onAutoCall()
        }
      }, betweenCallDelay)
    } else {
    }
  }, [onAutoCall, betweenCallDelay, incrementCallsHandled, updateHandleTime, setCallsInQueue, setLastCallEndTime, settings.calls.afterCallWorkTime, startAfterCallWork, toast, setStatus])
  
  // Handle Do Not Disturb toggle from settings
  const handleDoNotDisturbToggle = useCallback((enabled: boolean, duration: number) => {
    if (enabled) {
      const currentStatus = useAgentStatusStore.getState().status
      const originalStatus = currentStatus === 'do-not-disturb' ? 'available' : currentStatus
      startDoNotDisturb(duration, originalStatus)
      
      toast({
        title: 'Do Not Disturb enabled',
        description: `Calls will be blocked for ${duration} minutes`,
      })
    } else {
      cancelDoNotDisturb()
      
      toast({
        title: 'Do Not Disturb disabled',
        description: 'You are now available to receive calls',
      })
    }
  }, [startDoNotDisturb, cancelDoNotDisturb, toast])
  
  // Toggle between available and break
  const toggleAvailability = useCallback(() => {
    if (status === 'available') {
      setStatus('break')
    } else if (status === 'break' || status === 'offline') {
      setStatus('available')
    }
  }, [status, setStatus])
  
  // Cleanup timers on unmount and page unload
  useEffect(() => {
    const cleanupTimers = () => {
      if (autoCallTimerRef.current) {
        clearTimeout(autoCallTimerRef.current)
        autoCallTimerRef.current = null
      }
      if (betweenCallTimerRef.current) {
        clearTimeout(betweenCallTimerRef.current)
        betweenCallTimerRef.current = null
      }
      // Reset queue on unload to prevent phantom calls
      setCallsInQueue(0)
    }
    
    // Clean up on page unload/refresh
    const handleBeforeUnload = () => {
      cleanupTimers()
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Clean up on unmount
    return () => {
      cleanupTimers()
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [setCallsInQueue])
  
  // Watch for status changes from timers (after-call work expiring)
  useEffect(() => {
    
    // If status changed to available and it wasn't from a manual action
    // (happens when after-call work timer expires)
    if (status === 'available' && afterCallWorkSecondsRemaining === 0) {
      
      // Check if auto-call is enabled and we have the callback
      if (autoCallEnabled && onAutoCall) {
        
        // Simulate queue refill
        const currentQueue = useAgentStatusStore.getState().callsInQueue
        if (currentQueue === 0) {
          const queueSize = Math.floor(Math.random() * 3) + 1 // 1-3 calls
          setCallsInQueue(queueSize)
        }
        
        // Trigger auto-call with a small delay
        setTimeout(() => {
          if (useAgentStatusStore.getState().status === 'available') {
            onAutoCall()
          }
        }, 2000) // 2 second delay after ACW ends
      }
    }
  }, [status, afterCallWorkSecondsRemaining, autoCallEnabled, onAutoCall, setCallsInQueue])
  
  // Reset daily metrics at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      const msUntilMidnight = tomorrow.getTime() - now.getTime()
      
      setTimeout(() => {
        useAgentStatusStore.getState().resetDailyMetrics()
        checkMidnight() // Schedule next check
      }, msUntilMidnight)
    }
    
    checkMidnight()
  }, [])
  
  return {
    // State
    status,
    statusSince,
    callsHandledToday,
    averageHandleTime,
    callsInQueue,
    autoCallEnabled,
    lastCallEndTime,
    timeInStatus,
    afterCallWorkSecondsRemaining,
    doNotDisturbSecondsRemaining,
    
    // Actions
    setStatus,
    toggleAvailability,
    handleCallEnded,
    setAutoCallEnabled,
    handleDoNotDisturbToggle,
    startAfterCallWork,
    cancelAfterCallWork,
    startDoNotDisturb,
    cancelDoNotDisturb,
    canAcceptCalls,
    
    // Utilities
    formatTime,
    getStatusColor,
    getStatusIcon,
    getStatusLabel
  }
}
