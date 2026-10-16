import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface FormFieldProps {
  /** Id of the control this label describes — wires up `htmlFor`. */
  htmlFor: string
  label: string
  /** Validation message from react-hook-form. Rendered below the control. */
  error?: string
  /** Marker only; the zod schema is what actually enforces it. */
  required?: boolean
  children: ReactNode
}

/**
 * Label + control + inline error, in the one layout every form field in this
 * app uses. Extracted because that block was previously hand-written 39 times
 * across the dialogs, which is most of why those files were 300-450 lines.
 *
 * `Label` has no built-in required affordance, so requiredness is marked with
 * text (per the repo's shadcn notes).
 */
export function FormField({
  htmlFor,
  label,
  error,
  required,
  children,
}: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            *
          </span>
        )}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
