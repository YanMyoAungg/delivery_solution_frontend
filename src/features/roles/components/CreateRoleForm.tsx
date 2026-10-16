import type { ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { Form, FormBody, FormFooter } from '@/components/form/Form'
import { FormAlert } from '@/components/form/FormAlert'
import { TextField } from '@/components/form/TextField'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCreateRole } from '../api'
import { createRoleSchema, type CreateRoleValues } from '../validations'
import { EMPTY_ROLE } from '../mappers'

/**
 * Role names are the permission-grid keys, so they are upper-cased on every
 * keystroke rather than on submit — the user sees the final value while typing
 * instead of after the fact.
 */
function toUpperCase(event: ChangeEvent<HTMLInputElement>) {
  event.target.value = event.target.value.toUpperCase()
}

/** Dialog content only; `RoleDialog` owns the `<Dialog>` chrome. */
export function CreateRoleForm({ onClose }: { onClose: () => void }) {
  const form = useForm<CreateRoleValues>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: EMPTY_ROLE,
  })
  const createRoleMutation = useCreateRole()
  const { errors } = form.formState

  function handleClose() {
    // Drop a stale 409 banner, and clear any half-typed input for next open.
    form.reset(EMPTY_ROLE)
    onClose()
  }

  async function onSubmit(values: CreateRoleValues) {
    form.clearErrors('root')
    try {
      await createRoleMutation.mutateAsync({
        name: values.name,
        description: values.description || null,
      })
      toast.success('Role created')
      handleClose()
    } catch (error) {
      form.setError('root', { message: getApiErrorMessage(error) })
    }
  }

  return (
    <Form form={form} onValid={onSubmit}>
      <DialogHeader>
        <DialogTitle>New role</DialogTitle>
        <DialogDescription>Create a role to group permissions.</DialogDescription>
      </DialogHeader>

      <FormBody>
        <TextField
          {...form.register('name', { onChange: toUpperCase })}
          htmlFor="role-name"
          label="Name"
          placeholder="MANAGER"
          autoFocus
          required
          error={errors.name?.message}
        />

        <TextField
          {...form.register('description')}
          htmlFor="role-description"
          label="Description"
          placeholder="Optional description"
          error={errors.description?.message}
        />

      </FormBody>

      <FormAlert error={errors.root?.message} />

      <FormFooter submitLabel="Create role" isSubmitting={createRoleMutation.isPending} />
    </Form>
  )
}
