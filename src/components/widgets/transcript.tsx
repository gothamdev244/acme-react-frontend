import { ScrollArea } from '../ui/scroll-area'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { User, Headphones, MessageSquare, MessagesSquare, Activity, Circle } from 'lucide-react'
import { useTranscript, useCustomerName, useAgentName } from '../../stores/selectors/agent-selectors'
import { useAgentSettings } from '../../hooks/use-agent-settings'
import { useEffect, useRef, memo } from 'react'
import { cn } from '../../lib/utils'

export const TranscriptWidget = memo(function TranscriptWidget() {
  const transcript = useTranscript()
  const customerName = useCustomerName()
  const agentName = useAgentName()
  const { settings: agentSettings } = useAgentSettings()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const scrollContentRef = useRef<HTMLDivElement>(null)
  const prevTranscriptLength = useRef(transcript.length)
  
  // Handle scroll behavior
  useEffect(() => {
    // If transcript was cleared (call ended), scroll to top
    if (transcript.length === 0 && prevTranscriptLength.current > 0) {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
        if (scrollContainer) {
          scrollContainer.scrollTop = 0
        }
      }
    }
    // If new messages arrived, scroll to bottom
    else if (transcript.length > prevTranscriptLength.current) {
      if (scrollContentRef.current) {
        scrollContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      }
    }
    
    prevTranscriptLength.current = transcript.length
  }, [transcript.length])
  
  const formatTime = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
  }


  return (
    <div className="flex flex-col h-full min-w-0 transcript-widget">
      {/* Professional Header */}
      <div className="border-b pb-4 mb-4 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessagesSquare className="h-4 w-4 text-gray-600" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Live Transcript</h3>
              <p className="text-xs text-muted-foreground">Real-time conversation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-2 w-2 bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-600">Active</span>
            <span className="text-xs text-muted-foreground font-medium">•</span>
            <span className="text-xs font-medium text-gray-600">{transcript.length} messages</span>
          </div>
        </div>
      </div>
      
      <ScrollArea className="flex-1 min-w-0" ref={scrollAreaRef}>
        <div className="space-y-3 min-w-0 px-4">
          {transcript.length > 0 ? transcript.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "flex w-full",
                entry.speaker === 'agent' ? 'justify-end' : 'justify-start'
              )}
            >
              <div className={cn(
                "max-w-[75%] space-y-1",
                entry.speaker === 'agent' ? 'items-end' : 'items-start'
              )}>
                <div className={cn(
                  "flex items-baseline gap-2 text-xs",
                  entry.speaker === 'agent' ? 'justify-end' : 'justify-start'
                )}>
                  <span className={cn(
                    "font-medium",
                    entry.speaker === 'agent' ? 'text-red-700' : 'text-gray-700'
                  )}>
                    {entry.speaker === 'agent' ? agentName : customerName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {entry.speaker === 'agent' ? 'Agent' : 'Customer'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • {formatTime(entry.timestamp)}
                  </span>
                </div>
                <div className={cn(
                  "p-3 rounded-lg break-words whitespace-normal shadow-sm",
                  entry.speaker === 'agent' 
                    ? 'bg-red-50 border border-red-100 rounded-br-sm' 
                    : 'bg-gray-50 border border-gray-200 rounded-bl-sm'
                )}>
                  <p className="text-sm text-gray-900 break-words whitespace-normal">{entry.text}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="flex items-start justify-center min-h-[200px] pt-8">
              <div className="text-center space-y-3 max-w-[260px]">
                <div className="relative inline-flex">
                  <div className="absolute inset-0 bg-gray-100 rounded-full blur-xl opacity-70" />
                  <MessageSquare className="h-10 w-10 text-gray-400 relative" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">No Active Conversation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transcript will appear here when call begins
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Auto-scroll anchor */}
          <div ref={scrollContentRef} />
        </div>
      </ScrollArea>
    </div>
  )
})
