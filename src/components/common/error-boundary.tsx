import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to external service in production
    // For now, just update state
    
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      
      // Custom fallback component
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} />
      }

      // Default fallback UI
      return (
        <div className="h-full bg-background p-4 border border-red-200 rounded-lg">
          <div className="text-red-600 font-medium mb-2">
            Something went wrong in this component
          </div>
          <details className="text-sm text-gray-600">
            <summary className="cursor-pointer mb-2">Error Details</summary>
            <div className="bg-gray-50 p-2 rounded border text-xs font-mono">
              <div className="mb-2">
                <strong>Error:</strong> {this.state.error?.message}
              </div>
              <div className="mb-2">
                <strong>Stack:</strong>
                <pre className="whitespace-pre-wrap">{this.state.error?.stack}</pre>
              </div>
              {this.state.errorInfo && (
                <div>
                  <strong>Component Stack:</strong>
                  <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                </div>
              )}
            </div>
          </details>
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Simple fallback component for Space Copilot
export const SpaceCopilotErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="h-full bg-background p-4">
    <div className="text-red-600 font-medium mb-2">
      Space Copilot Error
    </div>
    <div className="text-sm text-gray-600 mb-2">
      The Space Copilot component encountered an error while processing intent data.
    </div>
    {error && (
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
        Error: {error.message}
      </div>
    )}
    <div className="mt-4 text-sm">
      <p>This usually happens when:</p>
      <ul className="list-disc list-inside mt-1 text-xs">
        <li>Intent data format is unexpected</li>
        <li>Network connection to embedded app failed</li>
        <li>JavaScript error in component logic</li>
      </ul>
    </div>
  </div>
)
