import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/lib/zodResolver'
import { toNullableString } from '@/lib/nullable'
import { getApiErrorMessage } from '@/lib/api/client'
import { useCreateRole, useUpdateRole } from '../api'
import {
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleValues,
  type UpdateRoleValues,
} from '../validations'
import type { components } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Role = components['schemas']['RoleResponseDto']

interface RoleDialogProps {
  open: boolean
  role: Role | null
  onClose: () => void
}

interface CreateRoleFormProps {
  open: boolean
  onClose: () => void
}

function CreateRoleForm({ open, onClose }: CreateRoleFormProps) {
  const form = useForm<CreateRoleValues>({
    resolver: zodResolver<CreateRoleValues>(createRoleSchema),
    defaultValues: { name: '', description: '' },
  })
  const createRoleMutation = useCreateRole()
  const { formState: { errors } } = form

  async function onSubmit(data: CreateRoleValues) {
    try {
      await createRoleMutation.mutateAsync({
        name: data.name,
        description: data.description || null,
      })
      toast.success('Role created')
      onClose()
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New role</DialogTitle>
            <DialogDescription>Create a role to group permissions.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="role-name">Name</Label>
            <Input
              id="role-name"
              placeholder="MANAGER"
              autoFocus
              required
              {...form.register('name', {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase()
                },
              })}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="role-description">Description</Label>
            <Input
              id="role-description"
              placeholder="Optional description"
              {...form.register('description')}
            />
          </div>

          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          {/* Close first, submit second, so the footer reads [Close][Create] on
              desktop and stacks with Close on top on mobile. */}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Close
            </DialogClose>
            <Button type="submit" disabled={createRoleMutation.isPending}>
              Create role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditRoleFormProps {
  open: boolean
  role: Role
  onClose: () => void
}

function EditRoleForm({ open, role, onClose }: EditRoleFormProps) {
  const form = useForm<UpdateRoleValues>({
    resolver: zodResolver<UpdateRoleValues>(updateRoleSchema),
    defaultValues: { description: toNullableString(role.description ?? null) ?? '' },
  })
  const updateRoleMutation = useUpdateRole()
  const { formState: { errors } } = form

  async function onSubmit(data: UpdateRoleValues) {
    try {
      await updateRoleMutation.mutateAsync({
        id: role.id,
        body: { description: data.description || null },
      })
      toast.success('Role updated')
      onClose()
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
            <DialogDescription>Update the role description.</DialogDescription>
          </DialogHeader>

          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{role.name}</dd>
            </div>
            {role.isSystem && (
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Type</dt>
                <dd>
                  <Badge>System role</Badge>
                </dd>
              </div>
            )}
          </dl>

          <div className="flex flex-col gap-2">
            <Label htmlFor="role-description">Description</Label>
            <Input
              id="role-description"
              placeholder="Optional description"
              {...form.register('description')}
            />
          </div>

          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          {/* Close first, submit second, so the footer reads [Close][Save] on
              desktop and stacks with Close on top on mobile. */}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Close
            </DialogClose>
            <Button type="submit" disabled={updateRoleMutation.isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Split by mode rather than typed as a union: the update schema (description
 * only — role `name` is immutable after create) shares no field set with the
 * create schema, so a union type forced casts at `register`, `setError` and the
 * submit payload. The caller remounts per role (`key={roleToEdit?.id ?? 'new'}`).
 */
export function RoleDialog({ open, role, onClose }: RoleDialogProps) {
  return role ? (
    <EditRoleForm open={open} role={role} onClose={onClose} />
  ) : (
    <CreateRoleForm open={open} onClose={onClose} />
  )
}
