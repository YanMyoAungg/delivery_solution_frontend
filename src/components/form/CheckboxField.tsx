import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface CheckboxFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  htmlFor: string
  label: string
  error?: string
  disabled?: boolean
}

/**
 * Boolean field on the shadcn Checkbox, bound through `Controller`.
 *
 * Replaces the raw `<input type="checkbox">` that was used inline before —
 * which had no design-system styling and sat well under the 40px touch-target
 * floor. `field.onChange` also fixes the dirty/touched tracking that
 * `setValue` skipped.
 */
export function CheckboxField<TFieldValues extends FieldValues>({
  control,
  name,
  htmlFor,
  label,
  error,
  disabled,
}: CheckboxFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex flex-col gap-2">
          <div className="flex min-h-10 items-center gap-2">
            <Checkbox
              id={htmlFor}
              checked={field.value === true}
              disabled={disabled}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${htmlFor}-error` : undefined}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <Label htmlFor={htmlFor} className="font-normal">
              {label}
            </Label>
          </div>
          {error && (
            <p id={`${htmlFor}-error`} className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      )}
    />
  )
}
