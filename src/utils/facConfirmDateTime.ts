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
// INVALID DATETIME MESSAGE
// =========================================================

function getInvalidDateTimeMessage(): string {
  const now = new Date()

  return (
    'Sai định dạng ngày giờ. VD: '
    + `${pad2(now.getDate())}`
    + `/${pad2(now.getMonth() + 1)}`
    + `/${now.getFullYear()}`
    + ` ${pad2(now.getHours())}`
    + `:${pad2(now.getMinutes())}`
  )
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
      getInvalidDateTimeMessage(),
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
    getInvalidDateTimeMessage(),
  )
}


// =========================================================
// NORMALIZE FOR API
// =========================================================
interface NormalizeFacConfirmDateTimeOptions {
  field?: string
  isDC53?: boolean
  isTD?: boolean
  heatStart?: unknown
}

// Normalize existing values without applying rules for new edits.
export function normalizeFacConfirmDateTime(
  value: unknown,
): string {
  const parts = parseFacConfirmDateTime(value)

  return (
    `${parts.year}-${parts.month}-${parts.day}`
    + `T${parts.hour}:${parts.minute}:${parts.second}`
  )
}

export function normalizeFacConfirmDateTimeForApi(
  value: unknown,
  options?: NormalizeFacConfirmDateTimeOptions,
): string {
  const parts =
    parseFacConfirmDateTime(value)

  const inputDate = partsToLocalDateTime(parts)

  const now = new Date()

  // UI nhập chính xác tới phút
  now.setSeconds(0, 0)

  if (
    inputDate.getTime()
    < now.getTime()
  ) {
    throw new Error(
      `Không được chọn thời gian trước `
      + `${formatDateTimeForMessage(now)}.`,
    )
  }

  // =========================================================
  // VALIDATE HEAT FINISH
  //
  // DC53 -> +5 ngày
  // TD   -> +2 ngày
  // =========================================================

  if (
    options?.field === 'heatFinish'
    && (
      options.isDC53 === true
      || options.isTD === true
    )
  ) {
    validateHeatFinish(
      value,
      {
        isDC53:
          options.isDC53,

        isTD:
          options.isTD,

        heatStart:
          options.heatStart,
      },
    )
  }

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


    // DISPLAY:
    // MM/DD/YYYY HH:mm
    return (
      `${parts.month}/${parts.day}/${parts.year}`
      + ` ${parts.hour}:${parts.minute}`
    )

  } catch {

    // Formatter không throw.
    // Nếu value đang invalid/transient
    // thì giữ nguyên text.
    return text
  }
}

interface ValidateHeatFinishOptions {
  isDC53?: boolean
  isTD?: boolean
  heatStart?: unknown
}

// =========================================================
// VALIDATE HEAT FINISH
//
// DC53:
//   Heat Start có    -> Finish >= Start + 5 days
//   Heat Start null  -> Finish >= Now   + 5 days
//
// TD:
//   Heat Start có    -> Finish >= Start + 2 days
//   Heat Start null  -> Finish >= Now   + 2 days
// =========================================================

export function validateHeatFinish(
  heatFinish: unknown,
  options: ValidateHeatFinishOptions,
): void {

  // =======================================================
  // XÁC ĐỊNH SỐ NGÀY CHỜ
  // DC53 ưu tiên nếu trường hợp dữ liệu bị cả 2 flag
  // =======================================================

  let waitingDays = 0
  let materialLabel = ''

  if (options.isDC53 === true) {
    waitingDays = 5
    materialLabel = 'DC53'
  } else if (options.isTD === true) {
    waitingDays = 2
    materialLabel = 'TD'
  }

  // Hàng thường -> không cần check
  if (waitingDays === 0) {
    return
  }

  const finishParts =
    parseFacConfirmDateTime(
      heatFinish,
    )

  const finishDate =
    partsToLocalDateTime(
      finishParts,
    )

  let baseDate: Date

  // =======================================================
  // CÓ HEAT START
  // =======================================================

  if (
    options.heatStart != null
    && String(options.heatStart).trim() !== ''
  ) {
    const startParts =
      parseFacConfirmDateTime(
        options.heatStart,
      )

    baseDate =
      partsToLocalDateTime(
        startParts,
      )

  }

  // =======================================================
  // CHƯA CÓ HEAT START -> LẤY HIỆN TẠI
  // =======================================================

  else {
    baseDate = new Date()

    // UI chỉ nhập tới phút
    baseDate.setSeconds(
      0,
      0,
    )

  }

  const minimumFinish =
    addDays(
      baseDate,
      waitingDays,
    )

  // =======================================================
  // VALIDATE
  // =======================================================

  if (
    finishDate.getTime()
    < minimumFinish.getTime()
  ) {
    throw new Error(
      `${materialLabel}: Heat Finish phải từ `
      + `${formatDateTimeForMessage(minimumFinish)} trở đi.`,
    )
  }
}

// =========================================================
// PARTS -> LOCAL DATE
// =========================================================

function partsToLocalDateTime(
  parts: FacConfirmDateTimeParts,
): Date {
  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
    0,
  )
}

// =========================================================
// ADD DAYS
// =========================================================

function addDays(
  value: Date,
  days: number,
): Date {
  const result = new Date(
    value.getTime(),
  )

  result.setDate(
    result.getDate() + days,
  )

  return result
}

// =========================================================
// FORMAT ERROR DATETIME
// =========================================================

function formatDateTimeForMessage(
  value: Date,
): string {
  return (
    `${pad2(value.getDate())}`
    + `/${pad2(value.getMonth() + 1)}`
    + `/${value.getFullYear()}`
    + ` ${pad2(value.getHours())}`
    + `:${pad2(value.getMinutes())}`
  )
}
