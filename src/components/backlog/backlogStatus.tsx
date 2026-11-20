// src/constants/backlogStatus.ts

export const BACKLOG_STATUS_COLORS = {
    NYI: '#64748b',
    'NY PROCESS': '#d97706',
    WIP: '#2563eb',
    Finished: '#0d9488',
} as const

// Chế độ tối: cùng sắc nhưng sáng hơn để chữ trên chip đọc được
// (#2563eb / #64748b chỉ ~3.1–3.3:1 trên nền tối; bản này ≥ 5.9:1)
export const BACKLOG_STATUS_COLORS_DARK: Record<keyof typeof BACKLOG_STATUS_COLORS, string> = {
    NYI: '#94a3b8',
    'NY PROCESS': '#fbbf24',
    WIP: '#60a5fa',
    Finished: '#2dd4bf',
}

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
    mode: 'light' | 'dark' = 'light',
) {
    const status = normalizeBacklogStatus(value)
    const colors = mode === 'dark' ? BACKLOG_STATUS_COLORS_DARK : BACKLOG_STATUS_COLORS

    return (
        colors[
        status as BacklogStatusKey
        ] ?? colors.NYI
    )
}