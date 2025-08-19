import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Progress } from '../ui/progress'
import { 
  Users, 
  Phone, 
  MessageSquare, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Eye,
  UserCheck,
  UserX,
  Activity
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface Agent {
  id: string
  name: string
  role: 'call' | 'chat'
  status: 'available' | 'busy' | 'break' | 'offline'
  currentCustomer?: string
  callDuration?: number
  performance: {
    callsToday: number
    avgHandleTime: number
    satisfaction: number
  }
}

// ✅ EXTERNALIZED: Team agents data moved to /public/config/team-agents.json

async function loadTeamAgents(): Promise<Agent[]> {
  try {
    const response = await fetch('/config/team-agents.json')
    if (!response.ok) {
      throw new Error(`Failed to load team agents: ${response.status}`)
    }
    const data = await response.json()
    return data.agents
  } catch (error) {
    // Failed to load team agents, using fallback
    return [
      {
        id: '1',
        name: 'Agent 1',
        role: 'call',
        status: 'available',
        performance: {
          callsToday: 0,
          avgHandleTime: 180,
          satisfaction: 90
        }
      }
    ]
  }
}

export function TeamStatusGrid({ className }: { className?: string }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  // Load agents from config on component mount
  useEffect(() => {
    loadTeamAgents().then(loadedAgents => {
      setAgents(loadedAgents)
      setLoading(false)
    })
  }, [])
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'busy': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'break': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'offline': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const totalAgents = agents.length
  const availableAgents = agents.filter(a => a.status === 'available').length
  const busyAgents = agents.filter(a => a.status === 'busy').length
  const onBreak = agents.filter(a => a.status === 'break').length
  
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Status
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Eye className="h-4 w-4 mr-1" />
              Monitor All
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <p className="text-2xl font-bold text-green-600">{availableAgents}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </div>
          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <p className="text-2xl font-bold text-red-600">{busyAgents}</p>
            <p className="text-xs text-muted-foreground">Busy</p>
          </div>
          <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <p className="text-2xl font-bold text-yellow-600">{onBreak}</p>
            <p className="text-xs text-muted-foreground">Break</p>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/20 rounded">
            <p className="text-2xl font-bold text-gray-600">{totalAgents - availableAgents - busyAgents - onBreak}</p>
            <p className="text-xs text-muted-foreground">Offline</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Agent Grid */}
        <div className="space-y-2">
          {agents.map((agent) => (
            <Card 
              key={agent.id} 
              className={cn(
                "p-3 cursor-pointer transition-colors border",
                selectedAgent?.id === agent.id && "bg-accent",
                agent.status === 'busy' && "border-l-4 border-l-red-500"
              )}
              onClick={() => setSelectedAgent(agent)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn("text-xs", getStatusColor(agent.status))}>
                        {agent.status}
                      </Badge>
                      {agent.role === 'call' ? (
                        <Phone className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <MessageSquare className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {agent.status === 'busy' && agent.callDuration !== undefined && (
                    <p className="text-sm font-mono text-red-600">
                      {formatDuration(agent.callDuration)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {agent.performance.callsToday} today
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{agent.performance.satisfaction}%</span>
                  </div>
                </div>
              </div>
              
              {agent.currentCustomer && (
                <div className="mt-2 p-2 bg-muted rounded text-xs">
                  <span className="text-muted-foreground">With: </span>
                  <span className="font-medium">{agent.currentCustomer}</span>
                </div>
              )}
              
              {/* Performance bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Performance</span>
                  <span>{agent.performance.satisfaction}%</span>
                </div>
                <Progress value={agent.performance.satisfaction} className="h-1" />
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
