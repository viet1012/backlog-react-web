import { useEffect, useRef, type ReactNode } from 'react'

import { Box, Portal, Typography } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'

import { useI18n } from '../../i18n/useI18n'

// Shared pieces for the clock-in (login) and clock-out (logout) sequences.

export const monoFont = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'

export function formatClock(date: Date) {
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
}

export function isNightShift(date: Date) {
    const hour = date.getHours()
    return hour >= 18 || hour < 6
}

// =========================================================
// KEYFRAMES (transform / opacity only)
// =========================================================

export const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
`

export const sceneFade = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`

const overlayFadeOut = keyframes`
    from { opacity: 1; }
    to { opacity: 0; }
`

export const shutterDrop = keyframes`
    0% { transform: translateY(-100%); animation-timing-function: cubic-bezier(.7,0,.3,1); }
    80% { transform: translateY(0); animation-timing-function: ease-out; }
    90% { transform: translateY(-6px); animation-timing-function: ease-in; }
    100% { transform: translateY(0); }
`

// Mirror of the drop: a small unlatch dip, then the roll up.
export const shutterRise = keyframes`
    0% { transform: translateY(0); animation-timing-function: ease-out; }
    10% { transform: translateY(6px); animation-timing-function: cubic-bezier(.7,0,.3,1); }
    100% { transform: translateY(-100%); }
`

// Only shifts right/down: the overlay overhangs the viewport on those sides.
const screenShake = keyframes`
    0% { transform: translate(0, 0); }
    20% { transform: translate(-4px, 3px); }
    40% { transform: translate(4px, 1px); }
    60% { transform: translate(-3px, 2px); }
    80% { transform: translate(2px, 1px); }
    100% { transform: translate(0, 0); }
`

const dustBurst = keyframes`
    0% { opacity: 0.9; transform: translate(0, 0) scale(1); }
    100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.4); }
`

const beaconSpin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`

const beaconLife = keyframes`
    0% { opacity: 0; }
    8% { opacity: 1; }
    75% { opacity: 1; }
    100% { opacity: 0; }
`

const armWave = keyframes`
    0% { transform: rotate(0deg); }
    25% { transform: rotate(-150deg); }
    50% { transform: rotate(-115deg); }
    75% { transform: rotate(-150deg); }
    100% { transform: rotate(0deg); }
`

const limbSwing = keyframes`
    0% { transform: rotate(0deg); }
    25% { transform: rotate(26deg); }
    75% { transform: rotate(-26deg); }
    100% { transform: rotate(0deg); }
`

const limbSwingAlt = keyframes`
    0% { transform: rotate(0deg); }
    25% { transform: rotate(-26deg); }
    75% { transform: rotate(26deg); }
    100% { transform: rotate(0deg); }
`

const bodyBob = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-1.5px); }
`

const walkStep = keyframes`
    from { transform: translateX(0); }
    to { transform: translateX(var(--walk-dx)); }
`

// =========================================================
// OVERLAY ROOT
// =========================================================

export function ShiftOverlayRoot({
    onSkip,
    shakeAt,
    fadeIn = false,
    fadeOutAt,
    children,
}: {
    onSkip: () => void
    shakeAt?: number
    fadeIn?: boolean
    fadeOutAt?: number
    children: ReactNode
}) {
    const { t } = useI18n()
    const onSkipRef = useRef(onSkip)

    useEffect(() => {
        onSkipRef.current = onSkip
    }, [onSkip])

    useEffect(() => {
        const handleKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onSkipRef.current()
        }

        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [])

    const animations = [
        fadeIn && `${sceneFade} 280ms ease-out both`,
        shakeAt !== undefined && `${screenShake} 120ms linear ${shakeAt}ms`,
        fadeOutAt !== undefined && `${overlayFadeOut} 300ms ease-in ${fadeOutAt}ms forwards`,
    ].filter(Boolean)

    return (
        <Portal>
            <Box
                role="status"
                aria-live="polite"
                title={t.shift.skip}
                onClick={onSkip}
                sx={(theme) => ({
                    position: 'fixed',
                    // Overhang top/left/right so the shake never reveals the page.
                    top: -12,
                    left: -12,
                    right: -12,
                    bottom: 0,
                    zIndex: theme.zIndex.modal + 1,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    animation: animations.length ? animations.join(', ') : 'none',
                })}
            >
                {children}
            </Box>
        </Portal>
    )
}

