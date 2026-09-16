/** Role name: uppercase, 2-32 chars, letters/digits/underscore (backend-enforced). */
export const ROLE_NAME_PATTERN = /^[A-Z][A-Z0-9_]{1,31}$/

/** Permission name: `domain.action`, lowercase letters/digits/dots (backend-enforced). */
export const PERMISSION_NAME_PATTERN =
  /^[a-z][a-z0-9]{0,31}\.[a-z0-9][a-z0-9.]{0,127}$/

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 72
