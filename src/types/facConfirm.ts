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

    // =====================================================
    // HEAT PROCESS FLAG
    //
    // true  = PO có công đoạn Nhiệt
    // false = PO không có công đoạn Nhiệt
    // =====================================================
    hasHeatProcess: boolean

    // =====================================================
    // PROCESS TIMES
    // =====================================================
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


export type FacConfirmClassify =
    | 'Sale'
    | 'Stock'


export interface FacConfirmProcessGroupSummary {
    processGroup: FacConfirmProcessGroup

    requiredOrderCount: number
    requiredTotalQty: number

    confirmedOrderCount: number
    confirmedTotalQty: number
}


export interface FacConfirmFilterItem {
    field: string

    operator: string

    value?: string

    values?: string[]
}


export interface FacConfirmSearchRequest {
    div: string

    expD: string

    procGrp: FacConfirmProcessGroup

    classify?: FacConfirmClassify

    page: number
    size: number

    filters: FacConfirmFilterItem[]

    logicOperator: 'and' | 'or'
}


export interface FacConfirmFilterOptionsRequest {
    field: string

    search?: string

    div: string

    expD: string

    procGrp: FacConfirmProcessGroup

    classify?: FacConfirmClassify

    filters: FacConfirmFilterItem[]

    logicOperator: 'and' | 'or'

    page?: number
    size?: number
}


// =========================================================
// EDITABLE FIELD
// =========================================================

export type FacConfirmEditableField =
    | 'toDrill'
    | 'toHeat'
    | 'heatStart'
    | 'heatFinish'
    | 'toPk'


// =========================================================
// HEAT FIELD
//
// Dùng cho rule:
// hasHeatProcess = false
// => warning trước khi sửa Heat Start / Heat Finish
// =========================================================

export type FacConfirmHeatEditableField =
    | 'heatStart'
    | 'heatFinish'


// =========================================================
// BACKEND PROCESS NAME
// =========================================================

export type FacConfirmBackendProcessName =
    | 'To Drill'
    | 'To Heat'
    | 'Heat Start'
    | 'Heat Finish'
    | 'To Packing'


// =========================================================
// PROCESS TIME CHANGE
// =========================================================

export interface FacConfirmProcessTimeChange {
    aufnr: string

    field: FacConfirmEditableField

    value: string
}


// =========================================================
// SAVE REQUEST
// =========================================================

export interface FacConfirmProcessTimeRequest {
    employeeId: string

    changes: FacConfirmProcessTimeChange[]
}


// =========================================================
// SAVE RESPONSE
// =========================================================

export interface FacConfirmProcessTimeResponse {
    success: boolean

    updatedCount: number

    message: string
}


// =========================================================
// CONFIRMED PROCESS
// =========================================================

export interface FacConfirmConfirmedProcess {
    aufnr: string

    processGrp: FacConfirmBackendProcessName

    confirmFnTime: string | null

    updater?: string | null

    updatedAt?: string | null
}