import type { ProductionOrder } from '../types/report'

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://192.168.122.16:9100'
// const API_BASE_URL =
// import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'
const DEFAULT_PAGE_SIZE = 20

type ApiBacklog = Record<string, unknown>

interface ApiPageResponse extends Omit<PageResponse<ApiBacklog>, 'content'> {
  content: ApiBacklog[]
}

function requiredString(value: unknown, field: string): string {
  if (value === null || value === undefined || value === '') {
    throw new Error(`API response is missing required field: ${field}`)
  }

  return String(value)
}

function nullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value)
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null

  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? null : numberValue
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
