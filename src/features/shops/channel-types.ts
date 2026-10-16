/**
 * Canonical chat channels for shops.
 *
 * Same story as `riders/vehicle-types.ts`: the pair was written out seven
 * times across the feature as a `z.enum([...])`, two hand-built `Select` option
 * arrays, a label map, and three inline `'VIBER' | 'TELEGRAM'` unions.
 *
 * Module scope matters: `SelectField` and `FilterSelect` memoise Base UI's
 * `items` map off this array's identity.
 */
export const CHANNEL_TYPES = ['VIBER', 'TELEGRAM'] as const

export type ChannelType = (typeof CHANNEL_TYPES)[number]

const LABELS: Record<ChannelType, string> = {
  VIBER: 'Viber',
  TELEGRAM: 'Telegram',
}

export const CHANNEL_TYPE_OPTIONS = CHANNEL_TYPES.map((value) => ({
  value,
  label: LABELS[value],
}))

export function channelTypeLabel(value: ChannelType): string {
  return LABELS[value]
}
