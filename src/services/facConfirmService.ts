import {
    API_BASE_URL,
} from '../config/api'

import type {
    FacConfirmPageResponse,
    FacConfirmProcessGroup,
    FacConfirmProcessGroupSummary,
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