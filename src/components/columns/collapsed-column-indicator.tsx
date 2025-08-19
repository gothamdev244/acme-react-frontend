import { Button } from '../ui/button'
import { ChevronRight, ChevronLeft, Maximize2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip'

interface CollapsedColumnIndicatorProps {
  title: string
  columnId: 'customer' | 'embedded' | 'spaceCopilot' | 'kms'
  position: 'left' | 'right'
  onExpand: () => void
  canManageColumns: boolean
}

export function CollapsedColumnIndicator({
  title,
  columnId,
  position,
  onExpand,
  canManageColumns
}: CollapsedColumnIndicatorProps) {
  if (!canManageColumns) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex flex-col items-center justify-center",
            "w-8 bg-muted/50 border-r border-l hover:bg-muted/80 transition-colors cursor-pointer",
            "h-full group"
          )}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0 icon-button-red-hover"
              onClick={onExpand}
            >
              {/* Use maximize icon for all collapsed columns */}
              <Maximize2 className="h-3 w-3" />
            </Button>
            
            {/* Vertical text */}
            <div className={cn(
              "writing-mode-vertical-lr text-orientation-mixed",
              "text-xs text-muted-foreground mt-2 group-hover:text-foreground transition-colors"
            )} style={{
              writingMode: 'vertical-lr',
              textOrientation: 'mixed'
            }}>
              {title}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Expand {title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
