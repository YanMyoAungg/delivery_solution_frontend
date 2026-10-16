import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { Form, FormBody, FormFooter } from '@/components/form/Form'
import { FormAlert } from '@/components/form/FormAlert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateRider, useUpdateRider, type Rider } from '../api'
import { riderSchema, type RiderValues } from '../validations'
import { toCreateRiderBody, toRiderFormValues, toRiderProfileBody } from '../mappers'
import { RiderFormFields } from './RiderForm'

interface RiderDialogProps {
  open: boolean
  /** Absent in create mode. Its presence is what discriminates the two modes. */
  rider?: Rider
  onClose: () => void
}

/**
 * Owns the dialog and nothing else: visibility, the copy, which mutation runs,
 * and the toasts. The twelve fields live in `RiderFormFields`, and the
 * DTO↔form translation lives beside it in `RiderForm`.
 *
 * One form for create and edit. The two-mode `rider ? <Edit/> : <Create/>`
 * branch this replaced duplicated ~150 lines and threaded every one of twelve
 * fields through five places each. Mode is now a single `isEditing` boolean
 * that picks the resolver, decides whether the account block is editable or
 * read-only, and selects the mutation.
 *
 * `values` re-seeds when `rider` changes, which is what makes the parent-side
 * `key={rider?.id ?? 'new'}` remount hack unnecessary. Reopening the
 * *same* mode is the gap `values` can't see (identity is unchanged), so
 * `handleClose` resets explicitly.
 */
export function RiderDialog({ open, rider, onClose }: RiderDialogProps) {
  const isEditing = rider !== undefined
  const formValues = useMemo(() => toRiderFormValues(rider), [rider])
  // Create requires an account; the PATCH runs against an existing one.
  const schema = useMemo(() => riderSchema(!isEditing), [isEditing])

  const form = useForm<RiderValues>({
    resolver: zodResolver(schema),
    defaultValues: formValues,
    values: formValues,
  })

  const createRiderMutation = useCreateRider()
  const updateRiderMutation = useUpdateRider()

  const { errors } = form.formState

  function handleClose() {
    // Drop a stale 409 banner, and clear any half-typed input for next open.
    form.reset(formValues)
    onClose()
  }

  async function onValid(values: RiderValues) {
    form.clearErrors('root')
    try {
      if (rider) {
        await updateRiderMutation.mutateAsync({
          id: rider.id,
          body: toRiderProfileBody(values),
        })
        toast.success('Rider updated')
      } else {
        await createRiderMutation.mutateAsync(toCreateRiderBody(values))
        toast.success('Rider created')
      }
      handleClose()
    } catch (error) {
      form.setError('root', { message: getApiErrorMessage(error) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <Form form={form} onValid={onValid}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit rider' : 'New rider'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the rider. The login email cannot be changed.'
                : 'Create a rider and its login account.'}
            </DialogDescription>
          </DialogHeader>

          <FormBody>

            <RiderFormFields isEditing={isEditing} readOnlyEmail={rider?.email} />

          </FormBody>

          <FormAlert error={errors.root?.message} />

          <FormFooter
            submitLabel={isEditing ? 'Save changes' : 'Create rider'}
            isSubmitting={createRiderMutation.isPending || updateRiderMutation.isPending}
          />
        </Form>
      </DialogContent>
    </Dialog>
  )
}
