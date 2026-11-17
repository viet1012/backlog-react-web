import dayjs from 'dayjs'
import type {
  UtilityBillPeriod,
  UtilityEnergyBreakdown,
  UtilityEvnCompareData,
  UtilityMeterIssue,
  UtilityMissingMeter,
  UtilityScopeCode,
} from '../types/utilityEvn'
import { UTILITY_SCOPE_CODES } from '../types/utilityEvn'
import { downloadBlob } from './xlsxWriter'

// =========================================================
// NGƯỠNG TÔ MÀU % LỆCH (|%|) – sửa tại đây
// =========================================================

// |%| ≤ OK → xanh
export const EVN_PCT_OK = 2
// |%| ≤ WARN → vàng; lớn hơn → đỏ
export const EVN_PCT_WARN = 10

export type EvnPctTone = 'ok' | 'warn' | 'bad'

export function evnPctTone(pct: number | null): EvnPctTone | null {
  if (pct === null) return null
  const abs = Math.abs(pct)
  if (abs <= EVN_PCT_OK) return 'ok'
  if (abs <= EVN_PCT_WARN) return 'warn'
  return 'bad'
}

// Tên phạm vi giữ nguyên ở cả 2 ngôn ngữ
export const EVN_SCOPE_LABEL: Record<UtilityScopeCode, string> = {
  KVH: 'KVH',
  FAC_AB: 'Fac A&B',
  FAC_C: 'Fac C',
}

// Dùng cho cả scope (FAC_AB) lẫn fac của meter (FAC_A / FAC_B / FAC_C)
export function evnScopeLabel(code: string | null): string {
  if (!code) return EVN_DASH
  const known = (EVN_SCOPE_LABEL as Record<string, string | undefined>)[code]
  if (known) return known
  return code.startsWith('FAC_') ? `Fac ${code.slice(4)}` : code
}

// =========================================================
// ĐƠN VỊ / NHÓM CỘT
// =========================================================

// MWh / kWh = điện năng (field mwh); kUSD = tiền điện (field kusd)
export type EvnUnit = 'MWh' | 'kWh' | 'kUSD'

export type EvnMetric = 'mwh' | 'kusd'

export const EVN_UNITS: readonly EvnUnit[] = ['MWh', 'kWh', 'kUSD']

export function evnMetricOf(unit: EvnUnit): EvnMetric {
  return unit === 'kUSD' ? 'kusd' : 'mwh'
}

// Số BE trả theo MWh / kUSD
const UNIT_FACTOR: Record<EvnUnit, number> = { MWh: 1, kWh: 1000, kUSD: 1 }

// số lẻ khi hiển thị / khi ghi CSV
const DISPLAY_DIGITS: Record<EvnUnit, number> = { MWh: 2, kWh: 0, kUSD: 2 }
const CSV_DIGITS: Record<EvnUnit, number> = { MWh: 4, kWh: 1, kUSD: 4 }

export const EVN_GROUPS = ['normal', 'highPeak', 'lowPeak', 'totalElectricity', 'solar'] as const

export type EvnGroupKey = typeof EVN_GROUPS[number]

export const HOURS_PER_DAY = 24

// =========================================================
// DÒNG SO SÁNH
// =========================================================

export interface EvnCell {
  // MWh hoặc kUSD tùy metric
  excel: number | null
  actual: number | null
  // Thực tế − Excel
  diff: number | null
  // (Thực tế / Excel − 1) × 100
  pct: number | null
  // cao điểm Chủ nhật: không có khung giờ này
  notApplicable: boolean
}

export interface EvnCompareRow {
  date: string
  // 0 = Chủ nhật; null khi không đọc được ngày
  weekdayIndex: number | null
  weekdayRaw: string | null
  sunday: boolean
  hasExcel: boolean
  partial: boolean
  coveragePct: number | null
  hoursWithData: number | null
  missingMeters: UtilityMissingMeter[]
  cells: Record<EvnGroupKey, EvnCell>
}

export interface EvnCompareSummary {
  // tổng chỉ trên ngày đã có Excel
  totals: Record<EvnGroupKey, EvnCell>
  excelDays: number
  noExcelDays: number
  partialDays: number
  // % lệch trung bình (tổng điện lưới) trên ngày có Excel và đủ đồng hồ
  avgPctFull: number | null
  fullDays: number
}

function compareCell(excel: number | null, actual: number | null, notApplicable = false): EvnCell {
  if (notApplicable) {
    return { excel: null, actual: null, diff: null, pct: null, notApplicable: true }
  }

  return {
    excel,
    actual,
    diff: excel !== null && actual !== null ? actual - excel : null,
    pct: excel !== null && actual !== null && excel !== 0 ? (actual / excel - 1) * 100 : null,
    notApplicable: false,
  }
}

