import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { useAuthStore } from '@/lib/store/auth.store'
import { filterAssignableRoles } from '@/lib/auth/filterAssignableRoles'
import { Form, FormBody, FormFooter } from '@/components/form/Form'
import { FormAlert } from '@/components/form/FormAlert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRoles } from '@/features/roles/api'
import { useCreateUser, useUpdateUser, type User } from '../api'
import { userSchema, type UserValues } from '../validations'
import { toCreateUserBody, toUpdateUserBody, toUserFormValues } from '../mappers'
import { UserFormFields } from './UserForm'

interface UserDialogProps {
  open: boolean
  /** Absent in create mode. Its presence is what discriminates the two modes. */
  user?: User
  onClose: () => void
}

/**
 * Owns the dialog and nothing else: visibility, the copy, the assignable-role
 * set, which mutation runs, and the toasts. Fields live in `UserFormFields`; the
 * DTO↔form translation lives beside it in `mappers.ts`.
 *
 * `values` re-seeds when `user` changes, which is what makes the parent-side
 * `key={userToEdit?.id ?? 'new'}` remount hack unnecessary. Reopening the *same*
 * mode is the gap `values` can't see (identity is unchanged), so `handleClose`
 * resets explicitly.
 */
export function UserDialog({ open, user, onClose }: UserDialogProps) {
  const isEditing = user !== undefined
  const currentUser = useAuthStore((store) => store.user)
  const { data: roles = [] } = useRoles()

  const formValues = useMemo(() => toUserFormValues(user), [user])
  const schema = useMemo(() => userSchema(isEditing), [isEditing])

  const form = useForm<UserValues>({
    resolver: zodResolver(schema),
    defaultValues: formValues,
    values: formValues,
  })

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()

  const { errors } = form.formState

  /**
   * Base UI resolves the trigger's label from the options list, so a role the
   * caller may not *assign* still has to be in that list or the trigger renders
   * a raw id — the case is an ADMIN editing another ADMIN, who is excluded from
   * `filterAssignableRoles`. Appending it keeps the name visible.
   */
  const roleOptions = useMemo(() => {
    const options = filterAssignableRoles(roles, currentUser).map((role) => ({
      value: role.id,
      label: role.name,
    }))

    if (user && !options.some((option) => option.value === user.roleId)) {
      const assignedRole = roles.find((role) => role.id === user.roleId)
      if (assignedRole) {
        options.push({ value: assignedRole.id, label: assignedRole.name })
      }
    }

    return options
  }, [roles, currentUser, user])

  function handleClose() {
    // Drop a stale 409 banner, and clear any half-typed input for next open.
    form.reset(formValues)
    onClose()
  }

  async function onValid(values: UserValues) {
    form.clearErrors('root')
    try {
      if (user) {
        await updateUserMutation.mutateAsync({ id: user.id, body: toUpdateUserBody(values) })
        toast.success('User updated')
      } else {
        await createUserMutation.mutateAsync(toCreateUserBody(values))
        toast.success('User created')
      }
      handleClose()
    } catch (error) {
      form.setError('root', { message: getApiErrorMessage(error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <Form form={form} onValid={onValid}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit user' : 'New user'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the user profile details.'
                : 'Create a new account for a team member.'}
            </DialogDescription>
          </DialogHeader>

          <FormBody>

            <UserFormFields isEditing={isEditing} roleOptions={roleOptions} />

          </FormBody>

          <FormAlert error={errors.root?.message} />

          <FormFooter
            submitLabel={isEditing ? 'Save changes' : 'Create user'}
            isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
          />
        </Form>
      </DialogContent>
    </Dialog>
  )
}
