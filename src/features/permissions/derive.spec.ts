import { describe, expect, it } from 'vitest'
import {
  buildCheckedSet,
  isDirtyCatalogAware,
  type PermissionGroupInput,
} from './grant-logic'

describe('permissions derive', () => {
  const CATALOG: PermissionGroupInput[] = [
    { domain: 'users', permissions: ['users.list', 'users.create'] },
    { domain: 'roles', permissions: ['roles.list', 'roles.create'] },
  ]

  it('builds a checked set from granted keys', () => {
    const set = buildCheckedSet(['users.list', 'roles.list'], CATALOG)
    expect(set.has('users.list')).toBe(true)
    expect(set.has('roles.list')).toBe(true)
    expect(set.size).toBe(2)
  })

  it('drops granted keys missing from the catalog', () => {
    const set = buildCheckedSet(['users.list', 'orders.cancel'], CATALOG)
    expect(set.has('orders.cancel')).toBe(false)
    expect(set.size).toBe(1)
  })

  it('no changes when checked matches granted', () => {
    const set = buildCheckedSet(['users.list'], CATALOG)
    expect(isDirtyCatalogAware(set, ['users.list'], CATALOG)).toBe(false)
  })

  it('dirty when a key is toggled on', () => {
    const set = buildCheckedSet([], CATALOG)
    set.add('users.list')
    expect(isDirtyCatalogAware(set, [], CATALOG)).toBe(true)
  })

  it('dirty when a key is toggled off', () => {
    const set = buildCheckedSet(['users.list', 'users.create'], CATALOG)
    set.delete('users.list')
    expect(
      isDirtyCatalogAware(set, ['users.list', 'users.create'], CATALOG),
    ).toBe(true)
  })
})