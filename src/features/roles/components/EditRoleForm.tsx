import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { Form, FormBody, FormFooter } from '@/components/form/Form'
import { FormAlert } from '@/components/form/FormAlert'
import { TextField } from '@/components/form/TextField'
import { Badge } from '@/components/ui/badge'
import { DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUpdateRole, type Role } from '../api'
import { updateRoleSchema, type UpdateRoleValues } from '../validations'
import { toRoleFormValues } from '../mappers'

interface EditRoleFormProps {
  role: Role
  onClose: () => void
}

/**
 * A role's `name` is immutable after create — `PATCH /roles/:id` takes
 * `{ description? }` only — so the name is rendered as a read-only summary
 * rather than an input. That also means this form and the create form share no
 * editable field, which is why they stay two components instead of one
 * mode-driven form.
 */
export function EditRoleForm({ role, onClose }: EditRoleFormProps) {
  const formValues = useMemo(() => toRoleFormValues(role), [role])

  const form = useForm<UpdateRoleValues>({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: formValues,
    values: formValues,
  })
  const updateRoleMutation = useUpdateRole()
  const { errors } = form.formState

  function handleClose() {
    // Drop a stale 409 banner, and clear any half-typed input for next open.
    form.reset(formValues)
    onClose()
  }

  async function onSubmit(values: UpdateRoleValues) {
    form.clearErrors('root')
    try {
      await updateRoleMutation.mutateAsync({
        id: role.id,
        body: { description: values.description || null },
      })
      toast.success('Role updated')
      handleClose()
    } catch (error) {
      form.setError('root', { message: getApiErrorMessage(error) })
    }
  }

  return (
    <Form form={form} onValid={onSubmit}>
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

      <FormBody>
        <TextField
          {...form.register('description')}
          htmlFor="role-description"
          label="Description"
          placeholder="Optional description"
          error={errors.description?.message}
        />

      </FormBody>

      <FormAlert error={errors.root?.message} />

      <FormFooter submitLabel="Save changes" isSubmitting={updateRoleMutation.isPending} />
    </Form>
  )
}
