import { useState, useEffect } from 'react'

/**
 * Custom hook for debouncing values
 * Delays updating the debounced value until after the specified delay
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timer if value changes or component unmounts
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
