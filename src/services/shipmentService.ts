import type { ShipmentFulfillment } from '../types/shipment'

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

type ApiShipmentFulfillment = Record<string, unknown>

function nullableString(value: unknown): string | null {
    return value === null || value === undefined
        ? null
        : String(value)
}

function requiredString(value: unknown, field: string): string {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ''
    ) {
        throw new Error(`Shipment API missing field: ${field}`)
    }

    return String(value)
}

function numberValue(value: unknown): number {
    if (value === null || value === undefined) {
        return 0
    }

    const parsed = Number(value)

    return Number.isNaN(parsed) ? 0 : parsed
}

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
    const query = new URLSearchParams({
        fromD,
        toD,
    })

    const response = await fetch(
        `${API_BASE_URL}/api/shipment-fulfillment?${query.toString()}`,
        {
            signal,
        },
    )

    if (!response.ok) {
        throw new Error(
            `Shipment API request failed: ${response.status}`,
        )
    }

    const result = await response.json()

    if (!Array.isArray(result)) {
        throw new Error(
            'Shipment API response must be an array',
        )
    }

    return result.map(
        (item) =>
            mapShipment(
                item as ApiShipmentFulfillment,
            ),
    )
}