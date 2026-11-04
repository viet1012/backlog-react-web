import { useSyncExternalStore } from 'react'

// The clock-in overlay lives at the App root so it survives the
// /login → dashboard navigation. LoginPage starts it, then navigates
// once the shutter fully covers the screen.

export const CLOCK_IN_COVER_MS = 320

export interface ClockInRun {
    id: number
    username: string
    startedAt: Date
}

let current: ClockInRun | null = null
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
    listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

export function startClockIn(username: string) {
    current = { id: nextId++, username, startedAt: new Date() }
    emit()
}

export function finishClockIn(id: number) {
    if (current?.id !== id) return

    current = null
    emit()
}

export function useClockInRun() {
    return useSyncExternalStore(subscribe, () => current)
}
