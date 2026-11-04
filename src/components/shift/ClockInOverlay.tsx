import { useEffect } from 'react'

import {
    finishClockIn,
    useClockInRun,
    type ClockInRun,
} from './clockInStore'
import {
    Beacon,
    DustBurst,
    fadeUp,
    formatClock,
    ShiftOverlayRoot,
    ShutterMessage,
    ShutterPanel,
    shutterRise,
    Worker,
} from './shiftParts'

// =========================================================
// TIMELINE (ms from overlay mount) — mirror of the clock-out:
// shutter is down, the worker walks in and waves, the shutter
// rolls up on the dashboard and the worker heads inside.
// =========================================================

const gaitCycle = 440
const messageAt = 350
const messageFade = 450
const walkInStart = 250
const walkInDuration = gaitCycle * 2
const waveStart = walkInStart + walkInDuration
const waveDuration = 500
const riseAt = waveStart + 420
const riseDuration = 1000
const walkOnStart = riseAt + 100
const walkOnDuration = gaitCycle * 2
const fadeOutAt = riseAt + riseDuration - 100
const endAt = fadeOutAt + 300

function greeting(date: Date) {
    const hour = date.getHours()

    if (hour >= 5 && hour < 11) return 'CHÀO BUỔI SÁNG'
    if (hour >= 11 && hour < 18) return 'CHÀO BUỔI CHIỀU'
    return 'CHÀO BUỔI TỐI'
}

function ClockInSequence({ run }: { run: ClockInRun }) {
    useEffect(() => {
        const timer = window.setTimeout(() => finishClockIn(run.id), endAt)
        return () => window.clearTimeout(timer)
    }, [run.id])

    return (
        <ShiftOverlayRoot
            onSkip={() => finishClockIn(run.id)}
            fadeIn
            shakeAt={riseAt}
            fadeOutAt={fadeOutAt}
        >
            <ShutterPanel animation={`${shutterRise} ${riseDuration}ms ${riseAt}ms forwards`}>
                <ShutterMessage
                    title={`VÀO CA — ${greeting(run.startedAt)}`}
                    subtitle={run.username}
                    detail={`Check-in ${formatClock(run.startedAt)}`}
                    animation={`${fadeUp} ${messageFade}ms ease-out ${messageAt}ms both`}
                />
            </ShutterPanel>

            <DustBurst at={riseAt} />
            <Beacon tone="green" start={riseAt - 200} duration={riseDuration + 300} />

            <Worker
                startX="-10vw"
                walks={[
                    { dx: '36vw', start: walkInStart, duration: walkInDuration },
                    { dx: '34vw', start: walkOnStart, duration: walkOnDuration },
                ]}
                wave={{ start: waveStart, duration: waveDuration }}
                gaitCycle={gaitCycle}
            />
        </ShiftOverlayRoot>
    )
}

export function ClockInOverlay() {
    const run = useClockInRun()

    if (!run) return null

    return <ClockInSequence key={run.id} run={run} />
}
