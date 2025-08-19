import { useState, useEffect, memo } from 'react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Badge } from '../ui/badge'
import { getAppConfig } from '../../config/app-config'
import { Separator } from '../ui/separator'
import { 
  ArrowLeft, 
  ExternalLink, 
  X,
  BookOpen,
  Clock,
  User,
  Tag,
  Star,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Printer,
  Share
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useKMSData } from '../../stores/selectors/agent-selectors'

interface KnowledgeArticle {
  id: string | number
  title: string
  category: string
  relevance?: number
  excerpt?: string
  url: string
  canEmbed?: boolean
  embedUrl?: string
  priority?: string
  author?: string
  lastUpdated?: string
  readTime?: string
  averageRating?: number
  totalRatings?: number
  helpfulVotes?: number
  content?: string
  tags?: string[]
}

interface KMSColumnProps {
  onBack?: () => void
  articleId?: string
  article?: KnowledgeArticle
}

export const KMSColumn = memo(function KMSColumn({ onBack, articleId, article }: KMSColumnProps) {
  const [userRating, setUserRating] = useState<number>(0)
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null)
  const [showThankYou, setShowThankYou] = useState(false)
  const { knowledgeArticles } = useKMSData()
  
  // Resolve internal KB slugs to Docusaurus URLs
  const resolveArticleUrl = (url: string) => {
    const config = getAppConfig()
    const KB_BASE_URL = config.services.knowledgePortal.baseUrl
    
    if (url?.startsWith('/kb/')) {
      const slug = url.replace(/^\/kb\//, '')
      return `${KB_BASE_URL}/docs/${slug}`
    }
    
    return url
  }
  
  // Use the passed article object first, then try to find by ID, then fallback to mock
  const selectedArticle = article || knowledgeArticles.find(art => art.id === articleId)
  
  // Fallback to mock article if no real article found
  const displayArticle = selectedArticle || {
    id: articleId || 'kb-001',
    title: 'Querying recurring or continuous day loan transactions on a Credit Card',
    category: 'Credit Cards',
    author: 'Knowledge Team',
    lastUpdated: '20 Aug 2024',
    readTime: '5 min',
    averageRating: 4.3,
    totalRatings: 127,
    helpfulVotes: 89,
    content: `## Overview

This procedure helps establish if a transaction is a recurring transaction or a day loan transaction on a Credit Card and what the customer wants to do with the transaction.

## General Information

A recurring transaction, sometimes called a **Continuous Payment Authority (CPA)** or **Continuous Authority Transaction (CAT)**, is a series of payments set up using a customer's card details. These can be for subscriptions, memberships, or regular payments.

## Procedure Steps

### Step 1: Identify the Transaction

- Ask the customer to provide the transaction details
- Check if the merchant name appears multiple times  
- Verify the amounts and dates

### Step 2: Determine Transaction Type

#### Recurring Transaction Indicators:
- Same merchant name appearing regularly
- Consistent amounts (though may vary)
- Monthly, weekly, or other regular intervals

#### Day Loan Transaction Indicators:
- Small amounts (usually under £100)
- Very frequent transactions (daily or multiple times per week)
- Payday loan company names

### Step 3: Customer Options

#### For Recurring Transactions:
1. **Cancel at source** - CCAAS the merchant directly
2. **Cancel via bank** - Stop the continuous payment authority
3. **Dispute if unauthorized** - Raise a chargeback claim

#### For Day Loan Transactions:
1. **CCAAS the lender** - Discuss repayment options
2. **Seek financial advice** - Refer to debt counseling
3. **Block future transactions** - Cancel the CPA

## Important Notes

> ⚠️ **Always verify the customer's identity before making changes**

- Document all actions taken
- Inform customer of potential fees or consequences
- Escalate to supervisor if fraud is suspected

## Related Articles

- [How to cancel a continuous payment authority](#)
- [Understanding credit card statements](#)
- [Dispute and chargeback procedures](#)`,
    tags: ['credit-card', 'recurring-payments', 'transactions', 'day-loans']
  }

  // Handle feedback functions
  const handleRating = (rating: number) => {
    setUserRating(rating)
    setShowThankYou(true)
    setTimeout(() => setShowThankYou(false), 3000)
  }

  const handleHelpfulFeedback = (helpful: boolean) => {
    setIsHelpful(helpful)
    setShowThankYou(true) 
    setTimeout(() => setShowThankYou(false), 3000)
  }

  const copyArticleLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/knowledge/${displayArticle.id}`)
    // Could show a toast notification here
  }

  const printArticle = () => {
    window.print()
  }
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with article title and action buttons */}
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <h2 className="font-medium text-sm truncate flex-1 mr-2">
          {selectedArticle?.title || displayArticle.title}
        </h2>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.open(selectedArticle?.url || '#', '_blank')}
            title="Open in new tab"
            className="h-7 w-7"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            title="Close"
            className="h-7 w-7"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      
      {/* Full iframe - no other content */}
      {selectedArticle?.url ? (
        <div className="flex-1 relative overflow-hidden">
          <iframe
            src={selectedArticle.url}
            className="absolute w-full border-0"
            style={{ 
              height: 'calc(100% + 60px)', 
              top: '-60px'
            }}
            title={selectedArticle.title}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      ) : (
        // Fallback to markdown content for demo articles
        <ScrollArea className="flex-1">
          <div className="p-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              className="prose prose-sm dark:prose-invert max-w-none"
              components={{
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mt-6 mb-4 text-foreground">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold mt-5 mb-3 text-foreground">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-sm font-semibold mt-3 mb-2 text-foreground">{children}</h4>
                ),
                p: ({ children }) => (
                  <p className="text-sm leading-relaxed mb-3 text-foreground">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-sm text-foreground ml-2">{children}</li>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/50 rounded-r">
                    {children}
                  </blockquote>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    className="text-primary hover:text-primary/80 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                code: ({ children }) => (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
              }}
            >
              {displayArticle.content || (displayArticle as any).excerpt}
            </ReactMarkdown>
          </div>
        </ScrollArea>
      )}
    </div>
  )
})
