import { useEffect, useRef, useState } from 'react'

import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Typography,
    useMediaQuery,
} from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'

import { LogoutRounded } from '@mui/icons-material'

import { useI18n } from '../../i18n/useI18n'

import {
    Beacon,
    DustBurst,
    formatClock,
    getDayPeriod,
    monoFont,
    type DayPeriod,
    scenePalettes,
    ShiftOverlayRoot,
    ShiftScene,
    ShutterMessage,
    ShutterPanel,
    shutterDrop,
    skylinePath,
    Worker,
} from '../shift/shiftParts'

interface LogoutConfirmDialogProps {
    open: boolean
    username: string
    role?: string
    onCancel: () => void
    onConfirm: () => void
}

// =========================================================
// TIMELINE (ms from the Sign out click)
// =========================================================

// The gate in the dialog header closes first, then the full-screen
// clock-out sequence takes over.
const shutterStartAt = 600

const gateDropDuration = 520
const gateImpact = Math.round(gateDropDuration * 0.8)

// Relative to overlay mount (600ms): the worker waves, walks out,
// and the shutter lands just before they leave the frame.
const waveDuration = 500
const walkStart = waveDuration
const walkDuration = 950
const gaitCycle = 440
const dropDelay = 400
const dropDuration = 1150
const shutterImpact = dropDelay + Math.round(dropDuration * 0.8)

// Farewell text fades in after impact, then holds long enough to read.
const messageAt = shutterImpact + 60
const messageFade = 450
const messageHold = 900

const confirmAt = shutterStartAt + messageAt + messageFade + messageHold

// =========================================================
// KEYFRAMES (transform / opacity only, except the hazard stripes)
// =========================================================

// Gate header: the shutter's hazard rail peeks out of the top edge.
const gateHeight = 104
const gateRail = 10

const paperSpring = keyframes`
    from { opacity: 0; transform: translateY(12px) scale(0.9); }
    to { opacity: 1; transform: translateY(0) scale(1); }
`

// Same curve as shutterDrop, starting from the rolled-up position.
const gateDrop = keyframes`
    0% { transform: translateY(calc(-100% + ${gateRail}px)); animation-timing-function: cubic-bezier(.7,0,.3,1); }
    80% { transform: translateY(0); animation-timing-function: ease-out; }
    90% { transform: translateY(-4px); animation-timing-function: ease-in; }
    100% { transform: translateY(0); }
`

// Opening: mirror of the clock-in — unlatch dip, then roll up to the rail.
const gateRise = keyframes`
    0% { transform: translateY(0); animation-timing-function: ease-out; }
    12% { transform: translateY(4px); animation-timing-function: cubic-bezier(.7,0,.3,1); }
    100% { transform: translateY(calc(-100% + ${gateRail}px)); }
`

const smokeRise = keyframes`
    0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
    20% { opacity: 0.8; }
    100% { opacity: 0; transform: translate(12px, -36px) scale(1.6); }
`

const cloudDrift = keyframes`
    from { transform: translateX(-120px); }
    to { transform: translateX(560px); }
`

const twinkle = keyframes`
    0%, 100% { opacity: 0.25; }
    50% { opacity: 1; }
`

const windowFlicker = keyframes`
    0%, 100% { opacity: 1; }
    45% { opacity: 1; }
    50% { opacity: 0.35; }
    55% { opacity: 1; }
    70% { opacity: 0.6; }
    72% { opacity: 1; }
`

const laneScroll = keyframes`
    from { transform: translateX(0); }
    to { transform: translateX(28px); }
`

const lampBlink = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
`

// Morning sun creeps up from behind the skyline.
const sunRise = keyframes`
    from { transform: translateY(12px); }
    to { transform: translateY(-4px); }
`

const raySpin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`

const birdFly = keyframes`
    from { transform: translateX(-70px); }
    to { transform: translateX(540px); }
`

const birdFlap = keyframes`
    from { transform: scaleY(1); }
    to { transform: scaleY(0.35); }
`

const scanSweep = keyframes`
    from { transform: translateX(-140%) skewX(-20deg); }
    to { transform: translateX(300%) skewX(-20deg); }
`

const hazardRun = keyframes`
    from { background-position: 0 0; }
    to { background-position: 8px 0; }
`

