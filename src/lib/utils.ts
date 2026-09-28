/**
 * Semantic badge colours, decoupled from what they represent.
 *
 * This used to be `statusBadgeClass(status: UserStatusValue)`, which forced
 * every caller to speak in statuses. `RidersTable` duly passed
 * `rider.status === 'ACTIVE' ? 'positive' : 'warning'` — availability is not a status,
 * it just happened to need green-and-amber. Keying on tone removes the
 * category error: a caller asks for the colour it wants, and a caller that
 * *does* have a status maps it through `userStatusTone` first.
 *
 * `negative` is unused today but defined here so the helper is actually generic
 * rather than a two-value switch — the `--destructive` token it maps to is
 * already used across the app.
 */
export type BadgeTone = 'positive' | 'warning' | 'negative'

const TONE_CLASSES: Record<BadgeTone, string> = {
  positive: 'bg-success/15 text-emerald-700',
  warning: 'bg-warning/15 text-amber-700',
  negative: 'bg-destructive/15 text-destructive',
}

/** Compact `12 Sep 2026`-style date label used in tables. */
export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

/**
 * Tone classes for a `<Badge>` or an equivalent pill. Colour only — size and
 * shape come from the component, so this composes with any of them.
 */
export function badgeClass(tone: BadgeTone): string {
  return TONE_CLASSES[tone]
}
