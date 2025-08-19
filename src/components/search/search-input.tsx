import { forwardRef, useEffect, useState } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import '../../styles/search-animations.css'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  loading?: boolean
  placeholder?: string
  autoFocus?: boolean
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, loading = false, placeholder = "Search procedures, policies, compliance guides...", autoFocus = true }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    
    useEffect(() => {
      if (autoFocus && ref && 'current' in ref && ref.current) {
        ref.current.focus()
      }
    }, [autoFocus, ref])
    
    // Trigger wave animation on typing
    useEffect(() => {
      if (isTyping) {
        const timer = setTimeout(() => setIsTyping(false), 1000)
        return () => clearTimeout(timer)
      }
    }, [isTyping, value])

    return (
      <div className={`gradient-border-animated ${loading ? 'search-input-loading' : ''}`}>
        <div className="relative bg-white dark:bg-gray-900 rounded-[0.7rem]">
          {/* Wave overlay for typing effect */}
          <div className={`search-wave-overlay ${isTyping ? 'search-wave-active' : ''}`} />
          
          {/* Search Icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </div>

          {/* Search Input */}
          <Input
            ref={ref}
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setIsTyping(true)
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="search-input-animated pl-10 pr-10 h-11 text-base bg-transparent border-0 focus:ring-0 focus:outline-none rounded-[0.7rem]"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Clear Button */}
          {value && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    )
  }
)

SearchInput.displayName = "SearchInput"
