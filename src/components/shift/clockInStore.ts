import { useSyncExternalStore } from 'react'

import { takeFirstRunToday } from './shiftParts'

// The clock-in overlay lives at the App root so it survives the
// /login → dashboard navigation. LoginPage starts it, then navigates
// once the shutter fully covers the screen.

// =========================================================
// TIMELINE (ms from startClockIn)
// The shutter drops over the login page, the app is navigated underneath
// once it has landed, then it rolls up on the dashboard. Full (first
// sign-in of the day): the worker walks in during the drop, swipes the
// badge at the reader (beep), and heads inside as the shutter rolls up.
// Short: the shutter only.
// =========================================================

const gaitCycle = 440
const dropDuration = 650
const landAt = Math.round(dropDuration * 0.8)

export const CLOCK_IN_COVER_MS = landAt + 40

export function clockInTimeline(full: boolean) {
    const walkInStart = 200
    // Stops at the reader and raises the badge (arm up in ~280ms, one tap)
    const scanAt = walkInStart + gaitCycle * 2
    const beepAt = scanAt + 340
    // The shutter unlatches as the badge comes down
    const lowerAt = beepAt + 60
    const riseAt = full ? lowerAt : 1200
    const riseDuration = full ? 900 : 700
    const fadeOutAt = riseAt + riseDuration - 100

    return {
        gaitCycle,
        dropDuration,
        landAt,
        walkInStart,
        scanAt,
        beepAt,
        lowerAt,
        riseAt,
        riseDuration,
        fadeOutAt,
        endAt: fadeOutAt + 300,
    }
}

export type ClockInTimeline = ReturnType<typeof clockInTimeline>

export interface ClockInRun {
    id: number
    username: string
    startedAt: Date
    full: boolean
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
    current = {
        id: nextId++,
        username,
        startedAt: new Date(),
        full: takeFirstRunToday('clock-in', username),
    }
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