const cardSink = keyframes`
    0% { opacity: 1; transform: translateY(0) scale(1); }
    25% { opacity: 1; transform: translateY(0) scale(0.98); }
    100% { opacity: 0; transform: translateY(26px) scale(0.96, 0.2); }
`

const ledDoubleBlink = keyframes`
    0% { opacity: 0; }
    15% { opacity: 1; }
    40% { opacity: 0; }
    60% { opacity: 1; }
    85% { opacity: 0; }
    100% { opacity: 0; }
`

// Diagonal amber/charcoal tile, same pair as the shutter's bottom rail.
const hazardTile = 'linear-gradient(45deg, #111827 25%, #f59e0b 25%, #f59e0b 50%, #111827 50%, #111827 75%, #f59e0b 75%, #f59e0b)'

// =========================================================
// GATE HEADER (miniature of the clock-out scene)
// =========================================================

// Opening (ms from dialog mount): shutter rolls up, worker walks in.
const gateRiseDelay = 220
const gateRiseDuration = 700
const workerWalkIn = { dx: '132px', start: gateRiseDelay + 200, duration: gaitCycle * 2 }
// Confirm: worker heads out while the shutter comes down.
const workerWalkOut = { dx: '360px', start: 0, duration: gaitCycle * 2 }

// Chimney tops of skylinePath (x / 1200), px above the scene bottom.
const chimneys = [
    { left: '28.96%', bottom: 50 },
    { left: '73.9%', bottom: 53 },
]
const smokePuffs = [0, 0.9, 1.8]

// Factory windows in skylinePath coordinates (viewBox 0 0 1200 160).
const factoryWindows = [
    [24, 110], [84, 110], [144, 110], [204, 110],
    [432, 80], [462, 80], [492, 80],
    [616, 106], [668, 106], [720, 106], [768, 106],
    [972, 80], [1010, 80], [1048, 80],
    [1106, 102], [1150, 102],
] as const

// [left %, top px]
const stars = [[8, 14], [18, 32], [33, 10], [47, 24], [58, 8], [66, 30], [90, 14], [95, 36]] as const

// Per time of day: where the sun / moon sits, how lit the factory is and
// what lives in the sky. Birds fly to work in the morning, home in the afternoon.
interface GatePalette {
    orbLeft: string
    orbBottom: number
    windowLit: string
    windowOpacity: number
    smoke: string
    cloud: string | null
    birds: { color: string; reverse: boolean } | null
    stars?: boolean
    sunRays?: boolean
    sunRise?: boolean
}

const gatePalettes: Record<DayPeriod, GatePalette> = {
    morning: {
        orbLeft: '9%',
        orbBottom: 30,
        windowLit: '#fde68a',
        windowOpacity: 0.35,
        smoke: 'rgba(100,116,139,0.45)',
        cloud: 'rgba(255,241,242,0.8)',
        birds: { color: '#334155', reverse: false },
        sunRise: true,
    },
    noon: {
        orbLeft: '52%',
        orbBottom: 64,
        windowLit: '#e0f2fe',
        windowOpacity: 0.2,
        smoke: 'rgba(148,163,184,0.5)',
        cloud: 'rgba(255,255,255,0.92)',
        birds: null,
        sunRays: true,
    },
    afternoon: {
        orbLeft: '84%',
        orbBottom: 40,
        windowLit: '#fde68a',
        windowOpacity: 0.6,
        smoke: 'rgba(120,113,108,0.55)',
        cloud: 'rgba(255,237,213,0.6)',
        birds: { color: '#7c2d12', reverse: true },
    },
    night: {
        orbLeft: '84%',
        orbBottom: 62,
        windowLit: '#fbbf24',
        windowOpacity: 0.95,
        smoke: 'rgba(148,163,184,0.35)',
        cloud: null,
        birds: null,
        stars: true,
    },
}

// [x, y, flap delay s] inside the flock
const flock = [[0, 6, 0], [14, 0, 0.12], [26, 9, 0.24]] as const

