import { useFormContext } from 'react-hook-form'
import { TextField } from '@/components/form/TextField'
import type { TownshipValues } from '../validations'

export function TownshipFormFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<TownshipValues>()

  return (
    <>
      <TextField
        {...register('name')}
        htmlFor="township-name"
        label="Township name"
        maxLength={100}
        required
        error={errors.name?.message}
      />
      <TextField
        {...register('defaultDeliveryFee')}
        htmlFor="township-default-fee"
        label="Delivery fee"
        inputMode="decimal"
        placeholder="e.g. 200 or 200.50"
        required
        error={errors.defaultDeliveryFee?.message}
      />
    </>
  )
}
