import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { ResizableHandle } from '../layout/resizable-widget-container'
import { useWidgetLayout } from '../../hooks/use-widget-layout'
import { 
  AlertTriangle, 
  Phone, 
  Mail, 
  MapPin,
  User,
  Hash,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Building2,
  Video,
  MessageCircle,
  Smartphone,
  Globe
} from 'lucide-react'
import { useCustomerColumnData } from '../../stores/selectors/agent-selectors'
import { useState, memo, useMemo } from 'react'
import { cn } from '../../lib/utils'

// Icon mapping for 8 standardized channel types
const getChannelIcon = (channel: string) => {
  switch (channel) {
    case 'phone':
      return Phone
    case 'email':
      return Mail
    case 'mobile':
      return Smartphone
    case 'branch':
      return Building2
    case 'video':
      return Video
    case 'web':
      return Globe
    case 'social':
      return MessageCircle
    case 'chat':
      return MessageSquare
    default:
      return MessageSquare // Default fallback
  }
}

export const CustomerColumn = memo(function CustomerColumn() {
  const { customer, connectionStatus } = useCustomerColumnData()
  const [expandedInteractions, setExpandedInteractions] = useState<Set<string>>(new Set())
  
  // Widget layout hooks
  const customerInfoLayout = useWidgetLayout({
    column: 'customer',
    widgetId: 'customer-info',
    defaultSize: 40,
    minSize: 30,
    maxSize: 60
  })
  
  const interactionLayout = useWidgetLayout({
    column: 'customer',
    widgetId: 'interaction-history',
    defaultSize: 60,
    minSize: 40,
    maxSize: 70
  })
  
  // Memoize expensive interactions mapping - only recalculate when customer changes
  const interactions = useMemo(() => 
    (customer?.interactionHistory || []).map((interaction: any, index: number) => ({
      id: `interaction-${index}`,
      channel: interaction.channel || 'phone',
      subject: interaction.subject || 'Customer Interaction',
      date: interaction.interaction_date || interaction.date || new Date().toISOString(),
      status: interaction.status || 'resolved',
      details: interaction.description || interaction.interaction_context || '',
      sentiment: interaction.sentiment || 'neutral',
      outcome: interaction.interaction_outcome || interaction.status,
      responseTime: interaction.response_time_minutes,
      priority: interaction.priority_level || 'medium',
      tags: interaction.tags || []
    })), [customer?.interactionHistory])
  
  const toggleInteraction = (id: string) => {
    setExpandedInteractions(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  
  return (
    <PanelGroup direction="vertical" className="h-full w-full customer-column">
      {/* Customer Info Panel */}
      <Panel 
        defaultSize={customerInfoLayout.size}
        minSize={customerInfoLayout.minSize}
        maxSize={customerInfoLayout.maxSize}
        onResize={customerInfoLayout.handleResize}
      >
        <div className="bg-white h-full">
          <ScrollArea className="h-full w-full">
            <div className="p-4 space-y-4">
              {/* Customer Header - Show watermark when no customer data */}
              {customer ? (
                <>
                  {/* Professional Header */}
                  <div className="mb-4 border-l-4 border-gray-800 pl-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-lg font-semibold text-gray-900">{customer.name}</h1>
                        <p className="text-xs text-gray-600 mt-1">
                          {customer.tier || customer.accountType || 'Standard'} • CIN: {(customer.cin || customer.id).replace('CIN-', '')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={customerInfoLayout.resetSize}
                        title="Reset to default size"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Customer Information Card */}
                  <Card className="border-gray-200">
                    <CardHeader className="pb-3 bg-gray-50">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {/* Verification Status */}
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          {customer.verificationStatus === 'verified' ? (
                            <CheckCircle className="h-3 w-3 text-green-600" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-yellow-600" />
                          )}
                          <span className="text-xs font-medium">Verification</span>
                        </div>
                        <Badge className={`text-xs ${
                          customer.verificationStatus === 'verified' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`} variant="outline">
                          {customer.verificationStatus === 'verified' ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>

                      {/* CCAAS Details */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 border rounded text-xs">
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-600" />
                            <span className="text-gray-600">Phone</span>
                          </div>
                          <span className="font-medium">{customer.phone}</span>
                        </div>
                        
                        <div className="flex items-center justify-between p-2 border rounded text-xs">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-gray-600" />
                            <span className="text-gray-600">Email</span>
                          </div>
                          <span className="font-medium text-right">{customer.email}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 border rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <MapPin className="h-3 w-3 text-gray-600" />
                              <span className="text-gray-600">Location</span>
                            </div>
                            <span className="font-medium text-xs">{customer.location}</span>
                          </div>
                          
                          <div className="p-2 border rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <Hash className="h-3 w-3 text-gray-600" />
                              <span className="text-gray-600">Tier</span>
                            </div>
                            <span className="font-medium text-xs">{customer.tier || customer.accountType}</span>
                          </div>
                        </div>
                      </div>

                      {/* Care Need Alert - only show if customer has risk */}
                      {customer.riskLevel && customer.riskLevel !== 'low' && (
                        <div className={`p-2 rounded border-2 ${
                          customer.riskLevel === 'high' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                        }`}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className={`h-3 w-3 ${
                              customer.riskLevel === 'high' ? 'text-red-600' : 'text-orange-600'
                            }`} />
                            <span className="text-xs font-medium">
                              {customer.riskLevel === 'high' ? 'Care Need' : 'Monitor Required'}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* Empty state watermark */
                <div className="flex items-center justify-center h-full min-h-[200px]">
                  <div className="text-center space-y-2">
                    <div className="text-muted-foreground">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">Customer Information</p>
                      <p className="text-xs opacity-75">Customer details will appear when call begins</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Panel>
      
      {/* Resize Handle */}
      <ResizableHandle direction="vertical" />
      
      {/* Interactions Panel */}
      <Panel 
        defaultSize={interactionLayout.size}
        minSize={interactionLayout.minSize}
        maxSize={interactionLayout.maxSize}
        onResize={interactionLayout.handleResize}
      >
        <div className="bg-white h-full">
          <ScrollArea className="h-full w-full">
            <div className="p-4 space-y-4">
              {/* Professional Header */}
              <div className="mb-4 border-l-4 border-gray-800 pl-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">Interaction History</h1>
                    <p className="text-xs text-gray-600 mt-1">
                      {interactions.length} total interactions • Recent activity
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {interactions.length}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={interactionLayout.resetSize}
                      title="Reset to default size"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Interactions List */}
              {interactions.length > 0 ? (
                <div className="space-y-3">
                  {interactions.map((interaction) => {
                    const Icon = getChannelIcon(interaction.channel)
                    const isExpanded = expandedInteractions.has(interaction.id)
                    
                    return (
                      <Card key={interaction.id} className="border-gray-200 overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-3">
                            <button
                              onClick={() => toggleInteraction(interaction.id)}
                              className="w-full text-left"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-1 p-2 rounded-full ${
                                  interaction.sentiment === 'positive' || interaction.sentiment === 'delighted' ? 'bg-green-100' :
                                  interaction.sentiment === 'negative' || interaction.sentiment === 'frustrated' ? 'bg-red-100' :
                                  interaction.sentiment === 'urgent' ? 'bg-orange-100' :
                                  'bg-gray-100'
                                }`}>
                                  <Icon className={`h-3 w-3 ${
                                    interaction.sentiment === 'positive' || interaction.sentiment === 'delighted' ? 'text-green-600' :
                                    interaction.sentiment === 'negative' || interaction.sentiment === 'frustrated' ? 'text-red-600' :
                                    interaction.sentiment === 'urgent' ? 'text-orange-600' :
                                    'text-gray-600'
                                  }`} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-gray-900">
                                        {interaction.subject}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <p className="text-xs text-gray-600">
                                          {new Date(interaction.date).toLocaleDateString()}
                                        </p>
                                        <Badge className={`text-xs ${
                                          interaction.status === 'resolved' ? 'bg-green-100 text-green-800 border-green-200' :
                                          interaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                          interaction.status === 'escalated' ? 'bg-red-100 text-red-800 border-red-200' :
                                          interaction.status === 'Current conversation' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                          'bg-gray-100 text-gray-800 border-gray-200'
                                        }`} variant="outline">
                                          {interaction.status === 'Current conversation' ? 'Current' : interaction.status}
                                        </Badge>
                                        {interaction.priority === 'urgent' && (
                                          <Badge className="text-xs bg-red-100 text-red-700 border-red-200" variant="outline">
                                            Urgent
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="mt-0.5">
                                      {interaction.details && (
                                        isExpanded ? (
                                          <ChevronUp className="h-4 w-4 text-gray-400" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 text-gray-400" />
                                        )
                                      )}
                                    </div>
                                  </div>
                                  
                                  {isExpanded && interaction.details && (
                                    <div className="mt-3 space-y-2">
                                      <div className="p-3 bg-gray-50 rounded">
                                        <p className="text-xs text-gray-700 leading-relaxed">
                                          {interaction.details}
                                        </p>
                                      </div>
                                      {interaction.responseTime && (
                                        <div className="flex items-center gap-4 text-xs text-gray-600">
                                          <span>Response time: {interaction.responseTime} min</span>
                                          {interaction.outcome && (
                                            <span>Outcome: {interaction.outcome}</span>
                                          )}
                                        </div>
                                      )}
                                      {interaction.tags && interaction.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {interaction.tags.map((tag: string, idx: number) => (
                                            <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                /* Empty state watermark for interactions */
                <div className="flex items-center justify-center h-full min-h-[150px]">
                  <div className="text-center space-y-2">
                    <div className="text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-medium">Interaction History</p>
                      <p className="text-xs opacity-75">Customer interactions will appear here</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Panel>
    </PanelGroup>
  )
})
