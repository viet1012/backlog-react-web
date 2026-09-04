export interface OdbfSummaryItem {
    productGrp: string
    status2: string
    exportD: string
    countPo: number
    sumQty: number
}

export type OdbfSummaryMetric = 'countPo' | 'sumQty'
