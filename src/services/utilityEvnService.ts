import { UTILITY_API_BASE_URL } from '../config/api'
import { getMessages } from '../i18n/i18nContext'
import type {
  UtilityBillPeriod,
  UtilityEnergyBreakdown,
  UtilityEvnCompareData,
  UtilityMeasuredDay,
  UtilityMeasuredResponse,
  UtilityMeasuredScope,
  UtilityMeterIssue,
  UtilityMissingMeter,
  UtilityOfficialDay,
  UtilityOfficialResponse,
  UtilityOfficialScope,
  UtilityOfficialSource,
} from '../types/utilityEvn'

// BE tính tổng hợp theo kỳ khá lâu
export const UTILITY_REQUEST_TIMEOUT_MS = 60_000

type UtilityView = 'measured' | 'official'

type Json = Record<string, unknown>

// =========================================================
// CHUẨN HÓA (BE có thể trả null / thiếu field / số dạng chuỗi)
// =========================================================

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function num(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function str(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() === '' ? null : value
  if (typeof value === 'number') return String(value)
  return null
}

function arr(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

// "2026-10-21T00:00:00" -> "2026-10-21"
function dateKey(value: unknown): string | null {
  const text = str(value)
  if (!text) return null
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(text)
  return match ? match[1] : text
}

// Bộ số theo khung giờ; BE trả 1 số đơn => coi là tổng điện lưới
function breakdown(value: unknown): UtilityEnergyBreakdown | null {
  const single = num(value)
  if (single !== null) {
    return { normal: null, highPeak: null, lowPeak: null, solar: null, totalElectricity: single, load: null }
  }
  if (!isObject(value)) return null

  return {
    normal: num(value.normal),
    highPeak: num(value.highPeak),
    lowPeak: num(value.lowPeak),
    solar: num(value.solar),
    // không fallback sang `total`: BE trả total = load (gồm solar)
    totalElectricity: num(value.totalElectricity),
    load: num(value.load ?? value.total),
  }
}

// { label: "Nov (Oct21 ~ Nov20]", from: "2026-10-21", to: "2026-11-21", days: 31 }
function billPeriod(value: unknown): UtilityBillPeriod | null {
  if (!isObject(value)) return null
  const from = dateKey(value.from)
  const to = dateKey(value.to)
  if (!from && !to) return null

  return { label: str(value.label), from, to, days: num(value.days) }
}

function missingMeter(value: unknown): UtilityMissingMeter | null {
  if (!isObject(value)) return null
  const meter = str(value.meter)
  if (!meter) return null

  return {
    meter,
    fac: str(value.fac),
    validHours: num(value.validHours ?? value.hours),
    reason: str(value.reason),
    lastDataAt: str(value.lastDataAt),
  }
}

function measuredDay(value: unknown): UtilityMeasuredDay | null {
  if (!isObject(value)) return null
  const date = dateKey(value.date)
  if (!date) return null

  return {
    date,
    weekday: str(value.weekday),
    hoursWithData: num(value.hoursWithData),
    meters: num(value.meters),
    reportingMeters: num(value.reportingMeters),
    coveragePct: num(value.coveragePct),
    partial: value.partial === true,
    missingMeters: arr(value.missingMeters).map(missingMeter).filter((m): m is UtilityMissingMeter => m !== null),
    mwh: breakdown(value.mwh),
    kusd: breakdown(value.kusd),
  }
}

function meterIssue(value: unknown, scopeCode: string): UtilityMeterIssue | null {
  if (!isObject(value)) return null
  const meter = str(value.meter)
  if (!meter) return null

  return {
    meter,
    fac: str(value.fac),
    scope: scopeCode,
    missingHours: num(value.missingHours),
    severity: str(value.severity)?.toUpperCase() ?? null,
    lastDataAt: str(value.lastDataAt),
    // BE chưa trả ngày → utils gom từ daily[].missingMeters
    dates: [],
  }
}

function source(value: unknown): UtilityOfficialSource | null {
  const text = str(value)?.toUpperCase()
  return text === 'EVN' || text === 'MEASURED' ? text : null
}

function officialDay(value: unknown): UtilityOfficialDay | null {
  if (!isObject(value)) return null
  const date = dateKey(value.date)
  if (!date) return null

  const official = isObject(value.official)
    ? {
      mwh: breakdown(value.official.mwh),
      kusd: breakdown(value.official.kusd),
      source: source(value.official.source),
    }
    : null

  return { date, official }
}

function measuredResponse(raw: unknown): UtilityMeasuredResponse {
  if (!isObject(raw) || !Array.isArray(raw.scopes)) {
    throw new Error('Invalid electric-consumption (measured) response')
  }

  const scopes: UtilityMeasuredScope[] = raw.scopes.filter(isObject).map((scope) => {
    const code = str(scope.code) ?? ''
    return {
      code,
      name: str(scope.name),
      meters: num(scope.meters),
      elapsedDays: num(scope.elapsedDays),
      daysWithData: num(scope.daysWithData),
      completeDays: num(scope.completeDays),
      daily: arr(scope.daily).map(measuredDay).filter((d): d is UtilityMeasuredDay => d !== null),
      dailyTotalMwh: breakdown(scope.dailyTotalMwh),
      dailyTotalKusd: breakdown(scope.dailyTotalKusd),
      meterIssues: arr(scope.meterIssues).map((i) => meterIssue(i, code)).filter((i): i is UtilityMeterIssue => i !== null),
      estimatedMissingMwh: num(scope.estimatedMissingMwh),
      priceMissing: scope.priceMissing === true,
    }
  })

  return {
    month: str(raw.month),
    dataUntil: str(raw.dataUntil),
    billPeriod: billPeriod(raw.billPeriod),
    minCoveragePct: num(raw.minCoveragePct),
    excludedMeters: arr(raw.excludedMeters).map(str).filter((m): m is string => m !== null),
    tariffAvailable: typeof raw.tariffAvailable === 'boolean' ? raw.tariffAvailable : null,
    scopes,
  }
}

function officialResponse(raw: unknown): UtilityOfficialResponse {
  if (!isObject(raw) || !Array.isArray(raw.scopes)) {
    throw new Error('Invalid electric-consumption (official) response')
  }

  return {
    month: str(raw.month),
    dataUntil: str(raw.dataUntil),
    billPeriod: billPeriod(raw.billPeriod),
    scopes: raw.scopes.filter(isObject).map((scope) => ({
      code: str(scope.code) ?? '',
      daily: arr(scope.daily).map(officialDay).filter((d): d is UtilityOfficialDay => d !== null),
      officialTotalMwh: breakdown(scope.officialTotalMwh),
      officialTotalKusd: breakdown(scope.officialTotalKusd),
      evnDays: num(scope.evnDays),
      measuredDays: num(scope.measuredDays),
    } satisfies UtilityOfficialScope)),
  }
}

// =========================================================
// FETCH
// =========================================================

async function getElectricConsumption(
  month: string,
  view: UtilityView,
  signal: AbortSignal,
): Promise<unknown> {
  const params = new URLSearchParams({ month, view })
  const timeout = AbortSignal.timeout(UTILITY_REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(
      `${UTILITY_API_BASE_URL}/api/utility/electric-consumption?${params}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.any([signal, timeout]),
      },
    )

    if (!response.ok) {
      throw new Error(`Electric consumption API (${view}) failed: ${response.status}`)
    }

    // đọc body vẫn nằm trong 60s
    return await response.json()
  } catch (error) {
    // hết 60s (không phải do người dùng rời trang / đổi kỳ)
    if (timeout.aborted && !signal.aborted) {
      throw new Error(getMessages().utilityEvn.timeout(view, UTILITY_REQUEST_TIMEOUT_MS / 1000), { cause: error })
    }
    throw error
  }
}

// Gọi song song 2 view; 1 bên lỗi => cả lượt lỗi (so sánh cần đủ 2 bên)
export async function getUtilityEvnCompare(
  month: string,
  signal: AbortSignal,
): Promise<UtilityEvnCompareData> {
  const [measured, official] = await Promise.all([
    getElectricConsumption(month, 'measured', signal),
    getElectricConsumption(month, 'official', signal),
  ])

  return {
    measured: measuredResponse(measured),
    official: officialResponse(official),
  }
}
