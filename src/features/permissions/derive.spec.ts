import { describe, expect, it } from 'vitest'
import {
  buildCheckedSet,
  isDirtyCatalogAware,
  type PermissionGroupInput,
} from './grant-logic'

describe('permissions derive', () => {
  const CATALOG: PermissionGroupInput[] = [
    { module: 'users', permissions: ['users.read', 'users.create'] },
    { module: 'roles', permissions: ['roles.read', 'roles.create'] },
  ]

  it('builds a checked set from granted keys', () => {
    const set = buildCheckedSet(['users.read', 'roles.read'], CATALOG)
    expect(set.has('users.read')).toBe(true)
    expect(set.has('roles.read')).toBe(true)
    expect(set.size).toBe(2)
  })

  it('drops granted keys missing from the catalog', () => {
    const set = buildCheckedSet(['users.read', 'orders.cancel'], CATALOG)
    expect(set.has('orders.cancel')).toBe(false)
    expect(set.size).toBe(1)
  })

  it('no changes when checked matches granted', () => {
    const set = buildCheckedSet(['users.read'], CATALOG)
    expect(isDirtyCatalogAware(set, ['users.read'], CATALOG)).toBe(false)
  })

  it('dirty when a key is toggled on', () => {
    const set = buildCheckedSet([], CATALOG)
    set.add('users.read')
    expect(isDirtyCatalogAware(set, [], CATALOG)).toBe(true)
  })

  it('dirty when a key is toggled off', () => {
    const set = buildCheckedSet(['users.read', 'users.create'], CATALOG)
    set.delete('users.read')
    expect(
      isDirtyCatalogAware(set, ['users.read', 'users.create'], CATALOG),
    ).toBe(true)
  })
})