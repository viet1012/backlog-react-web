// =========================================================
// UTILITY · ELECTRIC CONSUMPTION (BE utility, không phải backlog-be)
// GET {UTILITY_API_BASE_URL}/api/utility/electric-consumption?month=YYYY-MM&view=measured|official
//
// Kiểu dưới đây là dạng SAU KHI chuẩn hóa (utilityEvnService) – mọi field số đều nullable.
// view=measured theo JSON thật của BE; view=official theo đặc tả (chưa có mẫu thật).
// =========================================================

export type UtilityScopeCode = 'KVH' | 'FAC_AB' | 'FAC_C'

export const UTILITY_SCOPE_CODES: readonly UtilityScopeCode[] = ['KVH', 'FAC_AB', 'FAC_C']

export type UtilityOfficialSource = 'EVN' | 'MEASURED'

// Bộ số theo khung giờ (MWh hoặc kUSD)
export interface UtilityEnergyBreakdown {
  normal: number | null
  highPeak: number | null
  lowPeak: number | null
  solar: number | null
  // điện lưới = normal + highPeak + lowPeak
  totalElectricity: number | null
  // tải = điện lưới + solar (BE trả thêm `total` = load)
  load: number | null
}

export interface UtilityBillPeriod {
  // "Nov (Oct21 ~ Nov20]"
  label: string | null
  // YYYY-MM-DD, ngày đầu kỳ
  from: string | null
  // YYYY-MM-DD, BE trả mốc KẾT THÚC (không gồm) – vd 2026-11-21 cho kỳ tới 20/11
  to: string | null
  days: number | null
}

// ---------- view=measured (đồng hồ) ----------

export interface UtilityMissingMeter {
  meter: string
  // FAC_A | FAC_B | FAC_C
  fac: string | null
  // số giờ meter có dữ liệu trong ngày (thiếu = 24 − validHours)
  validHours: number | null
  // PARTIAL | NO_DATA
  reason: string | null
  lastDataAt: string | null
}

export interface UtilityMeasuredDay {
  // YYYY-MM-DD
  date: string
  weekday: string | null
  hoursWithData: number | null
  meters: number | null
  reportingMeters: number | null
  // 0–100; null = chưa có dữ liệu
  coveragePct: number | null
  partial: boolean
  missingMeters: UtilityMissingMeter[]
  // null = ngày chưa tới / chưa có dữ liệu
  mwh: UtilityEnergyBreakdown | null
  kusd: UtilityEnergyBreakdown | null
}

export type UtilityMeterSeverity = 'MAJOR' | 'MINOR' | string

export interface UtilityMeterIssue {
  meter: string
  fac: string | null
  // scope chứa danh sách meterIssues
  scope: string | null
  // tổng số giờ thiếu trong kỳ
  missingHours: number | null
  severity: UtilityMeterSeverity | null
  lastDataAt: string | null
  // YYYY-MM-DD; BE không trả → gom từ missingMeters theo ngày
  dates: string[]
}

export interface UtilityMeasuredScope {
  code: string
  name: string | null
  meters: number | null
  elapsedDays: number | null
  daysWithData: number | null
  completeDays: number | null
  daily: UtilityMeasuredDay[]
  dailyTotalMwh: UtilityEnergyBreakdown | null
  dailyTotalKusd: UtilityEnergyBreakdown | null
  meterIssues: UtilityMeterIssue[]
  // MWh ước tính bị thiếu do đồng hồ mất dữ liệu
  estimatedMissingMwh: number | null
  priceMissing: boolean
}

export interface UtilityMeasuredResponse {
  month: string | null
  dataUntil: string | null
  billPeriod: UtilityBillPeriod | null
  // ngưỡng độ phủ (%) dưới mức này là ngày partial
  minCoveragePct: number | null
  // meter bị loại khỏi tính toán
  excludedMeters: string[]
  tariffAvailable: boolean | null
  scopes: UtilityMeasuredScope[]
}

// ---------- view=official (Excel EVN) ----------

export interface UtilityOfficialValue {
  mwh: UtilityEnergyBreakdown | null
  kusd: UtilityEnergyBreakdown | null
  // EVN = đã có Excel; MEASURED = BE lấy tạm số đồng hồ (chưa có Excel)
  source: UtilityOfficialSource | null
}

export interface UtilityOfficialDay {
  date: string
  official: UtilityOfficialValue | null
}

export interface UtilityOfficialScope {
  code: string
  daily: UtilityOfficialDay[]
  officialTotalMwh: UtilityEnergyBreakdown | null
  officialTotalKusd: UtilityEnergyBreakdown | null
  evnDays: number | null
  measuredDays: number | null
}

export interface UtilityOfficialResponse {
  month: string | null
  dataUntil: string | null
  billPeriod: UtilityBillPeriod | null
  scopes: UtilityOfficialScope[]
}

export interface UtilityEvnCompareData {
  measured: UtilityMeasuredResponse
  official: UtilityOfficialResponse
}
