import { useEffect, useRef, useState } from 'react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import './notification-center.css'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { 
  Bell, 
  BookOpen, 
  Bot, 
  AlertCircle, 
  CheckCircle,
  Info,
  X,
  CheckCheck,
  Trash2,
  ExternalLink,
  Sparkles
} from 'lucide-react'
import { useNotificationStore, type NotificationType } from '../../stores/notification-store'
import { cn } from '../../lib/utils'
import { formatDistanceToNow } from 'date-fns'

export function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    isOpen,
    markAsRead, 
    markAllAsRead, 
    dismissNotification,
    clearAll,
    toggleOpen,
    setOpen
  } = useNotificationStore()
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [shouldShake, setShouldShake] = useState(false)
  const previousCountRef = useRef(unreadCount)
  
  // Trigger bell shake animation when new notifications arrive
  useEffect(() => {
    if (unreadCount > previousCountRef.current && !isOpen) {
      setShouldShake(true)
      setTimeout(() => setShouldShake(false), 500)
    }
    previousCountRef.current = unreadCount
  }, [unreadCount, isOpen])
  
  // Auto-mark as read when viewing
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        // Mark visible unread notifications as read after 2 seconds
        notifications
          .filter(n => !n.read)
          .slice(0, 5)
          .forEach(n => markAsRead(n.id))
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, notifications, markAsRead])
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'knowledge':
        return <BookOpen className="h-4 w-4" />
      case 'ai_coaching':
        return <Bot className="h-4 w-4" />
      case 'alert':
        return <AlertCircle className="h-4 w-4" />
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }
  
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'knowledge':
        return 'text-blue-600 bg-blue-50/60 dark:bg-blue-900/10'
      case 'ai_coaching':
        return 'text-purple-600 bg-purple-50/60 dark:bg-purple-900/10'
      case 'alert':
        return 'text-red-600 bg-red-50/60 dark:bg-red-900/10'
      case 'success':
        return 'text-green-600 bg-green-50/60 dark:bg-green-900/10'
      default:
        return 'text-gray-600 bg-gray-50/60 dark:bg-gray-900/10'
    }
  }
  
  const groupedNotifications = notifications.reduce((acc, notif) => {
    if (!acc[notif.type]) {
      acc[notif.type] = []
    }
    acc[notif.type].push(notif)
    return acc
  }, {} as Record<NotificationType, typeof notifications>)
  
  const typeLabels: Record<NotificationType, string> = {
    knowledge: 'Knowledge Articles',
    ai_coaching: 'AI Coaching',
    alert: 'Alerts',
    success: 'Success',
    system: 'System'
  }
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 relative icon-button-red-hover"
          onClick={() => toggleOpen()}
        >
          <Bell className={cn(
            "h-4 w-4 transition-all",
            shouldShake && "bell-shake",
            unreadCount > 0 && "text-blue-600 dark:text-blue-400"
          )} />
          {unreadCount > 0 && (
            <span className={cn(
              "absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center animate-in zoom-in-50 duration-200",
              shouldShake && "notification-badge-pulse"
            )}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-[420px] p-0"
        ref={dropdownRef}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  markAllAsRead()
                }}
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  clearAll()
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
        
        {/* Notifications List */}
        <ScrollArea className="h-[400px] notification-scroll">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs opacity-60">You're all caught up!</p>
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedNotifications).map(([type, items]) => (
                <div key={type} className="mb-2">
                  <div className="px-4 py-1.5">
                    <p className="text-xs font-medium text-muted-foreground">
                      {typeLabels[type as NotificationType]}
                    </p>
                  </div>
                  {items.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "relative group px-4 py-3 notification-item-hover cursor-pointer",
                        !notification.read && "bg-accent/20 border-l-2 border-blue-400",
                        index < items.length - 1 && "border-b border-border/50"
                      )}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id)
                        }
                        if (notification.actionCallback) {
                          notification.actionCallback()
                          setOpen(false)
                        }
                      }}
                    >
                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                      )}
                      
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "rounded-lg p-1.5 mt-0.5",
                          getNotificationColor(notification.type)
                        )}>
                          {notification.icon === 'sparkles' ? (
                            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                          ) : (
                            getNotificationIcon(notification.type)
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={cn(
                                "text-sm notification-title transition-colors",
                                !notification.read && "font-medium"
                              )}>
                                {notification.title}
                              </p>
                              {notification.description && (
                                <p className="text-xs text-muted-foreground notification-description mt-0.5 line-clamp-2 transition-colors">
                                  {notification.description}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground notification-timestamp mt-1 transition-colors">
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                              </p>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {notification.actionLabel && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (notification.actionCallback) {
                                      notification.actionCallback()
                                      setOpen(false)
                                    }
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  dismissNotification(notification.id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="px-4 py-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  // Could open a full notifications page
                  setOpen(false)
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
