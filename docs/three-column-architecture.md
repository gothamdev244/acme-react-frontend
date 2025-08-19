# Three-Column Architecture

## Overview

The HSBC CCAAS Platform uses a sophisticated three-column layout architecture that provides agents with an organized, efficient workspace. This architecture divides the interface into three distinct functional areas while maintaining flexibility through collapsible columns and responsive behavior.

## Layout Structure

### Column Organization

```
┌─────────────────────────────────────────────────────────┐
│                    Global Header                         │
├─────────────┬─────────────────────┬────────────────────┤
│             │                     │                      │
│  Customer   │    Main Content     │   Space Copilot     │
│   Column    │      Column         │      Column         │
│             │                     │                      │
│   (Left)    │     (Center)        │      (Right)        │
│             │                     │                      │
│  - Info     │  - Transcript       │  - Knowledge Base   │
│  - History  │  - Summary          │  - AI Assistant     │
│             │  - Sentiment        │  - Embedded Apps    │
│             │  - Actions          │                      │
│             │                     │                      │
└─────────────┴─────────────────────┴────────────────────┘
```

### Column Responsibilities

#### 1. Customer Column (Left)
- **Purpose**: Display customer context and history
- **Components**:
  - Customer information card
  - Interaction history timeline
  - Verification status
  - Account details
- **Width**: Fixed 380px (desktop), collapsible

#### 2. Main Content Column (Center)
- **Purpose**: Primary workspace for active interactions
- **Components**:
  - Live call transcript
  - AI-generated summary
  - Sentiment analysis
  - Intent detection
  - Recommended actions
  - Priority indicators
- **Width**: Flexible, expands when side columns collapse

#### 3. Space Copilot Column (Right)
- **Purpose**: AI assistance and knowledge resources
- **Components**:
  - Knowledge base search
  - Quick actions
  - Embedded application frames
  - AI suggestions
- **Width**: Fixed 400px (desktop), collapsible

## Implementation Details

### Component Structure

```typescript
// src/components/layout/column-layout.tsx
export function ColumnLayout() {
  const { 
    isCustomerColumnCollapsed,
    isSpaceCopilotCollapsed,
    toggleCustomerColumn,
    toggleSpaceCopilotColumn
  } = useColumnLayout()

  return (
    <div className="flex h-screen">
      {!isCustomerColumnCollapsed && (
        <div className="w-[380px] border-r">
          <CustomerColumn />
        </div>
      )}
      
      <div className="flex-1">
        <MainContent />
      </div>
      
      {!isSpaceCopilotCollapsed && (
        <div className="w-[400px] border-l">
          <SpaceCopilotColumn />
        </div>
      )}
    </div>
  )
}
```

### State Management

The column layout state is managed through a custom hook:

```typescript
// src/hooks/use-column-layout.ts
export function useColumnLayout() {
  const [state, setState] = useState(() => {
    // Load saved preferences from localStorage
    const saved = localStorage.getItem('column-layout')
    return saved ? JSON.parse(saved) : defaultState
  })

  const toggleCustomerColumn = () => {
    setState(prev => {
      const updated = {
        ...prev,
        isCustomerColumnCollapsed: !prev.isCustomerColumnCollapsed
      }
      localStorage.setItem('column-layout', JSON.stringify(updated))
      return updated
    })
  }

  // Similar for other columns...
  return { ...state, toggleCustomerColumn, toggleSpaceCopilotColumn }
}
```

## Responsive Behavior

### Breakpoint Strategy

```css
/* Desktop (>1440px) */
- All three columns visible by default
- Full functionality enabled
- Optimal spacing and sizing

/* Laptop (1024px - 1440px) */
- Space Copilot column auto-collapses
- Customer column remains visible
- Main content takes priority

/* Tablet (768px - 1024px) */
- Only main content visible by default
- Side columns accessible via toggle
- Overlays instead of side-by-side

/* Mobile (<768px) */
- Single column view
- Tab navigation between sections
- Optimized touch interactions
```

### Responsive Implementation

```typescript
const useResponsiveColumns = () => {
  const screenSize = useMediaQuery()
  
  useEffect(() => {
    if (screenSize < 1024) {
      collapseSpaceCopilot()
    }
    if (screenSize < 768) {
      collapseCustomer()
    }
  }, [screenSize])
}
```

## Collapsible Columns

### Collapse Controls

Each column has a collapse button in its header:

```typescript
<button
  onClick={toggleColumn}
  className="p-1 hover:bg-gray-100 rounded"
  aria-label="Toggle column visibility"
>
  {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
</button>
```

### Animation

Smooth transitions using Tailwind CSS:

