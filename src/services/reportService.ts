import { API_BASE_URL } from '../config/api'

import type { ProductionOrder } from '../types/report'

import {
  nullableNumber,
  nullableString,
} from '../utils/apiMapper'

import {
  isExcelFilterField,
  type ExcelFilterField,
} from '../config/backlogFilterFields'


// =========================================================
// COMMON TYPES
// =========================================================

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

export interface BacklogFilterRequest {
  filters: BacklogFilterItem[]
  logicOperator: 'and' | 'or'
}

export interface BacklogSortRequest {
  field: ExcelFilterField
  direction: 'asc' | 'desc'
}

export interface BacklogFilterOptionsRequest {
  field: ExcelFilterField

  /**
   * Các filter đang active trên table.
   *
   * Khi lấy option cho field hiện tại,
   * FE nên loại filter của chính field đó ra trước khi gửi.
   *
   * Ví dụ:
   * Div = PR
   * đang mở Status
   *
   * => filters gửi lên chứa Div = PR
   */
  filters: BacklogFilterItem[]

  logicOperator: 'and' | 'or'

  search?: string

  limit?: number
}

export interface ReportFilters {
  search: string
  status: string
  div: string
  currentProcess: string
  shipBy: string
  productionDate: string
}

export interface BacklogStatusSummaryItem {
  status: string
  poCount: number
  totalQty: number
}

export interface BacklogStatusSummary {
  totalPoCount: number
  totalQty: number
  statuses: BacklogStatusSummaryItem[]
}

// =========================================================
// API RESPONSE TYPES
// =========================================================

type ApiBacklog = Record<string, unknown>

interface ApiPageResponse
  extends Omit<PageResponse<ApiBacklog>, 'content'> {

  content: ApiBacklog[]
}


// =========================================================
// CONSTANTS
// =========================================================

const DEFAULT_PAGE_SIZE = 20

const DEFAULT_FILTER_OPTION_LIMIT = 100

const FILTER_OPTIONS_CACHE_TTL =
  10 * 60 * 1000 // 10 phút


const EMPTY_REPORT_FILTERS: ReportFilters = {
  search: '',
  status: '',
  div: '',
  currentProcess: '',
  shipBy: '',
  productionDate: '',
}


// =========================================================
// FILTER OPTION CACHE
// =========================================================

interface FilterOptionsCacheEntry {
  values: string[]
  expiresAt: number
}

/**
 * Key không chỉ là field.
 *
 * Vì:
 *
 * Status + không filter
 *
 * khác với:
 *
 * Status + Div=PR
 *
 * khác với:
 *
 * Status + Div=KVH
 */
const filterOptionsCache =
  new Map<string, FilterOptionsCacheEntry>()

/**
 * Chống gọi trùng API trong cùng thời điểm.
 */
const filterOptionsPending =
  new Map<string, Promise<string[]>>()



// =========================================================
// NORMALIZE FILTER
// =========================================================

function normalizeFilterItem(
  filter: BacklogFilterItem,
) {
  return {
    field:
      filter.field.trim(),

    operator:
      filter.operator.trim(),

    value:
      filter.value?.trim() ?? '',

    values:
      [...(filter.values ?? [])]
        .map((value) => value.trim())
        .sort((a, b) =>
          a.localeCompare(b),
        ),
  }
}


// =========================================================
// CREATE FILTER OPTION CACHE KEY
// =========================================================

function createFilterOptionsCacheKey(
  request: BacklogFilterOptionsRequest,
): string {

  const normalizedFilters =
    request.filters
      .map(normalizeFilterItem)
      .sort((a, b) => {

        const fieldCompare =
          a.field.localeCompare(
            b.field,
          )

        if (fieldCompare !== 0) {
          return fieldCompare
        }

        const operatorCompare =
          a.operator.localeCompare(
            b.operator,
          )

        if (operatorCompare !== 0) {
          return operatorCompare
        }

        return a.value.localeCompare(
          b.value,
        )
      })


  return JSON.stringify({
    field:
      request.field,

    search:
      request.search
        ?.trim()
        .toLowerCase()
      ?? '',

    limit:
      request.limit
      ?? DEFAULT_FILTER_OPTION_LIMIT,

    logicOperator:
      request.logicOperator,

    filters:
      normalizedFilters,
  })
}


// =========================================================
// VALIDATION
// =========================================================

