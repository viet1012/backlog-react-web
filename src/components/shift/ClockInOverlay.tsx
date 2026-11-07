import { useEffect, useState } from 'react'

import { Box } from '@mui/material'
import { keyframes } from '@mui/material/styles'

import { useI18n } from '../../i18n/useI18n'

import {
    clockInTimeline,
    finishClockIn,
    useClockInRun,
    type ClockInRun,
    type ClockInTimeline,
} from './clockInStore'
import {
    Beacon,
    CardReader,
    DustBurst,
    formatClock,
    getDayPeriod,
    sceneFade,
    ShiftOverlayRoot,
    ShutterMessage,
    ShutterPanel,
    Worker,
} from './shiftParts'
import { buildWorkerCharacter, readAvatarSeed } from './workerCharacter'

// Mirror of the clock-out: the shutter comes down over the login page
// (same curve and bounce as shutterDrop), rests while the app loads
// underneath, then unlatches and rolls up on the dashboard. One keyframes
// for the whole run, so the drop and the rise never fight over transform.
function shutterRun({ dropDuration, landAt, riseAt, riseDuration }: ClockInTimeline) {
    const total = riseAt + riseDuration
    const at = (ms: number) => `${(ms / total * 100).toFixed(2)}%`

    return keyframes`
        0% { transform: translateY(-100%); animation-timing-function: cubic-bezier(.7,0,.3,1); }
        ${at(landAt)} { transform: translateY(0); animation-timing-function: ease-out; }
        ${at((landAt + dropDuration) / 2)} { transform: translateY(-6px); animation-timing-function: ease-in; }
        ${at(dropDuration)} { transform: translateY(0); }
        ${at(riseAt)} { transform: translateY(0); animation-timing-function: ease-out; }
        ${at(riseAt + riseDuration * 0.1)} { transform: translateY(6px); animation-timing-function: cubic-bezier(.7,0,.3,1); }
        100% { transform: translateY(-100%); }
    `
}

const runs = {
    full: { timeline: clockInTimeline(true), shutter: shutterRun(clockInTimeline(true)) },
    short: { timeline: clockInTimeline(false), shutter: shutterRun(clockInTimeline(false)) },
}

// The worker (default height clamp(64px, 11vh, 112px)) stops at 26vw; the
// reader scales with them and stands 36 units ahead, on the same ground.
const readerUnit = 'clamp(1px, 11vh / 64, 1.75px)'
const workerRestX = '26vw'

type SwipeStep = 'walk' | 'scan' | 'ok' | 'in'

function ClockInSequence({ run }: { run: ClockInRun }) {
    const { t } = useI18n()
    const { timeline, shutter } = runs[run.full ? 'full' : 'short']
    const { gaitCycle, landAt, riseAt, riseDuration } = timeline
    const [step, setStep] = useState<SwipeStep>('walk')

    useEffect(() => {
        const timer = window.setTimeout(() => finishClockIn(run.id), timeline.endAt)
        return () => window.clearTimeout(timer)
    }, [run.id, timeline.endAt])

    useEffect(() => {
        if (!run.full) return

        const timers = [
            window.setTimeout(() => setStep('scan'), timeline.scanAt),
            window.setTimeout(() => setStep('ok'), timeline.beepAt),
            window.setTimeout(() => setStep('in'), timeline.lowerAt),
        ]
        return () => timers.forEach(window.clearTimeout)
    }, [run.full, timeline])

    return (
        <ShiftOverlayRoot
            onSkip={() => finishClockIn(run.id)}
            shakeAt={landAt}
            fadeOutAt={timeline.fadeOutAt}
        >
            <ShutterPanel animation={`${shutter} ${riseAt + riseDuration}ms linear both`}>
                <ShutterMessage
                    tone="green"
                    label={t.shift.signedIn}
                    title={t.shift.greeting[getDayPeriod(run.startedAt)]}
                    subtitle={run.username}
                    timeLabel={t.shift.timeAt}
                    time={formatClock(run.startedAt)}
                    delay={landAt + 60}
                />
            </ShutterPanel>

            <DustBurst at={landAt} />
            <Beacon tone="green" start={riseAt - 200} duration={riseDuration + 300} />

            {/* Walks in front of the falling shutter, swipes the badge at
                the reader (shows up once the shutter has landed), heads inside */}
            {run.full && (
                <>
                    <Worker
                        startX="-10vw"
                        walks={[
                            { dx: '36vw', start: timeline.walkInStart, duration: gaitCycle * 2 },
                            { dx: '34vw', start: riseAt + 100, duration: gaitCycle * 2 },
                        ]}
                        badge={step === 'walk' ? undefined : step === 'in' ? 'lower' : 'scan'}
                        gaitCycle={gaitCycle}
                        character={buildWorkerCharacter(readAvatarSeed(run.username))}
                    />

                    <Box sx={{ position: 'absolute', inset: 0, animation: `${sceneFade} 250ms ease-out ${landAt}ms both` }}>
                        <CardReader
                            state={step === 'walk' ? 'idle' : step === 'scan' ? 'scan' : 'ok'}
                            animate
                            left={`calc(${workerRestX} + 36 * ${readerUnit})`}
                            bottom={14}
                            unit={readerUnit}
                        />
                    </Box>
                </>
            )}
        </ShiftOverlayRoot>
    )
}

export function ClockInOverlay() {
    const run = useClockInRun()

    if (!run) return null

    return <ClockInSequence key={run.id} run={run} />
}