```css
.column-transition {
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.column-collapsed {
  width: 0;
  overflow: hidden;
}
```

### Collapsed State Indicators

When collapsed, a vertical tab shows the column can be expanded:

```typescript
{isCollapsed && (
  <CollapsedColumnIndicator
    title="Customer Info"
    onClick={toggleColumn}
    position="left"
  />
)}
```

## State Persistence

### localStorage Integration

Column preferences are automatically saved:

```typescript
const STORAGE_KEY = 'hsbc-column-layout'

const saveLayout = (layout: LayoutState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
}

const loadLayout = (): LayoutState => {
  const saved = localStorage.getItem(STORAGE_KEY)
  return saved ? JSON.parse(saved) : defaultLayout
}
```

### Persisted Properties

- Column visibility states
- Column widths (if resizable)
- User preferences
- Last active tab

## Keyboard Shortcuts

### Global Shortcuts

```typescript
const keyboardShortcuts = {
  'Alt+1': toggleCustomerColumn,
  'Alt+2': focusMainContent,
  'Alt+3': toggleSpaceCopilotColumn,
  'Alt+0': resetLayout
}
```

### Implementation

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.altKey) {
      switch(e.key) {
        case '1':
          toggleCustomerColumn()
          break
        case '3':
          toggleSpaceCopilotColumn()
          break
      }
    }
  }
  
  window.addEventListener('keydown', handleKeyPress)
  return () => window.removeEventListener('keydown', handleKeyPress)
}, [])
```

## Performance Optimizations

### Lazy Loading

Side columns load content only when visible:

```typescript
{!isCustomerColumnCollapsed && (
  <Suspense fallback={<ColumnSkeleton />}>
    <CustomerColumn />
  </Suspense>
)}
```

### Memoization

Prevent unnecessary re-renders:

```typescript
const CustomerColumn = memo(() => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison logic
  return prevProps.isCollapsed === nextProps.isCollapsed
})
```

### Virtual Scrolling

Long lists use virtual scrolling:

```typescript
<VirtualList
  height={600}
  itemCount={interactions.length}
  itemSize={80}
  renderItem={renderInteraction}
/>
```

## Accessibility

### ARIA Attributes

```html
<div role="region" aria-label="Customer Information">
  <button aria-expanded="false" aria-controls="customer-panel">
    Toggle Customer Information
  </button>
  <div id="customer-panel" aria-hidden="true">
    <!-- Content -->
  </div>
</div>
```

### Focus Management

```typescript
const handleColumnToggle = (columnId: string) => {
  toggleColumn(columnId)
  
  // Move focus to newly visible content
  if (!isCollapsed) {
    const element = document.getElementById(columnId)
    element?.focus()
  }
}
```

### Screen Reader Support

- Proper heading hierarchy
- Descriptive labels
- Status announcements
- Keyboard navigation

## Customization

### Configuration Options

```typescript
interface ColumnConfig {
  customerColumn: {
    width: number
    collapsible: boolean
    defaultCollapsed: boolean
  }
  mainColumn: {
    minWidth: number
  }
  spaceCopilotColumn: {
    width: number
    collapsible: boolean
    defaultCollapsed: boolean
  }
}
```

### Theme Integration

Columns respect the application theme:

```css
.column-container {
  @apply bg-background border-border;
}

.dark .column-container {
  @apply bg-background border-border;
}
```

## Best Practices

### 1. Content Priority
- Most important information in main column
- Supporting context in side columns
- Progressive disclosure for complex data

### 2. Responsive Design
- Test on multiple screen sizes
- Ensure touch-friendly controls
- Maintain functionality when columns collapse

### 3. Performance
- Lazy load heavy components
- Use virtual scrolling for long lists
- Minimize re-renders with proper memoization

### 4. User Experience
- Remember user preferences
- Provide clear visual feedback
- Smooth animations and transitions
- Intuitive keyboard shortcuts

## Troubleshooting

### Common Issues

1. **Column not collapsing**
   - Check localStorage permissions
   - Verify state management hooks
   - Ensure CSS transitions are applied

2. **Layout breaking on resize**
   - Review responsive breakpoints
   - Check flexbox/grid configurations
   - Verify media query listeners

3. **Performance issues**
   - Profile component renders
   - Check for unnecessary re-renders
   - Implement proper memoization

## Future Enhancements

### Planned Features
- Resizable column widths
- Drag-and-drop column reordering
- Custom column configurations per role
- Column presets/templates
- Multi-monitor support

### Under Consideration
- Floating/detachable columns
- Column content tabs
- Horizontal column splits
- Picture-in-picture mode
- Column sharing between agents
