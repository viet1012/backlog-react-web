export function requiredString(value: unknown, field: string): string {
  if (value === null || value === undefined || value === '') {
    throw new Error(`API response is missing required field: ${field}`)
  }

  return String(value)
}

export function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value)
}

export function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

export function numberValue(value: unknown, defaultValue = 0): number {
  if (value === null || value === undefined) return defaultValue

  const parsed = Number(value)
  return Number.isNaN(parsed) ? defaultValue : parsed
}
