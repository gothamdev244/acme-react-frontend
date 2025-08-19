import { ReactNode } from 'react'
import { PanelResizeHandle } from 'react-resizable-panels'
import { GripVertical, GripHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ResizableWidgetContainerProps {
  children: ReactNode
  widgetId: string
  className?: string
  direction?: 'horizontal' | 'vertical'
  showHandle?: boolean
  handleClassName?: string
  minSize?: number
  maxSize?: number
  defaultSize?: number
  onResize?: (size: number) => void
}

export function ResizableWidgetContainer({
  children,
  widgetId,
  className,
  direction = 'vertical',
  showHandle = true,
  handleClassName,
  minSize = 10,
  maxSize = 90,
  defaultSize = 50,
  onResize
}: ResizableWidgetContainerProps) {
  return (
    <>
      <div 
        className={cn(
          "relative h-full w-full overflow-hidden",
          className
        )}
        data-widget-id={widgetId}
      >
        {children}
      </div>
      {showHandle && (
        <ResizableHandle 
          direction={direction}
          className={handleClassName}
        />
      )}
    </>
  )
}

export function ResizableHandle({ 
  direction = 'vertical',
  className,
  withHandle = true 
}: { 
  direction?: 'horizontal' | 'vertical'
  className?: string
  withHandle?: boolean
}) {
  return (
    <PanelResizeHandle
      className={cn(
        "group relative flex items-center justify-center",
        direction === 'vertical' 
          ? "h-1 w-full cursor-row-resize" 
          : "h-full w-1 cursor-col-resize",
        "bg-border/50 hover:bg-border transition-colors",
        "data-[resize-handle-state=drag]:bg-primary/20",
        className
      )}
    >
      {withHandle && (
        <div className={cn(
          "absolute z-10 flex items-center justify-center rounded-sm",
          "bg-border opacity-0 group-hover:opacity-100 transition-opacity",
          "group-data-[resize-handle-state=drag]:opacity-100",
          direction === 'vertical' 
            ? "h-4 w-8 -translate-y-1/2" 
            : "h-8 w-4 -translate-x-1/2"
        )}>
          {direction === 'vertical' ? (
            <GripHorizontal className="h-3 w-3 text-muted-foreground" />
          ) : (
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      )}
    </PanelResizeHandle>
  )
}
