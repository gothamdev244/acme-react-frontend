import { useEffect, useRef, useState } from 'react'

interface IframeHealthMonitorOptions {
  iframeRef: React.RefObject<HTMLIFrameElement>
  checkInterval?: number // milliseconds
  timeout?: number // milliseconds
  onCrash?: () => void
  onRecover?: () => void
}

export function useIframeHealthMonitor({
  iframeRef,
  checkInterval = 5000, // Check every 5 seconds
  timeout = 10000, // Consider crashed after 10 seconds
  onCrash,
  onRecover
}: IframeHealthMonitorOptions) {
  const [isHealthy, setIsHealthy] = useState(true)
  const [lastPingTime, setLastPingTime] = useState<Date | null>(null)
  const lastResponseRef = useRef<Date>(new Date())
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const crashTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Listen for health responses from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'health.pong') {
        const now = new Date()
        lastResponseRef.current = now
        
        if (!isHealthy) {
          // Iframe recovered
          setIsHealthy(true)
          onRecover?.()
        }
        
        // Clear crash timeout
        if (crashTimeoutRef.current) {
          clearTimeout(crashTimeoutRef.current)
        }
      }
    }
    
    window.addEventListener('message', handleMessage)
    
    // Start health check interval
    healthCheckIntervalRef.current = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        const pingTime = new Date()
        setLastPingTime(pingTime)
        
        try {
          iframeRef.current.contentWindow.postMessage({ type: 'health.ping' }, '*')
          
          // Set timeout for response
          crashTimeoutRef.current = setTimeout(() => {
            const timeSinceLastResponse = new Date().getTime() - lastResponseRef.current.getTime()
            
            if (timeSinceLastResponse > timeout && isHealthy) {
              // Iframe not responding
              setIsHealthy(false)
              onCrash?.()
            }
          }, timeout)
        } catch (error) {
          // Error sending ping
          if (isHealthy) {
            setIsHealthy(false)
            onCrash?.()
          }
        }
      }
    }, checkInterval)
    
    return () => {
      window.removeEventListener('message', handleMessage)
      
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current)
      }
      
      if (crashTimeoutRef.current) {
        clearTimeout(crashTimeoutRef.current)
      }
    }
  }, [iframeRef, checkInterval, timeout, isHealthy, onCrash, onRecover, lastPingTime])
  
  return {
    isHealthy,
    lastResponseTime: lastResponseRef.current,
    lastPingTime
  }
}
