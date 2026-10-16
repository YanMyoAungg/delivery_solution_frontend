import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TownshipForm } from '@/features/townships/TownshipForm'
import type { Township, TownshipBody } from '@/features/orders/api'

interface TownshipDialogProps {
  township: Township | null
  open: boolean
  pending: boolean
  onClose: () => void
  onSave: (body: TownshipBody) => Promise<void>
}

export function TownshipDialog({ township, open, pending, onClose, onSave }: TownshipDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{township ? 'Edit township' : 'Create township'}</DialogTitle><DialogDescription>Set order defaults for this service area.</DialogDescription></DialogHeader>
        <TownshipForm key={township?.id ?? 'new-township'} township={township} pending={pending} onCancel={onClose} onSave={onSave} />
      </DialogContent>
    </Dialog>
  )
}
