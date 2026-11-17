import {
    API_BASE_URL,
} from '../config/api'

import { getMessages } from '../i18n/i18nContext'
import { getCurrentEmployeeId } from './authService'

import {
    OT_SUB_DIVS,
} from '../types/costMonitoring'

import type {
    CostDiv,
    CostOtImportResult,
    CostOtImportSummary,
    CostOtStatusResponse,
    CostOtStatusRow,
    OtSubDiv,
    CostChartForecast,
    CostDetailDailyRow,
    CostForecastStatus,
    CostDetailKpi,
    CostDetailResponse,
    CostDetailTarget,
    CostDetailTransaction,
    CostDetailTransactionPage,
    CostDetailTxQuery,
    CostMonitoringChartResponse,
    CostPlWeeksResponse,
    CostSimuWeek,
} from '../types/costMonitoring'


// =========================================================
// COST MONITORING – API backlog-be (/api/cost-monitoring)
// =========================================================

const API_URL =
    `${API_BASE_URL.replace(/\/$/, '')}/api/cost-monitoring`

async function getJson(
    url: string,
    signal?: AbortSignal,
): Promise<unknown> {

    const response = await fetch(
        url,
        {
            method: 'GET',

            headers: {
                Accept: 'application/json',
            },

            signal,
        },
    )

    if (!response.ok) {
        throw new Error(
            `Cost Monitoring API failed: ${response.status}`,
        )
    }

    return response.json()
}


// =========================================================
// VALIDATION
// =========================================================

function isChartResponse(
    value: unknown,
): value is CostMonitoringChartResponse {

    if (
        typeof value !== 'object'
        || value === null
    ) {
        return false
    }

    const item =
        value as Record<string, unknown>

    return (
        typeof item.month === 'string'
        && Array.isArray(item.charts)
    )
}


// =========================================================
// MONTHS – "2026.10", mới nhất trước
// =========================================================

export async function getCostMonitoringMonths(
    signal?: AbortSignal,
): Promise<string[]> {

    const result =
        await getJson(`${API_URL}/months`, signal)

    if (
        !Array.isArray(result)
        || !result.every((m) => typeof m === 'string')
    ) {
        throw new Error(
            'Invalid Cost Monitoring months response',
        )
    }

    return result
}


// =========================================================
// CHART – month dạng "2026-10"
// =========================================================

export async function getCostMonitoringChart(
    month: string,
    simuWeek: CostSimuWeek,
    signal?: AbortSignal,
    // true: nút Refresh – BE bỏ cache, tính lại; load thường không gửi
    refresh = false,
): Promise<CostMonitoringChartResponse> {

    const params =
        new URLSearchParams({ month })

    if (simuWeek) {
        params.set('simuWeek', simuWeek)
    }

    if (refresh) {
        params.set('refresh', 'true')
    }

    const result =
        await getJson(`${API_URL}/chart?${params}`, signal)

    if (!isChartResponse(result)) {
        throw new Error(
            'Invalid Cost Monitoring chart response',
        )
    }

    return {
        ...result,
        charts: result.charts.map((chart) => ({
            ...chart,
            forecast: mapForecast((chart as { forecast?: unknown }).forecast),
        })),
    }
}

const FORECAST_STATUSES: readonly CostForecastStatus[] = ['OVER', 'WILL_EXCEED', 'WITHIN', 'NO_DATA']

// Map đúng record CostChartForecastDto; thiếu object → null
function mapForecast(raw: unknown): CostChartForecast | null {
    if (!isRecord(raw)) return null

    const status = FORECAST_STATUSES.find((s) => s === raw.status) ?? null

    return {
        status,
        actualPctOfFluct: num(raw.actualPctOfFluct),
        estimateBase: raw.estimateBase === 'PL' || raw.estimateBase === 'Fluct' ? raw.estimateBase : null,
        estimateEom: num(raw.estimateEom),
        estimateOver: num(raw.estimateOver),
        estimateOverFc: num(raw.estimateOverFc),
        estimatePctOfFluct: num(raw.estimatePctOfFluct),
        estimateOverPct: num(raw.estimateOverPct),
        projectedEom: num(raw.projectedEom),
        projectedOver: num(raw.projectedOver),
        projectedOverFc: num(raw.projectedOverFc),
        projectedPctOfFluct: num(raw.projectedPctOfFluct),
        projectedOverPct: num(raw.projectedOverPct),
    }
}


