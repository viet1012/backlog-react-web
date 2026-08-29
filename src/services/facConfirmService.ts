import {
    API_BASE_URL,
} from '../config/api'

import type {
    FacConfirmPageResponse,
    FacConfirmProcessGroup,
    FacConfirmProcessGroupSummary,
    FacConfirmFilterOptionsRequest,
    FacConfirmSearchRequest,
    FacConfirmProcessTimeRequest,
    FacConfirmProcessTimeResponse,
    FacConfirmConfirmedProcess,
} from '../types/facConfirm'

export interface FacConfirmParams {
    div: string
    expD: string
    procGrp: FacConfirmProcessGroup

    page: number
    size: number
}


// =========================================================
// DETAIL
// =========================================================

export async function getFacConfirm(
    params: FacConfirmParams,
    signal?: AbortSignal,
): Promise<FacConfirmPageResponse> {

    const query = new URLSearchParams({
        div: params.div,
        expD: params.expD,
        procGrp: params.procGrp,
        page: String(params.page),
        size: String(params.size),
    })

    const url =
        `${API_BASE_URL}/api/fac-confirm?${query.toString()}`

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
            `Fac Confirm API failed: ${response.status}`,
        )
    }

    const result =
        await response.json() as FacConfirmPageResponse

    if (!Array.isArray(result.content)) {
        throw new Error(
            'Invalid Fac Confirm API response',
        )
    }

    return result
}


// =========================================================
// PROCESS GROUPS
// =========================================================

export async function getFacConfirmProcessGroups(
    div: string,
    expD: string,
    signal?: AbortSignal,
): Promise<FacConfirmProcessGroupSummary[]> {

    const query = new URLSearchParams({
        div,
        expD,
    })

    const url =
        `${API_BASE_URL}/api/fac-confirm/process-groups?${query.toString()}`

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
            `Fac Confirm Process Groups API failed: ${response.status}`,
        )
    }

    const result =
        await response.json() as FacConfirmProcessGroupSummary[]

    if (!Array.isArray(result)) {
        throw new Error(
            'Invalid Fac Confirm Process Groups response',
        )
    }

    return result
}

// =========================================================
// SERVER-SIDE EXCEL FILTERING
// Expected backend endpoints; no client-page filtering fallback.
// =========================================================

export async function searchFacConfirm(
    request: FacConfirmSearchRequest,
    signal?: AbortSignal,
): Promise<FacConfirmPageResponse> {
    const response = await fetch(`${API_BASE_URL}/api/fac-confirm/search`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal,
    })

    if (!response.ok) {
        throw new Error(`Fac Confirm search API failed: ${response.status}`)
    }

    const result = await response.json() as FacConfirmPageResponse
    if (!Array.isArray(result.content)) {
        throw new Error('Invalid Fac Confirm search response')
    }
    return result
}

export async function getFacConfirmFilterOptions(
    request: FacConfirmFilterOptionsRequest,
    signal?: AbortSignal,
): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/fac-confirm/filter-options`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal,
    })

    if (!response.ok) {
        throw new Error(`Fac Confirm filter options API failed: ${response.status}`)
    }

    const result: unknown = await response.json()
    const values = Array.isArray(result)
        ? result
        : typeof result === 'object' && result !== null && 'values' in result
            ? (result as { values: unknown }).values
            : null

    if (!Array.isArray(values) || !values.every(
        (value) => value === null || typeof value === 'string',
    )) {
        throw new Error('Invalid Fac Confirm filter options response')
    }

    return [...new Set(values.map((value) => value ?? ''))]
        .sort((left, right) => left.localeCompare(right))
}

// =========================================================
// CONFIRMED PROCESSES
// =========================================================

export async function getFacConfirmConfirmedProcesses(
    aufnrs: string[],
    signal?: AbortSignal,
): Promise<FacConfirmConfirmedProcess[]> {

    const cleanAufnrs = [
        ...new Set(
            aufnrs
                .map((value) => value.trim())
                .filter(Boolean),
        ),
    ]

    if (cleanAufnrs.length === 0) {
        return []
    }

    const response = await fetch(
        `${API_BASE_URL}/api/fac-confirm/confirmed-processes`,
        {
            method: 'POST',

            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },

            body: JSON.stringify(
                cleanAufnrs,
            ),

            signal,
        },
    )

    if (!response.ok) {
        throw new Error(
            `Fac Confirm confirmed-processes API failed: ${response.status}`,
        )
    }

    const result: unknown =
        await response.json()

    if (!Array.isArray(result)) {
        throw new Error(
            'Invalid confirmed processes response',
        )
    }

    return result as FacConfirmConfirmedProcess[]
}
// =========================================================
// SAVE PROCESS TIMES
// =========================================================


export async function saveFacConfirmProcessTimes(
    request: FacConfirmProcessTimeRequest,
    signal?: AbortSignal,
): Promise<FacConfirmProcessTimeResponse> {

    if (!request.employeeId?.trim()) {
        throw new Error('Employee ID is required')
    }

    if (
        !Array.isArray(request.changes)
        || request.changes.length === 0
    ) {
        throw new Error('No process changes to save')
    }

    const response = await fetch(
        `${API_BASE_URL}/api/fac-confirm/process-times`,
        {
            method: 'PATCH',

            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },

            body: JSON.stringify(request),

            signal,
        },
    )

    if (!response.ok) {
        const message = await response.text()

        throw new Error(
            message
            || `Save Fac Confirm failed: ${response.status}`,
        )
    }

    const result =
        await response.json() as FacConfirmProcessTimeResponse

    return result
}