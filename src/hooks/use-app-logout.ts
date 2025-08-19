import { useAuth } from '../contexts/auth-context'
import { useRoleConfig } from '../contexts/role-context'
import { useAgentStore } from '../stores/agent-store'
import { useIntentStore } from '../stores/intent-store'
import { useWebSocket } from '../contexts/websocket-context'
import { useAgentStatusStore } from '../stores/agent-status-store'

/**
 * Custom hook that provides a comprehensive logout function
 * that clears all application state including auth, role, stores, etc.
 */
export function useAppLogout() {
  const { logout } = useAuth()
  const { resetRole } = useRoleConfig()
  const { clearAgentData } = useAgentStore()
  const { clearIntents } = useIntentStore()
  const { disconnect, isConnected } = useWebSocket()
  const { endCall, setStatus } = useAgentStatusStore()

  const performLogout = () => {
    // End any active call
    endCall()
    
    // Set agent status to offline
    setStatus('offline')
    
    // Disconnect WebSocket if connected
    if (isConnected) {
      disconnect()
    }
    
    // Reset role to default
    resetRole()
    
    // Clear agent store data
    if (clearAgentData) {
      clearAgentData()
    }
    
    // Clear intent store data  
    if (clearIntents) {
      clearIntents()
    }
    
    // Clear auth (this also clears localStorage and navigates)
    logout()
  }

  return { logout: performLogout }
}
