import { useState, useCallback } from 'react'
import { kmsService, type KMSArticle, type KMSLinkInfo } from '../services/kms.service'

/**
 * Hook for managing KMS operations - article opening, linking, etc.
 */
export function useKMS() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Open a KMS article by ID or URL
   */
  const openKMSArticle = useCallback(async (
    articleIdOrUrl: string,
    openInNewTab: boolean = false
  ): Promise<{ success: boolean; articleId?: string; error?: string }> => {
    setIsLoading(true)
    setError(null)

    try {
      const linkInfo = kmsService.normalizeKMSLink(articleIdOrUrl)
      
      if (!linkInfo.isValid) {
        throw new Error('Invalid KMS article reference')
      }

      if (openInNewTab) {
        // Open in new browser tab
        const shareableLink = kmsService.generateShareableLink(linkInfo.articleId)
        window.open(shareableLink, '_blank', 'noopener,noreferrer')
        return { success: true, articleId: linkInfo.articleId }
      } else {
        // Signal to parent component to open in KMS column
        // This would typically dispatch an event or call a callback
        window.dispatchEvent(new CustomEvent('kms:open-article', {
          detail: { articleId: linkInfo.articleId }
        }))
        return { success: true, articleId: linkInfo.articleId }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open KMS article'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Extract and enrich KMS links from text
   */
  const processTextForKMSLinks = useCallback(async (text: string): Promise<{
    hasKMSLinks: boolean
    links: Array<KMSLinkInfo & { metadata?: Partial<KMSArticle> }>
    enrichedText: string
  }> => {
    const links = kmsService.extractKMSLinks(text)
    
    if (links.length === 0) {
      return {
        hasKMSLinks: false,
        links: [],
        enrichedText: text
      }
    }

    // Enrich links with metadata
    const enrichedLinks = await Promise.all(
      links.map(async (link) => {
        const metadata = await kmsService.getArticleMetadata(link.articleId)
        return { ...link, metadata }
      })
    )

    // Replace text with formatted links
    let enrichedText = text
    enrichedLinks.forEach(link => {
      if (link.metadata) {
        const formattedLink = kmsService.formatKMSLinkForDisplay(link, link.metadata)
        enrichedText = enrichedText.replace(link.originalUrl, formattedLink)
      }
    })

    return {
      hasKMSLinks: true,
      links: enrichedLinks,
      enrichedText
    }
  }, [])

  /**
   * Generate a shareable link for an article
   */
  const shareKMSArticle = useCallback((articleId: string): string => {
    return kmsService.generateShareableLink(articleId)
  }, [])

  /**
   * Check if a URL is a KMS link
   */
  const isKMSLink = useCallback((url: string): boolean => {
    return kmsService.isKMSLink(url)
  }, [])

  return {
    isLoading,
    error,
    openKMSArticle,
    processTextForKMSLinks,
    shareKMSArticle,
    isKMSLink
  }
}
