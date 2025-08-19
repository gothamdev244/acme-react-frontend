import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import type { ColumnLayoutState } from '../../hooks/use-column-layout'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Switch } from '../ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { 
  Grid3x3, 
  Save, 
  FolderOpen,
  Layout,
  Maximize2,
  RotateCcw,
  Lock,
  Unlock,
  Download,
  Upload,
  Trash2,
  Check,
  Monitor,
  Users,
  Bot,
  FileText,
  PanelLeft,
  X,
  Sparkles,
  Zap,
  Target,
  Columns3,
  Eye,
  EyeOff
} from 'lucide-react'
import { useColumnLayout } from '../../hooks/use-column-layout'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'

interface SavedLayout {
  id: string
  name: string
  layout: any
  timestamp: number
  description?: string
}

interface LayoutManagerOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isKMSOpen: boolean
  setIsKMSOpen: (open: boolean) => void
}

// Visual preview component for layout
function LayoutPreview({ layout, isKMSOpen }: { layout: any, isKMSOpen: boolean }) {
  const getColumnWidth = (state: string) => {
    switch (state) {
      case 'collapsed': return 'w-2'
      case 'maximized': return 'flex-1'
      case 'normal':
      default: return 'w-16'
    }
  }

  return (
    <div className="h-32 bg-muted/30 rounded-lg p-3 flex gap-1">
      {/* Customer */}
      <div className={cn(
        "bg-blue-500/20 rounded border border-blue-500/40 flex items-center justify-center text-xs",
        getColumnWidth(layout.customer)
      )}>
        {layout.customer !== 'collapsed' && <Users className="h-4 w-4 text-blue-500" />}
      </div>
      
      {/* Embedded */}
      <div className={cn(
        "bg-green-500/20 rounded border border-green-500/40 flex items-center justify-center text-xs",
        getColumnWidth(layout.embedded)
      )}>
        {layout.embedded !== 'collapsed' && <Monitor className="h-4 w-4 text-green-500" />}
      </div>
      
      {/* KMS (if open) */}
      {isKMSOpen && (
        <div className={cn(
          "bg-purple-500/20 rounded border border-purple-500/40 flex items-center justify-center text-xs",
          getColumnWidth(layout.kms)
        )}>
          {layout.kms !== 'collapsed' && <FileText className="h-4 w-4 text-purple-500" />}
        </div>
      )}
      
      {/* Space Copilot */}
      <div className={cn(
        "bg-amber-500/20 rounded border border-amber-500/40 flex items-center justify-center text-xs",
        getColumnWidth(layout.spaceCopilot)
      )}>
        {layout.spaceCopilot !== 'collapsed' && <Bot className="h-4 w-4 text-amber-500" />}
      </div>
    </div>
  )
}

