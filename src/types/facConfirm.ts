export interface FacConfirmRow {
    ferth: string | null

    productGrp: string | null

    aufnr: string

    zglobalCode: string | null
    pname: string | null

    issueD: string | null
    exportD: string | null

    cusId: string | null
    shipBy: string | null

    mtoId: string | null
    prtAddcmt2: string | null

    currentProcess: string | null

    finalQty: number | null

    toDrill: string | null
    toHeat: string | null

    heatStart: string | null
    heatFinish: string | null

    toPk: string | null
}


export interface FacConfirmPageResponse {
    content: FacConfirmRow[]

    page: number
    size: number

    totalElements: number
    totalPages: number

    first: boolean
    last: boolean
}


export type FacConfirmProcessGroup =
    | 'Fine'
    | 'Heat'
    | 'Rough'


export interface FacConfirmProcessGroupSummary {
    processGroup: FacConfirmProcessGroup
    orderCount: number
    totalFinalQty: number
}