function pick(source: UtilityEnergyBreakdown | null | undefined, key: EvnGroupKey): number | null {
  return source?.[key] ?? null
}

export function buildEvnCompareRows(
  data: UtilityEvnCompareData | null,
  scope: UtilityScopeCode,
  metric: EvnMetric = 'mwh',
): EvnCompareRow[] {
  if (!data) return []

  const measured = data.measured.scopes.find((s) => s.code === scope)
  const official = data.official.scopes.find((s) => s.code === scope)

  const measuredByDate = new Map((measured?.daily ?? []).map((d) => [d.date, d]))
  const officialByDate = new Map((official?.daily ?? []).map((d) => [d.date, d]))

  const dates = [...new Set([...measuredByDate.keys(), ...officialByDate.keys()])].sort()

  const rows: EvnCompareRow[] = []

  for (const date of dates) {
    const m = measuredByDate.get(date)
    const o = officialByDate.get(date)?.official ?? null

    // Excel = official.mwh / official.kusd khi source = EVN; MEASURED = chưa có Excel
    const hasExcel = o?.source === 'EVN'
    const excel = hasExcel ? o[metric] : null
    const actual = m?.[metric] ?? null

    const parsed = dayjs(date)
    const weekdayIndex = parsed.isValid() ? parsed.day() : null
    const sunday = weekdayIndex === 0

    const cells = Object.fromEntries(
      EVN_GROUPS.map((key) => [
        key,
        compareCell(pick(excel, key), pick(actual, key), sunday && key === 'highPeak'),
      ]),
    ) as Record<EvnGroupKey, EvnCell>

    const partial = m?.partial ?? false

    // ngày chưa tới (BE điền sẵn cả kỳ): không có số nào → bỏ
    if (!hasExcel && !partial && cells.totalElectricity.actual === null) continue

    rows.push({
      date,
      weekdayIndex,
      weekdayRaw: m?.weekday ?? null,
      sunday,
      hasExcel,
      partial,
      coveragePct: m?.coveragePct ?? null,
      hoursWithData: m?.hoursWithData ?? null,
      missingMeters: m?.missingMeters ?? [],
      cells,
    })
  }

  return rows
}

export function summarizeEvnCompare(rows: EvnCompareRow[]): EvnCompareSummary {
  const excelRows = rows.filter((r) => r.hasExcel)

  const totals = Object.fromEntries(
    EVN_GROUPS.map((key) => {
      let excel: number | null = null
      let actual: number | null = null

      // chỉ cộng ngày có đủ 2 số để Excel và Thực tế cùng phạm vi ngày
      for (const row of excelRows) {
        const cell = row.cells[key]
        if (cell.excel === null || cell.actual === null) continue
        excel = (excel ?? 0) + cell.excel
        actual = (actual ?? 0) + cell.actual
      }

      return [key, compareCell(excel, actual)]
    }),
  ) as Record<EvnGroupKey, EvnCell>

  const fullPcts = excelRows
    .filter((r) => !r.partial)
    .map((r) => r.cells.totalElectricity.pct)
    .filter((p): p is number => p !== null)

  return {
    totals,
    excelDays: excelRows.length,
    noExcelDays: rows.length - excelRows.length,
    partialDays: rows.filter((r) => r.partial).length,
    avgPctFull: fullPcts.length > 0 ? fullPcts.reduce((sum, p) => sum + p, 0) / fullPcts.length : null,
    fullDays: fullPcts.length,
  }
}

// Tổng điện lưới (ngày có Excel) của từng phạm vi – cho biểu đồ so sánh phạm vi
export interface EvnScopeTotal {
  code: UtilityScopeCode
  total: EvnCell
  excelDays: number
}

export function summarizeEvnScopes(data: UtilityEvnCompareData | null, metric: EvnMetric): EvnScopeTotal[] {
  if (!data) return []

  return UTILITY_SCOPE_CODES.map((code) => {
    const summary = summarizeEvnCompare(buildEvnCompareRows(data, code, metric))
    return { code, total: summary.totals.totalElectricity, excelDays: summary.excelDays }
  })
}

// =========================================================
// CẢNH BÁO ĐỒNG HỒ
// =========================================================

const SEVERITY_RANK: Record<string, number> = { MAJOR: 0, MINOR: 1 }