// =========================================================
// SCENE (factory skyline at dusk / night)
// =========================================================

const skylinePath = 'M0 160 L0 90 L80 90 L80 60 L120 90 L160 60 L200 90 L240 60 L280 90 L280 100 L340 100 L340 40 L355 40 L355 100 L420 100 L420 70 L520 70 L520 100 L600 100 L600 55 L640 80 L680 55 L720 80 L760 55 L800 80 L800 95 L880 95 L880 30 L894 30 L894 95 L960 95 L960 75 L1080 75 L1080 90 L1200 90 L1200 160 Z'

const scenePalettes = {
    dusk: {
        sky: 'linear-gradient(to bottom, #fde68a 0%, #fdba74 35%, #f97316 72%, #c2410c 100%)',
        orb: '#fff7ed',
        orbSize: 96,
        skyline: '#5b2a12',
        ground: '#44403c',
    },
    night: {
        sky: 'linear-gradient(to bottom, #0b1330 0%, #1b2547 55%, #3a3560 100%)',
        orb: '#e2e8f0',
        orbSize: 44,
        skyline: '#0a0f1f',
        ground: '#1f2937',
    },
}

export function ShiftScene({ night }: { night: boolean }) {
    const palette = night ? scenePalettes.night : scenePalettes.dusk

    return (
        <Box
            aria-hidden
            sx={{
                position: 'absolute',
                inset: 0,
                background: palette.sky,
                animation: `${sceneFade} 250ms ease-out both`,
            }}
        >
            {/* SUN / MOON */}
            <Box
                sx={{
                    position: 'absolute',
                    left: '68%',
                    bottom: 'calc(22vh + 10px)',
                    width: palette.orbSize,
                    height: palette.orbSize,
                    borderRadius: '50%',
                    bgcolor: palette.orb,
                    boxShadow: `0 0 60px ${alpha(palette.orb, 0.6)}`,
                }}
            />

            {/* FACTORY SKYLINE */}
            <svg
                viewBox="0 0 1200 160"
                preserveAspectRatio="none"
                style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 24,
                    width: '100%',
                    height: '22vh',
                    display: 'block',
                }}
            >
                <path d={skylinePath} fill={palette.skyline} />
            </svg>

            {/* GROUND + LANE MARKING */}
            <Box
                sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 24,
                    bgcolor: palette.ground,
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 10,
                        height: 2,
                        backgroundImage: 'repeating-linear-gradient(90deg, rgba(250,204,21,0.7) 0 24px, transparent 24px 48px)',
                    },
                }}
            />
        </Box>
    )
}

// =========================================================
// WORKER
// =========================================================

export interface WorkerWalk {
    /** Distance covered by this segment, e.g. '40vw'. */
    dx: string
    start: number
    duration: number
}

