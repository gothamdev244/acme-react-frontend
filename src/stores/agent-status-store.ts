import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AgentStatus = 'available' | 'on-call' | 'break' | 'offline' | 'after-call-work' | 'do-not-disturb'
export type CallState = 'idle' | 'incoming' | 'ringing' | 'active' | 'ended'

export interface CallerInfo {
  id?: string
  name: string
  number: string // Changed from phone to number
  location?: string // Changed from email to location
  accountNumber?: string
  accountId?: string
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' // Updated priority values
  issueCategory?: string
  issueDescription?: string
  avatar?: string
}

interface AgentStatusState {
  // Current status
  status: AgentStatus
  
  // Status timestamps
  statusSince: Date
  lastStatusChange: Date
  
  // Call state management
  callState: CallState
  currentCallerId: string
  callerInfo: CallerInfo | null
  callDuration: number
  callStartTime: Date | null
  isMuted: boolean
  isOnHold: boolean
  
  // Call metrics
  callsHandledToday: number
  totalHandleTime: number
  lastCallEndTime: Date | null
  
  // Queue information
  callsInQueue: number
  autoCallEnabled: boolean
  autoAcceptCalls: boolean
  
  // Time tracking
  timeInStatus: {
    available: number
    'on-call': number
    break: number
    offline: number
    'after-call-work': number
    'do-not-disturb': number
  }
  
  // Timer states for after-call work and DND
  afterCallWorkTimer: NodeJS.Timeout | null
  afterCallWorkSecondsRemaining: number
  doNotDisturbTimer: NodeJS.Timeout | null
  doNotDisturbSecondsRemaining: number
  doNotDisturbOriginalStatus: AgentStatus | null
  
  // Actions
  setStatus: (status: AgentStatus) => void
  incrementCallsHandled: () => void
  updateHandleTime: (duration: number) => void
  setCallsInQueue: (count: number) => void
  setAutoCallEnabled: (enabled: boolean) => void
  setAutoAcceptCalls: (enabled: boolean) => void
  updateTimeInStatus: () => void
  resetDailyMetrics: () => void
  setLastCallEndTime: (time: Date | null) => void
  
  // Call state actions
  setCallState: (state: CallState) => void
  setCallerInfo: (info: CallerInfo | null) => void
  setCurrentCallerId: (id: string) => void
  setCallDuration: (duration: number) => void
  setIsMuted: (muted: boolean) => void
  setIsOnHold: (onHold: boolean) => void
  startCall: (callerId: string, callerInfo: CallerInfo) => void
  acceptCall: () => void
  endCall: () => void
  
  // New actions for after-call work and DND
  startAfterCallWork: (durationSeconds: number) => void
  cancelAfterCallWork: () => void
  startDoNotDisturb: (durationMinutes: number, originalStatus?: AgentStatus) => void
  cancelDoNotDisturb: () => void
  canAcceptCalls: () => boolean
}

