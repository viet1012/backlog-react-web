const INVALID_DATE_TIME_MESSAGE =
  'Invalid datetime. Use D/M/YYYY H:mm or DD/MM/YYYY HH:mm.'


interface FacConfirmDateTimeParts {
  year: string
  month: string
  day: string
  hour: string
  minute: string
  second: string
}


// =========================================================
// DISPLAY FORMAT
//
// Support:
//
// 3/9/2026 9:18
// 3/9/2026 10:18
// 03/09/2026 09:18
// 3/9/2026 9:18:30
// =========================================================

const displayDateTimePattern =
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/


// =========================================================
// ISO FORMAT
//
// Support:
//
// 2026-09-03T09:18
// 2026-09-03T09:18:30
// 2026-09-03T09:18:30.000
// 2026-09-03T09:18:30Z
// 2026-09-03T09:18:30+07:00
// =========================================================

const isoDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/


// =========================================================
// PAD
// =========================================================

function pad2(
  value: string | number,
): string {

  return String(value)
    .padStart(2, '0')
}


// =========================================================
// LEAP YEAR
// =========================================================

function isLeapYear(
  year: number,
): boolean {

  return year % 4 === 0
    && (
      year % 100 !== 0
      || year % 400 === 0
    )
}


// =========================================================
// DAYS IN MONTH
// =========================================================

function getDaysInMonth(
  year: number,
  month: number,
): number {

  const daysByMonth = [
    31,

    isLeapYear(year)
      ? 29
      : 28,

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

  return daysByMonth[
    month - 1
  ] ?? 0
}


// =========================================================
// VALIDATE + NORMALIZE PARTS
// =========================================================

function validateDateTimeParts(
  parts: FacConfirmDateTimeParts,
): FacConfirmDateTimeParts {

  const year =
    Number(parts.year)

  const month =
    Number(parts.month)

  const day =
    Number(parts.day)

  const hour =
    Number(parts.hour)

  const minute =
    Number(parts.minute)

  const second =
    Number(parts.second)


  const valid =
    year >= 1

    && month >= 1
    && month <= 12

    && day >= 1
    && day <= getDaysInMonth(
      year,
      month,
    )

    && hour >= 0
    && hour <= 23

    && minute >= 0
    && minute <= 59

    && second >= 0
    && second <= 59


  if (!valid) {
    throw new Error(
      INVALID_DATE_TIME_MESSAGE,
    )
  }


  return {
    year:
      String(year)
        .padStart(4, '0'),

    month:
      pad2(month),

    day:
      pad2(day),

    hour:
      pad2(hour),

    minute:
      pad2(minute),

    second:
      pad2(second),
  }
}


// =========================================================
// PARSE
// =========================================================

function parseFacConfirmDateTime(
  value: unknown,
): FacConfirmDateTimeParts {

  const text =
    String(value ?? '')
      .trim()


  // =======================================================
  // DISPLAY FORMAT
  // =======================================================

  const displayMatch =
    text.match(
      displayDateTimePattern,
    )


  if (displayMatch) {

    const [
      ,
      day,
      month,
      year,
      hour,
      minute,
      second = '00',
    ] = displayMatch


    return validateDateTimeParts({
      year,
      month,
      day,
      hour,
      minute,
      second,
    })
  }


  // =======================================================
  // ISO FORMAT
  // =======================================================

  const isoMatch =
    text.match(
      isoDateTimePattern,
    )


  if (isoMatch) {

    const [
      ,
      year,
      month,
      day,
      hour,
      minute,
      second = '00',
    ] = isoMatch


    return validateDateTimeParts({
      year,
      month,
      day,
      hour,
      minute,
      second,
    })
  }


  throw new Error(
    INVALID_DATE_TIME_MESSAGE,
  )
}


// =========================================================
// NORMALIZE FOR API
// =========================================================

export function normalizeFacConfirmDateTimeForApi(
  value: unknown,
): string {

  const parts =
    parseFacConfirmDateTime(
      value,
    )


  return (
    `${parts.year}-${parts.month}-${parts.day}`
    + `T${parts.hour}:${parts.minute}:${parts.second}`
  )
}


// =========================================================
// DISPLAY FORMATTER
// =========================================================

export function formatFacConfirmDateTime(
  value: unknown,
): string {

  const text =
    String(value ?? '')
      .trim()


  if (!text) {
    return ''
  }


  try {

    const parts =
      parseFacConfirmDateTime(
        text,
      )


    return (
      `${parts.day}/${parts.month}/${parts.year}`
      + ` ${parts.hour}:${parts.minute}`
    )

  } catch {

    // IMPORTANT:
    // Formatter không throw.
    // Nếu user đang gõ invalid/transient input,
    // trả lại text để DataGrid không crash.
    return text
  }
}