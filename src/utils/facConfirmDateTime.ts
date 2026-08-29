const INVALID_DATE_TIME_MESSAGE =
  'Invalid datetime. Use DD/MM/YYYY HH:mm.'

interface FacConfirmDateTimeParts {
  year: string
  month: string
  day: string
  hour: string
  minute: string
  second: string
}

const displayDateTimePattern =
  /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/

const isoDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/

function isLeapYear(year: number): boolean {
  return year % 4 === 0
    && (year % 100 !== 0 || year % 400 === 0)
}

function getDaysInMonth(year: number, month: number): number {
  const daysByMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]

  return daysByMonth[month - 1] ?? 0
}

function validateDateTimeParts(
  parts: FacConfirmDateTimeParts,
): FacConfirmDateTimeParts {
  const year = Number(parts.year)
  const month = Number(parts.month)
  const day = Number(parts.day)
  const hour = Number(parts.hour)
  const minute = Number(parts.minute)
  const second = Number(parts.second)

  const valid =
    year >= 1
    && month >= 1
    && month <= 12
    && day >= 1
    && day <= getDaysInMonth(year, month)
    && hour >= 0
    && hour <= 23
    && minute >= 0
    && minute <= 59
    && second >= 0
    && second <= 59

  if (!valid) {
    throw new Error(INVALID_DATE_TIME_MESSAGE)
  }

  return parts
}

function parseFacConfirmDateTime(
  value: unknown,
): FacConfirmDateTimeParts {
  const text = String(value ?? '').trim()
  const displayMatch = text.match(displayDateTimePattern)

  if (displayMatch) {
    const [, day, month, year, hour, minute, second = '00'] =
      displayMatch

    return validateDateTimeParts({
      year,
      month,
      day,
      hour,
      minute,
      second,
    })
  }

  const isoMatch = text.match(isoDateTimePattern)

  if (isoMatch) {
    const [, year, month, day, hour, minute, second = '00'] =
      isoMatch

    return validateDateTimeParts({
      year,
      month,
      day,
      hour,
      minute,
      second,
    })
  }

  throw new Error(INVALID_DATE_TIME_MESSAGE)
}

export function normalizeFacConfirmDateTimeForApi(
  value: unknown,
): string {
  const parts = parseFacConfirmDateTime(value)

  return `${parts.year}-${parts.month}-${parts.day}`
    + `T${parts.hour}:${parts.minute}:${parts.second}`
}

export function formatFacConfirmDateTime(
  value: unknown,
): string {
  const text = String(value ?? '').trim()

  if (!text) {
    return ''
  }

  try {
    const parts = parseFacConfirmDateTime(text)

    return `${parts.day}/${parts.month}/${parts.year}`
      + ` ${parts.hour}:${parts.minute}`
  } catch {
    return text
  }
}
