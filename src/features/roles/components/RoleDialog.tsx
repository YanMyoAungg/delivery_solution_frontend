import {} from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@/lib/zodResolver'
import { toNullableString } from '@/lib/nullable'
import { getApiErrorMessage } from '@/lib/api/client'
import { useCreateRole, useUpdateRole } from '@/lib/api/roles'
import {
  createRoleSchema,
  updateRoleSchema,
  type CreateRoleValues,
  type UpdateRoleValues,
} from '@/lib/validations/roles'
import type { components } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
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

type FormValues = CreateRoleValues | UpdateRoleValues

export function RoleDialog({ open, role, onClose }: RoleDialogProps) {
  const isEdit = !!role
  const form = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateRoleSchema : createRoleSchema) as never,
    defaultValues: isEdit
      ? { description: toNullableString(role?.description ?? null) ?? '' }
      : { name: '', description: '' },
  })

  const createRoleMutation = useCreateRole()
  const updateRoleMutation = useUpdateRole()
  const { formState: { errors } } = form

  async function onSubmit(data: FormValues) {
    try {
      if (isEdit) {
        const v = data as UpdateRoleValues
        await updateRoleMutation.mutateAsync({
          id: role!.id,
          body: { description: v.description || null },
        })
        toast.success('Role updated')
      } else {
        const v = data as CreateRoleValues
        await createRoleMutation.mutateAsync({
          name: v.name,
          description: v.description || null,
        })
        toast.success('Role created')
      }
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
            <DialogTitle>{isEdit ? 'Edit role' : 'New role'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Update the role description.' : 'Create a role to group permissions.'}
            </DialogDescription>
          </DialogHeader>

          {isEdit ? (
            <dl className="flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{role?.name}</dd>
              </div>
              {role?.isSystem && (
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd><Badge>System role</Badge></dd>
                </div>
              )}
            </dl>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="role-name">Name</Label>
              <Input id="role-name" placeholder="MANAGER" autoFocus required {...form.register('name', { onChange: (e) => { e.target.value = e.target.value.toUpperCase() } })} />
              {(errors as unknown as Record<string, { message?: string } | undefined>).name && <p className="text-xs text-destructive">{(errors as unknown as Record<string, { message?: string } | undefined>).name!.message}</p>}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="role-description">Description</Label>
            <Input id="role-description" placeholder="Optional description" {...form.register('description')} />
          </div>

          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
              {isEdit ? 'Save changes' : 'Create role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
