import {
    API_BASE_URL,
} from '../config/api'

import type {
    OdbfSummaryItem,
} from '../types/odbf'


// =========================================================
// VALIDATION
// =========================================================

function isOdbfSummaryItem(
    value: unknown,
): value is OdbfSummaryItem {

    if (
        typeof value !== 'object'
        || value === null
    ) {
        return false
    }

    const item =
        value as Record<string, unknown>

    return (
        typeof item.productGrp === 'string'
        && typeof item.status2 === 'string'
        && typeof item.exportD === 'string'
        && typeof item.countPo === 'number'
        && typeof item.sumQty === 'number'
    )
}


// =========================================================
// SUMMARY
// =========================================================

export async function getOdbfSummary(
    signal?: AbortSignal,
): Promise<OdbfSummaryItem[]> {

    const response = await fetch(
        `${API_BASE_URL}/api/odbf/summary`,
        {
            method: 'GET',

            headers: {
                Accept: 'application/json',
            },

            signal,
        },
    )

    if (!response.ok) {
        throw new Error(
            `ODBF Summary API failed: ${response.status}`,
        )
    }

    const result: unknown =
        await response.json()

    if (
        !Array.isArray(result)
        || !result.every(isOdbfSummaryItem)
    ) {
        throw new Error(
            'Invalid ODBF Summary response',
        )
    }

    return result
}