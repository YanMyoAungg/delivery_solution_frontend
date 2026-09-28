import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { Form, FormBody, FormFooter } from '@/components/form/Form'
import { FormAlert } from '@/components/form/FormAlert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSaveTownship, type Township } from '../api'
import { toTownshipFormValues } from '../mappers'
import { townshipSchema, type TownshipValues } from '../validations'
import { TownshipFormFields } from './TownshipForm'

interface TownshipDialogProps {
  open: boolean
  township?: Township
  onClose: () => void
}

export function TownshipDialog({ open, township, onClose }: TownshipDialogProps) {
  const isEditing = township !== undefined
  const formValues = useMemo(() => toTownshipFormValues(township), [township])
  const form = useForm<TownshipValues>({
    resolver: zodResolver(townshipSchema),
    defaultValues: formValues,
    values: formValues,
  })
  const saveTownshipMutation = useSaveTownship()
  const { errors } = form.formState

  function handleClose() {
    form.reset(formValues)
    form.clearErrors()
    onClose()
  }

  async function onValid(values: TownshipValues) {
    form.clearErrors('root')
    try {
      await saveTownshipMutation.mutateAsync({ id: township?.id, name: values.name })
      toast.success(isEditing ? 'Township renamed' : 'Township created')
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
            <DialogTitle>{isEditing ? 'Rename township' : 'New township'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update the township name.' : 'Create a delivery area for rider coverage.'}
            </DialogDescription>
          </DialogHeader>

          <FormBody>
            <TownshipFormFields />
          </FormBody>

          <FormAlert error={errors.root?.message} />

          <FormFooter
            submitLabel={isEditing ? 'Save changes' : 'Create township'}
            isSubmitting={saveTownshipMutation.isPending}
          />
        </Form>
      </DialogContent>
    </Dialog>
  )
}
