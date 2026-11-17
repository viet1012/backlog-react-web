import dayjs from 'dayjs'
import type { Messages } from '../i18n/messages/en'
import { UTILITY_SCOPE_CODES, type UtilityEvnCompareData, type UtilityScopeCode } from '../types/utilityEvn'
import {
  EVN_DASH,
  EVN_GROUPS,
  EVN_HIGHLIGHT_GROUP,
  EVN_PCT_OK,
  EVN_PCT_WARN,
  EVN_SCOPE_LABEL,
  buildEvnCompareRows,
  collectMeterIssues,
  evnMetricOf,
  evnNoteText,
  evnPctTone,
  evnScopeLabel,
  evnWeekdayLabel,
  formatDataUntil,
  formatDateRanges,
  resolveBillPeriod,
  summarizeEvnCompare,
  toUnit,
  type EvnCell,
  type EvnCompareSummary,
  type EvnGroupKey,
  type EvnMetric,
  type EvnUnit,
} from './utilityEvnCompare'
import {
  buildXlsx,
  xlsxDateSerial,
  xlsxRange,
  type XlsxCell,
  type XlsxRow,
  type XlsxSheet,
  type XlsxStyle,
} from './xlsxWriter'

// =========================================================
// XUẤT EXCEL – Utility · So sánh Excel (EVN)
// Sheet: Tổng hợp (3 phạm vi × điện năng + tiền, số official của BE)
//        | KVH | Fac A&B | Fac C (bảng theo ngày, đơn vị đang chọn)
//        | Cảnh báo đồng hồ (cả 3 phạm vi)
// =========================================================

type EvnLabels = Messages['utilityEvn']

// ---------- màu (RRGGBB) ----------

const COLOR = {
  headerFill: '1F3A5F',
  headerText: 'FFFFFF',
  subHeaderFill: 'E8EEF5',
  totalFill: 'DCE8F7',
  sundayFill: 'F1F3F5',
  muted: '6B7280',
  partial: 'C2410C',
  title: '1F3A5F',
  // nhóm Tổng điện lưới (nổi bật)
  highlightHeaderFill: '2563EB',
  highlightSubHeaderFill: 'D6E4FF',
  highlightText: '1E40AF',
  highlightFill: 'EEF4FF',
  highlightSundayFill: 'E2E8F3',
  highlightTotalFill: 'C7D8F5',
} as const

const TONE_STYLE = {
  ok: { fill: 'E6F4EA', color: '1E7B34' },
  warn: { fill: 'FFF4CE', color: '8A6100' },
  bad: { fill: 'FDE7E9', color: 'B42318' },
} as const

// ---------- định dạng số ----------

const AMOUNT_FMT: Record<EvnUnit, string> = { MWh: '#,##0.00', kWh: '#,##0', kUSD: '#,##0.00' }
const DIFF_FMT: Record<EvnUnit, string> = {
  MWh: '+#,##0.00;-#,##0.00;0.00',
  kWh: '+#,##0;-#,##0;0',
  kUSD: '+#,##0.00;-#,##0.00;0.00',
}
// % lưu dạng phân số (−0.072) để công thức Excel dùng được
const PCT_FMT = '+0.0%;-0.0%;0.0%'
const COVERAGE_FMT = '0.0%'
const DATE_FMT = 'dd/mm/yyyy'

const HEADER: XlsxStyle = {
  bold: true,
  color: COLOR.headerText,
  fill: COLOR.headerFill,
  align: 'center',
  vAlign: 'center',
  wrap: true,
  border: true,
}
const SUB_HEADER: XlsxStyle = { bold: true, fill: COLOR.subHeaderFill, align: 'center', vAlign: 'center', border: true }
const HEADER_HIGHLIGHT: XlsxStyle = { ...HEADER, fill: COLOR.highlightHeaderFill }
const SUB_HEADER_HIGHLIGHT: XlsxStyle = { ...SUB_HEADER, fill: COLOR.highlightSubHeaderFill, color: COLOR.highlightText }

