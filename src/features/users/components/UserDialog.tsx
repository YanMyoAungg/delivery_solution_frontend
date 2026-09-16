import { useMemo } from 'react'
import { toast } from 'sonner'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@/lib/zodResolver'
import { useAuthStore } from '@/lib/store/auth.store'
import { filterAssignableRoles } from '@/lib/auth/filterAssignableRoles'
import { getApiErrorMessage } from '@/lib/api/client'
import { toNullableString } from '@/lib/nullable'
import { useRoles } from '@/lib/api/roles'
import { useCreateUser, useUpdateUser } from '@/lib/api/users'
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserValues,
  type UpdateUserValues,
} from '@/lib/validations/users'
import type { components } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type User = components['schemas']['UserResponseDto']
type UserStatus = components['schemas']['UserStatus']

interface UserDialogProps {
  state: { open: boolean; user?: User }
  onClose: () => void
}

type FormValues = CreateUserValues | UpdateUserValues

export function UserDialog({ state, onClose }: UserDialogProps) {
  const user = state.user
  const isEdit = !!user

  const form = useForm<FormValues>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema) as never,
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      phone: toNullableString(user?.phone ?? null) ?? '',
      roleId: user?.roleId ?? '',
      ...(isEdit
        ? { status: (user?.status ?? 'ACTIVE') as UserStatus, password: '' }
        : { password: '' }),
    },
  })

  const watchedRoleId = useWatch({ control: form.control, name: 'roleId' })
  const watchedStatus = useWatch({ control: form.control, name: 'status' as keyof FormValues })

  const currentUser = useAuthStore((state) => state.user)
  const { data: roles = [] } = useRoles()
  const assignableRoles = useMemo(
    () => filterAssignableRoles(roles, currentUser),
    [roles, currentUser],
  )

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const { formState: { errors } } = form

  async function onSubmit(data: FormValues) {
    try {
      if (isEdit) {
        const v = data as UpdateUserValues
        await updateUserMutation.mutateAsync({
          id: user!.id,
          body: {
            name: v.name,
            email: v.email,
            phone: v.phone || null,
            roleId: v.roleId,
            status: v.status,
            ...(v.password ? { password: v.password } : {}),
          },
        })
        toast.success('User updated')
      } else {
        const v = data as CreateUserValues
        await createUserMutation.mutateAsync({
          name: v.name,
          email: v.email,
          phone: v.phone || null,
          roleId: v.roleId,
          password: v.password,
        })
        toast.success('User created')
      }
      onClose()
    } catch (err) {
      form.setError('root', { message: getApiErrorMessage(err) })
    }
  }

  return (
    <Dialog open={state.open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit user' : 'New user'}</DialogTitle>
            <DialogDescription>
              {isEdit ? 'Update the user profile details.' : 'Create a new account for a team member.'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-name">Name</Label>
            <Input id="user-name" required {...form.register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-email">Email</Label>
            <Input id="user-email" type="email" required {...form.register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-phone">Phone</Label>
            <Input id="user-phone" {...form.register('phone')} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-role">Role</Label>
            {assignableRoles.length > 0 ? (
              <Select value={watchedRoleId ?? ''} onValueChange={(v) => { if (v) void form.setValue('roleId', v, { shouldValidate: true }) }}>
                <SelectTrigger id="user-role" className="w-full">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {assignableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">No assignable roles.</p>
            )}
            {errors.roleId && <p className="text-xs text-destructive">{errors.roleId.message}</p>}
          </div>

          {isEdit ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-status">Status</Label>
              <Select value={watchedStatus ?? 'ACTIVE'} onValueChange={(v) => {
                if (v) void form.setValue('status' as keyof FormValues, v as never, { shouldValidate: true })
              }}>
                <SelectTrigger id="user-status" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="user-password">Password</Label>
              <Input id="user-password" type="password" autoComplete="new-password" placeholder="Minimum 8 characters" required {...form.register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          )}

          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errors.root.message}</p>
            </div>
          )}

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={createUserMutation.isPending || updateUserMutation.isPending}>
              {isEdit ? 'Save changes' : 'Create user'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