function GateScene({
    warn,
    closing,
    reduceMotion,
}: {
    warn: boolean
    closing: boolean
    reduceMotion: boolean
}) {
    const [period] = useState(() => getDayPeriod(new Date()))
    const palette = scenePalettes[period]
    const gate = gatePalettes[period]
    const orbSize = Math.round(palette.orbSize * 0.4)
    const animate = !reduceMotion

    // The factory "runs" until sign-out is confirmed.
    const running = animate && !closing ? 'running' : 'paused'

    const shutterAnimation = !animate
        ? 'none'
        : closing
            ? `${gateDrop} ${gateDropDuration}ms both`
            : `${gateRise} ${gateRiseDuration}ms ${gateRiseDelay}ms both`

    return (
        <Box
            aria-hidden
            sx={{
                position: 'relative',
                height: gateHeight,
                overflow: 'hidden',
                background: palette.sky,

                '& .gate-star': {
                    position: 'absolute',
                    width: 2,
                    height: 2,
                    borderRadius: '50%',
                    bgcolor: '#f8fafc',
                    animation: animate ? `${twinkle} 2.4s ease-in-out infinite` : 'none',
                },
                '& .gate-cloud': {
                    position: 'absolute',
                    left: 0,
                    height: 10,
                    borderRadius: 999,
                    bgcolor: gate.cloud,
                    filter: 'blur(2px)',
                    animation: animate ? `${cloudDrift} 28s linear infinite` : 'none',
                },
                '& .gate-smoke': {
                    position: 'absolute',
                    width: 9,
                    height: 9,
                    ml: '-4.5px',
                    borderRadius: '50%',
                    bgcolor: gate.smoke,
                    opacity: 0,
                    animation: animate ? `${smokeRise} 2.7s ease-out infinite` : 'none',
                    animationPlayState: running,
                },
                '& .gate-window-flicker': {
                    animation: animate ? `${windowFlicker} 3.2s steps(1, end) infinite` : 'none',
                },
                '& .gate-bird': {
                    transformOrigin: '50% 100%',
                    animation: animate ? `${birdFlap} 0.32s ease-in-out infinite alternate` : 'none',
                },
            }}
        >
            {gate.stars && stars.map(([left, top], index) => (
                <Box
                    key={`${left}-${top}`}
                    className="gate-star"
                    style={{ left: `${left}%`, top, animationDelay: `${index * 0.35}s` }}
                />
            ))}

            {gate.cloud && [
                { top: 16, width: 54, delay: -6 },
                { top: 34, width: 38, delay: -19 },
            ].map((cloud) => (
                <Box
                    key={cloud.top}
                    className="gate-cloud"
                    style={{ top: cloud.top, width: cloud.width, animationDelay: `${cloud.delay}s` }}
                />
            ))}

            {/* SUN / MOON */}
            <Box
                sx={{
                    position: 'absolute',
                    left: gate.orbLeft,
                    bottom: gate.orbBottom,
                    width: orbSize,
                    height: orbSize,
                    ml: `${-orbSize / 2}px`,
                    animation: gate.sunRise && animate ? `${sunRise} 14s ease-out both` : 'none',
                }}
            >
                {/* Noon: slow-turning rays behind the sun */}
                {gate.sunRays && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: orbSize * 3,
                            height: orbSize * 3,
                            mt: `${-orbSize * 1.5}px`,
                            ml: `${-orbSize * 1.5}px`,
                            borderRadius: '50%',
                            background: `repeating-conic-gradient(${alpha(palette.orb, 0.5)} 0deg 8deg, transparent 8deg 30deg)`,
                            WebkitMaskImage: 'radial-gradient(circle, #000 20%, transparent 70%)',
                            maskImage: 'radial-gradient(circle, #000 20%, transparent 70%)',
                            animation: animate ? `${raySpin} 24s linear infinite` : 'none',
                        }}
                    />
                )}

                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        bgcolor: palette.orb,
                        boxShadow: `0 0 28px ${alpha(palette.orb, 0.6)}`,
                    }}
                />
            </Box>

            {/* BIRDS */}
            {gate.birds && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 22,
                        left: 0,
                        width: 40,
                        height: 16,
                        animation: animate
                            ? `${birdFly} 13s linear -3s infinite${gate.birds.reverse ? ' reverse' : ''}`
                            : 'none',
                    }}
                >
                    {flock.map(([x, y, delay]) => (
                        <Box
                            key={x}
                            component="svg"
                            viewBox="0 0 10 4"
                            className="gate-bird"
                            style={{ animationDelay: `${delay}s` }}
                            sx={{ position: 'absolute', left: x, top: y, width: 10, height: 4, overflow: 'visible' }}
                        >
                            <path
                                d="M0 3 Q2.5 0 5 3 Q7.5 0 10 3"
                                fill="none"
                                stroke={gate.birds?.color}
                                strokeWidth={1.2}
                                strokeLinecap="round"
                            />
                        </Box>
                    ))}
                </Box>
            )}

            {/* CHIMNEY SMOKE */}
            {chimneys.map((chimney) =>
                smokePuffs.map((delay) => (
                    <Box
                        key={`${chimney.left}-${delay}`}
                        className="gate-smoke"
                        style={{ left: chimney.left, bottom: chimney.bottom, animationDelay: `${delay}s` }}
                    />
                )),
            )}

            {/* FACTORY SKYLINE + WINDOWS (lights go out one by one on confirm) */}
            <svg
                viewBox="0 0 1200 160"
                preserveAspectRatio="none"
                style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 12,
                    width: '100%',
                    height: 52,
                    display: 'block',
                }}
            >
                <path d={skylinePath} fill={palette.skyline} />

                {factoryWindows.map(([x, y], index) => (
                    <g
                        key={`${x}-${y}`}
                        style={{
                            opacity: closing ? 0.06 : gate.windowOpacity,
                            transition: animate ? `opacity 120ms ease ${index * 28}ms` : 'none',
                        }}
                    >
                        <rect
                            className={index % 5 === 2 ? 'gate-window-flicker' : undefined}
                            x={x}
                            y={y}
                            width={22}
                            height={12}
                            rx={2}
                            fill={gate.windowLit}
                        />
                    </g>
                ))}
            </svg>

            {/* GROUND + MOVING LANE MARKING */}
            <Box
                sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 12,
                    overflow: 'hidden',
                    bgcolor: palette.ground,
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: 5,
                        left: -28,
                        right: 0,
                        height: 1.5,
                        backgroundImage: 'repeating-linear-gradient(90deg, rgba(250,204,21,0.7) 0 14px, transparent 14px 28px)',
                        animation: animate ? `${laneScroll} 0.9s linear infinite` : 'none',
                        animationPlayState: running,
                    }}
                />
            </Box>

            {/* Walks in on open, waves goodbye on hover, walks out on confirm */}
            <Worker
                startX={animate ? '-36px' : '96px'}
                walks={!animate ? [] : closing ? [workerWalkIn, workerWalkOut] : [workerWalkIn]}
                wave={warn && animate ? { start: 0, duration: waveDuration, iterations: 'infinite' } : undefined}
                gaitCycle={gaitCycle}
                height={56}
                bottom={6}
            />

            {/* SHUTTER: rolls up on open, dips while hovering Sign out, drops on confirm */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    transform: closing ? 'translateY(0)' : `translateY(calc(-100% + ${gateRail}px))`,
                    animation: shutterAnimation,
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        transform: warn ? 'translateY(10px)' : 'translateY(0)',
                        transition: animate ? 'transform 260ms cubic-bezier(.34,1.56,.64,1)' : 'none',
                    }}
                >
                    <ShutterPanel animation="none" railHeight={gateRail}>
                        <Typography
                            sx={(theme) => ({
                                fontFamily: monoFont,
                                fontSize: 12,
                                fontWeight: 800,
                                letterSpacing: '0.32em',
                                color: theme.palette.mode === 'dark' ? 'rgba(229,231,235,0.7)' : 'rgba(31,41,55,0.65)',
                            })}
                        >
                            F2 FACTORY
                        </Typography>
                    </ShutterPanel>
                </Box>
            </Box>

            {/* WARNING LAMP under the rail — blinks while hovering Sign out */}
            <Box
                sx={{
                    position: 'absolute',
                    top: gateRail + 6,
                    right: 12,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: '#f59e0b',
                    boxShadow: warn ? '0 0 10px rgba(245,158,11,0.95)' : 'none',
                    opacity: warn ? 1 : 0.3,
                    transition: animate ? 'opacity 150ms ease, box-shadow 150ms ease' : 'none',
                    animation: warn && animate ? `${lampBlink} 0.6s steps(1, end) infinite` : 'none',
                }}
            />

            {animate && <DustBurst at={closing ? gateImpact : gateRiseDelay} key={closing ? 'close' : 'open'} />}
            {closing && animate && (
                <Beacon tone="amber" start={0} duration={shutterStartAt + 200} />
            )}
        </Box>
    )
}

