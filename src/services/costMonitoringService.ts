import {
    API_BASE_URL,
} from '../config/api'

import type {
    CostMonitoringChartResponse,
    CostPlWeeksResponse,
    CostSimuWeek,
} from '../types/costMonitoring'


// =========================================================
// COST MONITORING – API backlog-be (/api/cost-monitoring)
// =========================================================

const API_URL =
    `${API_BASE_URL.replace(/\/$/, '')}/api/cost-monitoring`

async function getJson(
    url: string,
    signal?: AbortSignal,
): Promise<unknown> {

    const response = await fetch(
        url,
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
            `Cost Monitoring API failed: ${response.status}`,
        )
    }

    return response.json()
}


// =========================================================
// VALIDATION
// =========================================================

function isChartResponse(
    value: unknown,
): value is CostMonitoringChartResponse {

    if (
        typeof value !== 'object'
        || value === null
    ) {
        return false
    }

    const item =
        value as Record<string, unknown>

    return (
        typeof item.month === 'string'
        && Array.isArray(item.charts)
    )
}


// =========================================================
// MONTHS – "2026.10", mới nhất trước
// =========================================================

export async function getCostMonitoringMonths(
    signal?: AbortSignal,
): Promise<string[]> {

    const result =
        await getJson(`${API_URL}/months`, signal)

    if (
        !Array.isArray(result)
        || !result.every((m) => typeof m === 'string')
    ) {
        throw new Error(
            'Invalid Cost Monitoring months response',
        )
    }

    return result
}


// =========================================================
// CHART – month dạng "2026-10"
// =========================================================

export async function getCostMonitoringChart(
    month: string,
    simuWeek: CostSimuWeek,
    signal?: AbortSignal,
): Promise<CostMonitoringChartResponse> {

    const params =
        new URLSearchParams({ month })

    if (simuWeek) {
        params.set('simuWeek', simuWeek)
    }

    const result =
        await getJson(`${API_URL}/chart?${params}`, signal)

    if (!isChartResponse(result)) {
        throw new Error(
            'Invalid Cost Monitoring chart response',
        )
    }

    return result
}


// =========================================================
// PL SIMULATION WEEKS – month dạng "2026-10"
// =========================================================

function isPlWeeksResponse(
    value: unknown,
): value is CostPlWeeksResponse {

    if (
        typeof value !== 'object'
        || value === null
    ) {
        return false
    }

    const item =
        value as Record<string, unknown>

    return (
        Array.isArray(item.weeks)
        && item.weeks.every((w) => typeof w === 'string')
        && (item.latestWeek === null || typeof item.latestWeek === 'string')
    )
}

export async function getCostMonitoringPlWeeks(
    month: string,
    signal?: AbortSignal,
): Promise<CostPlWeeksResponse> {

    const result =
        await getJson(
            `${API_URL}/pl-weeks?${new URLSearchParams({ month })}`,
            signal,
        )

    if (!isPlWeeksResponse(result)) {
        throw new Error(
            'Invalid Cost Monitoring PL weeks response',
        )
    }

    return {
        ...result,
        latestMixed: result.latestMixed === true,
    }
}


// "2026.10" -> "2026-10"
export function toApiMonth(
    month: string,
): string {
    return month.replace('.', '-')
}