// Side view, facing right. viewBox 0 0 40 76; limbs pivot at shoulder (20,27) and hip (20,47).
// Each walk segment gets its own nested wrapper so the translations add up,
// and the gait only runs while a segment is active (use multiples of gaitCycle
// so the limbs come to rest straight).
export function Worker({
    startX,
    walks,
    wave,
    gaitCycle = 440,
}: {
    startX: string
    walks: WorkerWalk[]
    wave?: { start: number; duration: number }
    gaitCycle?: number
}) {
    const gait = (name: typeof limbSwing, period: number, easing = 'linear') =>
        walks.length
            ? walks
                .map((walk) => `${name} ${period}ms ${easing} ${walk.start}ms ${walk.duration / period}`)
                .join(', ')
            : 'none'

    const figure = (
        <svg viewBox="0 0 40 76">
            <ellipse cx="21" cy="73" rx="9" ry="2" fill="rgba(0,0,0,0.28)" />

            <g className="worker-bob">
                <g className="worker-arm-back">
                    <rect x="17.5" y="26" width="5" height="19" rx="2.5" fill="#1d4ed8" />
                </g>
                <g className="worker-leg-back">
                    <rect x="17" y="45" width="6" height="24" rx="3" fill="#1e3a5f" />
                    <rect x="17" y="67" width="10" height="4" rx="2" fill="#111827" />
                </g>
                <g className="worker-leg-front">
                    <rect x="17" y="45" width="6" height="24" rx="3" fill="#274b77" />
                    <rect x="17" y="67" width="10" height="4" rx="2" fill="#1f2937" />
                </g>

                {/* TORSO: uniform, hi-vis stripe, badge */}
                <rect x="13" y="24" width="14" height="25" rx="6" fill="#2563eb" />
                <rect x="13" y="35" width="14" height="2.5" fill="#fbbf24" />
                <rect x="21" y="27.5" width="4" height="5" rx="1" fill="#f8fafc" />

                {/* HEAD + HARD HAT */}
                <circle cx="21" cy="16" r="6.5" fill="#f0c39a" />
                <path d="M 13.5 15 A 7.5 7.5 0 0 1 28.5 15 Z" fill="#facc15" />
                <rect x="12.5" y="14" width="19" height="2" rx="1" fill="#eab308" />

                <g className="worker-wave">
                    <g className="worker-arm-front">
                        <rect x="17.5" y="26" width="5" height="19" rx="2.5" fill="#3b82f6" />
                        <circle cx="20" cy="45" r="2.6" fill="#f0c39a" />
                    </g>
                </g>
            </g>
        </svg>
    )

    const moved = walks.reduceRight<ReactNode>(
        (inner, walk) => (
            <Box
                sx={{
                    '--walk-dx': walk.dx,
                    position: 'absolute',
                    inset: 0,
                    animation: `${walkStep} ${walk.duration}ms linear ${walk.start}ms forwards`,
                }}
            >
                {inner}
            </Box>
        ),
        figure,
    )

    return (
        <Box
            aria-hidden
            sx={{
                position: 'absolute',
                left: startX,
                bottom: 14,
                height: 'clamp(64px, 11vh, 112px)',
                aspectRatio: '40 / 76',
                willChange: 'transform',
                animation: `${sceneFade} 200ms ease-out both`,

                '& svg': { display: 'block', width: '100%', height: '100%', overflow: 'visible' },
                '& .worker-bob': { animation: gait(bodyBob, gaitCycle / 2, 'ease-in-out') },
                '& .worker-arm-back, & .worker-arm-front, & .worker-wave': {
                    transformOrigin: '20px 27px',
                },
                '& .worker-leg-back, & .worker-leg-front': {
                    transformOrigin: '20px 47px',
                },
                '& .worker-wave': {
                    animation: wave
                        ? `${armWave} ${wave.duration}ms ease-in-out ${wave.start}ms`
                        : 'none',
                },
                '& .worker-arm-back': { animation: gait(limbSwing, gaitCycle) },
                '& .worker-arm-front': { animation: gait(limbSwingAlt, gaitCycle) },
                '& .worker-leg-back': { animation: gait(limbSwingAlt, gaitCycle) },
                '& .worker-leg-front': { animation: gait(limbSwing, gaitCycle) },
            }}
        >
            {moved}
        </Box>
    )
}

// =========================================================
// STEEL SHUTTER
// =========================================================

export function ShutterPanel({
    animation,
    children,
}: {
    animation: string
    children?: ReactNode
}) {
    return (
        <Box
            sx={(theme) => {
                const isDark = theme.palette.mode === 'dark'
                const highlight = isDark ? '#6b7480' : '#e2e6ea'
                const body = isDark ? '#4b5360' : '#bfc6ce'
                const shade = isDark ? '#2a3038' : '#98a1ab'
                const groove = isDark ? '#181c21' : '#7b848e'

                return {
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: body,
                    backgroundImage: [
                        'linear-gradient(to right, rgba(0,0,0,0.20), transparent 12%, transparent 88%, rgba(0,0,0,0.20))',
                        'linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(0,0,0,0.20))',
                        `repeating-linear-gradient(to bottom, ${highlight} 0px, ${body} 6px, ${shade} 18px, ${groove} 20px, ${groove} 22px)`,
                    ].join(', '),
                    boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
                    willChange: 'transform',
                    animation,

                    // Bottom rail
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 22,
                        backgroundImage: `repeating-linear-gradient(-45deg, #f59e0b 0 14px, ${isDark ? '#111827' : '#374151'} 14px 28px)`,
                        borderTop: '3px solid',
                        borderColor: isDark ? '#0b0f14' : '#4b535d',
                        boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.3)',
                    },
                }
            }}
        >
            {children}
        </Box>
    )
}