// =========================================================
// TIME CLOCK SLOT (confirm phase only)
// =========================================================

function TimeClockSlot({
    active,
    checkoutTime,
    reduceMotion,
}: {
    active: boolean
    checkoutTime: string | null
    reduceMotion: boolean
}) {
    const { t } = useI18n()
    const grow = reduceMotion
        ? 'none'
        : 'height 150ms ease, opacity 150ms ease, margin 150ms ease'

    return (
        <>
            <Box
                aria-hidden
                sx={(theme) => ({
                    position: 'relative',
                    mx: 'auto',
                    width: '70%',
                    height: active ? 10 : 0,
                    opacity: active ? 1 : 0,
                    borderRadius: '5px',
                    bgcolor: 'action.hover',
                    boxShadow: theme.palette.mode === 'dark'
                        ? 'inset 0 2px 3px rgba(0,0,0,0.6)'
                        : 'inset 0 2px 3px rgba(15,23,42,0.22)',
                    transition: grow,
                })}
            >
                {/* LED */}
                <Box
                    sx={(theme) => ({
                        position: 'absolute',
                        top: '50%',
                        left: 'calc(100% + 8px)',
                        width: 6,
                        height: 6,
                        mt: '-3px',
                        borderRadius: '50%',
                        bgcolor: theme.palette.mode === 'dark' ? '#4b5563' : '#9ca3af',
                    })}
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            bgcolor: '#22c55e',
                            boxShadow: '0 0 6px rgba(34,197,94,0.9)',
                            opacity: active && reduceMotion ? 1 : 0,
                            animation: active && !reduceMotion
                                ? `${ledDoubleBlink} ${shutterStartAt - 120}ms linear 120ms forwards`
                                : 'none',
                        }}
                    />
                </Box>
            </Box>

            <Box
                sx={{
                    overflow: 'hidden',
                    height: active ? 18 : 0,
                    mt: active ? 0.75 : 0,
                    opacity: active ? 1 : 0,
                    transition: reduceMotion
                        ? 'none'
                        : 'height 150ms ease, margin 150ms ease, opacity 200ms ease 150ms',
                }}
            >
                {checkoutTime && (
                    <Typography
                        sx={{
                            fontFamily: monoFont,
                            fontSize: 12,
                            lineHeight: '18px',
                            letterSpacing: '0.08em',
                            color: 'text.secondary',
                        }}
                    >
                        {t.logout.checkOut(checkoutTime)}
                    </Typography>
                )}
            </Box>
        </>
    )
}

