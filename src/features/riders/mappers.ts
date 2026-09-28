/**
 * DTO ↔ form-state translation for riders. Lives beside `validations.ts` rather
 * than in the fields component: these are pure functions with no JSX, and
 * `RiderForm.tsx` should export exactly one thing.
 */
import { toNullableString } from '@/lib/nullable'
import { toUserStatus } from '@/lib/constants/user-status'
import type { CreateRiderBody, Rider } from './api'
import type { RiderValues } from './validations'

/** Referentially stable so `useMemo`/`values` can compare against it. */
export const EMPTY_RIDER: RiderValues = {
  name: '',
  email: '',
  password: '',
  phone: '',
  status: 'ACTIVE',
  licenseNo: '',
  vehicleType: 'BIKE',
  vehiclePlate: '',
  nrcNumber: '',
  emergencyContactPhone: '',
  townshipIds: [],
  notes: '',
}

/**
 * Row → form state. Note the split source: a rider's identity and credentials
 * identity and account fields are flattened into `RiderResponseDto` by the
 * backend.
 *
 * Codegen types the nullable phone/notes fields as `Record<string, never> |
 * null` (a thin stub for `string | null`), and an `<input>` can only hold a
 * string — so normalise `null` to `''` here, once.
 */
export function toRiderFormValues(rider: Rider | undefined): RiderValues {
  if (!rider) return EMPTY_RIDER
  return {
    name: rider.name,
    email: '',
    password: '',
    phone: toNullableString(rider.phone ?? null) ?? '',
    status: toUserStatus(rider.status),
    licenseNo: toNullableString(rider.licenseNo ?? null) ?? '',
    vehicleType: rider.vehicleType,
    vehiclePlate: toNullableString(rider.vehiclePlate ?? null) ?? '',
    nrcNumber: toNullableString(rider.nrcNumber ?? null) ?? '',
    emergencyContactPhone: toNullableString(rider.emergencyContactPhone ?? null) ?? '',
    townshipIds: rider.townshipIds,
    notes: toNullableString(rider.notes ?? null) ?? '',
  }
}

/**
 * The shared half of both payloads. A cleared optional input holds `''`, which
 * must go over the wire as `null` so it reads as "no value" rather than "the
 * empty string".
 */
export function toRiderProfileBody(values: RiderValues) {
  return {
    name: values.name,
    phone: values.phone || null,
    status: values.status,
    licenseNo: values.licenseNo || null,
    vehicleType: values.vehicleType,
    vehiclePlate: values.vehiclePlate || null,
    nrcNumber: values.nrcNumber || null,
    emergencyContactPhone: values.emergencyContactPhone || null,
    townshipIds: values.townshipIds,
    notes: values.notes || null,
  }
}

/**
 * Create needs the account half on top of the profile half; PATCH must not send
 * it at all, so the credentials are added here rather than in the shared
 * builder.
 */
export function toCreateRiderBody(values: RiderValues): CreateRiderBody {
  return {
    ...toRiderProfileBody(values),
    email: values.email,
    password: values.password,
  }
}
