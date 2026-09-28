/**
 * `UserStatus` is a cross-feature concept: it belongs to the backing user row,
 * and both `users` and `riders` read and write it. So the canonical list lives
 * in shared constants rather than in either feature's folder.
 *
 * The type is derived from the tuple, so the union and the runtime list can
 * never drift — which is the whole point of having exactly one copy.
 */
export const USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const

export type UserStatusValue = (typeof USER_STATUSES)[number]

/** A `Record` over the union, so forgetting a label is a compile error. */
const LABELS: Record<UserStatusValue, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
}

export const USER_STATUS_OPTIONS = USER_STATUSES.map((value) => ({
  value,
  label: LABELS[value],
}))

export function userStatusLabel(status: UserStatusValue): string {
  return LABELS[status]
}

/**
 * Status → badge tone. Declared with the literal union rather than importing
 * `BadgeTone` from `lib/utils`, because `utils` already imports this module —
 * importing back would be a cycle. The structural match is the whole contract.
 */
export function userStatusTone(status: UserStatusValue): 'positive' | 'warning' {
  return status === 'ACTIVE' ? 'positive' : 'warning'
}

/**
 * Codegen types the status fields as plain `string` (the `@description`/`@example`
 * decorators on the enum produce a `string` property rather than the enum
 * union), so anything coming off the wire has to be narrowed before it can be
 * treated as a `UserStatusValue`. Anything unrecognised becomes `INACTIVE`,
 * which is the safe reading for an access flag.
 */
export function toUserStatus(value: string): UserStatusValue {
  return value === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
}