function validatePage(
  page: number,
) {

  if (
    !Number.isInteger(page)
    || page < 0
  ) {
    throw new RangeError(
      'Page must be a non-negative integer',
    )
  }
}


function validatePageSize(
  pageSize: number,
) {

  if (
    !Number.isInteger(pageSize)
    || pageSize <= 0
  ) {
    throw new RangeError(
      'Page size must be a positive integer',
    )
  }
}


function validateFilterField(
  field: string,
): asserts field is ExcelFilterField {

  if (
    !isExcelFilterField(field)
  ) {
    throw new Error(
      `Unsupported backlog field: ${field}`,
    )
  }
}


// =========================================================
// FETCH HELPER
// =========================================================

async function fetchJson<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {

  const response =
    await fetch(
      url,
      options,
    )

  if (!response.ok) {

    let detail = ''

    try {
      detail =
        await response.text()
    } catch {
      // ignore
    }

    throw new Error(
      detail
        ? `API request failed (${response.status}): ${detail}`
        : `API request failed with status ${response.status}`,
    )
  }

  return await response.json() as T
}


// =========================================================
// MAP API BACKLOG
// =========================================================

function mapApiBacklog(
  item: ApiBacklog,
): ProductionOrder {

  return {
    VBELN:
      nullableString(
        item.vbeln,
      ) ?? '',

    ZGLOBAL_CODE:
      nullableString(
        item.zglobalCode,
      ) ?? '',

    PIER_AUFNR:
      nullableString(
        item.pierAufnr,
      ) ?? '',

    AUFNR:
      nullableString(
        item.aufnr,
      ) ?? '',

    IssueD:
      nullableString(
        item.issueD,
      ),

    ProductionD:
      nullableString(
        item.productionD,
      ),

    PromiseD:
      nullableString(
        item.promiseD,
      ),

    ExportD:
      nullableString(
        item.exportD,
      ),

    ORG_Date:
      nullableString(
        item.orgDate,
      ),

    MSM_Ship:
      nullableString(
        item.msmShip,
      ),

    PNAME:
      nullableString(
        item.pname,
      ),

    RRONYU1:
      nullableString(
        item.rronyu1,
      ),

    ShipBy:
      nullableString(
        item.shipBy,
      ),

    GAMNG:
      nullableNumber(
        item.gamng,
      ),

    NETPR:
      nullableNumber(
        item.netpr,
      ),

    PHCD:
      nullableString(
        item.phcd,
      ),

    KWMENG:
      nullableNumber(
        item.kwmeng,
      ),

    RODENK:
      nullableString(
        item.rodenk,
      ),

    LOEKZ:
      nullableString(
        item.loekz,
      ),

    MTO_ID:
      nullableString(
        item.mtoId,
      ),

    PRT_ADDCMT1:
      nullableString(
        item.prtAddcmt1,
      ),

    PRT_ADDCMT2:
      nullableString(
        item.prtAddcmt2,
      ),

    // BE trả số, ví dụ prtSts: 9
    PRT_STS:
      item.prtSts == null
        ? null
        : String(item.prtSts),

    Div:
      nullableString(
        item.div,
      ),

    FERTH:
      nullableString(
        item.ferth,
      ),

    PO_SRG_Convert:
      nullableString(
        item.poSrgConvert,
      ),

    ToDrill:
      nullableString(
        item.toDrill,
      ),

    ToHeat:
      nullableString(
        item.toHeat,
      ),

    ToPK:
      nullableString(
        item.toPk,
      ),

    Status:
      nullableString(
        item.status,
      ),

    CurrentProcess:
      nullableString(
        item.currentProcess,
      ),

    HeatCharge:
      nullableString(
        item.heatCharge,
      ),

    ProcessQty:
      nullableNumber(
        item.processQty,
      ),

    Z300Qty:
      nullableNumber(
        item.z300Qty,
      ),

    PkQty:
      nullableNumber(
        item.pkQty,
      ),

    FinalQty:
      nullableNumber(
        item.finalQty,
      ),

    TimeSQuenching:
      nullableString(
        item.timeSQuenching,
      ),

    TimeFHeat:
      nullableString(
        item.timeFHeat,
      ),

    C_PRODH:
      nullableString(
        item.cProdh,
      ),

    C_KEYCONTROL1:
      nullableString(
        item.cKeycontrol1,
      ),

    C_KEYCONTROL3:
      nullableString(
        item.cKeycontrol3,
      ),

    Updater:
      nullableString(
        item.updater,
      ),

    UpdatedAt:
      nullableString(
        item.updatedAt,
      ),
  }
}


