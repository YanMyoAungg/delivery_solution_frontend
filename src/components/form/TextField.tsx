import type { InputHTMLAttributes } from 'react'
import { Input } from '@/components/ui/input'
import { FormField } from './FormField'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  htmlFor: string
  label: string
  error?: string
}

/**
 * Text input wired to react-hook-form via `register()`.
 *
 * Spread `register()` last so callers can attach `onChange` transforms (e.g.
 * RoleDialog uppercasing the role name on every keystroke):
 *
 * ```tsx
 * <TextField {...register('name', { onChange: uppercase })} … />
 * ```
 */
export function TextField({
  htmlFor,
  label,
  error,
  required,
  ...inputProps
}: TextFieldProps) {
  return (
    <FormField
      htmlFor={htmlFor}
      label={label}
      error={error}
      required={required}
    >
      <Input
        id={htmlFor}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${htmlFor}-error` : undefined}
        {...inputProps}
      />
    </FormField>
  )
}
