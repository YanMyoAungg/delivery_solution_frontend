/** Role name: uppercase, 2-32 chars, letters/digits/underscore (backend-enforced). */
export const ROLE_NAME_PATTERN = /^[A-Z][A-Z0-9_]{1,31}$/

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 72

/**
 * Money input accepted by the API: whole units with optional 1-2 decimals,
 * e.g. `200`, `200.5`, `200.00`. One source of truth for every amount field
 * (township default fee, order delivery fee, COD).
 */
export const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/
