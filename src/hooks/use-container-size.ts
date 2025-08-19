import { useEffect, useState, useRef, useCallback } from 'react'

interface ContainerSize {
  width: number
  height: number
  isSmall: boolean
  isMedium: boolean
  isLarge: boolean
}

interface UseContainerSizeOptions {
  debounceMs?: number
  smallBreakpoint?: number
  mediumBreakpoint?: number
}

export function useContainerSize(options: UseContainerSizeOptions = {}): [
  React.RefObject<HTMLDivElement>,
  ContainerSize
] {
  const {
    debounceMs = 100,
    smallBreakpoint = 400,
    mediumBreakpoint = 800
  } = options

  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<ContainerSize>({
    width: 0,
    height: 0,
    isSmall: true,
    isMedium: false,
    isLarge: false
  })

  const updateSize = useCallback(() => {
    if (!containerRef.current) return

    const { offsetWidth, offsetHeight } = containerRef.current
    
    const newSize: ContainerSize = {
      width: offsetWidth,
      height: offsetHeight,
      isSmall: offsetWidth < smallBreakpoint,
      isMedium: offsetWidth >= smallBreakpoint && offsetWidth < mediumBreakpoint,
      isLarge: offsetWidth >= mediumBreakpoint
    }

    setSize(prevSize => {
      // Only update if dimensions actually changed
      if (prevSize.width !== newSize.width || prevSize.height !== newSize.height) {
        return newSize
      }
      return prevSize
    })
  }, [smallBreakpoint, mediumBreakpoint])

  useEffect(() => {
    if (!containerRef.current) return

    // Create ResizeObserver for more accurate container size detection
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0) {
        const entry = entries[0]
        const { width, height } = entry.contentRect
        
        const newSize: ContainerSize = {
          width,
          height,
          isSmall: width < smallBreakpoint,
          isMedium: width >= smallBreakpoint && width < mediumBreakpoint,
          isLarge: width >= mediumBreakpoint
        }

        setSize(prevSize => {
          if (prevSize.width !== newSize.width || prevSize.height !== newSize.height) {
            return newSize
          }
          return prevSize
        })
      }
    })

    resizeObserver.observe(containerRef.current)
    
    // Initial measurement
    updateSize()

    // Fallback with window resize for older browsers
    let debounceTimer: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(updateSize, debounceMs)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', handleResize)
      clearTimeout(debounceTimer)
    }
  }, [updateSize, debounceMs])

  return [containerRef, size]
}
