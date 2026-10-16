/**
 * DTO ↔ form-state translation for customers. Lives beside `validations.ts`
 * rather than in the fields component: these are pure functions with no JSX.
 */
import { toNullableString } from '@/lib/nullable'
import type { CreateCustomerBody, Customer } from './api'
import type { CustomerValues } from './validations'

/** Referentially stable so `useMemo`/`values` can compare against it. */
export const EMPTY_CUSTOMER: CustomerValues = {
  name: '',
  phone: '',
  address: '',
  notes: '',
}

/**
 * Row → form state. Codegen types `phone`/`address`/`notes` as
 * `Record<string, never> | null` (a thin stub for `string | null`), and an
 * `<input>` can only hold a string — so normalise `null` to `''` here, once.
 */
export function toCustomerFormValues(customer: Customer | undefined): CustomerValues {
  if (!customer) return EMPTY_CUSTOMER
  return {
    name: customer.name,
    phone: toNullableString(customer.phone ?? null) ?? '',
    address: toNullableString(customer.address ?? null) ?? '',
    notes: toNullableString(customer.notes ?? null) ?? '',
  }
}

/**
 * Form state → request body. A cleared optional input holds `''`, which must go
 * over the wire as `null` so it reads as "no value" rather than "the empty
 * string". A `CreateCustomerBody` is structurally assignable to
 * `UpdateCustomerBody`, so this builder serves both mutations.
 */
export function toCustomerRequestBody(values: CustomerValues): CreateCustomerBody {
  return {
    name: values.name,
    phone: values.phone || null,
    address: values.address || null,
    notes: values.notes || null,
  }
}
