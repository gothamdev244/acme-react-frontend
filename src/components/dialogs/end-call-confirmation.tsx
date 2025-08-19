import { PhoneOff, Phone, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'

interface EndCallConfirmationProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
  callerName?: string
  duration?: number
  incompleteActions?: number
  requireActionsCompletion?: boolean
}

export function EndCallConfirmation({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  callerName,
  duration,
  incompleteActions = 0,
  requireActionsCompletion = false
}: EndCallConfirmationProps) {
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <PhoneOff className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            End Call
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {/* Call Info */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
            {callerName && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Caller</span>
                <span className="font-medium">{callerName}</span>
              </div>
            )}
            {duration !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                <span className="font-medium">{formatDuration(duration)}</span>
              </div>
            )}
          </div>
          
          {/* Actions Warning */}
          {requireActionsCompletion && incompleteActions > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Incomplete Actions Required
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    You have {incompleteActions} pending action{incompleteActions !== 1 ? 's' : ''} that must be completed before ending this call.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Message */}
          <div className="text-center py-2">
            <p className="text-gray-700 dark:text-gray-300">
              {requireActionsCompletion && incompleteActions > 0 
                ? 'Complete all required actions before ending the call.' 
                : 'Are you sure you want to end this call?'
              }
            </p>
            {(!requireActionsCompletion || incompleteActions === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This action cannot be undone.
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <Phone className="h-4 w-4 mr-2" />
              Continue Call
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={requireActionsCompletion && incompleteActions > 0}
              className="flex-1"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              {requireActionsCompletion && incompleteActions > 0 ? 'Complete Actions First' : 'End Call'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
