import { useEffect, useCallback } from 'react'

interface KeyboardShortcutConfig {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  preventDefault?: boolean
}

/**
 * Custom hook for handling keyboard shortcuts
 * Supports modifier keys and prevents default behavior
 * 
 * @param config - Keyboard shortcut configuration
 * @param callback - Function to call when shortcut is pressed
 * @param dependencies - Dependencies for the callback
 */
export function useKeyboardShortcut(
  config: KeyboardShortcutConfig,
  callback: () => void,
  dependencies: React.DependencyList = []
) {
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const {
      key,
      ctrlKey = false,
      metaKey = false,
      shiftKey = false,
      altKey = false,
      preventDefault = true
    } = config

    // Check if the key matches
    if (event.key.toLowerCase() !== key.toLowerCase()) {
      return
    }

    // Check modifier keys
    const modifiersMatch = 
      event.ctrlKey === ctrlKey &&
      event.metaKey === metaKey &&
      event.shiftKey === shiftKey &&
      event.altKey === altKey

    if (modifiersMatch) {
      if (preventDefault) {
        event.preventDefault()
        event.stopPropagation()
      }
      callback()
    }
  }, [config, callback, ...dependencies])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])
}

/**
 * Convenience hook for Ctrl/Cmd+F shortcut
 * Automatically handles cross-platform modifier keys
 */
export function useGlobalSearch(callback: () => void, dependencies: React.DependencyList = []) {
  // Use metaKey for Mac (Cmd) and ctrlKey for Windows/Linux
  const isMac = typeof window !== 'undefined' && window.navigator.platform.toUpperCase().indexOf('MAC') >= 0

  useKeyboardShortcut(
    {
      key: 'f',
      ...(isMac ? { metaKey: true } : { ctrlKey: true }),
      preventDefault: true
    },
    callback,
    dependencies
  )
}
