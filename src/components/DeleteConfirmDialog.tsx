import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description: string
  onConfirm: () => Promise<void>
  confirmLabel?: string
}

/**
 * Shared delete confirmation dialog. Manages confirm-button loading state
 * and catches promise rejections → toast.error. Replaces the three
 * identical AlertDialog blocks in Users/Roles/Permissions pages.
 */
export function DeleteConfirmDialog({
  open,
  onClose,
  title,
  description,
  onConfirm,
  confirmLabel = 'Delete',
}: DeleteConfirmDialogProps) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete'))
    } finally {
      setLoading(false)
      onClose()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
