interface FormAlertProps {
  /** Server/root error from react-hook-form (`errors.root?.message`). */
  error?: string
}

/**
 * Form-level error banner, shown above the footer. Used for submission
 * failures that aren't tied to one field (409 conflicts, validation the
 * backend owns, network failures).
 */
export function FormAlert({ error }: FormAlertProps) {
  if (!error) return null
  return (
    <div
      role="alert"
      className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
    >
      {error}
    </div>
  )
}
