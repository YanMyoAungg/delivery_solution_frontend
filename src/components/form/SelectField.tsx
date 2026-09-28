import { useMemo } from 'react'
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormField } from './FormField'

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  htmlFor: string
  label: string
  /**
   * Hoist to module scope. Base UI takes an `items` map to resolve the label it
   * shows in the trigger, and an inline array literal rebuilds that map on
   * every render.
   */
  options: readonly SelectOption[]
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

/**
 * Base UI's Select is a controlled component, so it needs `Controller` rather
 * than `register()`.
 *
 * This replaces the previous `form.watch('x')` + `setValue('x', v, {
 * shouldValidate: true })` pairing, which had two problems: `watch()` was
 * called during render (a subscription side-effect in the render path), and
 * `setValue` never marks a field dirty or touched, so dirty-tracking silently
 * ignored every select and checkbox in the app. `field.onChange` sets all three.
 */
export function SelectField<TFieldValues extends FieldValues>({
  control,
  name,
  htmlFor,
  label,
  options,
  error,
  placeholder,
  required,
  disabled,
}: SelectFieldProps<TFieldValues>) {
  const items = useMemo(
    () => Object.fromEntries(options.map((o) => [o.value, o.label])),
    [options],
  )

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FormField
          htmlFor={htmlFor}
          label={label}
          error={error}
          required={required}
        >
          <Select
            items={items}
            value={toSelectValue(field.value)}
            disabled={disabled}
            onValueChange={(next) => field.onChange(next ?? '')}
          >
            <SelectTrigger
              id={htmlFor}
              className="w-full"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${htmlFor}-error` : undefined}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      )}
    />
  )
}

/** A cleared select is `null` to Base UI but `''` in form state (what zod sees). */
function toSelectValue(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}
