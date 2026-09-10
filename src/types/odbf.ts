export interface OdbfSummaryItem {
    productGrp: string
    status2: string
    exportD: string
    countPo: number
    sumQty: number
    poRatio: number | null
    qtyRatio: number | null
}

export type OdbfSummaryMetric = 'countPo' | 'sumQty'