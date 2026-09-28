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
import { useCreateCustomer, useUpdateCustomer, type Customer } from '../api'
import { customerSchema, type CustomerValues } from '../validations'
import { toCustomerFormValues, toCustomerRequestBody } from '../mappers'
import { CustomerFormFields } from './CustomerForm'

interface CustomerDialogProps {
  open: boolean
  /** Absent in create mode. Its presence is what discriminates the two modes. */
  customer?: Customer
  onClose: () => void
}

/**
 * Owns the dialog and nothing else: visibility, the copy, which mutation runs,
 * and the toasts. Fields live in `CustomerFormFields`; the DTO↔form
 * translation lives beside it in `mappers.ts`.
 *
 * This replaces two sibling components — `CreateCustomerForm` and
 * `EditCustomerForm` — each with its own `useForm`, its own default-value
 * mapping, its own submit handler, its own copy of the field markup and its own
 * hand-written footer and error banner. Mode is now a single `isEditing`
 * boolean.
 *
 * `values` re-seeds when `customer` changes, which is what makes the parent-side
 * `key={customerToEdit?.id ?? 'new'}` remount hack unnecessary. Reopening the
 * *same* mode is the gap `values` can't see (identity is unchanged), so
 * `handleClose` resets explicitly.
 */
export function CustomerDialog({ open, customer, onClose }: CustomerDialogProps) {
  const isEditing = customer !== undefined
  const formValues = useMemo(() => toCustomerFormValues(customer), [customer])
  const schema = useMemo(() => customerSchema(isEditing), [isEditing])

  const form = useForm<CustomerValues>({
    resolver: zodResolver(schema),
    defaultValues: formValues,
    values: formValues,
  })

  const createCustomerMutation = useCreateCustomer()
  const updateCustomerMutation = useUpdateCustomer()

  const { errors } = form.formState

  function handleClose() {
    // Drop a stale 409 banner, and clear any half-typed input for next open.
    form.reset(formValues)
    onClose()
  }

  async function onValid(values: CustomerValues) {
    form.clearErrors('root')
    try {
      if (customer) {
        await updateCustomerMutation.mutateAsync({
          id: customer.id,
          body: toCustomerRequestBody(values),
        })
        toast.success('Customer updated')
      } else {
        await createCustomerMutation.mutateAsync(toCustomerRequestBody(values))
        toast.success('Customer created')
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
            <DialogTitle>{isEditing ? 'Edit customer' : 'New customer'}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update the customer details.'
                : 'Create a new customer record.'}
            </DialogDescription>
          </DialogHeader>

          <FormBody>

            <CustomerFormFields />

          </FormBody>

          <FormAlert error={errors.root?.message} />

          <FormFooter
            submitLabel={isEditing ? 'Save changes' : 'Create customer'}
            isSubmitting={
              createCustomerMutation.isPending || updateCustomerMutation.isPending
            }
          />
        </Form>
      </DialogContent>
    </Dialog>
  )
}