// meterIssues của scope đang xem (BE trả theo từng scope, KVH gồm cả meter Fac A/B/C).
// BE không trả ngày bị ảnh hưởng → gom từ daily[].missingMeters của scope đó.
// BE không trả meterIssues → tự dựng từ missingMeters (cộng 24 − validHours).
export function collectMeterIssues(
  data: UtilityEvnCompareData | null,
  scopeCode: UtilityScopeCode,
): UtilityMeterIssue[] {
  const scope = data?.measured.scopes.find((s) => s.code === scopeCode)
  if (!scope) return []

  const datesByMeter = new Map<string, Set<string>>()
  const derived = new Map<string, UtilityMeterIssue>()

  for (const day of scope.daily) {
    for (const meter of day.missingMeters) {
      if (!datesByMeter.has(meter.meter)) datesByMeter.set(meter.meter, new Set())
      datesByMeter.get(meter.meter)?.add(day.date)

      const missing = missingHoursOf(meter)
      const prev = derived.get(meter.meter)
      derived.set(meter.meter, {
        meter: meter.meter,
        fac: meter.fac,
        scope: scope.code,
        missingHours: missing === null ? prev?.missingHours ?? null : (prev?.missingHours ?? 0) + missing,
        severity: null,
        lastDataAt: meter.lastDataAt,
        dates: [],
      })
    }
  }

  const issues = scope.meterIssues.length > 0 ? scope.meterIssues : [...derived.values()]

  return issues
    .map((issue) => ({
      ...issue,
      dates: [...new Set([...issue.dates, ...(datesByMeter.get(issue.meter) ?? [])])].sort(),
    }))
    .sort(
      (a, b) => (SEVERITY_RANK[a.severity ?? ''] ?? 2) - (SEVERITY_RANK[b.severity ?? ''] ?? 2)
        || (b.missingHours ?? -1) - (a.missingHours ?? -1)
        || a.meter.localeCompare(b.meter),
    )
}

// ["2026-11-05", ..., "2026-11-12", "2026-11-14"] → "05/11–12/11, 14/11"
export function formatDateRanges(dates: string[]): string {
  if (dates.length === 0) return EVN_DASH

  const ranges: [string, string][] = []

  for (const date of [...dates].sort()) {
    const last = ranges[ranges.length - 1]
    if (last && dayjs(last[1]).add(1, 'day').format('YYYY-MM-DD') === date) {
      last[1] = date
    } else {
      ranges.push([date, date])
    }
  }

  return ranges
    .map(([from, to]) => (from === to ? formatDayMonth(from) : `${formatDayMonth(from)}–${formatDayMonth(to)}`))
    .join(', ')
}

// =========================================================
// ĐỊNH DẠNG
// =========================================================

export const EVN_DASH = '–'

// raw = số BE (MWh hoặc kUSD)
export function toUnit(raw: number | null, unit: EvnUnit): number | null {
  return raw === null ? null : raw * UNIT_FACTOR[unit]
}

