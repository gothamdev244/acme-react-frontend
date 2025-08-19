/**
 * Debug Utility - Environment-based conditional logging
 * Controls verbose debug output based on VITE_ENABLE_DEBUG_LOGGING environment variable
 */

// Check if debug logging is enabled via environment variable
const isDebugEnabled = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true'

/**
 * Conditional console.log that only outputs in debug mode
 */
export function debugLog(message: string, data?: any): void {
  if (isDebugEnabled) {
    if (data !== undefined) {
      console.log(message, data)
    } else {
      console.log(message)
    }
  }
}

/**
 * Conditional console.log for trace-level debugging (most verbose)
 * Only outputs when debug logging is explicitly enabled
 */
export function traceLog(message: string, data?: any): void {
  if (isDebugEnabled) {
    if (data !== undefined) {
      console.log(message, data)
    } else {
      console.log(message)
    }
  }
}

/**
 * Info-level logging that always outputs (for important information)
 */
export function infoLog(message: string, data?: any): void {
  if (data !== undefined) {
    console.log(message, data)
  } else {
    console.log(message)
  }
}

/**
 * Warning-level logging that always outputs
 */
export function warnLog(message: string, data?: any): void {
  if (data !== undefined) {
    console.warn(message, data)
  } else {
    console.warn(message)
  }
}

/**
 * Error-level logging that always outputs
 */
export function errorLog(message: string, data?: any): void {
  if (data !== undefined) {
    console.error(message, data)
  } else {
    console.error(message)
  }
}

/**
 * Check if debug mode is currently enabled
 */
export function isDebugMode(): boolean {
  return isDebugEnabled
}
