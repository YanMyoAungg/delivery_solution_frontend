import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { Role } from '../api'
import { CreateRoleForm } from './CreateRoleForm'
import { EditRoleForm } from './EditRoleForm'

interface RoleDialogProps {
  open: boolean
  /** `null` in create mode. Its presence is what discriminates the two modes. */
  role: Role | null
  onClose: () => void
}

/**
 * Owns the dialog and nothing else — visibility and mode. The two modes have no
 * editable field in common (a role's `name` is immutable after create, so edit
 * only touches the description), so they stay two form components rather than
 * one mode-driven form with a conditional field.
 *
 * Each child renders its own `<Form>` (and its own `FormBody`), because the
 * submit button has to be inside the same `<form>` as the fields it submits.
 *
 * Both children reset on close, so the caller no longer needs
 * `key={roleToEdit?.id ?? 'new'}` to discard half-typed input between opens.
 */
export function RoleDialog({ open, role, onClose }: RoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        {role ? (
          <EditRoleForm role={role} onClose={onClose} />
        ) : (
          <CreateRoleForm onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