// =========================================================
// ROLLING SHUTTER
// =========================================================

function ShutterOverlay({
    username,
    checkoutTime,
    onSkip,
}: {
    username: string
    checkoutTime: string | null
    onSkip: () => void
}) {
    const { t } = useI18n()
    const [period] = useState(() => getDayPeriod(new Date()))

    return (
        <ShiftOverlayRoot onSkip={onSkip} shakeAt={shutterImpact}>
            <ShiftScene period={period} />

            <ShutterPanel animation={`${shutterDrop} ${dropDuration}ms ${dropDelay}ms both`}>
                <ShutterMessage
                    tone="amber"
                    label={t.shift.signedOut}
                    title={t.shift.farewell[period]}
                    subtitle={username}
                    timeLabel={t.shift.timeAt}
                    time={checkoutTime ?? undefined}
                    delay={messageAt}
                />
            </ShutterPanel>

            <DustBurst at={shutterImpact} />
            <Beacon tone="amber" start={dropDelay} duration={shutterImpact - dropDelay + 250} />

            {/* Walks out in front of the closing shutter */}
            <Worker
                startX="68vw"
                walks={[{ dx: '40vw', start: walkStart, duration: walkDuration }]}
                wave={{ start: 0, duration: waveDuration }}
                gaitCycle={gaitCycle}
            />
        </ShiftOverlayRoot>
    )
}

// =========================================================
// DIALOG
// =========================================================

