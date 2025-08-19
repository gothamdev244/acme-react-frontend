import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Switch } from './ui/switch'
import { Slider } from './ui/slider'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { ScrollArea } from './ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { 
  Settings, 
  Phone, 
  Volume2, 
  Bell, 
  Shield, 
  Accessibility, 
  Globe, 
  HelpCircle,
  Play,
  Trash2,
  Keyboard,
  Layout,
  Monitor
} from 'lucide-react'
import { audioService } from '../services/audio.service'
import { useAgentSettings } from '../hooks/use-agent-settings'
import { useAgentStatus } from '../hooks/use-agent-status'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

// Agent-focused settings interfaces
interface AgentSettings {
  calls: {
    autoAccept: boolean
    afterCallWorkTime: number // 0-120 seconds
    doNotDisturb: {
      enabled: boolean
      duration: 15 | 30 | 60 // minutes
      originalStatus?: string
    }
    confirmBeforeEnd: boolean
    requireActionsCompletion: boolean
  }
  audio: {
    ringtone: string
    volume: number // 0-100
    outputDevice: string
  }
  notifications: {
    desktop: boolean
    sounds: {
      incoming: boolean
      end: boolean
      error: boolean
    }
  }
  privacy: {
    idleTimeout: number // minutes before auto-logout
    rememberCallHistory: boolean
  }
  accessibility: {
    textSize: 'small' | 'medium' | 'large'
    highContrast: boolean
  }
  interface: {
    spaceCopilotMode: 'column' | 'overlay'
    spaceCopilotOverlayPosition: 'right' | 'left'
    showWidgetBorders: boolean
    compactMode: boolean
    showTranscript: boolean
    autoCloseKnowledgeOnCallEnd: boolean
  }
  language: string
}

const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  calls: {
    autoAccept: false,
    afterCallWorkTime: 30,
    doNotDisturb: {
      enabled: false,
      duration: 15
    },
    confirmBeforeEnd: true,
    requireActionsCompletion: false
  },
  audio: {
    ringtone: 'default',
    volume: 70,
    outputDevice: 'default'
  },
  notifications: {
    desktop: true,
    sounds: {
      incoming: true,
      end: true,
      error: true
    }
  },
  privacy: {
    idleTimeout: 30,
    rememberCallHistory: false
  },
  accessibility: {
    textSize: 'medium',
    highContrast: false
  },
  interface: {
    spaceCopilotMode: 'column',
    spaceCopilotOverlayPosition: 'right',
    showWidgetBorders: true,
    compactMode: false,
    showTranscript: true,
    autoCloseKnowledgeOnCallEnd: true
  },
  language: 'en'
}

const RINGTONES = [
  { value: 'default', label: 'Default Ring' },
  { value: 'gentle', label: 'Gentle Chime' },
  { value: 'professional', label: 'Professional Tone' },
  { value: 'urgent', label: 'Urgent Alert' }
]

