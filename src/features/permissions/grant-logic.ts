/** Pure grant-editor logic — extracted so it's testable without the component. */

export interface PermissionGroupInput {
  module: string
  permissions: string[]
}

export type GrantDraft = { roleId: string; set: Set<string> }

/** Every permission key from the catalog, flattened. */
export function catalogToKeys(catalog: PermissionGroupInput[]): string[] {
  return catalog.flatMap((group) => group.permissions)
}

/** Build the checked set from granted keys, dropping any not in the catalog
 * (e.g. a now-deleted permission). */
export function buildCheckedSet(
  granted: string[],
  catalog: PermissionGroupInput[],
): Set<string> {
  const valid = new Set(catalogToKeys(catalog))
  const checked = new Set(granted)
  for (const key of Array.from(checked)) {
    if (!valid.has(key)) checked.delete(key)
  }
  return checked
}

/** Direct comparison — true when checked differs from the server granted set. */
export function isDirty(checked: Set<string>, granted: string[]): boolean {
  if (checked.size !== granted.length) return true
  return Array.from(checked).some((key) => !granted.includes(key))
}

/** Catalog-aware dirty check (dedups against known keys). */
export function isDirtyCatalogAware(
  checked: Set<string>,
  granted: string[],
  catalog: PermissionGroupInput[],
): boolean {
  const keys = catalogToKeys(catalog)
  const checkedKeys = Array.from(checked).filter((key) => keys.includes(key))
  return isDirty(new Set(checkedKeys), granted)
}

/** Toggle a key in/out of a set, returning a NEW set. */
export function toggleKey(set: Set<string>, key: string): Set<string> {
  const next = new Set(set)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  return next
}

/** Add or remove every key in `keys`, returning a NEW set. Callers pass the
 * keys the catalog actually defines, so the grid's "All" toggle can never
 * introduce an unknown key. */
export function toggleAllKeys(
  keys: string[],
  set: Set<string>,
  target: boolean,
): Set<string> {
  const next = new Set(set)
  for (const key of keys) {
    if (target) next.add(key)
    else next.delete(key)
  }
  return next
}

export interface GrantSummary {
  granted: number
  total: number
  isAllGranted: boolean
  isPartiallyGranted: boolean
}

/** Bulk state over the catalog's defined keys — drives the select-all control
 * and the running count. `isPartiallyGranted` is what makes the control
 * tri-state, so "some granted" never renders as fully on or fully off. */
export function summarizeGrants(
  keys: string[],
  checked: Set<string>,
): GrantSummary {
  const granted = keys.filter((key) => checked.has(key)).length
  return {
    granted,
    total: keys.length,
    isAllGranted: keys.length > 0 && granted === keys.length,
    isPartiallyGranted: granted > 0 && granted < keys.length,
  }
}

/** Derive-or-own: use the draft when it matches the selected role, else server data. */
export function deriveChecked(
  draft: GrantDraft | null,
  selectedRole: string,
  granted: string[] | undefined,
): Set<string> {
  if (draft && draft.roleId === selectedRole) return draft.set
  return new Set(granted ?? [])
}
