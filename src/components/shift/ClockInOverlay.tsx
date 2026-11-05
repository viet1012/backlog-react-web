import { useEffect } from 'react'

import { useI18n } from '../../i18n/useI18n'

import {
    finishClockIn,
    useClockInRun,
    type ClockInRun,
} from './clockInStore'
import {
    Beacon,
    DustBurst,
    formatClock,
    getDayPeriod,
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

function ClockInSequence({ run }: { run: ClockInRun }) {
    const { t } = useI18n()

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
                    tone="green"
                    label={t.shift.signedIn}
                    title={t.shift.greeting[getDayPeriod(run.startedAt)]}
                    subtitle={run.username}
                    timeLabel={t.shift.timeAt}
                    time={formatClock(run.startedAt)}
                    delay={messageAt}
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
