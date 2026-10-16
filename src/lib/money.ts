function toMinorUnits(value: string): bigint {
  const normalizedValue = value.trim()
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(normalizedValue)
  if (!match) return 0n
  const sign = match[1] === '-' ? -1n : 1n
  const whole = BigInt(match[2] ?? '0')
  const fractional = BigInt((match[3] ?? '').padEnd(2, '0') || '0')
  return sign * (whole * 100n + fractional)
}

function fromMinorUnits(value: bigint): string {
  const sign = value < 0n ? '-' : ''
  const absoluteValue = value < 0n ? -value : value
  const whole = (absoluteValue / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const fractional = (absoluteValue % 100n).toString().padStart(2, '0')
  return `${sign}${whole}.${fractional}`
}

export function sumMoney(values: readonly string[]): string {
  return fromMinorUnits(values.reduce((total, value) => total + toMinorUnits(value), 0n))
}

export function maximumMoney(values: readonly string[]): string {
  return fromMinorUnits(values.reduce((maximum, value) => {
    const minorUnits = toMinorUnits(value)
    return minorUnits > maximum ? minorUnits : maximum
  }, 0n))
}

export function formatMmk(value: string): string {
  return `${fromMinorUnits(toMinorUnits(value))} MMK`
}

export function moneyRatioPercent(value: string, maximum: string): number {
  const maximumMinorUnits = toMinorUnits(maximum)
  if (maximumMinorUnits <= 0n) return 0
  const valueMinorUnits = toMinorUnits(value)
  if (valueMinorUnits <= 0n) return 0
  return Number((valueMinorUnits * 100n) / maximumMinorUnits)
}
