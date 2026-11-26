import { apiFetch } from './apiClient'
import {
    API_BASE_URL,
} from '../config/api'

import { getMessages } from '../i18n/i18nContext'
import { getToken } from './authStore'
import { fileNameFromDisposition, readBlobWithProgress, saveBlob, type DownloadProgress } from '../utils/download'

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

    const response = await apiFetch(
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

    const startedAt = performance.now()
    const result =
        await getJson(`${API_URL}/detail?${params}`, signal)

    // dev: ghi thời gian để biết chậm ở BE hay do xếp hàng phía trình duyệt (xem thêm tab Network)
    if (import.meta.env.DEV) {
        console.info(
            `[cost] /detail ${target.div}·${target.chart} p${query.page}${query.date ? ` ${query.date}` : ''}`
            + ` – ${Math.round(performance.now() - startedAt)} ms`,
        )
    }

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

// =========================================================
// GIAO DỊCH 1 KHUNG – /detail/transactions (+ /facets, /export)
// Tìm / lọc / sắp xếp / phân trang đều ở BE (không chạy snapshot / SP như /detail).
// Tham số nhiều giá trị: lặp lại tên (category=A&category=B), "" = ô trống.
// =========================================================

export type CostTxFacetColumn = 'date' | 'category' | 'costCenter' | 'machine'
export type CostTxSortField = 'date' | 'qty' | 'unitPrice' | 'amountK'

export interface CostTxServerQuery {
    // yyyy-MM-dd (cùng 1 tháng); thường lấy từ transactions.from / to của /detail
    from: string
    to: string
    q: string
    sort: { field: CostTxSortField; dir: 'asc' | 'desc' } | null
    filters: Partial<Record<CostTxFacetColumn, string[]>>
}

export interface CostTxFacetValue {
    value: string
    label: string
    count: number
}

export interface CostTxFacets {
    total: number
    truncated: boolean
    values: CostTxFacetValue[]
}

function txParams(target: CostDetailTarget, query: CostTxServerQuery) {
    const params = new URLSearchParams({
        div: target.div,
        chart: target.chart,
        from: query.from,
        to: query.to,
    })

    if (query.q.trim()) params.set('q', query.q.trim())
    if (query.sort) params.set('sort', `${query.sort.field},${query.sort.dir}`)

    for (const [column, values] of Object.entries(query.filters)) {
        for (const value of values ?? []) params.append(column, value)
    }

    return params
}

// Lỗi BE dạng { status, message } → dùng message
async function errorOf(response: Response, fallback: string) {
    try {
        const body: unknown = await response.json()
        if (isRecord(body) && typeof body.message === 'string' && body.message) return new Error(body.message)
    } catch {
        // không phải JSON
    }
    return new Error(`${fallback}: ${response.status}`)
}

export async function getCostTransactionsPage(
    target: CostDetailTarget,
    query: CostTxServerQuery,
    page: number,
    size: number,
    signal?: AbortSignal,
): Promise<CostDetailTransactionPage> {

    const params = txParams(target, query)
    params.set('page', String(page))
    params.set('size', String(size))

    const startedAt = performance.now()
    const response = await apiFetch(`${API_URL}/detail/transactions?${params}`, {
        headers: { Accept: 'application/json' },
        signal,
    })

    if (!response.ok) throw await errorOf(response, 'Cost Monitoring transactions failed')

    const result: unknown = await response.json()

    if (import.meta.env.DEV) {
        console.info(`[cost] /detail/transactions ${target.div}·${target.chart} p${page} – ${Math.round(performance.now() - startedAt)} ms`)
    }

    return mapTransactionPage(result)
}

// Giá trị dropdown của 1 cột (BE bỏ bộ lọc của chính cột này, áp dụng q + cột khác)
export async function getCostTransactionFacets(
    target: CostDetailTarget,
    query: CostTxServerQuery,
    column: CostTxFacetColumn,
    signal?: AbortSignal,
): Promise<CostTxFacets> {

    const params = txParams(target, { ...query, sort: null })
    params.set('column', column)

    const response = await apiFetch(`${API_URL}/detail/transactions/facets?${params}`, {
        headers: { Accept: 'application/json' },
        signal,
    })

    if (!response.ok) throw await errorOf(response, 'Cost Monitoring facets failed')

    const result: unknown = await response.json()
    const raw = isRecord(result) ? result : {}
    const values = Array.isArray(raw.values) ? raw.values.filter(isRecord) : []

    return {
        total: num(raw.total) ?? values.length,
        truncated: raw.truncated === true,
        values: values.map((v) => ({
            value: text(v.value) ?? '',
            label: text(v.label) ?? text(v.value) ?? '',
            count: num(v.count) ?? 0,
        })),
    }
}

// .xlsx do BE tạo theo đúng bộ lọc / thứ tự đang xem (1 request, stream) → trả tên file
export async function exportCostTransactionsXlsx(
    target: CostDetailTarget,
    query: CostTxServerQuery,
    fallbackName: string,
    onProgress?: DownloadProgress,
): Promise<string> {

    onProgress?.(null)

    const response = await apiFetch(`${API_URL}/detail/transactions/export?${txParams(target, query)}`)

    if (!response.ok) throw await errorOf(response, 'Cost Monitoring export failed')

    const fileName = fileNameFromDisposition(response.headers.get('Content-Disposition'), fallbackName)
    const blob = await readBlobWithProgress(response, onProgress)

    saveBlob(blob, fileName)

    return fileName
}


// =========================================================
// NẠP ACTUAL OT – /ot/import (multipart), /ot/import-from-share, /ot/status
// Ghi cần token có quyền COST_MONITORING X (BE kiểm).
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

    // Người ghi: BE lấy từ token (apiFetch gắn Authorization). Không có token thì báo ngay.
    if (write && !getToken()) {
        throw new CostApiError(getMessages().costOt.errors.notSignedIn, 401)
    }

    let response: Response

    try {
        // body FormData: KHÔNG set Content-Type – browser tự thêm boundary
        response = await apiFetch(url, { cache: 'no-store', ...init, headers })
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
