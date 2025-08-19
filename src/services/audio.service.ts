/**
 * Audio Service - Handles call ringtones and audio notifications
 */

interface AudioPlaybackResult {
  success: boolean
  error?: string
}

// Ringtone options mapping (only using available files)
const RINGTONE_PATHS = {
  'default': '/electro_hsbc.mp3',
  'gentle': '/electro_hsbc.mp3',
  'professional': '/electro_hsbc.mp3', 
  'urgent': '/electro_hsbc.mp3'
}

class AudioService {
  private ringtone: HTMLAudioElement | null = null
  private isPlaying: boolean = false
  private readonly defaultVolume: number = 0.7

  /**
   * Get agent settings for audio configuration
   */
  private getAgentSettings() {
    const saved = localStorage.getItem('agent-settings')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return null
      }
    }
    return null
  }

  /**
   * Initialize the ringtone audio element
   */
  private initRingtone(): void {
    if (!this.ringtone) {
      const settings = this.getAgentSettings()
      const ringtoneType = settings?.audio?.ringtone || 'default'
      const volume = settings?.audio?.volume || 70
      
      const ringtonePath = RINGTONE_PATHS[ringtoneType as keyof typeof RINGTONE_PATHS] || RINGTONE_PATHS.default
      
      this.ringtone = new Audio(ringtonePath)
      this.ringtone.loop = true
      this.ringtone.volume = volume / 100 // Convert percentage to 0-1
      
      // Handle audio events
      this.ringtone.addEventListener('ended', () => {
        this.isPlaying = false
      })
      
      this.ringtone.addEventListener('error', (e: Event) => {
      })

      this.ringtone.addEventListener('canplaythrough', () => {
      })
    }
  }

  /**
   * Play the incoming call ringtone
   */
  async playRingtone(): Promise<AudioPlaybackResult> {
    // Check if sound notifications are enabled
    const settings = this.getAgentSettings()
    if (!settings?.notifications?.sounds?.incoming) {
      return { success: false, error: 'Incoming call sounds disabled' }
    }

    this.initRingtone()
    
    if (!this.ringtone || this.isPlaying) {
      return { success: false, error: 'Ringtone already playing or not initialized' }
    }

    this.ringtone.currentTime = 0

    try {
      await this.ringtone.play()
      this.isPlaying = true
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('NotAllowedError') || errorMessage.includes('play')) {
      } else {
      }
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Stop the ringtone (when call is answered/rejected)
   */
  stopRingtone(): void {
    if (this.ringtone) {
      try {
        this.ringtone.pause()
        this.ringtone.currentTime = 0
        this.isPlaying = false
      } catch (error) {
        this.isPlaying = false
      }
    } else {
      // Force stop any playing audio elements
      const audioElements = document.querySelectorAll('audio')
      audioElements.forEach(audio => {
        if (!audio.paused) {
          audio.pause()
          audio.currentTime = 0
        }
      })
      this.isPlaying = false
    }
  }

  /**
   * Check if ringtone is currently playing
   */
  isRingtoneActive(): boolean {
    return this.isPlaying
  }

  /**
   * Force stop all audio on the page (emergency stop)
   */
  forceStopAllAudio(): void {
    // Stop our managed ringtone
    this.stopRingtone()
    
    // Force stop any other audio elements
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      if (!audio.paused) {
        audio.pause()
        audio.currentTime = 0
      }
    })
    
    // Reset our state
    this.isPlaying = false
  }

  /**
   * Play a short notification sound for other events
   */
  playNotification(): void {
    // Could add other notification sounds here
  }

  /**
   * Set ringtone volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    
    if (this.ringtone) {
      this.ringtone.volume = clampedVolume
    }
  }

  /**
   * Get current volume level
   */
  getVolume(): number {
    return this.ringtone?.volume ?? this.defaultVolume
  }

  /**
   * Test/preview a specific ringtone
   */
  async testRingtone(ringtoneType: string = 'default'): Promise<AudioPlaybackResult> {
    // Force reinitialize with new ringtone
    this.cleanup()
    
    const ringtonePath = RINGTONE_PATHS[ringtoneType as keyof typeof RINGTONE_PATHS] || RINGTONE_PATHS.default
    const settings = this.getAgentSettings()
    const volume = settings?.audio?.volume || 70
    
    this.ringtone = new Audio(ringtonePath)
    this.ringtone.volume = volume / 100
    this.ringtone.currentTime = 0

    try {
      // Play for 3 seconds only (test mode)
      await this.ringtone.play()
      this.isPlaying = true
      
      // Stop after 3 seconds
      setTimeout(() => {
        this.stopRingtone()
      }, 3000)
      
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Preload the audio file for better performance
   */
  preloadAudio(): void {
    this.initRingtone()
    if (this.ringtone) {
      this.ringtone.load()
    }
  }

  /**
   * Clean up audio resources
   */
  cleanup(): void {
    this.stopRingtone()
    if (this.ringtone) {
      this.ringtone.removeEventListener('ended', () => {})
      this.ringtone.removeEventListener('error', () => {})
      this.ringtone.removeEventListener('canplaythrough', () => {})
      this.ringtone = null
    }
  }
}

// Export singleton instance
export const audioService = new AudioService()
export default audioService
export type { AudioPlaybackResult }