// =========================================================
// MAP PAGE RESPONSE
// =========================================================

function mapPageResponse(
  result: ApiPageResponse,
): PageResponse<ProductionOrder> {

  if (!Array.isArray(result.content)) {
    throw new Error(
      'API response has invalid content',
    )
  }

  return {
    ...result,

    content:
      result.content.map(
        (item, index) => {

          if (
            item.vbeln == null
            || item.aufnr == null
          ) {
            console.warn(
              'BACKLOG ROW MISSING ID:',
              {
                index,
                vbeln: item.vbeln,
                aufnr: item.aufnr,
                row: item,
              },
            )
          }

          return mapApiBacklog(
            item,
          )
        },
      ),
  }
}

// =========================================================
// NORMALIZE FILTER OPTIONS
// =========================================================

function normalizeFilterOptions(
  result: unknown,
): string[] {

  /**
   * Support:
   *
   * [
   *   "PR",
   *   "KVH"
   * ]
   *
   * hoặc
   *
   * {
   *   values: [...]
   * }
   */

  let rawValues: unknown


  if (
    Array.isArray(result)
  ) {

    rawValues =
      result

  } else if (
    typeof result === 'object'
    && result !== null
    && 'values' in result
  ) {

    rawValues =
      (
        result as {
          values?: unknown
        }
      ).values

  } else {

    throw new Error(
      'Filter options response is invalid',
    )
  }


  if (
    !Array.isArray(
      rawValues,
    )
  ) {
    throw new Error(
      'Filter options response is invalid',
    )
  }


  if (
    !rawValues.every(
      (value) =>
        value === null
        || typeof value === 'string',
    )
  ) {
    throw new Error(
      'Filter options response contains invalid value',
    )
  }


  return [
    ...new Set(
      rawValues.map(
        (value) =>
          value ?? '',
      ),
    ),
  ].sort(
    (left, right) =>
      left.localeCompare(
        right,
      ),
  )
}


// =========================================================
// GET FILTER OPTIONS
// =========================================================

