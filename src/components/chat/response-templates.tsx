import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { 
  MessageSquare, 
  Search, 
  Copy, 
  Star,
  Zap
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface Template {
  id: string
  title: string
  content: string
  category: 'greeting' | 'account' | 'technical' | 'closing' | 'common'
  usage: number
  favorite: boolean
}

// ✅ EXTERNALIZED: Response templates moved to /public/config/response-templates.json

async function loadResponseTemplates(): Promise<Template[]> {
  try {
    const response = await fetch('/config/response-templates.json')
    if (!response.ok) {
      throw new Error(`Failed to load response templates: ${response.status}`)
    }
    const data = await response.json()
    return data.templates
  } catch (error) {
    // Failed to load response templates, using fallback
    return [
      {
        id: '1',
        title: 'Welcome',
        content: 'Hello! How can I help you today?',
        category: 'greeting',
        usage: 0,
        favorite: false
      }
    ]
  }
}

export function ResponseTemplates({ className, onTemplateSelect }: { 
  className?: string
  onTemplateSelect?: (template: Template) => void 
}) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Load templates from config on component mount
  useEffect(() => {
    loadResponseTemplates().then(loadedTemplates => {
      setTemplates(loadedTemplates)
      setLoading(false)
    })
  }, [])
  
  const categories = [
    { id: 'all', label: 'All', count: templates.length },
    { id: 'greeting', label: 'Greeting', count: templates.filter(t => t.category === 'greeting').length },
    { id: 'account', label: 'Account', count: templates.filter(t => t.category === 'account').length },
    { id: 'technical', label: 'Technical', count: templates.filter(t => t.category === 'technical').length },
    { id: 'closing', label: 'Closing', count: templates.filter(t => t.category === 'closing').length }
  ]
  
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'greeting': return 'bg-green-100 text-green-800'
      case 'account': return 'bg-blue-100 text-blue-800'
      case 'technical': return 'bg-orange-100 text-orange-800'
      case 'closing': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const handleTemplateClick = (template: Template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template)
    }
    // Copy to clipboard as fallback
    navigator.clipboard.writeText(template.content)
  }
  
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="border-b pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" />
          Quick Responses
        </CardTitle>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
              <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-2">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="p-2 cursor-pointer hover:bg-red-50 hover:border-red-200 transition-colors border"
                onClick={() => handleTemplateClick(template)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-medium">{template.title}</h4>
                    {template.favorite && (
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className={cn("text-[10px]", getCategoryColor(template.category))}>
                      {template.category}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {template.content}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    <span>Used {template.usage} times</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
            
            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No templates found</p>
                <p className="text-xs">Try adjusting your search or category filter</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
