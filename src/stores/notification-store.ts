import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NotificationType = 'knowledge' | 'ai_coaching' | 'system' | 'alert' | 'success'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  timestamp: Date
  read: boolean
  icon?: string
  metadata?: any
  actionLabel?: string
  actionCallback?: () => void
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  dismissNotification: (id: string) => void
  clearAll: () => void
  toggleOpen: () => void
  setOpen: (open: boolean) => void
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isOpen: false,
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false
        }
        
        set((state) => {
          const updatedNotifications = [newNotification, ...state.notifications]
          // Keep only last 50 notifications
          const trimmedNotifications = updatedNotifications.slice(0, 50)
          
          return {
            notifications: trimmedNotifications,
            unreadCount: trimmedNotifications.filter(n => !n.read).length
          }
        })
      },
      
      markAsRead: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
          
          return {
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter(n => !n.read).length
          }
        })
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0
        }))
      },
      
      dismissNotification: (id) => {
        set((state) => {
          const updatedNotifications = state.notifications.filter(n => n.id !== id)
          
          return {
            notifications: updatedNotifications,
            unreadCount: updatedNotifications.filter(n => !n.read).length
          }
        })
      },
      
      clearAll: () => {
        set({ notifications: [], unreadCount: 0 })
      },
      
      toggleOpen: () => {
        set((state) => ({ isOpen: !state.isOpen }))
      },
      
      setOpen: (open) => {
        set({ isOpen: open })
      }
    }),
    {
      name: 'ccaas-notifications',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 20), // Only persist last 20
        unreadCount: state.unreadCount
      })
    }
  )
)
