export interface ShipmentFulfillment {
    exportD: string | null
    cusId: string
    shipBy: string | null
    poQty: number
    fnQty: number
    fnRatio: number
}

export interface ShipmentHeatmapCell {
    date: string
    poQty: number
    fnQty: number
    ratio: number
}

export interface ShipmentHeatmapRow {
    key: string
    cusId: string
    shipBy: string
    cells: Record<string, ShipmentHeatmapCell>
}