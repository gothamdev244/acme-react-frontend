import React, { createContext, useContext, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAgentStore } from '../stores/agent-store'
import { useToast } from '../hooks/use-toast'
import { getWebSocketUrl, getAppConfig } from '../config/app-config'
import { useAgentProfiles } from '../hooks/use-config'
import { useRoleConfig } from './role-context'
import { useAuth } from './auth-context'
import { traceLog } from '../utils/debug'

interface WebSocketContextValue {
  connect: (agentId: string, callerId: string, port?: number) => void
  disconnect: () => void
  sendMessage: (message: any) => void
  isConnected: boolean
  clearStore?: (dataType: string) => void
  hasCustomerContext: boolean
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null)

export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    // Return a safe no-op implementation during transitions (HMR, role changes, etc.)
    // This prevents crashes while maintaining functionality when provider is available
    return {
      connect: () => {},
      disconnect: () => {},
      sendMessage: () => {},
      isConnected: false,
      clearStore: () => {},
      hasCustomerContext: false
    }
  }
  return context
}

interface WebSocketProviderProps {
  children: React.ReactNode
  customWsUrl?: string
}

export function WebSocketProvider({ children, customWsUrl }: WebSocketProviderProps) {
  const wsRef = useRef<WebSocket | null>(null)
  const heartbeatIntervalRef = useRef<number | null>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const reconnectAttemptsRef = useRef<number>(0)
  const intentionalDisconnectRef = useRef<boolean>(false)
  const hasAutoConnected = useRef(false)
  
  // Get configuration values
  const config = getAppConfig()
  const { maxReconnectAttempts, maxReconnectDelay } = config.websocket
  
  const { toast } = useToast()
  
  // Get current user role for intent-to-app mapping
  const { currentRole } = useRoleConfig()
  
  // Get authenticated user
  const { user } = useAuth()
  
  // Use the global store for the agent dashboard
  const {
    agentData,
    setConnectionStatus,
    updateSentiment,
    updatePriority,
    updateIntent,
    updateActions,
    updateKnowledgeArticles,
    addTranscriptEntry,
    updateCustomer,
    updateAgentData,
    isConnected,
    clearSentiment,
    clearPriority,
    clearIntent,
    clearActions,
    clearTranscript,
    clearKnowledgeArticles,
    clearCustomer,
  } = useAgentStore()

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)
      
      // 🔍 Log all incoming WebSocket messages for debugging
      
      // Route message based on type
      switch (data.type) {
        case 'sentiment':
          // Parse sentiment from backend which sends: {sentiment: 'positive'/'negative'/'neutral', confidence: 0.85}
          const sentimentValue = data.sentiment || 'neutral'
          const confidence = data.confidence || data.score || 0.5
          
          updateSentiment({
            score: Math.round(confidence * 100),  // Convert confidence to percentage
            label: sentimentValue,  // Use sentiment as label
            trend: data.trend || 'stable',
            change: data.change || 0,
          })
          break
          
        case 'priority':
          updatePriority({
            level: data.level || data.priority || 'MEDIUM',
            waitTime: data.waitTime || 0,
            estimatedResolution: data.estimatedResolution || 0,
            escalation: data.escalation || false,
          })
          // Also update agent data with queue position
          updateAgentData({
            queuePosition: data.queuePosition || 1
          })
          break
          
        case 'summary':
          // Summary is no longer used - skip processing
          break
          
        case 'intent': {
          // Derive detection latency from timestamp/deliveryTime when available
          let tsMs: number | undefined
          if (data.timestamp) {
            tsMs = new Date(data.timestamp).getTime()
          } else if (typeof data.deliveryTime === 'number') {
            // deliveryTime may be epoch seconds or ms; detect unit
            tsMs = data.deliveryTime > 1e12 ? data.deliveryTime : data.deliveryTime * 1000
          }
          const detectionMs = tsMs ? Math.max(0, Date.now() - tsMs) : undefined

          // Map accuracy label from confidence if explicit accuracy not provided
          const confidence = data.confidence || 0
          const accuracy = (data.intentAccuracy ?? data.accuracy) ?? (
            confidence >= 0.85 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low'
          )

          // Extract enriched app data from Gateway (new fields from intent-to-app mapping)
          const intentData = {
            type: data.intent || data.intentType || 'UNKNOWN',
            confidence,
            detectionMs,
            accuracy,
            appUrl: data.appUrl,      // Enriched by Gateway with embedded app URL
            appTitle: data.appTitle   // Enriched by Gateway with embedded app title
          }

          updateIntent(intentData)
          break
        }
          
        case 'actions':
          updateActions(data.actions || [])
          break
          
        case 'knowledge':
        case 'knowledge_articles':
        case 'knowledge_update':
          // Handle AI-provided knowledge article recommendations
          updateKnowledgeArticles(data.articles || data.knowledgeArticles || [])
          break
          
        case 'transcript':
          addTranscriptEntry({
            id: `${Date.now()}`,
            timestamp: new Date(data.timestamp || Date.now()),
            speaker: data.speaker || 'agent',
            text: data.text || '',
          })
          break
          
        case 'customer':
          // Accept customer data from PostgreSQL via WebSocket
          traceLog('🔍 [TRACE] Customer data received from WebSocket - BEFORE any processing:', {
            rawCustomerData: data.customer,
            hasId: !!data.customer?.id,
            hasCustomerId: !!data.customer?.customerId,
            allFields: Object.keys(data.customer || {}),
            fullMessage: data,
            timestamp: new Date().toISOString()
          })
          
          // Map accountType to tier for compatibility
          if (data.customer && data.customer.accountType) {
            data.customer.tier = data.customer.accountType
          }
          
          // IMPORTANT: Backend might send customerId instead of id
          // Check if we need to map customerId to id for frontend compatibility  
          if (data.customer && !data.customer.id && data.customer.customerId) {
            traceLog('🔧 [TRACE] Mapping customerId to id for frontend compatibility:', {
              beforeMapping: { ...data.customer },
              customerId: data.customer.customerId
            })
            data.customer.id = data.customer.customerId
          }
          
          // BACKUP: If still no ID, generate one from the customer name
          // This should no longer be needed after fixing the Java service
          if (data.customer && !data.customer.id && data.customer.name) {
            const generatedId = `CUST-${data.customer.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now().toString().slice(-6)}`
            traceLog('⚠️ [TRACE] BACKUP: No customer ID from backend, generating one (Java service should be fixed!):', {
              customerName: data.customer.name,
              generatedId,
              beforeGeneration: { ...data.customer }
            })
            data.customer.id = generatedId
          }
          
          traceLog('📤 [TRACE] Final customer data AFTER processing, before updateCustomer:', {
            finalCustomerData: data.customer,
            hasId: !!data.customer?.id,
            hasCustomerId: !!data.customer?.customerId,
            willHaveContext: !!data.customer?.id
          })
          
          updateCustomer(data.customer)
          
          traceLog('🔔 [TRACE] Dispatching customer-context:updated event:', {
            customer: data.customer,
            hasContext: !!data.customer?.id,
            timestamp: new Date().toISOString()
          })
          
          // Notify embedded apps about customer context change
          window.dispatchEvent(new CustomEvent('customer-context:updated', {
            detail: {
              customer: data.customer,
              hasContext: !!data.customer?.id
            }
          }))
          break
          
          
        default:
      }
    } catch (error) {
      // Error parsing WebSocket message
    }
  }, [
    updateSentiment,
    updatePriority,
    updateIntent,
    updateActions,
    updateKnowledgeArticles,
    addTranscriptEntry,
    updateCustomer,
    updateAgentData,
  ])

  // Hook to get agent profiles from configuration
  const { data: agentProfiles } = useAgentProfiles()
  
  // Helper function to get agent data from configuration or fallback
  const getAgentProfile = useCallback((agentId: string) => {
    // Try to get from configuration data first
    const agent = agentProfiles?.agentProfiles?.[agentId] || agentProfiles?.defaultAgent
    
    if (agent) {
      return {
        agentName: agent.agentName,
        department: agent.department,
        agentId: agent.agentId
      }
    }
    
    // Fallback to default
    return {
      agentName: 'HSBC Agent',
      department: 'Customer Service',
      agentId: agentId.toUpperCase().replace('AGENT-', 'HSB-'),
    }
  }, [agentProfiles])

  const connect = useCallback((agentId: string, callerId: string, port = 8080) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    // Reset intentional disconnect flag when starting new connection
    intentionalDisconnectRef.current = false
    setConnectionStatus('connecting')
    
    // Use custom URL if provided, otherwise use configuration-based URL
    const wsUrl = customWsUrl || getWebSocketUrl({ 
      callerId,
      agentId,
      role: currentRole,  // Pass role for intent-to-app mapping
      port 
    })
    
    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      
      ws.onopen = () => {
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0 // Reset reconnect attempts on successful connection
        
        // Use authenticated user info if available, otherwise use config profile
        const agentProfile = user ? {
          agentName: user.name,
          department: user.department,
          agentId: user.id
        } : getAgentProfile(agentId)
        
        updateAgentData({
          ...agentProfile,
          callerId,
          status: 'active',
          callDuration: 0,
        })
        
        // Start call duration timer
        const callStartTime = Date.now()
        // PERFORMANCE: Changed from 1s to 5s updates, added document visibility check
        const durationInterval = setInterval(() => {
          // Skip update if tab is hidden
          if (document.hidden) return
          
          updateAgentData({
            callDuration: Math.floor((Date.now() - callStartTime) / 1000)
          })
        }, 5000) // Update every 5 seconds instead of 1
        
        // Store interval reference for cleanup
        ;(ws as any)._durationInterval = durationInterval
        
        // Start heartbeat
        heartbeatIntervalRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat' }))
          }
        }, config.websocket.heartbeatInterval)
        
        // Send initial heartbeat
        ws.send(JSON.stringify({ type: 'heartbeat' }))
        
        // Log connection success (no user notification needed)
      }
      
      ws.onmessage = handleMessage
      
      ws.onerror = (error) => {
        // WebSocket error
        setConnectionStatus('error')
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to WebSocket server',
          variant: 'destructive'
        })
      }
      
      ws.onclose = () => {
        setConnectionStatus('disconnected')
        
        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }
        
        // Clear call duration timer
        if ((ws as any)._durationInterval) {
          clearInterval((ws as any)._durationInterval)
        }
        
        // Only reconnect if this wasn't an intentional disconnect
        if (!intentionalDisconnectRef.current) {
          // Exponential backoff for reconnection
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++
            const delay = Math.min(
              config.websocket.reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1),
              maxReconnectDelay
            )
            
            
            reconnectTimeoutRef.current = window.setTimeout(() => {
              connect(agentId, callerId, port)
            }, delay)
          } else {
            // Max reconnection attempts reached
            setConnectionStatus('error')
          }
        } else {
        }
      }
    } catch (error) {
      // Failed to create WebSocket
      setConnectionStatus('error')
    }
  }, [setConnectionStatus, handleMessage, user, getAgentProfile, updateAgentData, toast, config, currentRole])

  const disconnect = useCallback(() => {
    
    // Set intentional disconnect flag to prevent reconnection
    intentionalDisconnectRef.current = true
    reconnectAttemptsRef.current = 0  // Reset reconnect attempts
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    // Clear heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    setConnectionStatus('disconnected')
  }, [setConnectionStatus])

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      // WebSocket not connected, cannot send message
    }
  }, [])
  
  const clearStore = useCallback((dataType: string) => {
    switch(dataType) {
      case 'sentiment':
        clearSentiment?.()
        break
      case 'priority':
        clearPriority?.()
        break
      case 'summary':
        // Summary is no longer used - skip clearing
        break
      case 'intent':
        clearIntent?.()
        break
      case 'actions':
        clearActions?.()
        break
      case 'knowledge':
      case 'knowledge_articles':
        clearKnowledgeArticles?.()
        break
      case 'messages':
      case 'transcript':
        clearTranscript?.()
        break
      case 'customer':
        clearCustomer?.()
        break
      default:
        // Unknown data type for clearing
    }
  }, [clearSentiment, clearPriority, clearIntent, clearActions, clearKnowledgeArticles, clearTranscript, clearCustomer])

  // Cleanup on unmount
  // Auto-connect if custom URL is provided (for multi-agent view)
  useEffect(() => {
    if (customWsUrl && !hasAutoConnected.current) {
      hasAutoConnected.current = true
      // Extract agentId and callerId from URL
      const url = new URL(customWsUrl.replace('ws://', 'http://'))
      const params = new URLSearchParams(url.search)
      const agentId = params.get('agentId') || 'agent-001'
      const callerId = params.get('callerId') || 'caller-001'
      
      // Auto-connect with extracted parameters
      connect(agentId, callerId)
    }
  }, [customWsUrl, connect])
  
  useEffect(() => {
    return () => {
      // Only disconnect when the component truly unmounts
      // Set intentional disconnect flag to prevent reconnection
      intentionalDisconnectRef.current = true
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
    }
  }, [])

  // Calculate hasCustomerContext with logging  
  const hasCustomerContext = !!(agentData?.customer?.id)
  traceLog('🧮 [TRACE] WebSocketContext hasCustomerContext calculation:', {
    hasCustomerContext,
    agentDataExists: !!agentData,
    customerExists: !!agentData?.customer,
    customerId: agentData?.customer?.id,
    customerName: agentData?.customer?.name,
    timestamp: new Date().toISOString()
  })

  const value: WebSocketContextValue = {
    connect,
    disconnect,
    sendMessage,
    isConnected,
    clearStore,
    hasCustomerContext
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}
