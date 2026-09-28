import { useFormContext } from 'react-hook-form'
import { TextField } from '@/components/form/TextField'
import type { CustomerValues } from '../validations'

/**
 * The customer fields, and nothing else — no dialog, no mutations, no submit.
 *
 * `register` and the error map come from the `FormProvider` that `<Form>`
 * already sets up, so this is a pure function of the schema: adding a field
 * means editing `validations.ts` and this list, with no third place to forget.
 */
export function CustomerFormFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CustomerValues>()

  return (
    <>
      <TextField
        {...register('name')}
        htmlFor="customer-name"
        label="Name"
        required
        error={errors.name?.message}
      />

      <TextField
        {...register('phone')}
        htmlFor="customer-phone"
        label="Phone"
        error={errors.phone?.message}
      />

      <TextField
        {...register('address')}
        htmlFor="customer-address"
        label="Address"
        error={errors.address?.message}
      />

      <TextField
        {...register('notes')}
        htmlFor="customer-notes"
        label="Notes"
        error={errors.notes?.message}
      />
    </>
  )
}
