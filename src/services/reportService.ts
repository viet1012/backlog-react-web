import { API_BASE_URL } from '../config/api'
import type { ProductionOrder } from '../types/report'
import {
  nullableNumber,
  nullableString,
  requiredString,
} from '../utils/apiMapper'
import {
  isExcelFilterField,
  type ExcelFilterField,
} from '../config/backlogFilterFields'

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface BacklogFilterItem {
  field: string
  operator: string
  value?: string
  values?: string[]
}
// =========================================================
// FILTER OPTIONS CACHE
// =========================================================

const FILTER_OPTIONS_CACHE_TTL = 10 * 60 * 1000 // 10 phút

interface FilterOptionsCacheEntry {
  values: string[]
  expiresAt: number
}

const filterOptionsCache = new Map<
  ExcelFilterField,
  FilterOptionsCacheEntry
>()

// tránh gọi trùng API nếu user mở cùng filter liên tục
const filterOptionsPending = new Map<
  ExcelFilterField,
  Promise<string[]>
>()


export async function getBacklogFilterOptions(
  field: ExcelFilterField,
  signal?: AbortSignal,
): Promise<string[]> {
  if (!isExcelFilterField(field)) {
    throw new Error(`Unsupported backlog filter field: ${field}`)
  }

  // =======================================================
  // 1. CHECK CACHE
  // =======================================================

  const now = Date.now()

  const cached = filterOptionsCache.get(field)

  if (cached && cached.expiresAt > now) {
    return cached.values
  }

  if (cached) {
    filterOptionsCache.delete(field)
  }

  // =======================================================
  // 2. CHECK REQUEST ĐANG CHẠY
  // =======================================================

  const pending = filterOptionsPending.get(field)

  if (pending) {
    return pending
  }

  // =======================================================
  // 3. CALL API
  // =======================================================

  const request = (async (): Promise<string[]> => {
    const query = new URLSearchParams({
      field,
    })

    const response = await fetch(
      `${API_BASE_URL}/api/backlogs/filter-options?${query.toString()}`,
      {
        headers: {
          Accept: 'application/json',
        },
        signal,
      },
    )

    if (!response.ok) {
      throw new Error(
        `API request failed with status ${response.status}`,
      )
    }

    const result: unknown = await response.json()

    const values =
      Array.isArray(result)
        ? result
        : typeof result === 'object'
          && result !== null
          && 'values' in result
          && Array.isArray(result.values)
          ? result.values
          : null

    if (
      !values ||
      !values.every(
        (value) =>
          value === null ||
          typeof value === 'string',
      )
    ) {
      throw new Error(
        'Filter options response is invalid',
      )
    }

    // =====================================================
    // NORMALIZE + REMOVE DUPLICATE
    // =====================================================

    const normalizedValues = [
      ...new Set(
        values.map(
          (value) => value ?? '',
        ),
      ),
    ].sort((left, right) =>
      left.localeCompare(right),
    )

    // =====================================================
    // SAVE CACHE
    // =====================================================

    filterOptionsCache.set(field, {
      values: normalizedValues,
      expiresAt:
        Date.now() +
        FILTER_OPTIONS_CACHE_TTL,
    })

    return normalizedValues
  })()

  filterOptionsPending.set(
    field,
    request,
  )

  try {
    return await request
  } finally {
    filterOptionsPending.delete(field)
  }
}

export interface BacklogFilterRequest {
  filters: BacklogFilterItem[]
  logicOperator: 'and' | 'or'
}

export interface BacklogSortRequest {
  field: ExcelFilterField
  direction: 'asc' | 'desc'
}

export interface ReportFilters {
  search: string
  status: string
  div: string
  currentProcess: string
  shipBy: string
  productionDate: string
}

const emptyFilters: ReportFilters = {
  search: '',
  status: '',
  div: '',
  currentProcess: '',
  shipBy: '',
  productionDate: '',
}

const DEFAULT_PAGE_SIZE = 20

type ApiBacklog = Record<string, unknown>

interface ApiPageResponse extends Omit<PageResponse<ApiBacklog>, 'content'> {
  content: ApiBacklog[]
}

