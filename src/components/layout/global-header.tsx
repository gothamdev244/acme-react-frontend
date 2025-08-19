import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { 
  Search, 
  Grid3x3, 
  Bell, 
  MessageSquare, 
  MoreVertical,
  Menu,
  LogOut,
  Settings,
  User,
  Loader2,
  Phone,
  Users,
  Headphones,
  Shield,
  TrendingUp
} from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'
import { useAppLogout } from '../../hooks/use-app-logout'
import { useNavigate } from 'react-router-dom'
import { GlobalSearchOverlay } from '../search/global-search-overlay'
import { SettingsPanel } from '../settings-panel'
import { useRoleConfig, type UserRole } from '../../contexts/role-context'
import { LayoutManagerOverlay } from './layout-manager-overlay'
import { useAgentStatusStore } from '../../stores/agent-status-store'
import { cn } from '../../lib/utils'
import { NotificationCenter } from '../notifications/notification-center'

interface GlobalHeaderProps {
  onMenuClick?: () => void
  onCopilotClick?: () => void
  isMobile?: boolean
  showCopilotButton?: boolean
  isKMSOpen?: boolean
  setIsKMSOpen?: (open: boolean) => void
}

export function GlobalHeader({ onMenuClick, onCopilotClick, isMobile, showCopilotButton = false, isKMSOpen = false, setIsKMSOpen }: GlobalHeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLayoutManagerOpen, setIsLayoutManagerOpen] = useState(false)
  
  const { user } = useAuth()
  const { logout } = useAppLogout()
  const navigate = useNavigate()
  const { currentRole, isLoading, updateRole, canAccessFeature } = useRoleConfig()
  const agentStatus = useAgentStatusStore(state => state.status)
  const afterCallWorkSecondsRemaining = useAgentStatusStore(state => state.afterCallWorkSecondsRemaining)
  const doNotDisturbSecondsRemaining = useAgentStatusStore(state => state.doNotDisturbSecondsRemaining)
  
  // Generate initials from user name
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) // Only take first 2 initials
  }
  
  // Keyboard shortcut for layout manager
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault()
        setIsLayoutManagerOpen(prev => !prev)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  const handleLogout = () => {
    logout()
  }
  
  return (
    <>
      <header className="sticky top-0 z-50 h-14 border-b bg-background">
        <div className="flex h-full items-center px-4">
          {/* Left: Logo + Environment + Role */}
          <div className="flex items-center gap-2">
            {isMobile && onMenuClick && (
              <Button variant="ghost" size="icon" onClick={onMenuClick} className="md:hidden icon-button-red-hover">
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <img 
              src="/hsbc-logo.png" 
              alt="HSBC" 
              className="h-8 w-auto"
            />
            {/* Role Badge */}
            <Badge 
              variant={currentRole === 'manager' ? 'default' : 'outline'} 
              className={cn(
                "text-xs flex items-center gap-1 hidden sm:flex",
                currentRole === 'agent' && "border-blue-500 text-blue-700 bg-blue-50",
                currentRole === 'chat_agent' && "border-green-500 text-green-700 bg-green-50",
                currentRole === 'supervisor' && "bg-orange-600 text-white border-orange-600",
                currentRole === 'manager' && "bg-purple-600 text-white border-purple-600"
              )}
            >
              {currentRole === 'agent' && <Headphones className="h-3 w-3" />}
              {currentRole === 'chat_agent' && <MessageSquare className="h-3 w-3" />}
              {currentRole === 'supervisor' && <Shield className="h-3 w-3" />}
              {currentRole === 'manager' && <TrendingUp className="h-3 w-3" />}
              {currentRole === 'agent' ? 'Voice Agent' : 
               currentRole === 'chat_agent' ? 'Chat Agent' : 
               currentRole === 'supervisor' ? 'Supervisor' :
               'Manager'}
            </Badge>
          </div>
          
          {/* Center: Search (hidden on mobile) */}
          <div className="flex-1 max-w-xl mx-auto px-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search customers, tools, knowledge..." 
                className="pl-9 h-9 w-full"
                onFocus={() => setIsSearchOpen(true)}
              />
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Search on mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden icon-button-red-hover"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
            
            {/* Layout Manager */}
            {!isMobile && setIsKMSOpen && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 hidden lg:flex icon-button-red-hover"
                onClick={() => setIsLayoutManagerOpen(true)}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
            )}
            
            {/* User Avatar with Role Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 icon-button-red-hover">
                  <Avatar className="h-8 w-8 border border-gray-300">
                    <AvatarImage src={(user as any)?.avatar} />
                    <AvatarFallback className="text-xs bg-white text-foreground">
                      {user?.name ? getUserInitials(user.name) : 'AG'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'John Smith'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'john.smith@hsbc.com'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        agentStatus === 'available' && "bg-green-500",
                        agentStatus === 'on-call' && "bg-blue-500",
                        agentStatus === 'break' && "bg-yellow-500",
                        agentStatus === 'offline' && "bg-gray-500",
                        agentStatus === 'after-call-work' && "bg-purple-500",
                        agentStatus === 'do-not-disturb' && "bg-orange-500"
                      )} />
                      <div className="flex flex-col">
                        <span className="text-xs font-medium">
                          {agentStatus === 'available' ? 'Online' : 
                           agentStatus === 'on-call' ? 'On Call' :
                           agentStatus === 'break' ? 'On Break' :
                           agentStatus === 'offline' ? 'Offline' :
                           agentStatus === 'after-call-work' ? 'After Call Work' :
                           agentStatus === 'do-not-disturb' ? 'Do Not Disturb' : 'Unknown'}
                        </span>
                        {agentStatus === 'after-call-work' && afterCallWorkSecondsRemaining > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {afterCallWorkSecondsRemaining}s remaining
                          </span>
                        )}
                        {agentStatus === 'do-not-disturb' && doNotDisturbSecondsRemaining > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {Math.floor(doNotDisturbSecondsRemaining / 60)}:{(doNotDisturbSecondsRemaining % 60).toString().padStart(2, '0')} remaining
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Role {isLoading && <Loader2 className="h-3 w-3 animate-spin inline ml-1" />}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup 
                  value={currentRole} 
                  onValueChange={(value) => updateRole(value as UserRole)}
                >
                  <DropdownMenuRadioItem value="agent" className="flex items-center gap-2">
                    <Headphones className="h-4 w-4" />
                    Voice Agent
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="chat_agent" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat Agent
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="supervisor" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Supervisor
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="manager" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Manager
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                
                <DropdownMenuSeparator />
                
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Space Copilot (only in overlay mode) */}
            {showCopilotButton && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 icon-button-red-hover"
                onClick={onCopilotClick}
                title="Open Space Copilot"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            )}
            
            {/* Notifications */}
            <NotificationCenter />
            
            {/* More Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 icon-button-red-hover">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canAccessFeature('settingsAccess') && (
                  <DropdownMenuItem onSelect={() => {
                    setIsSettingsOpen(true)
                  }}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onSelect={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      {/* Global Search Overlay */}
      <GlobalSearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
      
      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
      
      {/* Layout Manager Overlay */}
      {setIsKMSOpen && (
        <LayoutManagerOverlay 
          open={isLayoutManagerOpen} 
          onOpenChange={setIsLayoutManagerOpen}
          isKMSOpen={isKMSOpen}
          setIsKMSOpen={setIsKMSOpen}
        />
      )}
    </>
  )
}
