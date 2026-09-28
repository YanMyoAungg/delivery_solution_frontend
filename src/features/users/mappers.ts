/**
 * DTO ↔ form-state translation for users. Lives beside `validations.ts` rather
 * than in the fields component: these are pure functions with no JSX.
 */
import { toNullableString } from '@/lib/nullable'
import { toUserStatus } from '@/lib/constants/user-status'
import type { CreateUserBody, UpdateUserBody, User } from './api'
import type { UserValues } from './validations'

/** Referentially stable so `useMemo`/`values` can compare against it. */
export const EMPTY_USER: UserValues = {
  name: '',
  email: '',
  phone: '',
  roleId: '',
  // Required by create, and never rendered by edit — see `userSchema`.
  password: '',
  // Omitted from the create payload; the backend defaults a new account.
  status: 'ACTIVE',
}

/**
 * Row → form state. The password is deliberately never seeded: there is no
 * read-back, and pre-filling it would put a credential in the DOM.
 */
export function toUserFormValues(user: User | undefined): UserValues {
  if (!user) return EMPTY_USER
  return {
    name: user.name,
    email: user.email,
    phone: toNullableString(user.phone ?? null) ?? '',
    roleId: user.roleId,
    password: '',
    status: toUserStatus(user.status),
  }
}

/** POST body: no `status` — the backend sets it. */
export function toCreateUserBody(values: UserValues): CreateUserBody {
  return {
    name: values.name,
    email: values.email,
    phone: values.phone || null,
    roleId: values.roleId,
    password: values.password,
  }
}

/** PATCH body: no `password` — edit renders no password field. */
export function toUpdateUserBody(values: UserValues): UpdateUserBody {
  return {
    name: values.name,
    email: values.email,
    phone: values.phone || null,
    roleId: values.roleId,
    status: values.status,
  }
}