export function ShutterMessage({
    title,
    subtitle,
    detail,
    animation,
}: {
    title: string
    subtitle: string
    detail?: string
    animation: string
}) {
    return (
        <Box
            sx={(theme) => ({
                px: 2,
                textAlign: 'center',
                color: theme.palette.mode === 'dark' ? '#e5e7eb' : '#1f2937',
                textShadow: theme.palette.mode === 'dark'
                    ? '0 1px 0 rgba(0,0,0,0.7)'
                    : '0 1px 0 rgba(255,255,255,0.6)',
                animation,
            })}
        >
            <Typography
                component="p"
                sx={{
                    fontSize: 'clamp(24px, 4.2vw, 46px)',
                    fontWeight: 900,
                    letterSpacing: '0.28em',
                    lineHeight: 1.2,
                }}
            >
                {title}
            </Typography>
            <Typography
                sx={{
                    mt: 1,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: '0.16em',
                    opacity: 0.8,
                }}
            >
                {subtitle}
            </Typography>
            {detail && (
                <Typography
                    sx={{
                        mt: 0.75,
                        fontFamily: monoFont,
                        fontSize: 13,
                        letterSpacing: '0.1em',
                        opacity: 0.75,
                    }}
                >
                    {detail}
                </Typography>
            )}
        </Box>
    )
}

// =========================================================
// DUST + BEACON
// =========================================================

const dustParticles = [
    { left: 5, dx: -14, dy: -34, size: 4, delay: 0 },
    { left: 13, dx: 10, dy: -22, size: 3, delay: 20 },
    { left: 22, dx: -8, dy: -40, size: 5, delay: 10 },
    { left: 31, dx: 16, dy: -28, size: 3, delay: 30 },
    { left: 41, dx: -12, dy: -46, size: 4, delay: 5 },
    { left: 50, dx: 6, dy: -30, size: 5, delay: 25 },
    { left: 59, dx: -16, dy: -24, size: 3, delay: 15 },
    { left: 68, dx: 12, dy: -42, size: 4, delay: 0 },
    { left: 77, dx: -6, dy: -32, size: 5, delay: 35 },
    { left: 86, dx: 14, dy: -26, size: 3, delay: 10 },
    { left: 95, dx: 18, dy: -36, size: 4, delay: 20 },
]

export function DustBurst({ at }: { at: number }) {
    return (
        <>
            {dustParticles.map((particle) => (
                <Box
                    key={particle.left}
                    aria-hidden
                    sx={(theme) => ({
                        '--dx': `${particle.dx}px`,
                        '--dy': `${particle.dy}px`,
                        position: 'absolute',
                        bottom: 18,
                        left: `${particle.left}%`,
                        width: particle.size,
                        height: particle.size,
                        borderRadius: '50%',
                        bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(203,213,225,0.85)'
                            : 'rgba(75,85,99,0.75)',
                        opacity: 0,
                        animation: `${dustBurst} 800ms cubic-bezier(.2,.7,.3,1) ${at + particle.delay}ms forwards`,
                    })}
                />
            ))}
        </>
    )
}

const beaconTones = {
    amber: { rgb: '251,191,36', lamp: '#f59e0b' },
    green: { rgb: '74,222,128', lamp: '#22c55e' },
}

export function Beacon({
    tone,
    start,
    duration,
}: {
    tone: keyof typeof beaconTones
    start: number
    duration: number
}) {
    const { rgb, lamp } = beaconTones[tone]

    return (
        <Box
            aria-hidden
            sx={{
                position: 'absolute',
                top: 32,
                right: 32,
                width: 26,
                height: 26,
                opacity: 0,
                animation: `${beaconLife} ${duration}ms ease ${start}ms forwards`,
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 420,
                    height: 420,
                    mt: '-210px',
                    ml: '-210px',
                    borderRadius: '50%',
                    background: `conic-gradient(from 0deg, rgba(${rgb},0.55), rgba(${rgb},0) 55deg, transparent 180deg, rgba(${rgb},0.55) 180deg, rgba(${rgb},0) 235deg, transparent 360deg)`,
                    WebkitMaskImage: 'radial-gradient(circle, #000 0, #000 15%, transparent 70%)',
                    maskImage: 'radial-gradient(circle, #000 0, #000 15%, transparent 70%)',
                    animation: `${beaconSpin} 0.9s linear infinite`,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    bgcolor: lamp,
                    boxShadow: `0 0 18px rgba(${rgb},0.9), inset 0 -3px 5px rgba(0,0,0,0.3)`,
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        background: 'conic-gradient(from 0deg, rgba(255,255,255,0.85), transparent 90deg, transparent 360deg)',
                        animation: `${beaconSpin} 0.9s linear infinite`,
                    },
                }}
            />
        </Box>
    )
}