export async function getBacklogFilterOptions(
  request: BacklogFilterOptionsRequest,
  signal?: AbortSignal,
): Promise<string[]> {

  validateFilterField(
    request.field,
  )


  // -------------------------------------------------------
  // Chuẩn hóa request
  // -------------------------------------------------------

  const normalizedRequest:
    BacklogFilterOptionsRequest = {

    field:
      request.field,

    filters:
      request.filters ?? [],

    logicOperator:
      request.logicOperator
      ?? 'and',

    search:
      request.search?.trim()
      ?? '',

    limit:
      Math.max(
        1,
        Math.min(
          request.limit
          ?? DEFAULT_FILTER_OPTION_LIMIT,
          500,
        ),
      ),
  }


  // -------------------------------------------------------
  // Cache key
  // -------------------------------------------------------

  const cacheKey =
    createFilterOptionsCacheKey(
      normalizedRequest,
    )


  const now =
    Date.now()


  // -------------------------------------------------------
  // FE MEMORY CACHE
  // -------------------------------------------------------

  const cached =
    filterOptionsCache.get(
      cacheKey,
    )


  if (
    cached
    && cached.expiresAt > now
  ) {
    return cached.values
  }


  if (cached) {
    filterOptionsCache.delete(
      cacheKey,
    )
  }


  // -------------------------------------------------------
  // Request đang chạy
  // -------------------------------------------------------

  const pending =
    filterOptionsPending.get(
      cacheKey,
    )


  if (pending) {
    return pending
  }


  // -------------------------------------------------------
  // CALL API
  // -------------------------------------------------------

  const apiRequest =
    (async () => {

      const result =
        await fetchJson<unknown>(
          `${API_BASE_URL}/api/backlogs/filter-options`,
          {
            method:
              'POST',

            headers: {
              Accept:
                'application/json',

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify(
                normalizedRequest,
              ),

            signal,
          },
        )


      const values =
        normalizeFilterOptions(
          result,
        )


      // ---------------------------------------------------
      // Save cache
      // ---------------------------------------------------

      filterOptionsCache.set(
        cacheKey,
        {
          values,

          expiresAt:
            Date.now()
            + FILTER_OPTIONS_CACHE_TTL,
        },
      )


      return values
    })()


  // -------------------------------------------------------
  // Save pending
  // -------------------------------------------------------

  filterOptionsPending.set(
    cacheKey,
    apiRequest,
  )


  try {

    return await apiRequest

  } finally {

    filterOptionsPending.delete(
      cacheKey,
    )
  }
}


// =========================================================
// CLEAR FILTER OPTIONS CACHE
// =========================================================

export function clearBacklogFilterOptionsCache() {

  filterOptionsCache.clear()

  filterOptionsPending.clear()
}


// =========================================================
// GET REPORTS
// =========================================================

export async function getReports(
  page: number,
  filters: ReportFilters =
    EMPTY_REPORT_FILTERS,
  signal?: AbortSignal,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PageResponse<ProductionOrder>> {

  validatePage(
    page,
  )

  validatePageSize(
    pageSize,
  )


  const query =
    new URLSearchParams({
      page:
        String(page),

      size:
        String(pageSize),
    })


  // -------------------------------------------------------
  // Search
  // -------------------------------------------------------

  const search =
    filters.search.trim()


  if (search) {
    query.set(
      'search',
      search,
    )
  }


  // -------------------------------------------------------
  // Simple filters
  // -------------------------------------------------------

  if (filters.status) {
    query.set(
      'status',
      filters.status,
    )
  }


  if (filters.div) {
    query.set(
      'div',
      filters.div,
    )
  }


  if (
    filters.currentProcess
  ) {
    query.set(
      'currentProcess',
      filters.currentProcess,
    )
  }


  if (
    filters.shipBy
  ) {
    query.set(
      'shipBy',
      filters.shipBy,
    )
  }


  if (
    filters.productionDate
  ) {
    query.set(
      'productionDate',
      filters.productionDate,
    )
  }


  // -------------------------------------------------------
  // CALL API
  // -------------------------------------------------------

  const result =
    await fetchJson<ApiPageResponse>(
      `${API_BASE_URL}/api/backlogs?${query.toString()}`,
      {
        signal,
      },
    )


  return mapPageResponse(
    result,
  )
}


// =========================================================
// SEARCH REPORTS
// =========================================================

export async function searchReports(
  page: number,
  pageSize: number,
  filterRequest: BacklogFilterRequest,
  signal?: AbortSignal,
  sortRequest?: BacklogSortRequest,
): Promise<PageResponse<ProductionOrder>> {

  validatePage(
    page,
  )

  validatePageSize(
    pageSize,
  )


  const query =
    new URLSearchParams({
      page:
        String(page),

      size:
        String(pageSize),
    })


  // -------------------------------------------------------
  // SORT
  // -------------------------------------------------------

  if (sortRequest) {

    validateFilterField(
      sortRequest.field,
    )


    query.set(
      'sort',
      `${sortRequest.field},${sortRequest.direction}`,
    )
  }


  // -------------------------------------------------------
  // FILTER REQUEST
  // -------------------------------------------------------

  const safeFilterRequest:
    BacklogFilterRequest = {

    filters:
      filterRequest?.filters
      ?? [],

    logicOperator:
      filterRequest?.logicOperator
      ?? 'and',
  }


  // -------------------------------------------------------
  // CALL API
  // -------------------------------------------------------

  const result =
    await fetchJson<ApiPageResponse>(
      `${API_BASE_URL}/api/backlogs/search?${query.toString()}`,
      {
        method:
          'POST',

        headers: {
          Accept:
            'application/json',

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            safeFilterRequest,
          ),

        signal,
      },
    )


  return mapPageResponse(
    result,
  )


}


// =========================================================
// GET BACKLOG STATUS SUMMARY
// =========================================================

export async function getBacklogStatusSummary(
  filterRequest: BacklogFilterRequest,
  signal?: AbortSignal,
): Promise<BacklogStatusSummary> {

  const safeFilterRequest: BacklogFilterRequest = {
    filters:
      filterRequest?.filters
      ?? [],

    logicOperator:
      filterRequest?.logicOperator
      ?? 'and',
  }

  return await fetchJson<BacklogStatusSummary>(
    `${API_BASE_URL}/api/backlogs/summary/status`,
    {
      method: 'POST',

      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },

      body:
        JSON.stringify(
          safeFilterRequest,
        ),

      signal,
    },
  )
}