const LANGUAGES = [
  { value: 'en', label: 'English (UK)' },
  { value: 'en-us', label: 'English (US)' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'zh', label: '中文' }
]

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  
  const { settings, updateSettings, updateNestedSettings } = useAgentSettings()
  const { handleDoNotDisturbToggle, status, doNotDisturbSecondsRemaining } = useAgentStatus()

  // Request desktop notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        updateNestedSettings('notifications', { desktop: true })
      } else {
        updateNestedSettings('notifications', { desktop: false })
      }
    }
  }

  // Test ringtone playback
  const testRingtone = async () => {
    
    try {
      const result = await audioService.testRingtone(settings.audio.ringtone)
      if (result.success) {
        // Show brief notification if desktop notifications are enabled
        if ('Notification' in window && Notification.permission === 'granted' && settings.notifications.desktop) {
          new Notification('Ringtone Test', {
            body: `Playing ${RINGTONES.find(r => r.value === settings.audio.ringtone)?.label} at ${settings.audio.volume}% volume`,
            icon: '/hsbc-logo.png'
          })
        }
      } else {
        // Ringtone test failed
        // Fallback: show alert if audio fails
        alert(`Ringtone test failed: ${result.error}`)
      }
    } catch (error) {
      // Error testing ringtone
    }
  }


  // Apply text size to document
  useEffect(() => {
    const root = document.documentElement
    const textSizeMap = {
      small: '14px',
      medium: '16px', 
      large: '18px'
    }
    root.style.fontSize = textSizeMap[settings.accessibility.textSize]
  }, [settings.accessibility.textSize])

  // Apply high contrast mode
  useEffect(() => {
    const root = document.documentElement
    if (settings.accessibility.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
  }, [settings.accessibility.highContrast])

  // Fix pointer-events issue when dialog closes - Radix UI bug workaround
  useEffect(() => {
    if (!isOpen) {
      // Small delay to ensure Radix cleanup completes, then force restore pointer-events
      const timeoutId = setTimeout(() => {
        document.body.style.pointerEvents = ''
        document.body.style.removeProperty('pointer-events')
        document.documentElement.style.pointerEvents = ''
        document.documentElement.style.removeProperty('pointer-events')
      }, 200)
      return () => clearTimeout(timeoutId)
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Agent Settings
          </DialogTitle>
          <DialogDescription>
            Configure your agent preferences, call settings, and interface options.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="calls" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="calls" className="p-2">
              <Phone className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="audio" className="p-2">
              <Volume2 className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="notifications" className="p-2">
              <Bell className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="privacy" className="p-2">
              <Shield className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="interface" className="p-2">
              <Layout className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="p-2">
              <Accessibility className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="language" className="p-2">
              <Globe className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="help" className="p-2">
              <HelpCircle className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          {/* Calls Tab */}
          <TabsContent value="calls" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4 pb-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-accept calls</Label>
                  <p className="text-sm text-muted-foreground">Automatically accept incoming calls</p>
                </div>
                <Switch
                  checked={settings.calls.autoAccept}
                  onCheckedChange={(checked) => updateNestedSettings('calls', { autoAccept: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label>After-call work time: {settings.calls.afterCallWorkTime} seconds</Label>
                <Slider
                  value={[settings.calls.afterCallWorkTime]}
                  onValueChange={([value]) => updateNestedSettings('calls', { afterCallWorkTime: value })}
                  max={120}
                  min={0}
                  step={15}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Do Not Disturb</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={status === 'do-not-disturb'}
                    onCheckedChange={(enabled) => {
                      if (enabled) {
                        handleDoNotDisturbToggle(true, settings.calls.doNotDisturb.duration)
                      } else {
                        handleDoNotDisturbToggle(false, settings.calls.doNotDisturb.duration)
                      }
                    }}
                  />
                  <Select
                    value={settings.calls.doNotDisturb.duration.toString()}
                    onValueChange={(value) => updateNestedSettings('calls', {
                      doNotDisturb: { ...settings.calls.doNotDisturb, duration: parseInt(value) as 15 | 30 | 60 }
                    })}
                    disabled={status === 'do-not-disturb'}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                    </SelectContent>
                  </Select>
                  {status === 'do-not-disturb' && doNotDisturbSecondsRemaining > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {Math.floor(doNotDisturbSecondsRemaining / 60)}:{(doNotDisturbSecondsRemaining % 60).toString().padStart(2, '0')} remaining
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Confirm before ending call</Label>
                  <p className="text-sm text-muted-foreground">Show confirmation dialog when ending calls</p>
                </div>
                <Switch
                  checked={settings.calls.confirmBeforeEnd}
                  onCheckedChange={(checked) => updateNestedSettings('calls', { confirmBeforeEnd: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require actions completion</Label>
                  <p className="text-sm text-muted-foreground">Agent must complete all recommended actions before ending call</p>
                </div>
                <Switch
                  checked={settings.calls.requireActionsCompletion}
                  onCheckedChange={(checked) => updateNestedSettings('calls', { requireActionsCompletion: checked })}
                />
              </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ringtone</Label>
                <div className="flex gap-2">
                  <Select
                    value={settings.audio.ringtone}
                    onValueChange={(value) => updateNestedSettings('audio', { ringtone: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RINGTONES.map(ringtone => (
                        <SelectItem key={ringtone.value} value={ringtone.value}>
                          {ringtone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={testRingtone}>
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Volume: {settings.audio.volume}%</Label>
                <Slider
                  value={[settings.audio.volume]}
                  onValueChange={([value]) => updateNestedSettings('audio', { volume: value })}
                  max={100}
                  min={0}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Output Device</Label>
                <Select
                  value={settings.audio.outputDevice}
                  onValueChange={(value) => updateNestedSettings('audio', { outputDevice: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default Audio Device</SelectItem>
                    <SelectItem value="speakers">Speakers</SelectItem>
                    <SelectItem value="headset">Headset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Desktop notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Status: {Notification?.permission || 'not supported'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Switch
                    checked={settings.notifications.desktop}
                    onCheckedChange={(checked) => {
                      if (checked && Notification?.permission !== 'granted') {
                        requestNotificationPermission()
                      } else {
                        updateNestedSettings('notifications', { desktop: checked })
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sound Notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Incoming calls</Label>
                    <Switch
                      checked={settings.notifications.sounds.incoming}
                      onCheckedChange={(checked) => updateNestedSettings('notifications', {
                        sounds: { ...settings.notifications.sounds, incoming: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Call end</Label>
                    <Switch
                      checked={settings.notifications.sounds.end}
                      onCheckedChange={(checked) => updateNestedSettings('notifications', {
                        sounds: { ...settings.notifications.sounds, end: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Errors</Label>
                    <Switch
                      checked={settings.notifications.sounds.error}
                      onCheckedChange={(checked) => updateNestedSettings('notifications', {
                        sounds: { ...settings.notifications.sounds, error: checked }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-4 mt-4">
            <div className="space-y-4">

              <div className="space-y-2">
                <Label>Auto-logout after idle: {settings.privacy.idleTimeout} minutes</Label>
                <p className="text-sm text-muted-foreground">Automatically log out after period of inactivity</p>
                <Slider
                  value={[settings.privacy.idleTimeout]}
                  onValueChange={([value]) => updateNestedSettings('privacy', { idleTimeout: value })}
                  max={120}
                  min={5}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5 min</span>
                  <span>2 hours</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Remember call history</Label>
                  <p className="text-sm text-muted-foreground">Keep local history of recent calls for quick reference</p>
                </div>
                <Switch
                  checked={settings.privacy.rememberCallHistory}
                  onCheckedChange={(checked) => updateNestedSettings('privacy', { rememberCallHistory: checked })}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">Privacy Protection</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      All call data is automatically encrypted and cleared after each session. 
                      These settings provide additional privacy controls for your workspace.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Interface Tab */}
          <TabsContent value="interface" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-4 p-4 pb-6">
              <div className="space-y-2">
                <Label>Space Copilot Display Mode</Label>
                <Select
                  value={settings.interface.spaceCopilotMode}
                  onValueChange={(value: 'column' | 'overlay') => 
                    updateNestedSettings('interface', { spaceCopilotMode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="column">Column (Always visible)</SelectItem>
                    <SelectItem value="overlay">Overlay (On-demand)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Column mode shows Space Copilot as a fixed column. Overlay mode shows it as a floating panel.
                </p>
              </div>

              {settings.interface.spaceCopilotMode === 'overlay' && (
                <div className="space-y-2">
                  <Label>Overlay Position</Label>
                  <Select
                    value={settings.interface.spaceCopilotOverlayPosition}
                    onValueChange={(value: 'right' | 'left') => 
                      updateNestedSettings('interface', { spaceCopilotOverlayPosition: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="right">Right side</SelectItem>
                      <SelectItem value="left">Left side</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show widget borders</Label>
                  <p className="text-sm text-muted-foreground">Display borders around dashboard widgets</p>
                </div>
                <Switch
                  checked={settings.interface.showWidgetBorders}
                  onCheckedChange={(checked) => updateNestedSettings('interface', { showWidgetBorders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact mode</Label>
                  <p className="text-sm text-muted-foreground">Reduce padding and spacing for more content density</p>
                </div>
                <Switch
                  checked={settings.interface.compactMode}
                  onCheckedChange={(checked) => updateNestedSettings('interface', { compactMode: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Transcript in Space Copilot</Label>
                  <p className="text-sm text-muted-foreground">Display call transcript alongside AI assistance</p>
                </div>
                <Switch
                  checked={settings.interface.showTranscript}
                  onCheckedChange={(checked) => updateNestedSettings('interface', { showTranscript: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-close Knowledge on Call End</Label>
                  <p className="text-sm text-muted-foreground">Automatically close knowledge articles when call ends</p>
                </div>
                <Switch
                  checked={settings.interface.autoCloseKnowledgeOnCallEnd}
                  onCheckedChange={(checked) => updateNestedSettings('interface', { autoCloseKnowledgeOnCallEnd: checked })}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Monitor className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">Interface Tip</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Overlay mode is ideal for users with smaller screens or those who prefer more workspace. 
                      Column mode provides constant access to AI assistance.
                    </p>
                  </div>
                </div>
              </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Accessibility Tab */}
          <TabsContent value="accessibility" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Text size</Label>
                <Select
                  value={settings.accessibility.textSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') => 
                    updateNestedSettings('accessibility', { textSize: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>High-contrast mode</Label>
                  <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                </div>
                <Switch
                  checked={settings.accessibility.highContrast}
                  onCheckedChange={(checked) => updateNestedSettings('accessibility', { highContrast: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>App language</Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => updateSettings({ language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Help Tab */}
          <TabsContent value="help" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Keyboard shortcuts</Label>
                <div className="bg-muted p-3 rounded-md text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Global search</span>
                    <code>Ctrl+F / Cmd+F</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Accept call</span>
                    <code>Enter</code>
                  </div>
                  <div className="flex justify-between">
                    <span>End call</span>
                    <code>Ctrl+E</code>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Report an issue</Label>
                <p className="text-sm text-muted-foreground">
                  Attach the last 5 minutes of client logs for support
                </p>
                <Button variant="outline" className="w-full">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Quick training tips</Label>
                <div className="bg-muted p-3 rounded-md text-sm">
                  <p className="font-medium mb-2">💡 Pro Tips:</p>
                  <ul className="space-y-1">
                    <li>• Use Do Not Disturb during admin tasks</li>
                    <li>• Test your ringtone and volume regularly</li>
                    <li>• Clear cache weekly for optimal performance</li>
                    <li>• Enable desktop notifications for alerts</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
