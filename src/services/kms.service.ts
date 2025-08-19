/**
 * KMS Service - Handles Knowledge Management System operations
 * Supports article linking, normalization, and opening from various contexts
 */

export interface KMSArticle {
  id: string
  title: string
  category: string
  author: string
  lastUpdated: string
  readTime: string
  averageRating: number
  totalRatings: number
  helpfulVotes: number
  content: string
  tags: string[]
  url?: string
}

export interface KMSLinkInfo {
  articleId: string
  title?: string
  category?: string
  isValid: boolean
  normalizedUrl: string
  originalUrl: string
}

class KMSService {
  // ✅ FIXED: KMS base URL now configurable via environment variable
  private readonly KMS_BASE_URL = import.meta.env.VITE_KNOWLEDGE_PORTAL_BASE_URL || 'https://knowledge.hsbc.com'
  private readonly KMS_INTERNAL_PREFIX = '/knowledge/'
  
  /**
   * Normalize various KMS link formats to a standard format
   */
  normalizeKMSLink(url: string): KMSLinkInfo {
    // Handle different KMS URL patterns:
    // - https://knowledge.hsbc.com/article/kb-001
    // - /knowledge/kb-001  
    // - kb-001 (article ID only)
    // - KMS-CC-001 (prefixed article ID)
    
    let articleId = ''
    let isValid = false
    let normalizedUrl = url
    
    try {
      // Extract article ID from various formats
      if (url.includes('knowledge.hsbc.com')) {
        const match = url.match(/\/article\/([^/?#]+)/)
        articleId = match?.[1] || ''
      } else if (url.startsWith('/knowledge/')) {
        articleId = url.replace('/knowledge/', '').split('?')[0].split('#')[0]
      } else if (url.startsWith('KMS-') || url.startsWith('kb-') || url.startsWith('KB-')) {
        articleId = url
      } else if (url.match(/^[a-zA-Z0-9-_]+$/)) {
        // Simple alphanumeric ID
        articleId = url
      }
      
      if (articleId) {
        normalizedUrl = `${this.KMS_BASE_URL}/article/${articleId}`
        isValid = true
      }
      
    } catch (error) {
      // Error normalizing KMS link
    }
    
    return {
      articleId,
      isValid,
      normalizedUrl,
      originalUrl: url
    }
  }
  
  /**
   * Extract KMS links from text content (chat messages, descriptions, etc.)
   */
  extractKMSLinks(text: string): KMSLinkInfo[] {
    const links: KMSLinkInfo[] = []
    
    // Patterns to match KMS links in text
    const patterns = [
      // Full URLs
      /https?:\/\/knowledge\.hsbc\.com\/article\/([^/\s]+)/g,
      // Relative paths
      /\/knowledge\/([^/\s]+)/g,
      // Article references like "See KMS-CC-001" or "Check kb-001"
      /(KMS-[A-Z0-9-]+|kb-[A-Z0-9-]+|KB-[A-Z0-9-]+)/g,
    ]
    
    patterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0]
        const linkInfo = this.normalizeKMSLink(fullMatch)
        
        if (linkInfo.isValid && !links.some(l => l.articleId === linkInfo.articleId)) {
          links.push(linkInfo)
        }
      }
    })
    
    return links
  }
  
  /**
   * Get article metadata by ID (mock implementation - would call real API)
   */
  async getArticleMetadata(articleId: string): Promise<Partial<KMSArticle> | null> {
    // Mock data - in real implementation, this would call the KMS API
    const mockArticles: Record<string, Partial<KMSArticle>> = {
      'kb-001': {
        id: 'kb-001',
        title: 'Querying recurring or continuous day loan transactions on a Credit Card',
        category: 'Credit Cards',
        author: 'Knowledge Team'
      },
      'KMS-CC-001': {
        id: 'KMS-CC-001',
        title: 'Credit Card Transaction Disputes',
        category: 'Credit Cards',
        author: 'Support Team'
      },
      'KMS-DISPUTE-001': {
        id: 'KMS-DISPUTE-001',
        title: 'Unauthorized Transaction Dispute Process',
        category: 'Disputes',
        author: 'Fraud Team'
      },
      'KMS-DISPUTE-002': {
        id: 'KMS-DISPUTE-002',
        title: 'Duplicate Charge Dispute Process',
        category: 'Disputes',
        author: 'Fraud Team'
      },
      'KMS-DISPUTE-003': {
        id: 'KMS-DISPUTE-003',
        title: 'Wrong Amount Dispute Process',
        category: 'Disputes',
        author: 'Fraud Team'
      }
    }
    
    return mockArticles[articleId] || null
  }
  
  /**
   * Generate a shareable KMS link
   */
  generateShareableLink(articleId: string): string {
    return `${this.KMS_BASE_URL}/article/${articleId}?utm_source=agent_ui&utm_medium=share`
  }
  
  /**
   * Check if a URL is a KMS link
   */
  isKMSLink(url: string): boolean {
    const linkInfo = this.normalizeKMSLink(url)
    return linkInfo.isValid
  }
  
  /**
   * Create a formatted link for display in chat or UI
   */
  formatKMSLinkForDisplay(linkInfo: KMSLinkInfo, metadata?: Partial<KMSArticle>): string {
    if (metadata?.title) {
      return `📖 ${metadata.title} (${linkInfo.articleId})`
    }
    return `📖 Knowledge Article ${linkInfo.articleId}`
  }
}

// Export singleton instance
export const kmsService = new KMSService()
