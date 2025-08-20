import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  MessageSquare,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Building2,
  Home,
  Monitor,
  HelpCircle
} from 'lucide-react'
import { Customer, QueueMetrics } from '../../types/chat-types'
import { 
  generateInitialCustomerQueue, 
  generateMockCustomer,
  getCustomerAvatarInitials,
  getPriorityColor,
  getPriorityIcon,
  getCategoryIcon
} from '../../utils/mock-customers'
import { cn } from '../../lib/utils'

interface CustomerQueueProps {
  onSelectCustomer: (customer: Customer) => void
  className?: string
}

export function CustomerQueue({ onSelectCustomer, className }: CustomerQueueProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [metrics, setMetrics] = useState<QueueMetrics>({
    totalWaiting: 0,
    averageWaitTime: 0,
    highPriorityCount: 0,
    mediumPriorityCount: 0,
    lowPriorityCount: 0,
    longestWaitTime: 0
  })

  // Initialize queue on mount
  useEffect(() => {
    const initialQueue = generateInitialCustomerQueue(8)
    setCustomers(initialQueue)
  }, [])

  // Add new customers periodically - OPTIMIZED: Combined timers and added visibility check
  useEffect(() => {
    // Combine both timers into one for efficiency
    let counter = 0
    
    const interval = setInterval(() => {
      // Skip updates if tab is not visible
      if (document.hidden) return
      
      counter++
      
      // Update wait times every 10 seconds (was 60 seconds)
      // This provides smoother updates while reducing from 60 updates/hour to 6
      if (counter % 1 === 0) {
        setCustomers(prev => 
          prev.map(customer => ({
            ...customer,
            waitTime: customer.waitTime + 0.167 // 10 seconds = 0.167 minutes
          }))
        )
      }
      
      // Add new customers every 30 seconds (every 3rd iteration)
      if (counter % 3 === 0) {
        // 30% chance to add a new customer
        if (Math.random() < 0.3 && customers.length < 12) {
          const newCustomer = generateMockCustomer()
          setCustomers(prev => {
            const updated = [...prev, newCustomer]
            // Sort by priority and wait time
            return updated.sort((a, b) => {
              const priorityOrder = { high: 3, medium: 2, low: 1 }
              if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority]
              }
              return b.waitTime - a.waitTime
            })
          })
        }
      }
      
      // Reset counter to prevent overflow
      if (counter >= 6) counter = 0
    }, 10000) // Single timer running every 10 seconds

    return () => clearInterval(interval)
  }, [customers.length])

  // Calculate metrics whenever customers change
  useEffect(() => {
    const totalWaiting = customers.filter(c => c.status === 'waiting').length
    const waitingCustomers = customers.filter(c => c.status === 'waiting')
    const averageWaitTime = waitingCustomers.length > 0 
      ? Math.round(waitingCustomers.reduce((sum, c) => sum + c.waitTime, 0) / waitingCustomers.length)
      : 0
    const highPriorityCount = customers.filter(c => c.priority === 'high' && c.status === 'waiting').length
    const mediumPriorityCount = customers.filter(c => c.priority === 'medium' && c.status === 'waiting').length
    const lowPriorityCount = customers.filter(c => c.priority === 'low' && c.status === 'waiting').length
    const longestWaitTime = waitingCustomers.length > 0 
      ? Math.max(...waitingCustomers.map(c => c.waitTime))
      : 0

    setMetrics({
      totalWaiting,
      averageWaitTime,
      highPriorityCount,
      mediumPriorityCount,
      lowPriorityCount,
      longestWaitTime
    })
  }, [customers])

  const handleSelectCustomer = (customer: Customer) => {
    // Mark customer as in progress
    setCustomers(prev =>
      prev.map(c =>
        c.id === customer.id
          ? { ...c, status: 'in_progress' as const, assignedAgentId: 'current-agent' }
          : c
      )
    )
    
    onSelectCustomer(customer)
  }

  const formatWaitTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }

  const waitingCustomers = customers.filter(c => c.status === 'waiting')

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      {/* Queue Header */}
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Customer Queue</CardTitle>
          </div>
          <Badge variant="secondary" className="text-sm">
            {metrics.totalWaiting} waiting
          </Badge>
        </div>
      </CardHeader>

      {/* Queue Metrics */}
      <div className="px-4 py-3 border-b bg-muted/30">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">{formatWaitTime(metrics.averageWaitTime)}</div>
            <div className="text-xs text-muted-foreground">Avg Wait</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{metrics.highPriorityCount}</div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">{metrics.mediumPriorityCount}</div>
            <div className="text-xs text-muted-foreground">Medium Priority</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{metrics.lowPriorityCount}</div>
            <div className="text-xs text-muted-foreground">Low Priority</div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          {waitingCustomers.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No customers waiting
              </h3>
              <p className="text-sm text-muted-foreground">
                New customers will appear here when they need assistance
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {waitingCustomers.map((customer) => (
                <Card 
                  key={customer.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-transparent hover:border-l-primary"
                  onClick={() => handleSelectCustomer(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Customer Avatar */}
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="text-sm font-medium">
                          {getCustomerAvatarInitials(customer.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Customer Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm truncate">{customer.name}</h4>
                          <div className="flex items-center gap-1">
                            {getPriorityIcon(customer.priority) === 'alert-triangle' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                            {getPriorityIcon(customer.priority) === 'alert-circle' && <AlertCircle className="h-3 w-3 text-yellow-500" />}
                            {getPriorityIcon(customer.priority) === 'check-circle' && <CheckCircle className="h-3 w-3 text-green-500" />}
                            <Badge className={cn("text-xs", getPriorityColor(customer.priority))}>
                              {customer.priority.toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        {/* Issue Info */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-shrink-0">
                            {getCategoryIcon(customer.issueCategory) === 'building-2' && <Building2 className="h-3.5 w-3.5 text-blue-600" />}
                            {getCategoryIcon(customer.issueCategory) === 'credit-card' && <CreditCard className="h-3.5 w-3.5 text-purple-600" />}
                            {getCategoryIcon(customer.issueCategory) === 'home' && <Home className="h-3.5 w-3.5 text-orange-600" />}
                            {getCategoryIcon(customer.issueCategory) === 'monitor' && <Monitor className="h-3.5 w-3.5 text-gray-600" />}
                            {getCategoryIcon(customer.issueCategory) === 'help-circle' && <HelpCircle className="h-3.5 w-3.5 text-gray-500" />}
                          </div>
                          <span className="text-sm font-medium truncate">{customer.issueTitle}</span>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {customer.issueDescription}
                        </p>

                        {/* Customer Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            <span>***{customer.accountNumber?.slice(-4)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Est. {customer.estimatedResolutionTime}min</span>
                          </div>
                        </div>

                        {/* Wait Time */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium text-orange-600">
                              Waiting {formatWaitTime(customer.waitTime)}
                            </span>
                          </div>
                          <Button size="sm" className="text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Start Chat
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Quick Actions Footer */}
      <div className="border-t p-3 bg-muted/30">
        <div className="text-xs text-muted-foreground text-center">
          {metrics.longestWaitTime > 0 && (
            <>
              <AlertTriangle className="h-3 w-3 inline mr-1 text-orange-500" />
              Longest wait: {formatWaitTime(metrics.longestWaitTime)}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