export function LayoutManagerOverlay({ 
  open, 
  onOpenChange, 
  isKMSOpen, 
  setIsKMSOpen 
}: LayoutManagerOverlayProps) {
  const { 
    layout, 
    updateColumn,
    applyLayout, 
    resetLayout,
    canManageColumns 
  } = useColumnLayout()
  
  const [savedLayouts, setSavedLayouts] = useState<SavedLayout[]>([])
  const [isLayoutLocked, setIsLayoutLocked] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // Load saved layouts from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ccaas-saved-layouts')
    if (saved) {
      setSavedLayouts(JSON.parse(saved))
    }
    
    const locked = localStorage.getItem('ccaas-layout-locked')
    setIsLayoutLocked(locked === 'true')
  }, [])

  // Quick layout presets
  const presets = [
    {
      id: 'standard',
      name: 'Standard View',
      description: 'All columns visible in normal size',
      icon: <Layout className="h-5 w-5" />,
      color: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30',
      layout: { customer: 'normal', embedded: 'normal', spaceCopilot: 'normal', kms: 'normal' }
    },
    {
      id: 'focus',
      name: 'Focus Mode',
      description: 'Maximize application for focused work',
      icon: <Target className="h-5 w-5" />,
      color: 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30',
      layout: { customer: 'collapsed', embedded: 'maximized', spaceCopilot: 'collapsed', kms: 'collapsed' }
    },
    {
      id: 'customer-focus',
      name: 'Customer Focus',
      description: 'Emphasize customer information',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30',
      layout: { customer: 'maximized', embedded: 'collapsed', spaceCopilot: 'collapsed', kms: 'collapsed' }
    },
    {
      id: 'ai-mode',
      name: 'AI Assistant',
      description: 'Maximize Space Copilot for AI assistance',
      icon: <Sparkles className="h-5 w-5" />,
      color: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30',
      layout: { customer: 'normal', embedded: 'normal', spaceCopilot: 'maximized', kms: 'collapsed' }
    },
    {
      id: 'compact',
      name: 'Compact View',
      description: 'Essential columns only',
      icon: <Columns3 className="h-5 w-5" />,
      color: 'bg-gray-500/10 hover:bg-gray-500/20 border-gray-500/30',
      layout: { customer: 'normal', embedded: 'normal', spaceCopilot: 'collapsed', kms: 'collapsed' }
    },
    {
      id: 'knowledge',
      name: 'Knowledge Mode',
      description: 'Focus on knowledge base and AI',
      icon: <FileText className="h-5 w-5" />,
      color: 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30',
      layout: { customer: 'collapsed', embedded: 'normal', spaceCopilot: 'normal', kms: 'normal' },
      kmsOpen: true
    }
  ]

  const applyPreset = (preset: typeof presets[0]) => {
    if (isLayoutLocked || !canManageColumns) {
      toast.error('Layout is locked or you don\'t have permission')
      return
    }

    // Apply the complete layout at once using the new applyLayout function
    applyLayout(preset.layout as Partial<ColumnLayoutState>)
    
    // Handle KMS state
    if (preset.kmsOpen !== undefined) {
      setIsKMSOpen(preset.kmsOpen)
    } else if (preset.id !== 'knowledge') {
      // Close KMS for non-knowledge presets
      setIsKMSOpen(false)
    }
    
    toast.success(`Applied ${preset.name}`)
  }

  // Save current layout
  const saveCurrentLayout = () => {
    if (!saveName.trim()) {
      toast.error('Please enter a layout name')
      return
    }

    const newLayout: SavedLayout = {
      id: Date.now().toString(),
      name: saveName,
      description: saveDescription,
      layout: { ...layout, isKMSOpen },
      timestamp: Date.now()
    }

    const updated = [...savedLayouts, newLayout]
    setSavedLayouts(updated)
    localStorage.setItem('ccaas-saved-layouts', JSON.stringify(updated))
    
    setSaveName('')
    setSaveDescription('')
    setShowSaveDialog(false)
    toast.success(`Layout "${saveName}" saved`)
  }

  // Load saved layout
  const loadLayout = (saved: SavedLayout) => {
    if (isLayoutLocked || !canManageColumns) {
      toast.error('Layout is locked or you don\'t have permission')
      return
    }

    // Filter out non-column properties and apply the layout
    const columnLayout = Object.entries(saved.layout)
      .filter(([key]) => key !== 'isKMSOpen')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    
    applyLayout(columnLayout)
    setIsKMSOpen(saved.layout.isKMSOpen || false)
    
    toast.success(`Loaded "${saved.name}"`)
  }

  // Delete saved layout
  const deleteLayout = (id: string) => {
    const updated = savedLayouts.filter(l => l.id !== id)
    setSavedLayouts(updated)
    localStorage.setItem('ccaas-saved-layouts', JSON.stringify(updated))
    toast.success('Layout deleted')
  }

  // Toggle layout lock
  const toggleLayoutLock = () => {
    const newState = !isLayoutLocked
    setIsLayoutLocked(newState)
    localStorage.setItem('ccaas-layout-locked', String(newState))
    toast.success(newState ? 'Layout locked' : 'Layout unlocked')
  }

  // Export layouts
  const exportLayouts = () => {
    const data = {
      layouts: savedLayouts,
      currentLayout: layout,
      isKMSOpen,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ccaas-layouts-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Layouts exported')
  }

  // Import layouts
  const importLayouts = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return
      
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string)
          if (data.layouts) {
            setSavedLayouts(data.layouts)
            localStorage.setItem('ccaas-saved-layouts', JSON.stringify(data.layouts))
            toast.success('Layouts imported successfully')
          }
        } catch (error) {
          toast.error('Failed to import layouts')
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Grid3x3 className="h-6 w-6" />
                Layout Manager
              </DialogTitle>
              <DialogDescription>
                Customize your workspace layout for optimal productivity
              </DialogDescription>
            </div>
            {isLayoutLocked && (
              <Badge variant="secondary" className="text-xs">
                <Lock className="h-3 w-3 mr-1" />
                Locked
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="presets" className="flex-1">
          <TabsList className="w-full rounded-none border-b px-6">
            <TabsTrigger value="presets" className="gap-2">
              <Zap className="h-4 w-4" />
              Quick Presets
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-2">
              <Columns3 className="h-4 w-4" />
              Custom Layout
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Saved Layouts
              {savedLayouts.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {savedLayouts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] sm:h-[450px] lg:h-[500px]">
            <TabsContent value="presets" className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Current Layout Preview</h3>
                <LayoutPreview layout={layout} isKMSOpen={isKMSOpen} />
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3">Quick Layout Presets</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      disabled={isLayoutLocked || !canManageColumns}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-left group",
                        preset.color,
                        (isLayoutLocked || !canManageColumns) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-background">
                          {preset.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{preset.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {preset.description}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <LayoutPreview layout={preset.layout} isKMSOpen={preset.kmsOpen || false} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Current Layout Preview</h3>
                <LayoutPreview layout={layout} isKMSOpen={isKMSOpen} />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Column Visibility</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-blue-500" />
                      <Label htmlFor="customer-toggle" className="text-sm font-medium">
                        Customer Info
                      </Label>
                    </div>
                    <Switch
                      id="customer-toggle"
                      checked={layout.customer !== 'collapsed'}
                      onCheckedChange={(checked) => updateColumn('customer', checked ? 'normal' : 'collapsed')}
                      disabled={isLayoutLocked || !canManageColumns}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-green-500" />
                      <Label htmlFor="embedded-toggle" className="text-sm font-medium">
                        Application
                      </Label>
                    </div>
                    <Switch
                      id="embedded-toggle"
                      checked={layout.embedded !== 'collapsed'}
                      onCheckedChange={(checked) => updateColumn('embedded', checked ? 'normal' : 'collapsed')}
                      disabled={isLayoutLocked || !canManageColumns}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Bot className="h-4 w-4 text-amber-500" />
                      <Label htmlFor="copilot-toggle" className="text-sm font-medium">
                        Space Copilot
                      </Label>
                    </div>
                    <Switch
                      id="copilot-toggle"
                      checked={layout.spaceCopilot !== 'collapsed'}
                      onCheckedChange={(checked) => updateColumn('spaceCopilot', checked ? 'normal' : 'collapsed')}
                      disabled={isLayoutLocked || !canManageColumns}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-purple-500" />
                      <Label htmlFor="kms-toggle" className="text-sm font-medium">
                        Knowledge Base
                      </Label>
                    </div>
                    <Switch
                      id="kms-toggle"
                      checked={isKMSOpen}
                      onCheckedChange={setIsKMSOpen}
                      disabled={isLayoutLocked || !canManageColumns}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowSaveDialog(true)}
                  disabled={!canManageColumns}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Current Layout
                </Button>
                <Button
                  onClick={resetLayout}
                  variant="outline"
                  disabled={isLayoutLocked || !canManageColumns}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="saved" className="p-6 space-y-6">
              {savedLayouts.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="mt-4 text-sm font-medium">No saved layouts</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Save your current layout to quickly switch between different configurations
                  </p>
                  <Button
                    onClick={() => setShowSaveDialog(true)}
                    className="mt-4"
                    disabled={!canManageColumns}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Current Layout
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedLayouts.map((saved) => (
                    <div
                      key={saved.id}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium">{saved.name}</h4>
                          {saved.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {saved.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Saved {new Date(saved.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => loadLayout(saved)}
                            disabled={isLayoutLocked || !canManageColumns}
                          >
                            Apply
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteLayout(saved.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3">
                        <LayoutPreview 
                          layout={saved.layout} 
                          isKMSOpen={saved.layout.isKMSOpen || false} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="flex gap-3">
                <Button
                  onClick={exportLayouts}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export All
                </Button>
                <Button
                  onClick={importLayouts}
                  variant="outline"
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="p-4 sm:p-6 pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t gap-2 sm:gap-0">
          <Button
            onClick={toggleLayoutLock}
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
          >
            {isLayoutLocked ? (
              <>
                <Unlock className="h-4 w-4 mr-2" />
                Unlock Layout
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Lock Layout
              </>
            )}
          </Button>
          
          <div className="text-xs text-muted-foreground text-center sm:text-right">
            Use <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Ctrl</kbd>+<kbd className="px-1 py-0.5 rounded bg-muted text-xs">L</kbd> to open this dialog
          </div>
        </div>
      </DialogContent>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Layout</DialogTitle>
            <DialogDescription>
              Give your layout a name and optional description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="layout-name">Layout Name</Label>
              <Input
                id="layout-name"
                placeholder="e.g., Customer Service Mode"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="layout-description">Description (Optional)</Label>
              <Input
                id="layout-description"
                placeholder="e.g., Optimized for handling customer inquiries"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={saveCurrentLayout}
                disabled={!saveName.trim()}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Layout
              </Button>
              <Button
                onClick={() => {
                  setShowSaveDialog(false)
                  setSaveName('')
                  setSaveDescription('')
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
