import { UTILITY_API_BASE_URL } from '../config/api'
import { getMessages } from '../i18n/i18nContext'
import {
  UTILITY_SCOPE_CODES,
  type EvnImportError,
  type EvnImportOptions,
  type EvnImportResult,
  type EvnImportSheet,
  type UtilityBillPeriod,
  type UtilityEnergyBreakdown,
  type UtilityEvnCompareData,
  type UtilityMeasuredDay,
  type UtilityMeasuredResponse,
  type UtilityMeasuredScope,
  type UtilityMeterIssue,
  type UtilityMissingMeter,
  type UtilityOfficialDay,
  type UtilityOfficialResponse,
  type UtilityOfficialScope,
  type UtilityOfficialSource,
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
    estimatedMissingMwh: num(value.estimatedMissingMwh),
    estimatedMissingKusd: num(value.estimatedMissingKusd),
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

// =========================================================
// IMPORT EVN DAILY TỪ EXCEL – POST /api/utility/evn-daily/import
// FE không đọc Excel: upload nguyên file, BE đọc + kiểm tra + ghi DB.
// Lỗi 400: { status, error, message, timestamp } → hiện message (tiếng Anh, giữ nguyên).
// =========================================================

export const EVN_IMPORT_MAX_BYTES = 30 * 1024 * 1024
// BE đọc file ~5 giây, cả file ~4.300 dòng
export const EVN_IMPORT_TIMEOUT_MS = 120_000

const IMPORTED_BY_MAX_LENGTH = 100
// Gần giới hạn mà mất kết nối: server thường cắt request quá lớn thay vì trả 413
const NEAR_LIMIT_BYTES = EVN_IMPORT_MAX_BYTES - 1024 * 1024

export class UtilityApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number, options?: ErrorOptions) {
    super(message, options)
    this.name = 'UtilityApiError'
    this.status = status
  }
}

function importSheet(value: unknown): EvnImportSheet | null {
  if (!isObject(value)) return null
  const sheet = str(value.sheet)
  if (!sheet) return null

  return {
    sheet,
    billMonth: str(value.billMonth) ?? '',
    from: dateKey(value.from) ?? '',
    to: dateKey(value.to) ?? '',
    rows: num(value.rows) ?? 0,
  }
}

function importError(value: unknown): EvnImportError | null {
  if (!isObject(value)) return null
  const scope = str(value.scope)

  return {
    sheet: str(value.sheet) ?? '',
    day: dateKey(value.day),
    scope: UTILITY_SCOPE_CODES.find((code) => code === scope) ?? null,
    cell: str(value.cell),
    message: str(value.message) ?? '',
  }
}

function importResult(raw: unknown): EvnImportResult {
  if (!isObject(raw)) {
    throw new UtilityApiError(getMessages().utilityEvnImport.errors.invalidResponse)
  }

  return {
    sourceFile: str(raw.sourceFile) ?? '',
    dryRun: raw.dryRun === true,
    sheets: arr(raw.sheets).map(importSheet).filter((s): s is EvnImportSheet => s !== null),
    inserted: num(raw.inserted) ?? 0,
    updated: num(raw.updated) ?? 0,
    unchanged: num(raw.unchanged) ?? 0,
    skipped: num(raw.skipped) ?? 0,
    rejected: num(raw.rejected) ?? 0,
    errors: arr(raw.errors).map(importError).filter((e): e is EvnImportError => e !== null),
    warnings: arr(raw.warnings).map(str).filter((w): w is string => w !== null),
  }
}

function importHttpError(status: number, body: unknown): string {
  const errors = getMessages().utilityEvnImport.errors
  const message = isObject(body) ? str(body.message) : null

  if (status === 413) return errors.tooLarge
  if (status === 400) return message ?? errors.badRequest
  return message ? `${errors.http(status)} ${message}` : errors.http(status)
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

// file .xlsx ≤ 30 MB (FE đã kiểm trước khi gọi)
export async function importEvnDaily(
  file: File,
  opts: EvnImportOptions,
  signal?: AbortSignal,
): Promise<EvnImportResult> {
  const errors = getMessages().utilityEvnImport.errors

  const params = new URLSearchParams({ dryRun: String(opts.dryRun) })
  const importedBy = opts.importedBy?.trim().slice(0, IMPORTED_BY_MAX_LENGTH)
  if (importedBy) params.set('importedBy', importedBy)

  // month chỉ hợp lệ khi có sheet (thiếu sheet BE trả 400)
  const sheet = opts.sheet?.trim()
  if (sheet) {
    params.set('sheet', sheet)
    if (opts.month) params.set('month', opts.month)
  }

  const form = new FormData()
  form.append('file', file)

  const timeout = AbortSignal.timeout(EVN_IMPORT_TIMEOUT_MS)

  try {
    // body FormData: KHÔNG set Content-Type – browser tự thêm boundary
    const response = await fetch(`${UTILITY_API_BASE_URL}/api/utility/evn-daily/import?${params}`, {
      method: 'POST',
      body: form,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    })

    // đọc body vẫn nằm trong timeout
    const body = parseJson(await response.text())

    if (!response.ok) {
      throw new UtilityApiError(importHttpError(response.status, body), response.status)
    }

    return importResult(body)
  } catch (error) {
    if (error instanceof UtilityApiError) throw error
    // người dùng rời trang / hủy → để caller tự bỏ qua
    if (signal?.aborted) throw error
    if (timeout.aborted) {
      throw new UtilityApiError(errors.timeout(EVN_IMPORT_TIMEOUT_MS / 1000), undefined, { cause: error })
    }
    throw new UtilityApiError(
      file.size >= NEAR_LIMIT_BYTES ? errors.tooLarge : errors.network,
      undefined,
      { cause: error },
    )
  }
}
