import { API_BASE_URL } from '../config/api'

import type {
    ProductionOrder,
} from '../types/report'

import type {
    ShipmentDetailFilter,
    ShipmentFulfillment,
} from '../types/shipment'

import {
    nullableNumber,
    nullableString,
    numberValue,
    requiredString,
} from '../utils/apiMapper'


type ApiShipmentFulfillment =
    Record<string, unknown>

type ApiShipmentDetail =
    Record<string, unknown>


// =========================================================
// SHIPMENT HEATMAP MAPPER
// =========================================================

function mapShipment(
    item: ApiShipmentFulfillment,
): ShipmentFulfillment {
    return {
        exportD:
            nullableString(item.exportD),

        cusId:
            requiredString(
                item.cusId,
                'cusId',
            ),

        shipBy:
            nullableString(item.shipBy)
            ?? 'N/A',

        poQty:
            numberValue(item.poQty),

        fnQty:
            numberValue(item.fnQty),

        fnRatio:
            numberValue(item.fnRatio),
    }
}


// =========================================================
// SHIPMENT DETAIL MAPPER
// =========================================================

function mapShipmentDetail(
    item: ApiShipmentDetail,
): ProductionOrder {
    return {
        VBELN:
            requiredString(
                item.vbeln,
                'vbeln',
            ),

        ZGLOBAL_CODE:
            nullableString(
                item.zglobalCode,
            ) ?? '',

        PIER_AUFNR:
            nullableString(
                item.pierAufnr,
            ) ?? '',

        AUFNR:
            nullableString(
                item.aufnr,
            ) ?? '',

        IssueD:
            nullableString(
                item.issueD,
            ),

        ProductionD:
            nullableString(
                item.productionD,
            ),

        PromiseD:
            nullableString(
                item.promiseD,
            ),

        ExportD:
            nullableString(
                item.exportD,
            ),

        ORG_Date:
            nullableString(
                item.orgDate,
            ),

        MSM_Ship:
            nullableString(
                item.msmShip,
            ),

        PNAME:
            nullableString(
                item.pname,
            ),

        RRONYU1:
            nullableString(
                item.rronyu1,
            ),

        ShipBy:
            nullableString(
                item.shipBy,
            ),

        GAMNG:
            nullableNumber(
                item.gamng,
            ),

        NETPR:
            nullableNumber(
                item.netpr,
            ),

        PHCD:
            nullableString(
                item.phcd,
            ),

        KWMENG:
            nullableNumber(
                item.kwmeng,
            ),

        RODENK:
            nullableString(
                item.rodenk,
            ),

        LOEKZ:
            nullableString(
                item.loekz,
            ),

        MTO_ID:
            nullableString(
                item.mtoId,
            ),

        PRT_ADDCMT1:
            nullableString(
                item.prtAddcmt1,
            ),

        PRT_ADDCMT2:
            nullableString(
                item.prtAddcmt2,
            ),

        PRT_STS:
            nullableString(
                item.prtSts,
            ),

        Div:
            nullableString(
                item.div,
            ),

        FERTH:
            nullableString(
                item.ferth,
            ),

        PO_SRG_Convert:
            nullableString(
                item.poSrgConvert,
            ),

        ToDrill:
            nullableString(
                item.toDrill,
            ),

        ToHeat:
            nullableString(
                item.toHeat,
            ),

        ToPK:
            nullableString(
                item.toPk,
            ),

        Status:
            nullableString(
                item.status,
            ),

        CurrentProcess:
            nullableString(
                item.currentProcess,
            ),

        HeatCharge:
            nullableString(
                item.heatCharge,
            ),

        ProcessQty:
            nullableNumber(
                item.processQty,
            ),

        Z300Qty:
            nullableNumber(
                item.z300Qty,
            ),

        PkQty:
            nullableNumber(
                item.pkQty,
            ),

        FinalQty:
            nullableNumber(
                item.finalQty,
            ),

        TimeSQuenching:
            nullableString(
                item.timeSQuenching,
            ),

        TimeFHeat:
            nullableString(
                item.timeFHeat,
            ),

        C_PRODH:
            nullableString(
                item.cProdh,
            ),

        C_KEYCONTROL1:
            nullableString(
                item.cKeycontrol1,
            ),

        C_KEYCONTROL3:
            nullableString(
                item.cKeycontrol3,
            ),

        Updater:
            nullableString(
                item.updater,
            ),

        UpdatedAt:
            nullableString(
                item.updatedAt,
            ),
    }
}


// =========================================================
// GET SHIPMENT HEATMAP
// =========================================================

export async function getShipmentFulfillment(
    fromD: string,
    toD: string,
    signal?: AbortSignal,
): Promise<ShipmentFulfillment[]> {

    if (!fromD) {
        throw new Error(
            'From Date is required',
        )
    }

    if (!toD) {
        throw new Error(
            'To Date is required',
        )
    }

    if (fromD > toD) {
        throw new Error(
            'From Date cannot be after To Date',
        )
    }

    const query =
        new URLSearchParams({
            fromD,
            toD,
        })

    const response =
        await fetch(
            `${API_BASE_URL}/api/shipment-fulfillment?${query.toString()}`,
            {
                method: 'GET',
                signal,

                headers: {
                    Accept:
                        'application/json',
                },
            },
        )

    if (!response.ok) {
        throw new Error(
            `Shipment API request failed: ${response.status} ${response.statusText}`,
        )
    }

    const result: unknown =
        await response.json()

    if (!Array.isArray(result)) {
        throw new Error(
            'Shipment API response must be an array',
        )
    }

    return result.map(
        (item, index) => {

            if (
                typeof item !== 'object'
                || item === null
                || Array.isArray(item)
            ) {
                throw new Error(
                    `Invalid shipment data at index ${index}`,
                )
            }

            return mapShipment(
                item as ApiShipmentFulfillment,
            )
        },
    )
}


// =========================================================
// GET SHIPMENT DETAIL
// =========================================================

export async function getShipmentDetail(
    filter: ShipmentDetailFilter,
    signal?: AbortSignal,
): Promise<ProductionOrder[]> {

    if (!filter.cusId?.trim()) {
        throw new Error(
            'Customer is required',
        )
    }

    if (!filter.shipBy?.trim()) {
        throw new Error(
            'Ship By is required',
        )
    }

    const query =
        new URLSearchParams({
            cusId:
                filter.cusId.trim(),

            shipBy:
                filter.shipBy.trim(),
        })

    // Chỉ có khi click CELL
    if (filter.exportDate) {
        query.set(
            'exportDate',
            filter.exportDate,
        )
    }

    const response =
        await fetch(
            `${API_BASE_URL}/api/shipment-fulfillment/detail?${query.toString()}`,
            {
                method: 'GET',
                signal,

                headers: {
                    Accept:
                        'application/json',
                },
            },
        )

    if (!response.ok) {
        throw new Error(
            `Shipment detail API request failed: ${response.status} ${response.statusText}`,
        )
    }

    const result: unknown =
        await response.json()

    if (!Array.isArray(result)) {
        throw new Error(
            'Shipment detail API response must be an array',
        )
    }

    return result.map(
        (item, index) => {

            if (
                typeof item !== 'object'
                || item === null
                || Array.isArray(item)
            ) {
                throw new Error(
                    `Invalid shipment detail at index ${index}`,
                )
            }

            return mapShipmentDetail(
                item as ApiShipmentDetail,
            )
        },
    )
}