// src/constants/backlogStatus.ts

export const BACKLOG_STATUS_COLORS = {
    'NY PROCESS': '#d97706',
    NYI: '#64748b',
    WIP: '#2563eb',
    WIP_FG: '#0d9488',
} as const

export type BacklogStatusKey =
    keyof typeof BACKLOG_STATUS_COLORS

export function normalizeBacklogStatus(
    value?: string | null,
) {
    return (value ?? '')
        .trim()
        .toUpperCase()
}

export function getBacklogStatusColor(
    value?: string | null,
) {
    const status = normalizeBacklogStatus(value)

    return (
        BACKLOG_STATUS_COLORS[
        status as BacklogStatusKey
        ] ?? '#64748b'
    )
}