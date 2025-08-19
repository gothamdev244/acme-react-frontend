import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { ScrollArea } from '../ui/scroll-area'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  ArrowLeft,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Building2,
  Home,
  Monitor,
  HelpCircle
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Customer, ChatMessage } from '../../types/chat-types'
import { CustomerQueue } from './customer-queue'
import { 
  generateCustomerResponse, 
  getResponseDelay, 
  shouldCustomerEndConversation,
  generateThankYouMessage 
} from '../../utils/chat-ai-responses'
import { 
  getCustomerAvatarInitials,
  getPriorityColor,
  getPriorityIcon,
  getCategoryIcon
} from '../../utils/mock-customers'

interface ChatWindowProps {
  className?: string
}

export function ChatWindow({ className }: ChatWindowProps) {
  const [mode, setMode] = useState<'queue' | 'chat'>('queue')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isCustomerTyping, setIsCustomerTyping] = useState(false)
  const [conversationEnded, setConversationEnded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const responseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isCustomerTyping])

  // Start conversation when customer is selected
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer)
    setMode('chat')
    setMessages([])
    setConversationEnded(false)
    
    // Customer sends initial message after a short delay
    setTimeout(() => {
      const initialMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        text: customer.issueDescription,
        sender: 'customer',
        timestamp: new Date(),
        customerId: customer.id
      }
      setMessages([initialMessage])
    }, 1500)
  }

  // Return to queue
  const handleBackToQueue = () => {
    setMode('queue')
    setSelectedCustomer(null)
    setMessages([])
    setConversationEnded(false)
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current)
    }
  }

  // Complete conversation
  const handleCompleteConversation = () => {
    if (selectedCustomer) {
      const thankYouMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        text: generateThankYouMessage(selectedCustomer),
        sender: 'customer',
        timestamp: new Date(),
        customerId: selectedCustomer.id
      }
      setMessages(prev => [...prev, thankYouMessage])
      setConversationEnded(true)
      
      // Auto return to queue after 3 seconds
      setTimeout(() => {
        handleBackToQueue()
      }, 3000)
    }
  }

  // Generate customer response
  const generateCustomerReply = (agentMessage: string) => {
    if (!selectedCustomer || conversationEnded) return

    const context = {
      customer: selectedCustomer,
      conversation: messages,
      lastAgentMessage: agentMessage,
      conversationStage: messages.length <= 2 ? 'greeting' as const :
                        messages.length <= 4 ? 'problem_identification' as const :
                        messages.length <= 8 ? 'troubleshooting' as const :
                        messages.length <= 10 ? 'resolution' as const : 'closing' as const
    }

    // Check if customer wants to end conversation
    if (shouldCustomerEndConversation(messages, selectedCustomer)) {
      handleCompleteConversation()
      return
    }

    setIsCustomerTyping(true)
    
    const delay = getResponseDelay(selectedCustomer.personality)
    
    responseTimeoutRef.current = setTimeout(() => {
      const response = generateCustomerResponse(context)
      const customerMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        text: response,
        sender: 'customer',
        timestamp: new Date(),
        customerId: selectedCustomer.id
      }
      
      setMessages(prev => [...prev, customerMessage])
      setIsCustomerTyping(false)
    }, delay)
  }
  
  // Send agent message
  const handleSend = () => {
    if (inputText.trim() && selectedCustomer) {
      const agentMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        text: inputText.trim(),
        sender: 'agent',
        timestamp: new Date(),
        customerId: selectedCustomer.id,
        agentId: 'current-agent'
      }
      
      setMessages(prev => [...prev, agentMessage])
      const messageCopy = inputText.trim()
      setInputText('')
      
      // Generate customer response
      generateCustomerReply(messageCopy)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // Render queue mode
  if (mode === 'queue') {
    return (
      <CustomerQueue 
        onSelectCustomer={handleSelectCustomer}
        className={className}
      />
    )
  }

  // Render chat mode
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      {/* Chat Header */}
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToQueue}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-9 w-9">
              <AvatarFallback>
                {selectedCustomer ? getCustomerAvatarInitials(selectedCustomer.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm">{selectedCustomer?.name}</CardTitle>
              <div className="flex items-center gap-2">
                {selectedCustomer && (
                  <>
                    <Badge className={cn("text-xs flex items-center gap-1", getPriorityColor(selectedCustomer.priority))}>
                      {getPriorityIcon(selectedCustomer.priority) === 'alert-triangle' && <AlertTriangle className="h-2.5 w-2.5" />}
                      {getPriorityIcon(selectedCustomer.priority) === 'alert-circle' && <AlertCircle className="h-2.5 w-2.5" />}
                      {getPriorityIcon(selectedCustomer.priority) === 'check-circle' && <CheckCircle className="h-2.5 w-2.5" />}
                      {selectedCustomer.priority.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      {getCategoryIcon(selectedCustomer.issueCategory) === 'building-2' && <Building2 className="h-3 w-3 text-blue-600" />}
                      {getCategoryIcon(selectedCustomer.issueCategory) === 'credit-card' && <CreditCard className="h-3 w-3 text-purple-600" />}
                      {getCategoryIcon(selectedCustomer.issueCategory) === 'home' && <Home className="h-3 w-3 text-orange-600" />}
                      {getCategoryIcon(selectedCustomer.issueCategory) === 'monitor' && <Monitor className="h-3 w-3 text-gray-600" />}
                      {getCategoryIcon(selectedCustomer.issueCategory) === 'help-circle' && <HelpCircle className="h-3 w-3 text-gray-500" />}
                      {selectedCustomer.issueTitle}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conversationEnded && (
              <Badge variant="secondary" className="text-xs text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
            {!conversationEnded && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCompleteConversation}
                className="text-xs"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                End Chat
              </Button>
            )}
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Customer Details Bar */}
        {selectedCustomer && (
          <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{selectedCustomer.email}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{selectedCustomer.phone}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <CreditCard className="h-3 w-3" />
              <span>***{selectedCustomer.accountNumber?.slice(-4)}</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      {/* Chat Messages */}
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2",
                  message.sender === 'agent' ? "justify-end" : "justify-start"
                )}
              >
                {message.sender === 'customer' && selectedCustomer && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {getCustomerAvatarInitials(selectedCustomer.name)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-3 py-2",
                    message.sender === 'agent'
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    message.sender === 'agent' ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isCustomerTyping && selectedCustomer && (
              <div className="flex gap-2 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {getCustomerAvatarInitials(selectedCustomer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      {/* Chat Input */}
      <div className="border-t p-3">
        {conversationEnded ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Conversation completed successfully
            </p>
            <Button onClick={handleBackToQueue} variant="outline" size="sm">
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back to Queue
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isCustomerTyping}
            />
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Smile className="h-4 w-4" />
            </Button>
            <Button 
              onClick={handleSend} 
              size="icon" 
              className="flex-shrink-0"
              disabled={!inputText.trim() || isCustomerTyping}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
