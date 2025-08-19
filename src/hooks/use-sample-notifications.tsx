import { useEffect } from 'react'
import { useNotificationStore } from '../stores/notification-store'

// ✅ EXTERNALIZED: Sample notifications moved to /public/config/sample-notifications.json

async function loadSampleNotifications() {
  try {
    const response = await fetch('/config/sample-notifications.json')
    if (!response.ok) {
      throw new Error(`Failed to load sample notifications: ${response.status}`)
    }
    const data = await response.json()
    return data.notifications
  } catch (error) {
    // Failed to load sample notifications, using fallback
    return [
      {
        delay: 2000,
        type: 'system',
        title: 'System Ready',
        description: 'Application loaded successfully',
        icon: 'info'
      }
    ]
  }
}

export function useSampleNotifications() {
  const { addNotification } = useNotificationStore()
  
  useEffect(() => {
    // Load and schedule notifications from config
    loadSampleNotifications().then(notifications => {
      const timers: NodeJS.Timeout[] = []
      
      notifications.forEach((notification: any) => {
        const timer = setTimeout(() => {
          addNotification({
            type: notification.type,
            title: notification.title,
            description: notification.description,
            icon: notification.icon,
            actionLabel: notification.actionLabel
          })
        }, notification.delay)
        
        timers.push(timer)
      })
      
      return () => {
        timers.forEach(timer => clearTimeout(timer))
      }
    })
  }, [addNotification])
}
