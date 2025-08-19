import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface User {
  id: string
  name: string
  email: string
  role: 'agent' | 'chat_agent' | 'supervisor' | 'admin' | 'manager'
  department: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for demo
const MOCK_USERS = [
  {
    email: 'agent@hsbc.com',
    password: 'demo123',
    user: {
      id: 'agent-001',
      name: 'Sarah Thompson',
      email: 'agent@hsbc.com',
      role: 'agent' as const,
      department: 'Premier Banking'
    }
  },
  {
    email: 'chat@hsbc.com',
    password: 'demo123',
    user: {
      id: 'chat-001',
      name: 'Emma Rodriguez',
      email: 'chat@hsbc.com',
      role: 'chat_agent' as const,
      department: 'Digital Support'
    }
  },
  {
    email: 'supervisor@hsbc.com',
    password: 'demo123',
    user: {
      id: 'sup-001',
      name: 'Michael Chen',
      email: 'supervisor@hsbc.com',
      role: 'supervisor' as const,
      department: 'Call Center Operations'
    }
  },
  {
    email: 'manager@hsbc.com',
    password: 'demo123',
    user: {
      id: 'mgr-001',
      name: 'David Williams',
      email: 'manager@hsbc.com',
      role: 'manager' as const,
      department: 'Customer Experience'
    }
  },
  {
    email: 'admin@hsbc.com',
    password: 'admin123',
    user: {
      id: 'admin-001',
      name: 'Victoria Sterling',
      email: 'admin@hsbc.com',
      role: 'admin' as const,
      department: 'IT Administration'
    }
  }
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('hsbc-user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        // Failed to parse stored user
        localStorage.removeItem('hsbc-user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800))

    // Find matching user
    const mockUser = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )

    if (mockUser) {
      setUser(mockUser.user)
      localStorage.setItem('hsbc-user', JSON.stringify(mockUser.user))
      
      // Clear notifications on fresh login
      localStorage.removeItem('ccaas-notifications')
      
      // Navigate to dashboard
      navigate('/dashboard')
      
      return true
    }

    return false
  }

  const logout = () => {
    setUser(null)
    
    // Clear all localStorage data
    localStorage.removeItem('hsbc-user')
    localStorage.removeItem('ccaas-ui-role') // Clear role selection
    localStorage.removeItem('ccaas-agent-settings') // Clear agent settings
    localStorage.removeItem('ccaas-column-layout') // Clear column layout
    localStorage.removeItem('ccaas-notification-preferences') // Clear notification settings
    localStorage.removeItem('agent-status-storage') // Clear call state persistence
    
    // Clear any other localStorage keys that might contain user data
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('ccaas-') || key.startsWith('hsbc-')) {
        localStorage.removeItem(key)
      }
    })
    
    navigate('/login')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
