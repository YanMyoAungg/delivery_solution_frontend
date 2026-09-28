import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api/client'
import { Form, FormBody, FormFooter } from '@/components/form/Form'
import { FormAlert } from '@/components/form/FormAlert'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FAILURE_REASONS, failDeliverySchema, type FailDeliveryValues } from '../validations'
import { useFailDelivery } from '../api'

const FAILURE_REASON_LABELS: Record<(typeof FAILURE_REASONS)[number], string> = {
  CUSTOMER_UNAVAILABLE: 'Customer unavailable',
  WRONG_ADDRESS: 'Wrong address',
  CUSTOMER_REFUSED: 'Customer refused',
  CUSTOMER_RESCHEDULED: 'Customer rescheduled',
  DAMAGED_PACKAGE: 'Damaged package',
  OTHER: 'Other',
}

interface FailDeliveryDialogProps {
  deliveryAttemptId?: string
  trackingCode?: string
  onClose: () => void
}

export function FailDeliveryDialog({ deliveryAttemptId, trackingCode, onClose }: FailDeliveryDialogProps) {
  const formValues = useMemo<FailDeliveryValues>(() => ({ reason: 'CUSTOMER_UNAVAILABLE', note: '' }), [])
  const form = useForm<FailDeliveryValues>({ resolver: zodResolver(failDeliverySchema), defaultValues: formValues, values: formValues })
  const failMutation = useFailDelivery()
  const { errors } = form.formState
  const options = useMemo(() => FAILURE_REASONS.map((value) => ({ value, label: FAILURE_REASON_LABELS[value] })), [])

  const dialogOpen = deliveryAttemptId !== undefined

  function handleClose() {
    form.reset(formValues)
    form.clearErrors()
    onClose()
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      handleClose()
    } else {
      form.reset(formValues)
    }
  }

  async function onValid(values: FailDeliveryValues) {
    if (!deliveryAttemptId) return
    form.clearErrors('root')
    try {
      await failMutation.mutateAsync({ deliveryAttemptId, body: { reason: values.reason, note: values.note || undefined } })
      toast.success('Delivery marked failed')
      handleClose()
    } catch (error) {
      form.setError('root', { message: getApiErrorMessage(error) })
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <Form form={form} onValid={onValid}>
          <DialogHeader><DialogTitle>Mark delivery failed</DialogTitle><DialogDescription>{trackingCode} · choose the reason for the failed attempt.</DialogDescription></DialogHeader>
          <FormBody>
            <SelectField control={form.control} name="reason" htmlFor="failure-reason" label="Reason" options={options} required error={errors.reason?.message} />
            <TextField {...form.register('note')} htmlFor="failure-note" label="Note" error={errors.note?.message} />
          </FormBody>
          <FormAlert error={errors.root?.message} />
          <FormFooter submitLabel="Confirm failed" isSubmitting={failMutation.isPending} />
        </Form>
      </DialogContent>
    </Dialog>
  )
}
