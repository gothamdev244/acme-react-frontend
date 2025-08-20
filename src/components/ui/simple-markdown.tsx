import React from 'react'

interface SimpleMarkdownProps {
  content: string
  className?: string
}

export function SimpleMarkdown({ content, className = '' }: SimpleMarkdownProps) {
  // Simple markdown parsing for performance
  const renderContent = () => {
    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let inList = false
    let listItems: string[] = []

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={elements.length} className="list-disc list-inside mb-3 space-y-1">
            {listItems.map((item, i) => (
              <li key={i} className="text-sm text-foreground ml-2">{item}</li>
            ))}
          </ul>
        )
        listItems = []
        inList = false
      }
    }

    lines.forEach((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        flushList()
        elements.push(
          <h1 key={index} className="text-xl font-bold mt-6 mb-4 text-foreground">
            {line.substring(2)}
          </h1>
        )
      } else if (line.startsWith('## ')) {
        flushList()
        elements.push(
          <h2 key={index} className="text-lg font-semibold mt-5 mb-3 text-foreground">
            {line.substring(3)}
          </h2>
        )
      } else if (line.startsWith('### ')) {
        flushList()
        elements.push(
          <h3 key={index} className="text-base font-semibold mt-4 mb-2 text-foreground">
            {line.substring(4)}
          </h3>
        )
      }
      // Lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        inList = true
        listItems.push(line.substring(2))
      }
      // Regular paragraphs
      else if (line.trim() !== '') {
        flushList()
        
        // Simple bold support
        let text = line
        if (text.includes('**')) {
          const parts = text.split('**')
          const formatted = parts.map((part, i) => 
            i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
          )
          elements.push(
            <p key={index} className="text-sm leading-relaxed mb-3 text-foreground">
              {formatted}
            </p>
          )
        } else {
          elements.push(
            <p key={index} className="text-sm leading-relaxed mb-3 text-foreground">
              {text}
            </p>
          )
        }
      }
    })

    flushList() // Flush any remaining list items
    return elements
  }

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      {renderContent()}
    </div>
  )
}