export function LogoutConfirmDialog({
    open,
    username,
    role,
    onCancel,
    onConfirm,
}: LogoutConfirmDialogProps) {
    const { t } = useI18n()
    const reduceMotion = useMediaQuery(
        '(prefers-reduced-motion: reduce)',
        { noSsr: true },
    )

    const [stopped, setStopped] = useState(false)
    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)
    const [checkoutTime, setCheckoutTime] = useState<string | null>(null)
    const [shutterOn, setShutterOn] = useState(false)

    const stoppedRef = useRef(false)
    const confirmPendingRef = useRef(false)
    const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
    const onConfirmRef = useRef(onConfirm)

    useEffect(() => {
        onConfirmRef.current = onConfirm
    }, [onConfirm])

    useEffect(() => {
        if (!open || confirmPendingRef.current) return

        stoppedRef.current = false
        setStopped(false)
        setHovered(false)
        setFocused(false)
        setCheckoutTime(null)
        setShutterOn(false)
    }, [open])

    // A sign-out that was already confirmed must still happen if we unmount mid-sequence.
    useEffect(() => () => {
        timersRef.current.forEach(clearTimeout)
        timersRef.current = []

        if (confirmPendingRef.current) {
            confirmPendingRef.current = false
            onConfirmRef.current()
        }
    }, [])

    const warn = !stopped && (hovered || focused)

    function handleConfirm() {
        if (stoppedRef.current) return

        stoppedRef.current = true
        setStopped(true)
        setCheckoutTime(formatClock(new Date()))

        if (reduceMotion) {
            onConfirm()
            return
        }

        confirmPendingRef.current = true
        timersRef.current.push(
            setTimeout(() => setShutterOn(true), shutterStartAt),
            setTimeout(() => {
                confirmPendingRef.current = false
                onConfirmRef.current()
            }, confirmAt),
        )
    }

    // Click / Esc on the overlay jumps straight to the sign-out.
    function handleSkip() {
        if (!confirmPendingRef.current) return

        timersRef.current.forEach(clearTimeout)
        timersRef.current = []
        confirmPendingRef.current = false
        onConfirmRef.current()
    }

    return (
        <>
            <Dialog
                open={open}
                onClose={stopped ? undefined : onCancel}
                maxWidth="xs"
                fullWidth
                aria-labelledby="logout-dialog-title"
                aria-describedby="logout-dialog-desc"
                slotProps={{
                    paper: {
                        sx: (theme) => ({
                            overflow: 'hidden',
                            borderRadius: '18px',
                            border: '1px solid',
                            borderColor: theme.palette.mode === 'dark'
                                ? 'rgba(110,195,245,0.16)'
                                : 'rgba(92,146,190,0.16)',
                            backgroundImage: 'none',
                            boxShadow: theme.palette.mode === 'dark'
                                ? '0 24px 60px rgba(0,0,0,0.45)'
                                : '0 24px 60px rgba(30,60,100,0.18)',
                            animation: reduceMotion
                                ? 'none'
                                : `${paperSpring} 420ms cubic-bezier(.34,1.56,.64,1) both`,
                        }),
                    },
                    backdrop: {
                        sx: {
                            backdropFilter: 'blur(4px)',
                            backgroundColor: 'rgba(8,18,32,0.45)',
                        },
                    },
                }}
            >
                <GateScene
                    warn={warn}
                    closing={stopped}
                    reduceMotion={reduceMotion}
                />

                <DialogContent sx={{ pt: 2.5, pb: 1.5, textAlign: 'center' }}>
                    <Typography
                        id="logout-dialog-title"
                        sx={{ fontSize: 18, fontWeight: 800, mb: 0.75 }}
                    >
                        {t.logout.title}
                    </Typography>

                    <Typography
                        id="logout-dialog-desc"
                        sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}
                    >
                        {t.logout.description}
                    </Typography>

                    {/* EMPLOYEE BADGE — clipped at the slot's top edge while sinking */}
                    <Box sx={{ overflow: 'hidden' }}>
                        <Box
                            sx={(theme) => ({
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.25,
                                pl: 2,
                                pr: 1.5,
                                py: 1.1,
                                borderRadius: '12px',
                                textAlign: 'left',
                                bgcolor: theme.palette.mode === 'dark'
                                    ? 'rgba(255,255,255,0.04)'
                                    : 'rgba(37,99,235,0.05)',
                                border: '1px solid',
                                borderColor: 'divider',
                                transformOrigin: '50% 100%',
                                animation: stopped && !reduceMotion
                                    ? `${cardSink} ${shutterStartAt}ms cubic-bezier(.5,0,.75,0) forwards`
                                    : 'none',

                                // Hi-vis stripe of the worker's uniform along the left edge
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    left: 0,
                                    width: 4,
                                    bgcolor: '#fbbf24',
                                },
                            })}
                        >
                            <Avatar
                                sx={{
                                    width: 34,
                                    height: 34,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    bgcolor: '#2563eb',
                                }}
                            >
                                {username.charAt(0).toUpperCase()}
                            </Avatar>

                            <Box sx={{ minWidth: 0 }}>
                                <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
                                    {username}
                                </Typography>
                                {role && (
                                    <Typography
                                        noWrap
                                        sx={{
                                            fontSize: 10.5,
                                            fontWeight: 700,
                                            letterSpacing: '0.08em',
                                            color: 'primary.main',
                                        }}
                                    >
                                        {role}
                                    </Typography>
                                )}
                            </Box>

                            {/* SCANLINE — white sheen vanishes on a light card, so tint it there */}
                            {!reduceMotion && (
                                <Box
                                    aria-hidden
                                    sx={(theme) => ({
                                        position: 'absolute',
                                        top: 0,
                                        bottom: 0,
                                        left: 0,
                                        width: '40%',
                                        pointerEvents: 'none',
                                        backgroundImage: `linear-gradient(90deg, transparent, ${theme.palette.mode === 'dark'
                                            ? 'rgba(255,255,255,0.35)'
                                            : alpha(theme.palette.primary.main, 0.16)}, transparent)`,
                                        animation: `${scanSweep} 900ms ease-in-out 300ms both`,
                                    })}
                                />
                            )}
                        </Box>
                    </Box>

                    <TimeClockSlot
                        active={stopped}
                        checkoutTime={checkoutTime}
                        reduceMotion={reduceMotion}
                    />
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        color="inherit"
                        onClick={onCancel}
                        disabled={stopped}
                        autoFocus
                        sx={{
                            borderRadius: '10px',
                            py: 1,
                            fontWeight: 700,
                            textTransform: 'none',
                            borderColor: 'divider',
                        }}
                    >
                        {t.common.cancel}
                    </Button>

                    {/* Amber "shutter switch" — same amber as the clock-out beacon and rail */}
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleConfirm}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        disabled={stopped}
                        startIcon={<LogoutRounded />}
                        sx={{
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '10px',
                            py: 1,
                            fontWeight: 800,
                            textTransform: 'none',
                            color: '#111827',
                            bgcolor: '#f59e0b',
                            boxShadow: 'none',
                            transition: reduceMotion
                                ? 'none'
                                : 'transform 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
                            '&:hover': {
                                bgcolor: '#fbbf24',
                                boxShadow: '0 6px 16px rgba(245,158,11,0.32)',
                            },

                            // Pressed-switch inset shadow, faded via opacity.
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                borderRadius: 'inherit',
                                pointerEvents: 'none',
                                boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.35)',
                                opacity: 0,
                                transition: reduceMotion ? 'none' : 'opacity 150ms ease',
                            },

                            // Hazard strip along the bottom edge.
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                height: 3,
                                pointerEvents: 'none',
                                backgroundImage: hazardTile,
                                backgroundSize: '8px 8px',
                                opacity: warn ? 1 : 0,
                                transition: reduceMotion ? 'none' : 'opacity 160ms ease',
                                animation: warn && !reduceMotion
                                    ? `${hazardRun} 0.5s linear infinite`
                                    : 'none',
                            },

                            '&:active': {
                                transform: 'scale(0.95)',
                                '&::before': { opacity: 1 },
                            },

                            // Stay latched down instead of MUI's grey disabled look.
                            '&.Mui-disabled': {
                                transform: 'scale(0.95)',
                                color: '#111827',
                                bgcolor: '#d97706',
                                '&::before': { opacity: 1 },
                            },
                        }}
                    >
                        {t.logout.signOut}
                    </Button>
                </DialogActions>
            </Dialog>

            {shutterOn && (
                <ShutterOverlay
                    username={username}
                    checkoutTime={checkoutTime}
                    onSkip={handleSkip}
                />
            )}
        </>
    )
}