// style nền của 1 nhóm cột: nhóm Tổng điện lưới tô nền xanh nhạt + chữ đậm
function groupBase(key: EvnGroupKey, base: XlsxStyle, kind: 'row' | 'sunday' | 'total'): XlsxStyle {
  if (key !== EVN_HIGHLIGHT_GROUP) return base
  const fill = kind === 'total'
    ? COLOR.highlightTotalFill
    : kind === 'sunday' ? COLOR.highlightSundayFill : COLOR.highlightFill
  return { ...base, fill, bold: true }
}

function pctValue(pct: number | null): number | null {
  return pct === null ? null : pct / 100
}

function pctCell(pct: number | null, base: XlsxStyle): XlsxCell {
  const tone = evnPctTone(pct)
  return {
    v: pctValue(pct),
    s: { ...base, numFmt: PCT_FMT, align: 'right', ...(tone ? { ...TONE_STYLE[tone], bold: true } : {}) },
  }
}

function dashCell(base: XlsxStyle): XlsxCell {
  return { v: EVN_DASH, s: { ...base, align: 'center', color: COLOR.muted } }
}

// Excel | Thực tế | Chênh | % của 1 nhóm khung giờ
function groupCells(cell: EvnCell, unit: EvnUnit, base: XlsxStyle): XlsxCell[] {
  if (cell.notApplicable) return [dashCell(base), dashCell(base), dashCell(base), dashCell(base)]

  const amount = (raw: number | null, numFmt: string): XlsxCell =>
    raw === null ? dashCell(base) : { v: toUnit(raw, unit), s: { ...base, numFmt, align: 'right' } }

  return [
    amount(cell.excel, AMOUNT_FMT[unit]),
    amount(cell.actual, AMOUNT_FMT[unit]),
    amount(cell.diff, DIFF_FMT[unit]),
    cell.pct === null ? dashCell(base) : pctCell(cell.pct, base),
  ]
}

function formatDate(date: string): string {
  const parsed = dayjs(date)
  return parsed.isValid() ? parsed.format('DD/MM/YYYY') : date
}

// =========================================================
// SHEET THEO NGÀY (1 phạm vi)
// =========================================================

const DAILY_WIDTHS = {
  date: 12,
  weekday: 7,
  amount: 12,
  pct: 9,
  source: 14,
  coverage: 11,
  hours: 11,
  note: 70,
}

