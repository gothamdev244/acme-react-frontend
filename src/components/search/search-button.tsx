import { Search } from 'lucide-react'
import { Button } from '../ui/button'

interface SearchButtonProps {
  onClick: () => void
  className?: string
}

export function SearchButton({ onClick, className }: SearchButtonProps) {
  // Detect platform for correct keyboard shortcut display
  const isMac = typeof window !== 'undefined' && window.navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const shortcutKey = isMac ? '⌘' : 'Ctrl'

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={`h-9 px-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 ${className}`}
      title={`Global Search (${shortcutKey}+F)`}
    >
      <Search className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline-block mr-2">Search</span>
      <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded">
        {shortcutKey}F
      </kbd>
    </Button>
  )
}
