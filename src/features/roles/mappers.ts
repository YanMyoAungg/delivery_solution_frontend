/**
 * DTO ↔ form-state translation for roles. Lives beside `validations.ts` rather
 * than in the form components: these are pure functions with no JSX.
 */
import { toNullableString } from '@/lib/nullable'
import type { Role } from './api'
import type { CreateRoleValues, UpdateRoleValues } from './validations'

/** Referentially stable so `useMemo`/`values` can compare against it. */
export const EMPTY_ROLE: CreateRoleValues = {
  name: '',
  description: '',
}

/**
 * Row → form state. Only the description is editable; the name is immutable
 * after create and is rendered as a read-only summary instead.
 */
export function toRoleFormValues(role: Role): UpdateRoleValues {
  return {
    description: toNullableString(role.description ?? null) ?? '',
  }
}
