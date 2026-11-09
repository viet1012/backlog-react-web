export type CostDiv = 'PR' | 'MO' | 'Guide'

export type CostChartType = 'OT' | 'T&SL' | 'RM'

export interface CostChartPoint {
    date: string
    plMtd: number | null
    actMtd: number | null
    estMtd: number | null
    fluctTgt: number | null
}

// Trạng thái chính do BE tính (CostChartForecastDto.status):
//   OVER        Actual > Fluct (đã vượt thực tế)
//   WILL_EXCEED chưa vượt, estimateEom > Fluct (dự báo vượt)
//   WITHIN      chưa vượt, estimateEom ≤ Fluct
//   NO_DATA     thiếu Actual / Fluct
// Tháng đã kết thúc: OVER | WITHIN theo Actual, mọi field dự báo = null.
export type CostForecastStatus = 'OVER' | 'WILL_EXCEED' | 'WITHIN' | 'NO_DATA'

// Khớp record CostChartForecastDto (backlog-be). K$; FE chỉ hiển thị, không tự tính.
export interface CostChartForecast {
    status: CostForecastStatus | null
    // Actual / Fluct × 100 (chưa làm tròn)
    actualPctOfFluct: number | null
    // Dự báo CHÍNH: PL Estimate; không có PL → Actual + Fluct / N × (N − D)
    estimateBase: 'PL' | 'Fluct' | null
    estimateEom: number | null
    // estimateEom − Fluct (dương = vượt)
    estimateOver: number | null
    estimateOverFc: number | null
    estimatePctOfFluct: number | null
    estimateOverPct: number | null
    // Dự báo PHỤ theo tốc độ chi hiện tại – chỉ tham khảo
    projectedEom: number | null
    projectedOver: number | null
    projectedOverFc: number | null
    projectedPctOfFluct: number | null
    projectedOverPct: number | null
}

export interface CostChart {
    div: CostDiv
    chart: CostChartType
    fcTgt: number | null
    plTgt: number | null
    bp: number | null
    actMtdLatest: number | null
    estMonthEnd: number | null
    points: CostChartPoint[]
    // chỉ có trong GET /chart; null = BE không gửi
    forecast: CostChartForecast | null
}

export interface CostMonitoringChartResponse {
    month: string
    simuWeek: string | null
    unit: 'K$'
    charts: CostChart[]
}

// GET /api/cost-monitoring/pl-weeks?month=yyyy-MM
export interface CostPlWeeksResponse {
    month: string
    // tuần Simu có số trong tháng, tăng dần; rỗng = chưa có PL simulation
    weeks: Exclude<CostSimuWeek, ''>[]
    // tuần "Mới nhất (tự động)" đang dùng; null nếu weeks rỗng
    latestWeek: Exclude<CostSimuWeek, ''> | null
    // true: các khung dùng tuần khác nhau (khung thiếu số tuần mới nhất lấy tuần cũ hơn)
    latestMixed: boolean
}

// =========================================================
// DETAIL 1 khung – GET /api/cost-monitoring/detail
//   ?div=PR&chart=T%26SL&month=yyyy-MM[&simuWeek=][&date=yyyy-MM-dd][&page=0][&size=50]
// Khớp record CostDetailResponse (backlog-be). Số K$ làm tròn 1 chữ số.
// =========================================================

export interface CostDetailKpi {
    // FC TGT
    fc: number | null
    // Fluct mới nhất (nhãn cuối đường chart)
    fluct: number | null
    // Ratio Sale&Inven mới nhất của bộ phận, % (Fluct = FC × (1 + Ratio))
    ratioPct: number | null
    // null = chưa có actual (vd OT)
    actMtd: number | null
    estimateEom: number | null
    // Actual / Fluct × 100
    pctOfFluct: number | null
    // K$/ngày
    currentRate: number | null
    projectedEom: number | null
    // projectedEom − Fluct (dương = dự báo vượt)
    projectedOver: number | null
    // projectedEom − FC
    projectedOverFc: number | null
    status: 'OVER' | 'OK' | null
}

export interface CostDetailDailyRow {
    // "2026-11-05"
    date: string
    // chi trong ngày (âm = trả hàng / điều chỉnh)
    daily: number | null
    // Actual lũy kế
    cumulative: number | null
    // Ratio của bộ phận ngày đó, % (null = không có trong F2_Working_Date)
    ratioPct: number | null
    // Fluct tại ngày đó
    fluct: number | null
    // cumulative − fluct
    diff: number | null
}

// 1 dòng xuất kho (CostTool / CostRm)
export interface CostDetailTransaction {
    date: string | null
    code: string | null
    name: string | null
    category: string | null
    qty: number | null
    qtyUnit: string | null
    unitPrice: number | null
    // $ như bảng nguồn
    amount: number | null
    // amount / 1000
    amountK: number | null
    costCenter: string | null
    costCenterName: string | null
    machine: string | null
}

export interface CostDetailTransactionPage {
    from: string | null
    to: string | null
    // 0-based
    page: number
    size: number
    totalElements: number
    totalPages: number
    // tổng mọi dòng thỏa bộ lọc (không chỉ trang hiện tại), K$
    totalAmountK: number | null
    // actMtd − tổng trực tiếp (phân bổ F2 / HT2 / HT-G + điều chỉnh); null khi lọc theo ngày
    allocationK: number | null
    items: CostDetailTransaction[]
}

export interface CostDetailResponse {
    month: string
    div: CostDiv
    chart: CostChartType
    simuWeek: string | null
    unit: string
    daysInMonth: number
    // ngày có actual mới nhất; null = chưa có actual
    asOfDate: string | null
    monthClosed: boolean
    kpi: CostDetailKpi
    daily: CostDetailDailyRow[]
    transactions: CostDetailTransactionPage
}

// tham số lọc / phân trang giao dịch (server-side)
export interface CostDetailTxQuery {
    // "YYYY-MM-DD"; null = cả kỳ
    date: string | null
    page: number
    size: number
}

export interface CostDetailTarget {
    div: CostDiv
    chart: CostChartType
}

// '' = Latest (không gửi simuWeek)
export type CostSimuWeek =
    | ''
    | 'Simu_W1'
    | 'Simu_W2'
    | 'Simu_W3'
    | 'Simu_W4'
    | 'Simu_W5'