function mapApiBacklog(item: ApiBacklog): ProductionOrder {
  return {
    VBELN: requiredString(item.vbeln, 'vbeln'),
    ZGLOBAL_CODE: requiredString(item.zglobalCode, 'zglobalCode'),
    PIER_AUFNR: requiredString(item.pierAufnr, 'pierAufnr'),
    AUFNR: requiredString(item.aufnr, 'aufnr'),
    IssueD: nullableString(item.issueD),
    ProductionD: nullableString(item.productionD),
    PromiseD: nullableString(item.promiseD),
    ExportD: nullableString(item.exportD),
    ORG_Date: nullableString(item.orgDate),
    MSM_Ship: nullableString(item.msmShip),
    PNAME: nullableString(item.pname),
    RRONYU1: nullableString(item.rronyu1),
    ShipBy: nullableString(item.shipBy),
    GAMNG: nullableNumber(item.gamng),
    NETPR: nullableNumber(item.netpr),
    PHCD: nullableString(item.phcd),
    KWMENG: nullableNumber(item.kwmeng),
    RODENK: nullableString(item.rodenk),
    LOEKZ: nullableString(item.loekz),
    MTO_ID: nullableString(item.mtoId),
    PRT_ADDCMT1: nullableString(item.prtAddcmt1),
    PRT_ADDCMT2: nullableString(item.prtAddcmt2),
    PRT_STS: nullableString(item.prtSts),
    Div: nullableString(item.div),
    FERTH: nullableString(item.ferth),
    PO_SRG_Convert: nullableString(item.poSrgConvert),
    ToDrill: nullableString(item.toDrill),
    ToHeat: nullableString(item.toHeat),
    ToPK: nullableString(item.toPk),
    Status: nullableString(item.status),
    CurrentProcess: nullableString(item.currentProcess),
    HeatCharge: nullableString(item.heatCharge),
    ProcessQty: nullableNumber(item.processQty),
    Z300Qty: nullableNumber(item.z300Qty),
    PkQty: nullableNumber(item.pkQty),
    FinalQty: nullableNumber(item.finalQty),
    TimeSQuenching: nullableString(item.timeSQuenching),
    TimeFHeat: nullableString(item.timeFHeat),
    C_PRODH: nullableString(item.cProdh),
    C_KEYCONTROL1: nullableString(item.cKeycontrol1),
    C_KEYCONTROL3: nullableString(item.cKeycontrol3),
    Updater: nullableString(item.updater),
    UpdatedAt: nullableString(item.updatedAt),
  }
}

export async function getReports(
  page: number,
  filters: ReportFilters = emptyFilters,
  signal?: AbortSignal,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PageResponse<ProductionOrder>> {
  if (!Number.isInteger(page) || page < 0) {
    throw new RangeError('Page must be a non-negative integer')
  }

  const query = new URLSearchParams({
    page: String(page),
    size: String(pageSize),
  })

  const search = filters.search.trim()
  if (search) query.set('search', search)
  if (filters.status) query.set('status', filters.status)
  if (filters.div) query.set('div', filters.div)
  if (filters.currentProcess) {
    query.set('currentProcess', filters.currentProcess)
  }
  if (filters.shipBy) query.set('shipBy', filters.shipBy)
  if (filters.productionDate) {
    query.set('productionDate', filters.productionDate)
  }

  const response = await fetch(`${API_BASE_URL}/api/backlogs?${query}`, {
    signal,
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  const result = (await response.json()) as ApiPageResponse

  if (!Array.isArray(result.content)) {
    throw new Error('API response has invalid content')
  }

  return {
    ...result,
    content: result.content.map(mapApiBacklog),
  }
}

export async function searchReports(
  page: number,
  pageSize: number,
  filterRequest: BacklogFilterRequest,
  signal?: AbortSignal,
  sortRequest?: BacklogSortRequest,
): Promise<PageResponse<ProductionOrder>> {
  if (!Number.isInteger(page) || page < 0) {
    throw new RangeError('Page must be a non-negative integer')
  }

  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new RangeError('Page size must be a positive integer')
  }

  const query = new URLSearchParams({
    page: String(page),
    size: String(pageSize),
  })

  if (sortRequest) {
    if (!isExcelFilterField(sortRequest.field)) {
      throw new Error(`Unsupported backlog sort field: ${sortRequest.field}`)
    }
    query.set('sort', `${sortRequest.field},${sortRequest.direction}`)
  }

  const response = await fetch(`${API_BASE_URL}/api/backlogs/search?${query}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filterRequest),
    signal,
  })

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  const result = (await response.json()) as ApiPageResponse

  if (!Array.isArray(result.content)) {
    throw new Error('API response has invalid content')
  }

  return {
    ...result,
    content: result.content.map(mapApiBacklog),
  }
}
