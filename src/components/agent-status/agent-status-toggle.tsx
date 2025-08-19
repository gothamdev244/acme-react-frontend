import { useState, useEffect } from 'react'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'
import { Badge } from '../ui/badge'
import { 
  PhoneCall, 
  Coffee, 
  Power, 
  Clock,
  Phone,
  Activity
} from 'lucide-react'
import { useAgentStatus } from '../../hooks/use-agent-status'
import { AgentStatus } from '../../stores/agent-status-store'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'

interface AgentStatusToggleProps {
  onAutoCall?: () => void
  compact?: boolean
}

export function AgentStatusToggle({ onAutoCall, compact = false }: AgentStatusToggleProps) {
  const {
    status,
    statusSince,
    callsHandledToday,
    averageHandleTime,
    callsInQueue,
    setStatus,
    formatTime
  } = useAgentStatus({
    onAutoCall,
    onStatusChange: () => {
      // Agent status changed
    }
  })
  
  const [timeInStatus, setTimeInStatus] = useState('0:00')
  
  // Update time in current status
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      const diff = Math.floor((now.getTime() - new Date(statusSince).getTime()) / 1000)
      setTimeInStatus(formatTime(diff))
    }
    
    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    
    return () => clearInterval(interval)
  }, [statusSince, formatTime])
  
  // Get status details for display
  const getStatusDetails = (s: AgentStatus) => {
    switch (s) {
      case 'available':
        return {
          icon: <PhoneCall className="h-4 w-4" />,
          label: 'Available',
          description: 'Ready to receive calls',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800'
        }
      case 'on-call':
        return {
          icon: <Phone className="h-4 w-4 animate-pulse" />,
          label: 'On Call',
          description: 'Currently on a call',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800'
        }
      case 'break':
        return {
          icon: <Coffee className="h-4 w-4" />,
          label: 'On Break',
          description: 'Temporarily unavailable',
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800'
        }
      case 'offline':
        return {
          icon: <Power className="h-4 w-4" />,
          label: 'Offline',
          description: 'Not accepting calls',
          color: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800'
        }
      case 'after-call-work':
        return {
          icon: <Coffee className="h-4 w-4" />,
          label: 'After Call Work',
          description: 'Completing call documentation',
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          borderColor: 'border-purple-200 dark:border-purple-800'
        }
      case 'do-not-disturb':
        return {
          icon: <Power className="h-4 w-4" />,
          label: 'Do Not Disturb',
          description: 'Temporarily blocking all calls',
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800'
        }
      default:
        return {
          icon: <Power className="h-4 w-4" />,
          label: 'Unknown',
          description: 'Status unknown',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-900/20',
          borderColor: 'border-gray-200 dark:border-gray-800'
        }
    }
  }
  
  const currentStatus = getStatusDetails(status || 'offline')  // Fallback to offline if undefined
  
  if (compact) {
    // Compact version for header
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={`gap-2 ${currentStatus.borderColor} ${currentStatus.bgColor} ${currentStatus.color} hover:${currentStatus.bgColor} hover:${currentStatus.color}`}
          >
            <div className={`flex items-center gap-3 ${currentStatus.color}`}>
              {currentStatus.icon}
              <span className="font-medium">{currentStatus.label}</span>
            </div>
            {status === 'available' && callsInQueue > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {callsInQueue}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <AgentStatusPanel
            status={status}
            setStatus={setStatus}
            callsHandledToday={callsHandledToday}
            averageHandleTime={averageHandleTime}
            callsInQueue={callsInQueue}
            timeInStatus={timeInStatus}
            formatTime={formatTime}
          />
        </PopoverContent>
      </Popover>
    )
  }
  
  // Full version
  return (
    <div className="flex items-center gap-4">
        <ToggleGroup 
          type="single" 
        value={status}
        onValueChange={(value) => value && setStatus(value as AgentStatus)}
        className="border rounded-lg p-1 bg-muted/50"
      >
        <ToggleGroupItem 
          value="available" 
          aria-label="Set available"
          className="data-[state=on]:bg-green-500 data-[state=on]:!text-white data-[state=on]:hover:bg-green-600 data-[state=on]:hover:!text-white hover:bg-green-50 hover:text-green-700 font-medium"
        >
          <PhoneCall className="h-4 w-4 mr-2" />
          Available
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="break" 
          aria-label="On break"
          className="data-[state=on]:bg-yellow-500 data-[state=on]:!text-white data-[state=on]:hover:bg-yellow-600 data-[state=on]:hover:!text-white hover:bg-yellow-50 hover:text-yellow-700 font-medium"
        >
          <Coffee className="h-4 w-4 mr-2" />
          Break
        </ToggleGroupItem>
        <ToggleGroupItem 
          value="offline" 
          aria-label="Go offline"
          className="data-[state=on]:bg-red-500 data-[state=on]:!text-white data-[state=on]:hover:bg-red-600 data-[state=on]:hover:!text-white hover:bg-red-50 hover:text-red-700 font-medium"
        >
          <Power className="h-4 w-4 mr-2" />
          Offline
        </ToggleGroupItem>
      </ToggleGroup>
      
      {/* Status metrics */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {status === 'available' && callsInQueue > 0 && (
          <Badge variant="outline" className="gap-1">
            <Phone className="h-3 w-3" />
            {callsInQueue} waiting
          </Badge>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeInStatus}
        </span>
        <span className="flex items-center gap-1">
          <Activity className="h-3 w-3" />
          {callsHandledToday} calls today
        </span>
      </div>
    </div>
  )
}

// Status panel component for popover
function AgentStatusPanel({
  status,
  setStatus,
  callsHandledToday,
  averageHandleTime,
  callsInQueue,
  timeInStatus,
  formatTime
}: {
  status: AgentStatus
  setStatus: (status: AgentStatus) => void
  callsHandledToday: number
  averageHandleTime: number
  callsInQueue: number
  timeInStatus: string
  formatTime: (seconds: number) => string
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-sm mb-3">Agent Status</h3>
        <ToggleGroup 
          type="single" 
          value={status}
          onValueChange={(value) => value && setStatus(value as AgentStatus)}
          className="grid grid-cols-3 gap-2"
        >
          <ToggleGroupItem 
            value="available" 
            className="flex-col gap-1 h-auto py-3 data-[state=on]:bg-green-500 data-[state=on]:text-white"
          >
            <PhoneCall className="h-5 w-5" />
            <span className="text-xs font-medium">Available</span>
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="break" 
            className="flex-col gap-1 h-auto py-3 data-[state=on]:bg-yellow-500 data-[state=on]:text-white"
          >
            <Coffee className="h-5 w-5" />
            <span className="text-xs font-medium">Break</span>
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="offline" 
            className="flex-col gap-1 h-auto py-3 data-[state=on]:bg-red-500 data-[state=on]:text-white"
          >
            <Power className="h-5 w-5" />
            <span className="text-xs font-medium">Offline</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      <Separator />
      
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Today's Statistics</h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Calls Handled</p>
            <p className="text-xl font-semibold">{callsHandledToday}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Avg Handle Time</p>
            <p className="text-xl font-semibold">{formatTime(averageHandleTime)}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Time in Status</p>
            <p className="text-xl font-semibold">{timeInStatus}</p>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Queue Size</p>
            <p className="text-xl font-semibold">{callsInQueue}</p>
          </div>
        </div>
      </div>
      
      {status === 'available' && callsInQueue > 0 && (
        <>
          <Separator />
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-muted-foreground">Next call incoming...</span>
          </div>
        </>
      )}
      
      {status === 'break' && (
        <>
          <Separator />
          <div className="flex items-center gap-2 text-sm">
            <Coffee className="h-4 w-4 text-yellow-600" />
            <span className="text-muted-foreground">No calls will be routed</span>
          </div>
        </>
      )}
      
      {status === 'offline' && (
        <>
          <Separator />
          <div className="flex items-center gap-2 text-sm">
            <Power className="h-4 w-4 text-red-600" />
            <span className="text-muted-foreground">Sign in when ready</span>
          </div>
        </>
      )}
    </div>
  )
}