export const useAgentStatusStore = create<AgentStatusState>()(
  persist(
    (set, get) => ({
      // Initial state - ALWAYS start offline regardless of persisted state
      status: 'offline' as AgentStatus,
      statusSince: new Date(),
      lastStatusChange: new Date(),
      
      // Call state - always reset to idle on load
      callState: 'idle' as CallState,
      currentCallerId: '',
      callerInfo: null,
      callDuration: 0,
      callStartTime: null,
      isMuted: false,
      isOnHold: false,
      
      // Metrics
      callsHandledToday: 0,
      totalHandleTime: 0,
      lastCallEndTime: null,
      
      // Queue - always reset to 0 on load
      callsInQueue: 0,
      autoCallEnabled: true,
      autoAcceptCalls: false, // Default to manual accept
      
      // Time tracking (in seconds)
      timeInStatus: {
        available: 0,
        'on-call': 0,
        break: 0,
        offline: 0,
        'after-call-work': 0,
        'do-not-disturb': 0
      },
      
      // Timer state
      afterCallWorkTimer: null,
      afterCallWorkSecondsRemaining: 0,
      doNotDisturbTimer: null,
      doNotDisturbSecondsRemaining: 0,
      doNotDisturbOriginalStatus: null,
      
      // Actions
      setStatus: (newStatus) => {
        const state = get()
        const now = new Date()
        
        
        // Clear any running timers when changing status
        if (state.afterCallWorkTimer) {
          clearInterval(state.afterCallWorkTimer)
        }
        if (state.doNotDisturbTimer) {
          clearInterval(state.doNotDisturbTimer)
        }
        
        // Update time spent in previous status
        const timeSpent = Math.floor((now.getTime() - state.statusSince.getTime()) / 1000)
        const updatedTimeInStatus = { ...state.timeInStatus }
        updatedTimeInStatus[state.status] += timeSpent
        
        set({
          status: newStatus,
          statusSince: now,
          lastStatusChange: now,
          timeInStatus: updatedTimeInStatus,
          // Reset queue when going offline/break
          callsInQueue: newStatus === 'available' ? state.callsInQueue : 0,
          // Clear timer states
          afterCallWorkTimer: null,
          afterCallWorkSecondsRemaining: 0,
          doNotDisturbTimer: null,
          doNotDisturbSecondsRemaining: 0,
          doNotDisturbOriginalStatus: null
        })
      },
      
      incrementCallsHandled: () => set((state) => ({
        callsHandledToday: state.callsHandledToday + 1
      })),
      
      updateHandleTime: (duration) => set((state) => ({
        totalHandleTime: state.totalHandleTime + duration
      })),
      
      setCallsInQueue: (count) => set({ callsInQueue: count }),
      
      setAutoCallEnabled: (enabled) => set({ autoCallEnabled: enabled }),
      
      setAutoAcceptCalls: (enabled) => set({ autoAcceptCalls: enabled }),
      
      setLastCallEndTime: (time) => set({ lastCallEndTime: time }),
      
      // Call state actions
      setCallState: (state) => set({ callState: state }),
      
      setCallerInfo: (info) => set({ callerInfo: info }),
      
      setCurrentCallerId: (id) => set({ currentCallerId: id }),
      
      setCallDuration: (duration) => set({ callDuration: duration }),
      
      setIsMuted: (muted) => set({ isMuted: muted }),
      
      setIsOnHold: (onHold) => set({ isOnHold: onHold }),
      
      startCall: (callerId, callerInfo) => set({
        callState: 'incoming',
        currentCallerId: callerId,
        callerInfo: callerInfo,
        callDuration: 0,
        callStartTime: null, // Will be set when call is accepted
        isMuted: false,
        isOnHold: false
      }),
      
      acceptCall: () => {
        const state = get()
        set({
          callState: 'active',
          callStartTime: new Date(),
          status: 'on-call'
        })
      },
      
      endCall: () => {
        const state = get()
        // Calculate call duration if call was active
        let duration = 0
        if (state.callStartTime) {
          duration = Math.floor((new Date().getTime() - state.callStartTime.getTime()) / 1000)
        }
        
        set({
          callState: 'idle',
          currentCallerId: '',
          callerInfo: null,
          callDuration: 0,
          callStartTime: null,
          isMuted: false,
          isOnHold: false,
          status: 'available'
        })
        
        // Update metrics if there was a call
        if (duration > 0) {
          get().incrementCallsHandled()
          get().updateHandleTime(duration)
        }
      },
      
      updateTimeInStatus: () => {
        const state = get()
        const now = new Date()
        const timeSpent = Math.floor((now.getTime() - state.statusSince.getTime()) / 1000)
        const updatedTimeInStatus = { ...state.timeInStatus }
        updatedTimeInStatus[state.status] += timeSpent
        
        set({
          timeInStatus: updatedTimeInStatus,
          statusSince: now
        })
      },
      
      resetDailyMetrics: () => set({
        callsHandledToday: 0,
        totalHandleTime: 0,
        timeInStatus: {
          available: 0,
          'on-call': 0,
          break: 0,
          offline: 0,
          'after-call-work': 0,
          'do-not-disturb': 0
        }
      }),
      
      // After-call work functionality
      startAfterCallWork: (durationSeconds) => {
        const state = get()
        
        // Clear any existing timer
        if (state.afterCallWorkTimer) {
          clearInterval(state.afterCallWorkTimer)
        }
        
        // Set status and start countdown
        set({
          status: 'after-call-work',
          statusSince: new Date(),
          lastStatusChange: new Date(),
          afterCallWorkSecondsRemaining: durationSeconds
        })
        
        // Create countdown timer
        const timer = setInterval(() => {
          const currentState = get()
          const remaining = currentState.afterCallWorkSecondsRemaining - 1
          
          if (remaining <= 0) {
            // Timer finished - only change to available if still in after-call-work status
            clearInterval(currentState.afterCallWorkTimer!)
            
            // Only change to available if we're still in after-call-work status
            // (user might have gone on break or offline while timer was running)
            if (currentState.status === 'after-call-work') {
              set({
                status: 'available',
                statusSince: new Date(),
                lastStatusChange: new Date(),
                afterCallWorkTimer: null,
                afterCallWorkSecondsRemaining: 0
              })
            } else {
              set({
                afterCallWorkTimer: null,
                afterCallWorkSecondsRemaining: 0
              })
            }
          } else {
            set({ afterCallWorkSecondsRemaining: remaining })
          }
        }, 1000)
        
        set({ afterCallWorkTimer: timer })
      },
      
      cancelAfterCallWork: () => {
        const state = get()
        if (state.afterCallWorkTimer) {
          clearInterval(state.afterCallWorkTimer)
        }
        // Only change to available if currently in after-call-work status
        if (state.status === 'after-call-work') {
          set({
            status: 'available',
            statusSince: new Date(),
            lastStatusChange: new Date(),
            afterCallWorkTimer: null,
            afterCallWorkSecondsRemaining: 0
          })
        } else {
          // Just clear the timer without changing status
          set({
            afterCallWorkTimer: null,
            afterCallWorkSecondsRemaining: 0
          })
        }
      },
      
      // Do Not Disturb functionality
      startDoNotDisturb: (durationMinutes, originalStatus = 'available') => {
        const state = get()
        
        // Clear any existing timer
        if (state.doNotDisturbTimer) {
          clearInterval(state.doNotDisturbTimer)
        }
        
        const durationSeconds = durationMinutes * 60
        
        // Set DND status
        set({
          status: 'do-not-disturb',
          statusSince: new Date(),
          lastStatusChange: new Date(),
          doNotDisturbSecondsRemaining: durationSeconds,
          doNotDisturbOriginalStatus: originalStatus
        })
        
        // Create countdown timer
        const timer = setInterval(() => {
          const currentState = get()
          const remaining = currentState.doNotDisturbSecondsRemaining - 1
          
          if (remaining <= 0) {
            // Timer finished - only restore if still in DND status
            clearInterval(currentState.doNotDisturbTimer!)
            
            // Only change status if we're still in do-not-disturb
            // (user might have manually changed status while timer was running)
            if (currentState.status === 'do-not-disturb') {
              const restoreStatus = currentState.doNotDisturbOriginalStatus || 'available'
              set({
                status: restoreStatus,
                statusSince: new Date(),
                lastStatusChange: new Date(),
                doNotDisturbTimer: null,
                doNotDisturbSecondsRemaining: 0,
                doNotDisturbOriginalStatus: null
              })
            } else {
              set({
                doNotDisturbTimer: null,
                doNotDisturbSecondsRemaining: 0,
                doNotDisturbOriginalStatus: null
              })
            }
          } else {
            set({ doNotDisturbSecondsRemaining: remaining })
          }
        }, 1000)
        
        set({ doNotDisturbTimer: timer })
      },
      
      cancelDoNotDisturb: () => {
        const state = get()
        if (state.doNotDisturbTimer) {
          clearInterval(state.doNotDisturbTimer)
        }
        // Only restore status if currently in do-not-disturb
        if (state.status === 'do-not-disturb') {
          set({
            status: state.doNotDisturbOriginalStatus || 'available',
            statusSince: new Date(),
            lastStatusChange: new Date(),
            doNotDisturbTimer: null,
            doNotDisturbSecondsRemaining: 0,
            doNotDisturbOriginalStatus: null
          })
        } else {
          // Just clear the timer without changing status
          set({
            doNotDisturbTimer: null,
            doNotDisturbSecondsRemaining: 0,
            doNotDisturbOriginalStatus: null
          })
        }
      },
      
      // Check if agent can accept calls
      canAcceptCalls: () => {
        const state = get()
        // Can only accept calls if available (not on-call, break, offline, etc)
        return state.status === 'available' && state.autoCallEnabled
      }
    }),
    {
      name: 'agent-status-storage',
      partialize: (state) => ({
        // Don't persist status - always start as offline
        // status: state.status,
        callsHandledToday: state.callsHandledToday,
        totalHandleTime: state.totalHandleTime,
        timeInStatus: state.timeInStatus,
        autoCallEnabled: state.autoCallEnabled,
        // Don't persist queue or autoAccept - reset on reload
        // callsInQueue: state.callsInQueue,
        // autoAcceptCalls: state.autoAcceptCalls
      }),
      onRehydrateStorage: () => (state) => {
        // Force status to offline and reset queue on rehydration
        if (state) {
          state.status = 'offline'
          state.callsInQueue = 0
          state.autoAcceptCalls = false
          state.statusSince = new Date()
          state.lastStatusChange = new Date()
        }
      }
    }
  )
)
