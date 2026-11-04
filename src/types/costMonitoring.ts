export type CostDiv = 'PR' | 'MO' | 'Guide'

export type CostChartType = 'OT' | 'T&SL' | 'RM'

export interface CostChartPoint {
    date: string
    plMtd: number | null
    actMtd: number | null
    estMtd: number | null
    fluctTgt: number | null
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
}

export interface CostMonitoringChartResponse {
    month: string
    simuWeek: string | null
    unit: 'K$'
    charts: CostChart[]
}

// '' = Latest (không gửi simuWeek)
export type CostSimuWeek =
    | ''
    | 'Simu_W1'
    | 'Simu_W2'
    | 'Simu_W3'
    | 'Simu_W4'
    | 'Simu_W5'
