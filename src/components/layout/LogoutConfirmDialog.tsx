import { useEffect, useId, useRef, useState } from 'react'

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

import type { Messages } from '../../i18n/messages/en'
import { useI18n } from '../../i18n/useI18n'

import {
    Beacon,
    DustBurst,
    fadeUp,
    formatClock,
    isNightShift,
    monoFont,
    ShiftOverlayRoot,
    ShiftScene,
    ShutterMessage,
    ShutterPanel,
    shutterDrop,
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

const shutterStartAt = 600

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

const paperSpring = keyframes`
    from { opacity: 0; transform: translateY(12px) scale(0.9); }
    to { opacity: 1; transform: translateY(0) scale(1); }
`

const lampBlink = keyframes`
    0% { opacity: 1; }
    50% { opacity: 0; }
    100% { opacity: 0; }
`

const glowPulse = keyframes`
    0%, 100% { opacity: 0.45; }
    50% { opacity: 0.9; }
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

// Diagonal amber/charcoal tile; softer charcoal in light mode.
function hazardTile(mode: 'light' | 'dark') {
    const dark = mode === 'dark' ? '#111827' : '#374151'
    return `linear-gradient(45deg, ${dark} 25%, #f59e0b 25%, #f59e0b 50%, ${dark} 50%, ${dark} 75%, #f59e0b 75%, #f59e0b)`
}

// =========================================================
// ANDON LIGHT
// =========================================================

type AndonState = 'idle' | 'warn' | 'stop'

type LampMode = 'off' | 'on' | 'blink'

const andonLabelKeys = {
    idle: 'andonRunning',
    warn: 'andonWarning',
    stop: 'andonStopped',
} as const satisfies Record<AndonState, keyof Messages['logout']>

const housingColor = '#2b2f36'

// viewBox 0 0 24 40: lamps sit inside the housing with a 1px gap.
const lampGeometry = { x: 4.5, width: 15, height: 7.5, radius: 4 }
const lampTops = [4, 12.5, 21]

function AndonLight({
    state,
    reduceMotion,
}: {
    state: AndonState
    reduceMotion: boolean
}) {
    const { t } = useI18n()
    const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')

    const lamps: { color: string; deep: string; mode: LampMode }[] = [
        { color: '#ef4444', deep: '#b91c1c', mode: state === 'stop' ? 'on' : 'off' },
        { color: '#f59e0b', deep: '#b45309', mode: state === 'warn' ? 'blink' : 'off' },
        { color: '#22c55e', deep: '#15803d', mode: state === 'idle' ? 'on' : 'off' },
    ]

    return (
        <Box
            role="img"
            aria-label={t.logout[andonLabelKeys[state]]}
            sx={{
                display: 'block',
                width: 24,
                height: 40,

                '& svg': { display: 'block', overflow: 'visible' },
                '& .lamp-lit': {
                    opacity: 0,
                    transition: reduceMotion ? 'none' : 'opacity 150ms ease',
                },
                '& .lamp--on .lamp-lit, & .lamp--blink .lamp-lit': { opacity: 1 },
                '& .lamp-glow': {
                    opacity: 0.7,
                    animation: reduceMotion
                        ? 'none'
                        : `${glowPulse} 1.6s ease-in-out infinite`,
                },
                '& .lamp--blink .lamp-lit': {
                    animation: reduceMotion
                        ? 'none'
                        : `${lampBlink} 0.8s steps(1, end) infinite`,
                },
            }}
        >
            <svg viewBox="0 0 24 40" width="24" height="40" aria-hidden>
                <defs>
                    <filter
                        id={`${uid}-glow`}
                        x="-100%"
                        y="-150%"
                        width="300%"
                        height="400%"
                    >
                        <feGaussianBlur stdDeviation="2.2" />
                    </filter>
                    {lamps.map(({ color, deep }, index) => (
                        <radialGradient
                            key={color}
                            id={`${uid}-lamp-${index}`}
                            cx="35%"
                            cy="30%"
                            r="80%"
                        >
                            <stop offset="0" stopColor="#ffffff" stopOpacity="0.8" />
                            <stop offset="0.3" stopColor={color} />
                            <stop offset="1" stopColor={deep} />
                        </radialGradient>
                    ))}
                </defs>

                {/* CAP + HOUSING */}
                <rect x="7" y="0.5" width="10" height="3" rx="1.5" fill={housingColor} />
                <rect x="3" y="3" width="18" height="26.5" rx="4.5" fill={housingColor} />

                {/* LAMPS */}
                {lamps.map(({ color, mode }, index) => {
                    const lamp = {
                        x: lampGeometry.x,
                        y: lampTops[index],
                        width: lampGeometry.width,
                        height: lampGeometry.height,
                        rx: lampGeometry.radius,
                    }

                    return (
                        <g key={color} className={`lamp lamp--${mode}`}>
                            <rect {...lamp} fill={color} fillOpacity={0.25} />
                            <g className="lamp-lit">
                                <rect
                                    {...lamp}
                                    className="lamp-glow"
                                    fill={color}
                                    filter={`url(#${uid}-glow)`}
                                />
                                <rect {...lamp} fill={`url(#${uid}-lamp-${index})`} />
                            </g>
                        </g>
                    )
                })}

                {/* POLE + BASE */}
                <rect x="10.75" y="29.5" width="2.5" height="6.5" fill={housingColor} />
                <rect x="6" y="36" width="12" height="3" rx="1.5" fill={housingColor} />
            </svg>
        </Box>
    )
}

// =========================================================
// GEAR BACKGROUND
// =========================================================

function buildGearPath(teeth: number, outer: number, inner: number, hole: number) {
    const c = 25
    const step = (Math.PI * 2) / teeth
    const point = (r: number, a: number) =>
        `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`

    let d = ''
    for (let i = 0; i < teeth; i++) {
        const a = i * step
        d += `${i === 0 ? 'M' : 'L'} ${point(inner, a)} `
        d += `L ${point(outer, a + step * 0.18)} L ${point(outer, a + step * 0.42)} `
        d += `L ${point(inner, a + step * 0.6)} `
    }

    return `${d}Z M ${c + hole} ${c} A ${hole} ${hole} 0 1 0 ${c - hole} ${c} A ${hole} ${hole} 0 1 0 ${c + hole} ${c} Z`
}

const gearPath = buildGearPath(12, 23, 19, 7)

// Degrees per second for each Andon state (idle: 1 rev / 8s, warn: 1 rev / 1.5s).
const gearSpeed: Record<AndonState, number> = {
    idle: 360 / 8,
    warn: 360 / 1.5,
    stop: 0,
}

const gearSpinUp = 350
const gearStopDuration = shutterStartAt

// Speed is integrated per frame so changes ramp smoothly instead of
// jumping like a swapped animation-duration would.
function GearBg({
    state,
    reduceMotion,
}: {
    state: AndonState
    reduceMotion: boolean
}) {
    const gearRef = useRef<SVGSVGElement>(null)
    const stateRef = useRef(state)

    useEffect(() => {
        stateRef.current = state
    }, [state])

    useEffect(() => {
        if (reduceMotion) return

        let frame = 0
        let last = performance.now()
        let angle = 0
        let velocity = gearSpeed[stateRef.current]
        let stopStart: number | null = null
        let stopFrom = 0

        const tick = (now: number) => {
            const dt = Math.min(now - last, 64)
            last = now

            if (stateRef.current === 'stop') {
                if (stopStart === null) {
                    stopStart = now
                    stopFrom = velocity
                }

                // Quadratic speed decay → cubic ease-out of the angle.
                const p = Math.min((now - stopStart) / gearStopDuration, 1)
                velocity = stopFrom * (1 - p) ** 2
            } else {
                stopStart = null
                const target = gearSpeed[stateRef.current]
                velocity += (target - velocity) * (1 - Math.exp(-dt / gearSpinUp))
            }

            angle = (angle + (velocity * dt) / 1000) % 360

            if (gearRef.current) {
                gearRef.current.style.transform = `rotate(${angle}deg)`
            }

            frame = requestAnimationFrame(tick)
        }

        frame = requestAnimationFrame(tick)

        return () => cancelAnimationFrame(frame)
    }, [reduceMotion])

    return (
        <Box
            aria-hidden
            sx={(theme) => ({
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 96,
                height: 96,
                mt: '-48px',
                ml: '-48px',
                color: 'text.primary',
                opacity: theme.palette.mode === 'dark' ? 0.12 : 0.08,
                pointerEvents: 'none',
            })}
        >
            <svg
                ref={gearRef}
                viewBox="0 0 50 50"
                width="96"
                height="96"
                style={{
                    display: 'block',
                    overflow: 'visible',
                    transformOrigin: '50% 50%',
                    willChange: reduceMotion ? 'auto' : 'transform',
                }}
            >
                <path
                    d={gearPath}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
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
    onSkip,
}: {
    username: string
    onSkip: () => void
}) {
    const { t } = useI18n()
    const [night] = useState(() => isNightShift(new Date()))

    return (
        <ShiftOverlayRoot onSkip={onSkip} shakeAt={shutterImpact}>
            <ShiftScene night={night} />

            <ShutterPanel animation={`${shutterDrop} ${dropDuration}ms ${dropDelay}ms both`}>
                <ShutterMessage
                    title={t.shift.clockOutTitle}
                    subtitle={username}
                    animation={`${fadeUp} ${messageFade}ms ease-out ${messageAt}ms both`}
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

    const andonState: AndonState = stopped
        ? 'stop'
        : hovered || focused
            ? 'warn'
            : 'idle'

    const warn = andonState === 'warn'

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
                <DialogContent sx={{ pt: 3, pb: 1.5, textAlign: 'center' }}>
                    {/* ICON */}
                    <Box
                        sx={{
                            position: 'relative',
                            mx: 'auto',
                            mb: 1.75,
                            width: 64,
                            height: 64,
                        }}
                    >
                        <GearBg state={andonState} reduceMotion={reduceMotion} />

                        <Box
                            sx={(theme) => ({
                                position: 'relative',
                                width: 1,
                                height: 1,
                                display: 'grid',
                                placeItems: 'center',
                                borderRadius: '18px',
                                bgcolor: alpha(theme.palette.error.main, 0.08),
                                border: '1px solid',
                                borderColor: alpha(
                                    theme.palette.error.main,
                                    theme.palette.mode === 'dark' ? 0.24 : 0.18,
                                ),
                            })}
                        >
                            <AndonLight state={andonState} reduceMotion={reduceMotion} />
                        </Box>
                    </Box>

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

                    {/* CURRENT USER — clipped at the slot's top edge while sinking */}
                    <Box sx={{ overflow: 'hidden' }}>
                        <Box
                            sx={(theme) => ({
                                position: 'relative',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.25,
                                px: 1.5,
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
                            })}
                        >
                            <Avatar
                                sx={{
                                    width: 34,
                                    height: 34,
                                    fontSize: 14,
                                    fontWeight: 800,
                                    bgcolor: 'primary.main',
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

                    <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        onClick={handleConfirm}
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        disabled={stopped}
                        startIcon={<LogoutRounded />}
                        sx={(theme) => ({
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: '10px',
                            py: 1,
                            fontWeight: 700,
                            textTransform: 'none',
                            boxShadow: 'none',
                            transition: reduceMotion ? 'none' : 'transform 150ms ease',
                            '&:hover': { boxShadow: '0 6px 16px rgba(200,40,40,0.25)' },

                            // E-stop inset shadow, faded via opacity.
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                inset: 0,
                                borderRadius: 'inherit',
                                pointerEvents: 'none',
                                boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.45)',
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
                                backgroundImage: hazardTile(theme.palette.mode),
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
                                color: theme.palette.error.contrastText,
                                bgcolor: theme.palette.error.dark,
                                '&::before': { opacity: 1 },
                            },
                        })}
                    >
                        {t.logout.signOut}
                    </Button>
                </DialogActions>
            </Dialog>

            {shutterOn && (
                <ShutterOverlay username={username} onSkip={handleSkip} />
            )}
        </>
    )
}
