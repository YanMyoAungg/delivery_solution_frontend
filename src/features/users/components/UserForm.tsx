import { useFormContext } from 'react-hook-form'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { FormField } from '@/components/form/FormField'
import { USER_STATUS_OPTIONS } from '@/lib/constants/user-status'
import { MIN_PASSWORD_LENGTH } from '@/lib/constants'
import type { SelectOption } from '@/components/form/SelectField'
import type { UserValues } from '../validations'

interface UserFormFieldsProps {
  /** Password on create, status on edit — the two modes swap one field. */
  isEditing: boolean
  roleOptions: readonly SelectOption[]
}

/**
 * The user fields, and nothing else — no dialog, no mutations, no submit.
 *
 * `register`, `control` and the error map come from the `FormProvider` that
 * `<Form>` sets up. The one prop that can't be derived from the form is
 * `roleOptions`, which depends on a query and on the caller's own role.
 */
export function UserFormFields({ isEditing, roleOptions }: UserFormFieldsProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<UserValues>()

  return (
    <>
      <TextField
        {...register('name')}
        htmlFor="user-name"
        label="Name"
        required
        error={errors.name?.message}
      />

      <TextField
        {...register('email')}
        htmlFor="user-email"
        label="Email"
        type="email"
        required
        error={errors.email?.message}
      />

      <TextField
        {...register('phone')}
        htmlFor="user-phone"
        label="Phone"
        error={errors.phone?.message}
      />

      {/* An ADMIN has no assignable roles at all, so a bare Select would render
          an empty trigger with no explanation. */}
      {roleOptions.length > 0 ? (
        <SelectField
          control={control}
          name="roleId"
          htmlFor="user-role"
          label="Role"
          options={roleOptions}
          placeholder="Select a role"
          required
          error={errors.roleId?.message}
        />
      ) : (
        <FormField htmlFor="user-role" label="Role" error={errors.roleId?.message}>
          <p className="text-sm text-muted-foreground">No assignable roles.</p>
        </FormField>
      )}

      {isEditing ? (
        <SelectField
          control={control}
          name="status"
          htmlFor="user-status"
          label="Status"
          options={USER_STATUS_OPTIONS}
          placeholder="Select status"
          error={errors.status?.message}
        />
      ) : (
        <TextField
          {...register('password')}
          htmlFor="user-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder={`Minimum ${MIN_PASSWORD_LENGTH} characters`}
          required
          error={errors.password?.message}
        />
      )}
    </>
  )
}
