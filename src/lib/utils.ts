import type { components } from '@/types/api'

type UserStatus = components['schemas']['UserStatus']

/** Compact `12 Sep 2026`-style date label used in tables. */
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

/** Badge classes for a user status: green for ACTIVE, amber for INACTIVE. */
export function statusBadgeClass(status: UserStatus): string {
  if (status === 'ACTIVE') return 'bg-success/15 text-emerald-700'
  return 'bg-warning/15 text-amber-700'
}
