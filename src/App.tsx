import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ColumnLayout } from './components/layout/column-layout'
import { LoginPage } from './pages/login'
import { ProtectedRoute } from './components/auth/protected-route'
import { AuthProvider } from './contexts/auth-context'
import { WebSocketProvider } from './contexts/websocket-context'
import { ToastProvider } from './hooks/use-toast'
import { RoleProvider, useRoleConfig } from './contexts/role-context'
import { Toaster } from 'sonner'
import { useEffect } from 'react'

function Dashboard() {
  const { currentRole } = useRoleConfig()
  
  useEffect(() => {
  }, [currentRole])
  
  return <ColumnLayout key={`layout-${currentRole}`} />
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <RoleProvider>
          <AuthProvider>
            <WebSocketProvider>
              <Routes>
                {/* Login Route */}
                <Route path="/login" element={<LoginPage />} />
                
                {/* Dashboard Route */}
                <Route path="/dashboard" element={
                  <ProtectedRoute requireAuth={true}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                
                {/* Default Route - Redirect to login */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                
                {/* Catch all - redirect to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
              <Toaster 
                position="top-right" 
                richColors 
                duration={3000}
                closeButton
              />
            </WebSocketProvider>
          </AuthProvider>
        </RoleProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
