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
  // MWh ước tính không ghi nhận được = kWh TB/giờ hợp lệ × missingHours; chỉ meter MAJOR, MINOR luôn null
  estimatedMissingMwh: number | null
  // K$ = estimatedMissingMwh × giá lưới TB của Fac trong kỳ; null khi MWh null hoặc chưa có đơn giá
  estimatedMissingKusd: number | null
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

// =========================================================
// IMPORT EVN DAILY TỪ EXCEL
// POST {UTILITY_API_BASE_URL}/api/utility/evn-daily/import (multipart, field "file")
// BE tự đọc file "F2 electric consumption.xlsx"; FE chỉ upload nguyên file.
// =========================================================

export interface EvnImportSheet {
  sheet: string
  // yyyy-MM
  billMonth: string
  // yyyy-MM-dd, inclusive
  from: string
  // yyyy-MM-dd, exclusive
  to: string
  rows: number
}

export interface EvnImportError {
  sheet: string
  // yyyy-MM-dd; null = cả block / sheet
  day: string | null
  scope: UtilityScopeCode | null
  // vd "BS28:BS31"
  cell: string | null
  message: string
}

export interface EvnImportResult {
  sourceFile: string
  dryRun: boolean
  // các sheet đã dùng
  sheets: EvnImportSheet[]
  // dòng (ngày × scope) mới
  inserted: number
  // dòng đã có, kWh khác → ghi đè
  updated: number
  // dòng đã có, giống hệt → bỏ qua
  unchanged: number
  // ngày chưa nhập số (total trống / 0)
  skipped: number
  // dòng bị từ chối do kiểm tra (xem errors)
  rejected: number
  errors: EvnImportError[]
  warnings: string[]
  // tham số gợi ý cho API hiệu chỉnh tổn thất
  calibration: CalibrationWindow
}

export interface CalibrationWindow {
  // false = không có ngày EVN nào trong khoảng có số đo → không gọi được API hiệu chỉnh
  available: boolean
  // yyyy-MM-dd, ngày cuối có số EVN của cả FAC_AB và FAC_C
  lastEvnDay: string | null
  // yyyy-MM-dd, exclusive – truyền nguyên cho API hiệu chỉnh
  until: string | null
  // 1..366 – truyền nguyên cho API hiệu chỉnh
  days: number | null
  // yyyy-MM-dd, ngày đầu khoảng (chỉ để hiển thị)
  from: string | null
}

// =========================================================
// HIỆU CHỈNH TỔN THẤT
// POST {UTILITY_API_BASE_URL}/api/utility/loss-calibration/recompute?scope&days&until&createdBy
// Mỗi lần gọi thành công THÊM 1 dòng (append-only) → không gọi lặp / tự động.
// KVH = FAC_AB + FAC_C (BE tự cộng) → chỉ 2 scope này.
// =========================================================

export type LossCalibrationScope = 'FAC_AB' | 'FAC_C'

export const LOSS_CALIBRATION_SCOPES: readonly LossCalibrationScope[] = ['FAC_AB', 'FAC_C']

export type LossCalibrationExcludedReason = 'NO_MEASURED_DATA' | 'COVERAGE_BELOW_100'

export interface LossCalibrationSample {
  day: string
  evnTotalKwh: number
  measuredGridKwh: number
  measuredLoadKwh: number
  diffKwhPerHour: number
}

export interface LossCalibrationExcluded {
  day: string
  // BE có thể thêm lý do mới → giữ nguyên chuỗi
  reason: LossCalibrationExcludedReason | string
  coveragePct: number | null
}

export interface LossCalibrationResult {
  id: number
  scope: LossCalibrationScope
  lossKwhPerHour: number
  lossKwhPerDay: number
  // yyyy-MM-dd
  effectiveFrom: string
  // null = không giới hạn
  effectiveTo: string | null
  method: string
  createdAt: string
  createdBy: string | null
  windowFrom: string
  // exclusive
  windowTo: string
  hourOffset: number
  // số ngày dùng để tính
  sampleDays: number
  evnDaysNotUsed: number
  minDiffKwhPerHour: number
  maxDiffKwhPerHour: number
  avgLoadKwhPerHour: number
  // %
  lossPctOfAvgLoad: number | null
  // vd tổn thất âm, > 30 % tải → hiển thị nổi bật
  warnings: string[]
  samples: LossCalibrationSample[]
  excluded: LossCalibrationExcluded[]
}

export interface LossCalibrationOptions {
  scope: LossCalibrationScope
  // lấy nguyên từ EvnImportResult.calibration.days
  days: number
  // lấy nguyên từ EvnImportResult.calibration.until
  until: string
  createdBy?: string
}

export interface EvnImportOptions {
  // true = chỉ kiểm tra và đếm, không ghi DB
  dryRun: boolean
  // tối đa 100 ký tự
  importedBy?: string
  // tên sheet chính xác; bỏ trống = mọi sheet tháng
  sheet?: string
  // yyyy-MM, ghi đè tháng hóa đơn của sheet; chỉ dùng khi có sheet
  month?: string
}