export function formatAmount(raw: number | null, unit: EvnUnit): string {
  const value = toUnit(raw, unit)
  if (value === null) return EVN_DASH
  const digits = DISPLAY_DIGITS[unit]
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

export function formatAmountDiff(raw: number | null, unit: EvnUnit): string {
  const value = toUnit(raw, unit)
  if (value === null) return EVN_DASH
  const digits = DISPLAY_DIGITS[unit]
  const text = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  // −0.00 → 0.00
  return Number(text.replace(/,/g, '')) === 0 ? text : `${value > 0 ? '+' : '−'}${text}`
}

export function formatPct(pct: number | null, digits = 1): string {
  if (pct === null) return EVN_DASH
  const text = Math.abs(pct).toFixed(digits)
  return Number(text) === 0 ? `${text}%` : `${pct > 0 ? '+' : '−'}${text}%`
}

export function formatDayMonth(date: string): string {
  const parsed = dayjs(date)
  return parsed.isValid() ? parsed.format('DD/MM') : date
}

// Kỳ hóa đơn hiển thị (to = ngày cuối, GỒM): theo BE; không có thì 21 tháng trước → 20 tháng chọn.
// BE trả to là mốc kết thúc không gồm (from 2026-10-21, to 2026-11-21, days 31) → lùi 1 ngày.
export function resolveBillPeriod(period: UtilityBillPeriod | null, month: string): { from: string; to: string } {
  const fallbackTo = dayjs(`${month}-20`)
  const fallbackFrom = fallbackTo.subtract(1, 'month').add(1, 'day')

  const from = period?.from ?? fallbackFrom.format('YYYY-MM-DD')
  let to = fallbackTo.format('YYYY-MM-DD')

  if (period?.to) {
    const end = dayjs(period.to)
    const exclusive = period.days === null || end.diff(dayjs(from), 'day') === period.days
    to = (exclusive ? end.subtract(1, 'day') : end).format('YYYY-MM-DD')
  }

  return { from, to }
}

// "2026-11-15T23:00:00" → "15/11/2026 23:00"
export function formatDataUntil(value: string | null): string | null {
  if (!value) return null
  const parsed = dayjs(value)
  if (!parsed.isValid()) return value
  return /[T ]\d{1,2}:\d{2}/.test(value) ? parsed.format('DD/MM/YYYY HH:mm') : parsed.format('DD/MM/YYYY')
}

export function missingHoursOf(meter: UtilityMissingMeter): number | null {
  return meter.validHours === null ? null : Math.max(0, HOURS_PER_DAY - meter.validHours)
}

export function evnWeekdayLabel(row: EvnCompareRow, weekdays: readonly string[]): string {
  return (row.weekdayIndex !== null ? weekdays[row.weekdayIndex] : undefined) ?? row.weekdayRaw ?? EVN_DASH
}

export interface EvnNoteLabels {
  missingHours: (meter: string, hours: number | null) => string
  // ngày chưa hết (vd hôm nay: mới có 17/24 giờ)
  incompleteDay: (hours: number) => string
  partial: string
}

// Ghi chú: "meter · thiếu N giờ; ..." (N = 24 − validHours).
// Liệt kê cả ngày không partial nhưng có meter thiếu (độ phủ vẫn ≥ ngưỡng).
export function evnNoteText(row: EvnCompareRow, labels: EvnNoteLabels): string {
  const parts = row.missingMeters.map((m) => labels.missingHours(m.meter, missingHoursOf(m)))

  if (row.hoursWithData !== null && row.hoursWithData > 0 && row.hoursWithData < HOURS_PER_DAY) {
    parts.unshift(labels.incompleteDay(row.hoursWithData))
  }

  if (parts.length === 0 && row.partial) return labels.partial
  return parts.join('; ')
}

// "92.7% · 24/24 giờ"
export function evnCoverageText(row: EvnCompareRow, hoursLabel: (hours: number) => string): string {
  const parts: string[] = []
  if (row.coveragePct !== null) parts.push(`${Number(row.coveragePct.toFixed(1))}%`)
  if (row.hoursWithData !== null) parts.push(hoursLabel(Math.round(row.hoursWithData * 10) / 10))
  return parts.length > 0 ? parts.join(' · ') : EVN_DASH
}

// =========================================================
// CSV
// =========================================================

export interface EvnCsvLabels {
  date: string
  weekday: string
  groups: Record<EvnGroupKey, string>
  excel: string
  actual: string
  diff: string
  pct: string
  source: string
  coverage: string
  hoursWithData: string
  note: string
  total: string
  sourceEvn: string
  sourceNone: string
  weekdayOf: (row: EvnCompareRow) => string
  noteOf: (row: EvnCompareRow) => string
}

function csvCell(value: string | number | null): string {
  if (value === null) return ''
  const cell = String(value)
  return /[",\r\n;]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell
}

// Số thô (không dấu phân cách nghìn) để Excel đọc được là số
function csvNumber(value: number | null, digits: number): number | null {
  return value === null ? null : Number(value.toFixed(digits))
}

function csvCells(cell: EvnCell, unit: EvnUnit): (number | null)[] {
  const digits = CSV_DIGITS[unit]
  return [
    csvNumber(toUnit(cell.excel, unit), digits),
    csvNumber(toUnit(cell.actual, unit), digits),
    csvNumber(toUnit(cell.diff, unit), digits),
    csvNumber(cell.pct, 2),
  ]
}

export function buildEvnCompareCsv(
  rows: EvnCompareRow[],
  summary: EvnCompareSummary,
  unit: EvnUnit,
  labels: EvnCsvLabels,
): string {
  const header = [
    labels.date,
    labels.weekday,
    ...EVN_GROUPS.flatMap((key) => [
      `${labels.groups[key]} - ${labels.excel} (${unit})`,
      `${labels.groups[key]} - ${labels.actual} (${unit})`,
      `${labels.groups[key]} - ${labels.diff} (${unit})`,
      `${labels.groups[key]} - ${labels.pct}`,
    ]),
    labels.source,
    `${labels.coverage} (%)`,
    labels.hoursWithData,
    labels.note,
  ]

  const body = rows.map((row) => [
    row.date,
    labels.weekdayOf(row),
    ...EVN_GROUPS.flatMap((key) => csvCells(row.cells[key], unit)),
    row.hasExcel ? labels.sourceEvn : labels.sourceNone,
    csvNumber(row.coveragePct, 1),
    row.hoursWithData,
    labels.noteOf(row),
  ])

  const total = [
    labels.total,
    `${summary.excelDays}`,
    ...EVN_GROUPS.flatMap((key) => csvCells(summary.totals[key], unit)),
    null,
    null,
    null,
    null,
  ]

  return [header, ...body, total]
    .map((cells) => cells.map(csvCell).join(','))
    .join('\r\n')
}

export function downloadCsv(content: string, fileName: string) {
  // BOM để Excel mở đúng tiếng Việt
  downloadBlob(new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' }), fileName)
}