function dailySheet(
  data: UtilityEvnCompareData,
  scope: UtilityScopeCode,
  unit: EvnUnit,
  labels: EvnLabels,
): XlsxSheet {
  const table = labels.table
  const rows = buildEvnCompareRows(data, scope, evnMetricOf(unit))
  const summary = summarizeEvnCompare(rows)

  const groupStart = 2
  const tailStart = groupStart + EVN_GROUPS.length * 4

  // 2 dòng tiêu đề: nhóm khung giờ (gộp 4 cột) / Excel | Thực tế | Chênh | %
  const head1: XlsxRow = [
    { v: table.date, s: HEADER },
    { v: table.weekday, s: HEADER },
    ...EVN_GROUPS.flatMap((key) => {
      const s = key === EVN_HIGHLIGHT_GROUP ? HEADER_HIGHLIGHT : HEADER
      return [{ v: `${table.groups[key]} (${unit})`, s }, { v: null, s }, { v: null, s }, { v: null, s }]
    }),
    { v: table.source, s: HEADER },
    { v: table.coverage, s: HEADER },
    { v: table.hoursWithData, s: HEADER },
    { v: table.note, s: HEADER },
  ]

  const head2: XlsxRow = [
    { v: null, s: HEADER },
    { v: null, s: HEADER },
    ...EVN_GROUPS.flatMap((key) => {
      const s = key === EVN_HIGHLIGHT_GROUP ? SUB_HEADER_HIGHLIGHT : SUB_HEADER
      return [table.excel, table.actual, table.diff, table.pct].map((v) => ({ v, s }))
    }),
    { v: null, s: HEADER },
    { v: null, s: HEADER },
    { v: null, s: HEADER },
    { v: null, s: HEADER },
  ]

  const merges = [
    xlsxRange(0, 0, 1, 0),
    xlsxRange(0, 1, 1, 1),
    ...EVN_GROUPS.map((_, i) => xlsxRange(0, groupStart + i * 4, 0, groupStart + i * 4 + 3)),
    ...[0, 1, 2, 3].map((i) => xlsxRange(0, tailStart + i, 1, tailStart + i)),
  ]

  const body: XlsxRow[] = rows.map((row) => {
    const base: XlsxStyle = { border: true, ...(row.sunday ? { fill: COLOR.sundayFill } : {}) }
    const serial = xlsxDateSerial(row.date)
    const note = evnNoteText(row, table)

    return [
      {
        v: serial ?? row.date,
        s: { ...base, numFmt: DATE_FMT, align: 'center', ...(row.partial ? { color: COLOR.partial, bold: true } : {}) },
      },
      { v: evnWeekdayLabel(row, table.weekdays), s: { ...base, align: 'center' } },
      ...EVN_GROUPS.flatMap((key) =>
        groupCells(row.cells[key], unit, groupBase(key, base, row.sunday ? 'sunday' : 'row')),
      ),
      {
        v: row.hasExcel ? table.sourceEvn : table.sourceNone,
        s: { ...base, align: 'center', ...(row.hasExcel ? { bold: true } : { color: COLOR.muted }) },
      },
      row.coveragePct === null
        ? dashCell(base)
        : {
          v: row.coveragePct / 100,
          s: { ...base, numFmt: COVERAGE_FMT, align: 'right', ...(row.partial ? { color: COLOR.partial, bold: true } : {}) },
        },
      row.hoursWithData === null ? dashCell(base) : { v: row.hoursWithData, s: { ...base, align: 'right' } },
      { v: note, s: { ...base, ...(row.partial ? { color: COLOR.partial } : {}) } },
    ]
  })

  const totalBase: XlsxStyle = { border: true, bold: true, fill: COLOR.totalFill }
  const total: XlsxRow = [
    { v: table.total, s: { ...totalBase, align: 'center' } },
    { v: null, s: totalBase },
    ...EVN_GROUPS.flatMap((key) => groupCells(summary.totals[key], unit, groupBase(key, totalBase, 'total'))),
    { v: table.totalHint(summary.excelDays), s: totalBase },
    { v: null, s: totalBase },
    { v: null, s: totalBase },
    { v: null, s: totalBase },
  ]
  const totalRow = 2 + body.length

  return {
    name: EVN_SCOPE_LABEL[scope],
    rows: [head1, head2, ...body, ...(body.length > 0 ? [total] : [])],
    merges: [...merges, ...(body.length > 0 ? [xlsxRange(totalRow, 0, totalRow, 1)] : [])],
    freeze: { rows: 2, cols: 2 },
    colWidths: [
      DAILY_WIDTHS.date,
      DAILY_WIDTHS.weekday,
      ...EVN_GROUPS.flatMap(() => [DAILY_WIDTHS.amount, DAILY_WIDTHS.amount, DAILY_WIDTHS.amount, DAILY_WIDTHS.pct]),
      DAILY_WIDTHS.source,
      DAILY_WIDTHS.coverage,
      DAILY_WIDTHS.hours,
      DAILY_WIDTHS.note,
    ],
  }
}

// =========================================================
// SHEET TỔNG HỢP
// =========================================================

function summaryRow(
  summary: EvnCompareSummary,
  metricLabel: string,
  unit: EvnUnit,
  official: number | null,
  scopeCells: XlsxCell[],
): XlsxRow {
  const base: XlsxStyle = { border: true }
  const total = summary.totals.totalElectricity
  const amount = (raw: number | null, numFmt: string): XlsxCell =>
    raw === null ? dashCell(base) : { v: toUnit(raw, unit), s: { ...base, numFmt, align: 'right' } }

  return [
    scopeCells[0],
    { v: metricLabel, s: { ...base, bold: true } },
    amount(total.excel, AMOUNT_FMT[unit]),
    amount(total.actual, AMOUNT_FMT[unit]),
    amount(total.diff, DIFF_FMT[unit]),
    total.pct === null ? dashCell(base) : pctCell(total.pct, base),
    scopeCells[1],
    scopeCells[2],
    scopeCells[3],
    summary.avgPctFull === null ? dashCell(base) : pctCell(summary.avgPctFull, base),
    amount(official, AMOUNT_FMT[unit]),
    scopeCells[4],
    scopeCells[5],
    scopeCells[6],
  ]
}

