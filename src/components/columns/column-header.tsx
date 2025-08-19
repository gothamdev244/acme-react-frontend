import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  Minimize2, 
  Maximize2, 
  RotateCcw,
  MoreVertical,
  Sparkles 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { cn } from '../../lib/utils'
import type { ColumnState } from '../../hooks/use-column-layout'

interface ColumnHeaderProps {
  title: string
  columnId: 'customer' | 'embedded' | 'spaceCopilot' | 'kms'
  currentState: ColumnState
  canManageColumns: boolean
  onStateChange: (state: ColumnState) => void
  onResetAll?: () => void
  className?: string
  showBorder?: boolean
  showAIBadge?: boolean
}

export function ColumnHeader({
  title,
  columnId,
  currentState,
  canManageColumns,
  onStateChange,
  onResetAll,
  className,
  showBorder = true,
  showAIBadge = false
}: ColumnHeaderProps) {
  if (!canManageColumns) {
    // Simple header without controls for restricted roles
    return (
      <div className={cn(
        "flex items-center justify-between h-12 px-4 bg-muted/30",
        showBorder && "border-b",
        className
      )}>
        <div className="flex items-center gap-2">
          {showAIBadge && <Sparkles className="h-4 w-4 text-red-600" />}
          <h2 className="text-sm font-medium truncate">{title}</h2>
          {showAIBadge && (
            <Badge variant="secondary" className="text-xs bg-red-50 text-red-600 border-red-200">
              AI
            </Badge>
          )}
        </div>
      </div>
    )
  }

  const isCollapsed = currentState === 'collapsed'
  const isMaximized = currentState === 'maximized'
  const isNormal = currentState === 'normal'

  return (
    <div className={cn(
      "flex items-center justify-between h-12 px-2 bg-muted/30 transition-all duration-200",
      showBorder && "border-b",
      isCollapsed && "px-1",
      className
    )}>
      {/* Title - hidden when collapsed */}
      {!isCollapsed && (
        <div className="flex items-center gap-2 px-2">
          {showAIBadge && <Sparkles className="h-4 w-4 text-red-600" />}
          <h2 className="text-sm font-medium truncate">{title}</h2>
          {showAIBadge && (
            <Badge variant="secondary" className="text-xs bg-red-50 text-red-600 border-red-200">
              AI
            </Badge>
          )}
        </div>
      )}
      
      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Collapse/Expand toggle */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 icon-button-red-hover",
            isCollapsed && "h-6 w-6"
          )}
          onClick={() => {
            const newState = isCollapsed ? 'normal' : 'collapsed'
            onStateChange(newState)
          }}
          title={isCollapsed ? `Expand ${title}` : `Collapse ${title}`}
        >
          {/* Use intuitive icons that don't depend on direction:
              - Expanded: Show minimize icon (collapse)
              - Collapsed: Show maximize icon (expand) */}
          {isCollapsed ? (
            // Show maximize icon when collapsed
            <Maximize2 className="h-3 w-3" />
          ) : (
            // Show minimize icon when expanded
            <Minimize2 className="h-3 w-3" />
          )}
        </Button>

        {/* More options - only show when not collapsed */}
        {!isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 icon-button-red-hover"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {!isMaximized && (
                <DropdownMenuItem
                  onClick={() => onStateChange('maximized')}
                  className="text-xs"
                >
                  <Maximize2 className="mr-2 h-3 w-3" />
                  Maximize
                </DropdownMenuItem>
              )}
              
              {isMaximized && (
                <DropdownMenuItem
                  onClick={() => onStateChange('normal')}
                  className="text-xs"
                >
                  <Minimize2 className="mr-2 h-3 w-3" />
                  Restore
                </DropdownMenuItem>
              )}
              
              {!isNormal && (
                <DropdownMenuItem
                  onClick={() => onStateChange('normal')}
                  className="text-xs"
                >
                  <RotateCcw className="mr-2 h-3 w-3" />
                  Reset Size
                </DropdownMenuItem>
              )}
              
              {onResetAll && (
                <>
                  <DropdownMenuItem
                    onClick={onResetAll}
                    className="text-xs border-t mt-1 pt-1"
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Reset All Columns
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
