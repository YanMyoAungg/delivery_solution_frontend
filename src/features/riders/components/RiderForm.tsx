import { Controller, useFormContext } from 'react-hook-form'
import { USER_STATUS_OPTIONS } from '@/lib/constants/user-status'
import { SelectField } from '@/components/form/SelectField'
import { TextField } from '@/components/form/TextField'
import { useTownships } from '@/features/townships/api'
import { Checkbox } from '@/components/ui/checkbox'
import type { RiderValues } from '../validations'
import { VEHICLE_TYPE_OPTIONS } from '../vehicle-types'

interface RiderFormFieldsProps {
  isEditing: boolean
  /** Rendered read-only in edit mode — the API cannot change a login email. */
  readOnlyEmail?: string
}

/**
 * The rider fields, and nothing else — no dialog, no mutations, no submit.
 *
 * `control` and the error map come from the `FormProvider` that `<Form>`
 * already sets up, so the only prop is what the form genuinely can't derive:
 * the mode, and the one value the API has no field for.
 *
 * Both modes render the same Account/Profile fieldsets. Edit used to render
 * flat with no grouping at all, which made the two layouts look like different
 * forms for the same entity.
 */
export function RiderFormFields({ isEditing, readOnlyEmail }: RiderFormFieldsProps) {
  const { data: townships = [] } = useTownships()
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<RiderValues>()

  return (
    <>
      <fieldset className="rounded-md border p-4">
        <legend className="px-1 text-sm font-medium text-muted-foreground">Account</legend>
        <div className="flex flex-col gap-4">
          {isEditing ? (
            <TextField
              htmlFor="rider-email"
              label="Email"
              value={readOnlyEmail ?? ''}
              readOnly
              disabled
            />
          ) : (
            <>
              <TextField
                {...register('email')}
                htmlFor="rider-email"
                label="Email"
                type="email"
                required
                error={errors.email?.message}
              />

              <TextField
                {...register('password')}
                htmlFor="rider-password"
                label="Password"
                type="password"
                required
                error={errors.password?.message}
              />
            </>
          )}
        </div>
      </fieldset>

      <fieldset className="rounded-md border p-4">
        <legend className="px-1 text-sm font-medium text-muted-foreground">Profile</legend>
        <div className="flex flex-col gap-4">
          <TextField
            {...register('name')}
            htmlFor="rider-name"
            label="Name"
            required
            error={errors.name?.message}
          />

          <SelectField
            control={control}
            name="status"
            htmlFor="rider-status"
            label="Status"
            options={USER_STATUS_OPTIONS}
            placeholder="Select status"
            error={errors.status?.message}
          />

          <SelectField
            control={control}
            name="vehicleType"
            htmlFor="rider-vehicle-type"
            label="Vehicle type"
            options={VEHICLE_TYPE_OPTIONS}
            placeholder="Select vehicle type"
            error={errors.vehicleType?.message}
          />

          <TextField
            {...register('phone')}
            htmlFor="rider-phone"
            label="Phone"
            error={errors.phone?.message}
          />

          <TextField
            {...register('licenseNo')}
            htmlFor="rider-license"
            label="License number"
            error={errors.licenseNo?.message}
          />

          <TextField
            {...register('vehiclePlate')}
            htmlFor="rider-plate"
            label="Vehicle plate"
            error={errors.vehiclePlate?.message}
          />

          <TextField
            {...register('nrcNumber')}
            htmlFor="rider-nrc"
            label="NRC number"
            error={errors.nrcNumber?.message}
          />

          <TextField
            {...register('emergencyContactPhone')}
            htmlFor="rider-emergency-phone"
            label="Emergency contact"
            error={errors.emergencyContactPhone?.message}
          />

          <TextField
            {...register('notes')}
            htmlFor="rider-notes"
            label="Notes"
            error={errors.notes?.message}
          />
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Township coverage</legend>
            <p className="text-xs text-muted-foreground">Active riders with coverage can receive township assignments.</p>
            <div className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
              <Controller
                control={control}
                name="townshipIds"
                render={({ field }) => (
                  <>
                    {townships.map((township) => (
                      <label key={township.id} className="flex min-h-10 items-center gap-2 rounded px-2 text-sm hover:bg-accent">
                        <Checkbox
                          id={`rider-township-${township.id}`}
                          checked={field.value.includes(township.id)}
                          onCheckedChange={(checked) => field.onChange(
                            checked
                              ? [...field.value, township.id]
                              : field.value.filter((townshipId) => townshipId !== township.id),
                          )}
                          aria-label={township.name}
                        />
                        <span className="font-normal">{township.name}{township.selectable ? '' : ' · no active rider'}</span>
                      </label>
                    ))}
                  </>
                )}
              />
            </div>
            {errors.townshipIds?.message && <p className="text-xs text-destructive">{errors.townshipIds.message}</p>}
          </fieldset>
        </div>
      </fieldset>
    </>
  )
}