function summarySheet(
  data: UtilityEvnCompareData,
  month: string,
  unit: EvnUnit,
  labels: EvnLabels,
  minCoveragePct: number | null,
): XlsxSheet {
  const excel = labels.excel
  const kpi = labels.kpi
  const period = resolveBillPeriod(data.measured.billPeriod ?? data.official.billPeriod, month)
  const periodLabel = data.measured.billPeriod?.label ?? data.official.billPeriod?.label ?? null
  const dataUntil = formatDataUntil(data.measured.dataUntil ?? data.official.dataUntil)
  const excluded = data.measured.excludedMeters

  const infoLabel: XlsxStyle = { bold: true, color: COLOR.muted }
  const info: [string, string][] = [
    [excel.billPeriod, `${formatDate(period.from)} → ${formatDate(period.to)}${periodLabel ? `  (${periodLabel})` : ''}`],
    [excel.dataUntil, dataUntil ?? EVN_DASH],
    [excel.minCoverage, minCoveragePct === null ? EVN_DASH : `${minCoveragePct}%`],
    [excel.excludedMeters, excluded.length > 0 ? excluded.join(', ') : EVN_DASH],
    [excel.tableUnit, unit],
    [excel.exportedAt, dayjs().format('DD/MM/YYYY HH:mm')],
  ]

  const rows: XlsxRow[] = [
    [{ v: labels.title, s: { bold: true, fontSize: 14, color: COLOR.title } }],
    [],
    ...info.map(([label, value]): XlsxRow => [{ v: label, s: infoLabel }, null, value]),
    [],
  ]
  const merges: string[] = info.map((_, i) => xlsxRange(2 + i, 0, 2 + i, 1))

  rows.push([
    excel.scope,
    excel.metric,
    kpi.totalExcel,
    kpi.totalActual,
    kpi.diff,
    kpi.pct,
    kpi.excelDays,
    kpi.noExcelDays,
    kpi.partialDays,
    kpi.avgPctFull,
    excel.official,
    excel.evnDays,
    excel.measuredDays,
    excel.estimatedMissing,
  ].map((v) => ({ v, s: HEADER })))

  // MWh / kWh đang chọn → điện năng theo đơn vị đó; tiền luôn kUSD
  const energyUnit: EvnUnit = unit === 'kUSD' ? 'MWh' : unit
  const metrics: { metric: EvnMetric; unit: EvnUnit; label: string }[] = [
    { metric: 'mwh', unit: energyUnit, label: excel.gridEnergy(energyUnit) },
    { metric: 'kusd', unit: 'kUSD', label: excel.gridCost('kUSD') },
  ]

  for (const scope of UTILITY_SCOPE_CODES) {
    const officialScope = data.official.scopes.find((s) => s.code === scope)
    const measuredScope = data.measured.scopes.find((s) => s.code === scope)
    const start = rows.length
    const base: XlsxStyle = { border: true, align: 'center', vAlign: 'center' }
    const count = (value: number | null): XlsxCell => ({ v: value, s: base })

    metrics.forEach((m, i) => {
      const summary = summarizeEvnCompare(buildEvnCompareRows(data, scope, m.metric))
      const officialTotal = m.metric === 'mwh' ? officialScope?.officialTotalMwh : officialScope?.officialTotalKusd

      // cột theo phạm vi (không phụ thuộc chỉ số) chỉ ghi ở dòng đầu, dòng sau gộp
      const scopeCells: XlsxCell[] = i === 0
        ? [
          { v: EVN_SCOPE_LABEL[scope], s: { ...base, bold: true } },
          count(summary.excelDays),
          count(summary.noExcelDays),
          count(summary.partialDays),
          count(officialScope?.evnDays ?? null),
          count(officialScope?.measuredDays ?? null),
          measuredScope?.estimatedMissingMwh == null
            ? dashCell(base)
            : { v: measuredScope.estimatedMissingMwh, s: { ...base, numFmt: AMOUNT_FMT.MWh, align: 'right' } },
        ]
        : Array.from({ length: 7 }, () => ({ v: null, s: base }))

      rows.push(summaryRow(summary, m.label, m.unit, officialTotal?.totalElectricity ?? null, scopeCells))
    })

    // gộp dọc: phạm vi, số ngày, ngày EVN / đo, ước tính thiếu
    for (const col of [0, 6, 7, 8, 11, 12, 13]) {
      merges.push(xlsxRange(start, col, start + metrics.length - 1, col))
    }
  }

  // chú thích
  const notes = [
    excel.totalsRule,
    excel.pctLegend(EVN_PCT_OK, EVN_PCT_WARN),
    ...labels.notes.lines,
    ...(minCoveragePct !== null ? [labels.notes.partialRule(minCoveragePct)] : []),
    ...(excluded.length > 0 ? [labels.notes.excludedMeters(excluded.join(', '))] : []),
    excel.officialNote,
    excel.solarNote,
    excel.moneyNote,
  ]

  rows.push([], [{ v: labels.notes.title, s: { bold: true, color: COLOR.title } }])
  for (const line of notes) {
    merges.push(xlsxRange(rows.length, 0, rows.length, 13))
    rows.push([{ v: `• ${line}`, s: { wrap: true, vAlign: 'top' } }])
  }

  return {
    name: excel.sheetSummary,
    rows,
    merges,
    colWidths: [14, 24, 14, 14, 13, 10, 10, 11, 11, 14, 16, 11, 11, 14],
  }
}

