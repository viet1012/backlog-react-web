import { API_BASE_URL } from '../config/api'
import type { ShipmentFulfillment } from '../types/shipment'
import {
    nullableString,
    numberValue,
    requiredString,
} from '../utils/apiMapper'

type ApiShipmentFulfillment = Record<string, unknown>

function mapShipment(
    item: ApiShipmentFulfillment,
): ShipmentFulfillment {
    return {
        exportD: nullableString(item.exportD),

        cusId: requiredString(
            item.cusId,
            'cusId',
        ),

        shipBy:
            nullableString(item.shipBy) ?? 'N/A',

        poQty: numberValue(item.poQty),

        fnQty: numberValue(item.fnQty),

        fnRatio: numberValue(item.fnRatio),
    }
}

export async function getShipmentFulfillment(
    fromD: string,
    toD: string,
    signal?: AbortSignal,
): Promise<ShipmentFulfillment[]> {
    // =========================
    // VALIDATE
    // =========================

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

    // =========================
    // QUERY PARAMS
    // =========================

    const query = new URLSearchParams({
        fromD,
        toD,
    })

    // =========================
    // API
    // =========================

    const response = await fetch(
        `${API_BASE_URL}/api/shipment-fulfillment?${query.toString()}`,
        {
            method: 'GET',
            signal,
            headers: {
                Accept: 'application/json',
            },
        },
    )

    if (!response.ok) {
        throw new Error(
            `Shipment API request failed: ${response.status} ${response.statusText}`,
        )
    }

    // =========================
    // RESPONSE
    // =========================

    const result: unknown =
        await response.json()

    if (!Array.isArray(result)) {
        throw new Error(
            'Shipment API response must be an array',
        )
    }

    // =========================
    // MAPPING
    // =========================

    return result.map(
        (item, index) => {
            if (
                typeof item !== 'object' ||
                item === null ||
                Array.isArray(item)
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