// =========================================================
// PL SIMULATION WEEKS – month dạng "2026-10"
// =========================================================

function isPlWeeksResponse(
    value: unknown,
): value is CostPlWeeksResponse {

    if (
        typeof value !== 'object'
        || value === null
    ) {
        return false
    }

    const item =
        value as Record<string, unknown>

    return (
        Array.isArray(item.weeks)
        && item.weeks.every((w) => typeof w === 'string')
        && (item.latestWeek === null || typeof item.latestWeek === 'string')
    )
}

export async function getCostMonitoringPlWeeks(
    month: string,
    signal?: AbortSignal,
): Promise<CostPlWeeksResponse> {

    const result =
        await getJson(
            `${API_URL}/pl-weeks?${new URLSearchParams({ month })}`,
            signal,
        )

    if (!isPlWeeksResponse(result)) {
        throw new Error(
            'Invalid Cost Monitoring PL weeks response',
        )
    }

    return {
        ...result,
        latestMixed: result.latestMixed === true,
    }
}


// =========================================================
// DETAIL 1 khung (KPI + theo ngày + giao dịch) – month dạng "2026-10"
// =========================================================

// Map đúng record CostDetailResponse của BE; chỉ ép kiểu an toàn (số / chuỗi / ngày)

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function num(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function text(value: unknown): string | null {
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

// LocalDate Jackson: "2026-11-05" (hoặc mảng [2026, 11, 5] nếu tắt WRITE_DATES_AS_TIMESTAMPS sai cấu hình)
function date(value: unknown): string | null {
    if (typeof value === 'string') return value.slice(0, 10) || null
    if (Array.isArray(value) && value.length >= 3) {
        const [y, m, d] = value as number[]
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
    return null
}

function mapKpi(raw: unknown): CostDetailKpi {
    const k = isRecord(raw) ? raw : {}

    return {
        fc: num(k.fc),
        fluct: num(k.fluct),
        ratioPct: num(k.ratioPct),
        actMtd: num(k.actMtd),
        estimateEom: num(k.estimateEom),
        pctOfFluct: num(k.pctOfFluct),
        currentRate: num(k.currentRate),
        projectedEom: num(k.projectedEom),
        projectedOver: num(k.projectedOver),
        projectedOverFc: num(k.projectedOverFc),
        status: k.status === 'OVER' || k.status === 'OK' ? k.status : null,
    }
}

function mapDaily(raw: unknown): CostDetailDailyRow[] {
    if (!Array.isArray(raw)) return []

    return raw.filter(isRecord).flatMap((d) => {
        const day = date(d.date)
        return day
            ? [{
                date: day,
                daily: num(d.daily),
                cumulative: num(d.cumulative),
                ratioPct: num(d.ratioPct),
                fluct: num(d.fluct),
                diff: num(d.diff),
            }]
            : []
    })
}

// BE trả unitPrice = 0 khi nguồn không có đơn giá (vd LAPTOP SL 1, 1.076 K$) → coi như null
function unitPriceOf(tx: JsonRecord): number | null {
    const unitPrice = num(tx.unitPrice)
    if (unitPrice !== 0) return unitPrice

    const amount = num(tx.amount) ?? num(tx.amountK)
    return amount != null && amount !== 0 ? null : unitPrice
}

function mapTransaction(tx: JsonRecord): CostDetailTransaction {
    return {
        date: date(tx.date),
        code: text(tx.code),
        name: text(tx.name),
        category: text(tx.category),
        qty: num(tx.qty),
        qtyUnit: text(tx.qtyUnit),
        unitPrice: unitPriceOf(tx),
        amount: num(tx.amount),
        amountK: num(tx.amountK),
        costCenter: text(tx.costCenter),
        costCenterName: text(tx.costCenterName),
        machine: text(tx.machine),
    }
}

// transactions là object phân trang { items, totalElements, ... }, không phải mảng
function mapTransactionPage(raw: unknown): CostDetailTransactionPage {
    const p = isRecord(raw) ? raw : {}
    const items = Array.isArray(p.items) ? p.items.filter(isRecord).map(mapTransaction) : []

    return {
        from: date(p.from),
        to: date(p.to),
        page: num(p.page) ?? 0,
        size: num(p.size) ?? items.length,
        totalElements: num(p.totalElements) ?? items.length,
        totalPages: num(p.totalPages) ?? (items.length > 0 ? 1 : 0),
        totalAmountK: num(p.totalAmountK),
        allocationK: num(p.allocationK),
        items,
    }
}

async function fetchDetail(
    month: string,
    target: CostDetailTarget,
    simuWeek: CostSimuWeek,
    query: CostDetailTxQuery,
    signal?: AbortSignal,
    refresh = false,
): Promise<JsonRecord> {

    const params = new URLSearchParams({
        month,
        div: target.div,
        chart: target.chart,
        page: String(query.page),
        size: String(query.size),
    })

    if (simuWeek) params.set('simuWeek', simuWeek)
    if (query.date) params.set('date', query.date)
    if (refresh) params.set('refresh', 'true')

    const result =
        await getJson(`${API_URL}/detail?${params}`, signal)

    if (!isRecord(result)) {
        throw new Error(
            'Invalid Cost Monitoring detail response',
        )
    }

    return result
}

export async function getCostMonitoringDetail(
    month: string,
    target: CostDetailTarget,
    simuWeek: CostSimuWeek,
    query: CostDetailTxQuery,
    signal?: AbortSignal,
    // true: nút Refresh khi drawer đang mở; load thường không gửi
    refresh = false,
): Promise<CostDetailResponse> {

    const result = await fetchDetail(month, target, simuWeek, query, signal, refresh)

    return {
        month: text(result.month) ?? month,
        div: target.div,
        chart: target.chart,
        simuWeek: text(result.simuWeek),
        unit: text(result.unit) ?? 'K$',
        daysInMonth: num(result.daysInMonth) ?? 0,
        asOfDate: date(result.asOfDate),
        monthClosed: result.monthClosed === true,
        kpi: mapKpi(result.kpi),
        daily: mapDaily(result.daily),
        transactions: mapTransactionPage(result.transactions),
    }
}

// Chỉ lấy trang giao dịch (đổi trang / lọc ngày) – BE trả kèm KPI nhưng FE bỏ qua
export async function getCostMonitoringDetailTransactions(
    month: string,
    target: CostDetailTarget,
    simuWeek: CostSimuWeek,
    query: CostDetailTxQuery,
    signal?: AbortSignal,
): Promise<CostDetailTransactionPage> {

    const result = await fetchDetail(month, target, simuWeek, query, signal)

    return mapTransactionPage(result.transactions)
}


// =========================================================
// EXPORT giao dịch – lấy đủ mọi trang (size tối đa BE = 200) rồi xuất CSV UTF-8 (BOM),
// Excel mở thẳng, không cần thư viện
// =========================================================

const EXPORT_PAGE_SIZE = 200
// chặn vòng lặp vô hạn nếu BE trả totalPages sai
const EXPORT_MAX_PAGES = 100

function csvCell(value: string | number | null): string {
    if (value == null) return ''
    const cell = String(value)
    return /[",\r\n;]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell
}

export interface CostTxExportHeaders {
    date: string
    code: string
    name: string
    category: string
    qty: string
    qtyUnit: string
    unitPrice: string
    amount: string
    amountK: string
    costCenter: string
    machine: string
}

export async function exportCostTransactionsExcel(
    month: string,
    target: CostDetailTarget,
    simuWeek: CostSimuWeek,
    filterDate: string | null,
    headers: CostTxExportHeaders,
    fileName: string,
): Promise<void> {

    const rows: CostDetailTransaction[] = []

    for (let page = 0; page < EXPORT_MAX_PAGES; page++) {
        const result = await getCostMonitoringDetailTransactions(
            month,
            target,
            simuWeek,
            { date: filterDate, page, size: EXPORT_PAGE_SIZE },
        )

        rows.push(...result.items)

        if (page + 1 >= result.totalPages || result.items.length === 0) break
    }

    const lines = [
        [
            headers.date, headers.code, headers.name, headers.category, headers.qty, headers.qtyUnit,
            headers.unitPrice, headers.amount, headers.amountK, headers.costCenter, headers.machine,
        ],
        ...rows.map((r) => [
            r.date, r.code, r.name, r.category, r.qty, r.qtyUnit,
            r.unitPrice, r.amount, r.amountK,
            [r.costCenter, r.costCenterName].filter(Boolean).join(' - ') || null,
            r.machine,
        ]),
    ].map((cells) => cells.map(csvCell).join(','))

    const blob = new Blob(
        ['﻿' + lines.join('\r\n')],
        { type: 'text/csv;charset=utf-8' },
    )

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
}


// =========================================================
// NẠP ACTUAL OT – /ot/import (multipart), /ot/import-from-share, /ot/status
// Ghi cần header X-Employee-Id (BE kiểm quyền ADMIN).
// Lỗi BE luôn dạng { status, message } → dùng message; thiếu thì thông báo theo status.
// =========================================================

export class CostApiError extends Error {
    readonly status?: number

    constructor(message: string, status?: number) {
        super(message)

        this.name = 'CostApiError'
        this.status = status
    }
}

function otErrorMessage(status: number): string {
    const errors = getMessages().costOt.errors

    if (status === 401) return errors.notSignedIn
    if (status === 403) return errors.forbidden
    if (status === 400) return errors.badRequest
    if (status === 503) return errors.shareUnavailable
    return errors.http(status)
}

async function otRequest(
    url: string,
    init: RequestInit,
    write: boolean,
): Promise<unknown> {
    const headers: Record<string, string> = { Accept: 'application/json' }

    if (write) {
        const employeeId = getCurrentEmployeeId()

        if (!employeeId) {
            throw new CostApiError(getMessages().costOt.errors.notSignedIn, 401)
        }

        headers['X-Employee-Id'] = employeeId
    }

    let response: Response

    try {
        // body FormData: KHÔNG set Content-Type – browser tự thêm boundary
        response = await fetch(url, { cache: 'no-store', ...init, headers })
    } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err
        throw new CostApiError(getMessages().costOt.errors.network)
    }

    const body: unknown = await response.json().catch(() => null)

    if (!response.ok) {
        const message = isRecord(body) ? text(body.message) : null
        throw new CostApiError(message ?? otErrorMessage(response.status), response.status)
    }

    if (body === null) {
        throw new CostApiError(getMessages().costOt.errors.invalidResponse, response.status)
    }

    return body
}

function subDivOf(value: unknown): OtSubDiv | null {
    return OT_SUB_DIVS.find((s) => s === value) ?? null
}

function divOf(value: unknown, subDiv: OtSubDiv): CostDiv {
    if (value === 'PR' || value === 'MO' || value === 'Guide') return value
    return subDiv === 'PG' || subDiv === 'MG' ? 'Guide' : subDiv
}

// LocalDateTime Jackson: "2026-11-17T08:30:00" (hoặc mảng [y, M, d, H, m, s])
function dateTime(value: unknown): string | null {
    if (typeof value === 'string') return value.trim() || null
    if (Array.isArray(value) && value.length >= 3) {
        const [y, mo, d, h = 0, mi = 0, s = 0] = value as number[]
        const p = (n: number) => String(n).padStart(2, '0')
        return `${y}-${p(mo)}-${p(d)}T${p(h)}:${p(mi)}:${p(s)}`
    }
    return null
}

function mapOtSummary(raw: JsonRecord): CostOtImportSummary[] {
    const subDiv = subDivOf(raw.subDiv)
    if (!subDiv) return []

    return [{
        month: text(raw.month) ?? '',
        subDiv,
        div: divOf(raw.div, subDiv),
        sheet: text(raw.sheet) ?? '',
        days: num(raw.days) ?? 0,
        firstDate: date(raw.firstDate),
        lastDate: date(raw.lastDate),
        totalK: num(raw.totalK),
    }]
}

function mapOtImportResult(raw: unknown): CostOtImportResult {
    if (!isRecord(raw) || !Array.isArray(raw.summaries)) {
        throw new CostApiError(getMessages().costOt.errors.invalidResponse)
    }

    return {
        source: text(raw.source) ?? '',
        dryRun: raw.dryRun === true,
        importedAt: dateTime(raw.importedAt),
        rowsWritten: num(raw.rowsWritten) ?? 0,
        summaries: raw.summaries.filter(isRecord).flatMap(mapOtSummary),
        warnings: Array.isArray(raw.warnings)
            ? raw.warnings.filter((w): w is string => typeof w === 'string' && w.trim() !== '')
            : [],
    }
}

function mapOtStatusRow(raw: JsonRecord): CostOtStatusRow[] {
    const subDiv = subDivOf(raw.subDiv)
    if (!subDiv) return []

    return [{
        subDiv,
        div: divOf(raw.div, subDiv),
        days: num(raw.days) ?? 0,
        lastDate: date(raw.lastDate),
        totalK: num(raw.totalK),
        loadedAt: dateTime(raw.loadedAt),
        source: text(raw.source),
    }]
}

export interface CostOtImportOptions {
    // "2026-11"; bỏ trống = mọi tháng trong file
    month?: string
    dryRun: boolean
}

// file .xlsx/.xlsm ≤ 20MB (FE đã kiểm trước khi gọi)
export async function importOt(
    file: File,
    opts: CostOtImportOptions,
    signal?: AbortSignal,
): Promise<CostOtImportResult> {
    const form = new FormData()

    form.append('file', file)
    if (opts.month) form.append('month', opts.month)
    form.append('dryRun', String(opts.dryRun))

    const result = await otRequest(
        `${API_URL}/ot/import`,
        { method: 'POST', body: form, signal },
        true,
    )

    return mapOtImportResult(result)
}

// BE tự đọc file trên share (\\192.168.0.6); không có body
export async function importOtFromShare(
    opts: CostOtImportOptions,
    signal?: AbortSignal,
): Promise<CostOtImportResult> {
    const params = new URLSearchParams({ dryRun: String(opts.dryRun) })
    if (opts.month) params.set('month', opts.month)

    const result = await otRequest(
        `${API_URL}/ot/import-from-share?${params}`,
        { method: 'POST', signal },
        true,
    )

    return mapOtImportResult(result)
}

// month dạng "2026-11"
export async function getOtStatus(
    month: string,
    signal?: AbortSignal,
): Promise<CostOtStatusResponse> {
    const result = await otRequest(
        `${API_URL}/ot/status?${new URLSearchParams({ month })}`,
        { method: 'GET', signal },
        false,
    )

    if (!isRecord(result) || !Array.isArray(result.rows)) {
        throw new CostApiError(getMessages().costOt.errors.invalidResponse)
    }

    return {
        month: text(result.month) ?? month,
        unit: text(result.unit) ?? 'K$',
        shareImportEnabled: result.shareImportEnabled === true,
        rows: result.rows.filter(isRecord).flatMap(mapOtStatusRow),
    }
}


// "2026.10" -> "2026-10"
export function toApiMonth(
    month: string,
): string {
    return month.replace('.', '-')
}