// =========================================================
// SHEET CẢNH BÁO ĐỒNG HỒ
// =========================================================

function issuesSheet(data: UtilityEvnCompareData, labels: EvnLabels): XlsxSheet {
  const issues = labels.issues
  const severityLabels = issues.severityLabels as Record<string, string | undefined>

  const rows: XlsxRow[] = [
    [
      labels.excel.scope,
      issues.meter,
      issues.fac,
      issues.severity,
      issues.missingHours,
      issues.dates,
      labels.excel.lastDataAt,
    ].map((v) => ({ v, s: HEADER })),
  ]

  for (const scope of UTILITY_SCOPE_CODES) {
    for (const issue of collectMeterIssues(data, scope)) {
      const base: XlsxStyle = { border: true, vAlign: 'top' }
      const major = issue.severity === 'MAJOR'
      const tone = issue.severity ? (major ? TONE_STYLE.bad : TONE_STYLE.warn) : null

      rows.push([
        { v: EVN_SCOPE_LABEL[scope], s: { ...base, align: 'center' } },
        { v: issue.meter, s: { ...base, bold: true } },
        { v: evnScopeLabel(issue.fac), s: { ...base, align: 'center' } },
        {
          v: issue.severity ? severityLabels[issue.severity] ?? issue.severity : EVN_DASH,
          s: { ...base, align: 'center', ...(tone ? { ...tone, bold: true } : { color: COLOR.muted }) },
        },
        issue.missingHours === null
          ? dashCell(base)
          : { v: Math.round(issue.missingHours * 10) / 10, s: { ...base, align: 'right', bold: true } },
        { v: formatDateRanges(issue.dates), s: { ...base, wrap: true } },
        { v: formatDataUntil(issue.lastDataAt) ?? EVN_DASH, s: { ...base, align: 'center' } },
      ])
    }
  }

  const empty = rows.length === 1
  if (empty) rows.push([{ v: issues.none, s: { italic: true, color: COLOR.muted } }])

  return {
    name: issues.title,
    rows,
    merges: empty ? [xlsxRange(1, 0, 1, 6)] : [],
    freeze: { rows: 1 },
    colWidths: [11, 26, 10, 10, 13, 48, 18],
  }
}

// =========================================================
// WORKBOOK
// =========================================================

export function buildEvnCompareWorkbook(
  data: UtilityEvnCompareData,
  month: string,
  unit: EvnUnit,
  labels: EvnLabels,
): Blob {
  const minCoveragePct = data.measured.minCoveragePct

  return buildXlsx([
    summarySheet(data, month, unit, labels, minCoveragePct),
    ...UTILITY_SCOPE_CODES.map((scope) => dailySheet(data, scope, unit, labels)),
    issuesSheet(data, labels),
  ])
}
