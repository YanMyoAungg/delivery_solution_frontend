import { useFormContext } from 'react-hook-form'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { CHANNEL_TYPE_OPTIONS } from '../channel-types'
import type { ShopValues } from '../validations'

export function ShopFormFields() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ShopValues>()

  return (
    <>
      {/* NOTE: the backend DTO has NO chatId field. A chatId sent in the
          create/update payload is ignored by the API — and the handoff doc
          warns against confusing it with channelName. Never render it. */}
      <TextField
        {...register('name')}
        htmlFor="shop-name"
        label="Name"
        required
        error={errors.name?.message}
      />

      <SelectField
        control={control}
        name="channelType"
        htmlFor="shop-channel-type"
        label="Channel"
        options={CHANNEL_TYPE_OPTIONS}
        placeholder="Select channel"
        required
        error={errors.channelType?.message}
      />

      <TextField
        {...register('channelName')}
        htmlFor="shop-channel-name"
        label="Channel name"
        placeholder="e.g. Yangon Fresh Group"
        required
        error={errors.channelName?.message}
      />

      <TextField
        {...register('phone')}
        htmlFor="shop-phone"
        label="Phone"
        error={errors.phone?.message}
      />

      <TextField
        {...register('address')}
        htmlFor="shop-address"
        label="Address"
        error={errors.address?.message}
      />

      <TextField
        {...register('notes')}
        htmlFor="shop-notes"
        label="Notes"
        error={errors.notes?.message}
      />
    </>
  )
}
