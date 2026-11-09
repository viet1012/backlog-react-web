import { useEffect, useRef, type ReactNode } from 'react'

import { Box, Portal, Typography } from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'

import { useI18n } from '../../i18n/useI18n'

import { defaultWorkerCharacter, shade, type WorkerCharacter } from './workerCharacter'

// Shared pieces for the clock-in (login) and clock-out (logout) sequences.

export const monoFont = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'

// Site name printed on the shutters and the home LED board
export const FACTORY_NAME = 'F2 FACTORY'

export function formatClock(date: Date) {
    const hh = String(date.getHours()).padStart(2, '0')
    const mm = String(date.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
}

export type DayPeriod = 'morning' | 'noon' | 'afternoon' | 'night'

export function getDayPeriod(date: Date): DayPeriod {
    const hour = date.getHours()

    if (hour >= 5 && hour < 10) return 'morning'
    if (hour >= 10 && hour < 14) return 'noon'
    if (hour >= 14 && hour < 18) return 'afternoon'
    return 'night'
}

// The full clock-in / clock-out sequence plays on the user's first sign-in /
// sign-out of the day, a short one afterwards. Without storage it is
// always the full one.
export function takeFirstRunToday(kind: 'clock-in' | 'clock-out', username: string) {
    const key = `shiftReplay:${kind}:${username}`
    const today = new Date().toDateString()

    try {
        if (localStorage.getItem(key) === today) return false
        localStorage.setItem(key, today)
    } catch {
        // Full sequence every time
    }

    return true
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

// Badge swipe: the front arm comes up level with the chest, overshoots a
// little, holds the badge out; lowering holds a beat first (the "beep").
const armRaise = keyframes`
    0% { transform: rotate(0deg); }
    70% { transform: rotate(-86deg); }
    100% { transform: rotate(-80deg); }
`

const armLower = keyframes`
    0%, 40% { transform: rotate(-80deg); }
    100% { transform: rotate(0deg); }
`

// Badge stays in hand while the arm holds, gone once it is on the way down
// (also when 'lower' comes without a 'scan' first, e.g. a tap on touch screens)
const badgeHide = keyframes`
    0%, 50% { opacity: 1; }
    100% { opacity: 0; }
`

// Badge taps the reader (along the arm, i.e. forward once it is raised)
const badgeTap = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(1.6px); }
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
    revealAt,
    fadeOutAt,
    hintAt = (revealAt ?? 0) + 600,
    children,
}: {
    onSkip: () => void
    shakeAt?: number
    /**
     * Mount the overlay early but keep it invisible until this time (ms):
     * the mount / first paint cost then lands before the animation starts
     * instead of in the middle of it.
     */
    revealAt?: number
    fadeOutAt?: number
    /** When the "click / Esc to skip" hint shows (ms). */
    hintAt?: number
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
        revealAt !== undefined && `${sceneFade} 200ms ease-out ${revealAt}ms both`,
        shakeAt !== undefined && `${screenShake} 120ms linear ${shakeAt}ms`,
        fadeOutAt !== undefined && `${overlayFadeOut} 300ms ease-in ${fadeOutAt}ms forwards`,
    ].filter(Boolean)

    return (
        <Portal>
            <Box
                role="status"
                aria-live="polite"
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
                    willChange: 'transform, opacity',
                    animation: animations.length ? animations.join(', ') : 'none',
                })}
            >
                {children}

                {/* Skip hint: the click / Esc skip was only a tooltip before */}
                <Box
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        top: 28,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        pointerEvents: 'none',
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1.25,
                            py: 0.5,
                            borderRadius: 999,
                            bgcolor: 'rgba(2,6,23,0.55)',
                            color: 'rgba(226,232,240,0.85)',
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: '0.04em',
                            whiteSpace: 'nowrap',
                            animation: `${fadeUp} 300ms ease-out ${hintAt}ms both`,
                        }}
                    >
                        {t.shift.skip}
                        <Box
                            component="kbd"
                            sx={{
                                px: 0.6,
                                borderRadius: '4px',
                                border: '1px solid rgba(226,232,240,0.35)',
                                fontFamily: monoFont,
                                fontSize: 10.5,
                                lineHeight: '16px',
                            }}
                        >
                            Esc
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Portal>
    )
}

// =========================================================
// SCENE (factory skyline at dusk / night)
// =========================================================

const skylinePath ='M0 160 L0 90 L80 90 L80 60 L120 90 L160 60 L200 90 L240 60 L280 90 L280 100 L340 100 L340 40 L355 40 L355 100 L420 100 L420 70 L520 70 L520 100 L600 100 L600 55 L640 80 L680 55 L720 80 L760 55 L800 80 L800 95 L880 95 L880 30 L894 30 L894 95 L960 95 L960 75 L1080 75 L1080 90 L1200 90 L1200 160 Z'

// orbLeft / orbLift: sun or moon position (lift = height above the skyline).
export const scenePalettes: Record<DayPeriod, {
    sky: string
    orb: string
    orbSize: number
    orbLeft: string
    orbLift: string
    skyline: string
    ground: string
}> = {
    morning: {
        sky: 'linear-gradient(to bottom, #93c5fd 0%, #c7d2fe 38%, #fbcfe8 72%, #fed7aa 100%)',
        orb: '#fff4d6',
        orbSize: 80,
        orbLeft: '18%',
        orbLift: '2vh',
        skyline: '#475569',
        ground: '#57534e',
    },
    noon: {
        sky: 'linear-gradient(to bottom, #0ea5e9 0%, #38bdf8 40%, #bae6fd 85%, #e0f2fe 100%)',
        orb: '#fffbeb',
        orbSize: 72,
        orbLeft: '50%',
        orbLift: '40vh',
        skyline: '#334155',
        ground: '#4b5563',
    },
    afternoon: {
        sky: 'linear-gradient(to bottom, #fde68a 0%, #fdba74 35%, #f97316 72%, #c2410c 100%)',
        orb: '#fff7ed',
        orbSize: 96,
        orbLeft: 'calc(68% + 48px)',
        orbLift: '10px',
        skyline: '#5b2a12',
        ground: '#44403c',
    },
    night: {
        sky: 'linear-gradient(to bottom, #0b1330 0%, #1b2547 55%, #3a3560 100%)',
        orb: '#e2e8f0',
        orbSize: 44,
        orbLeft: 'calc(68% + 22px)',
        orbLift: '30vh',
        skyline: '#0a0f1f',
        ground: '#1f2937',
    },
}

export function ShiftScene({ period }: { period: DayPeriod }) {
    const palette = scenePalettes[period]

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
                    left: palette.orbLeft,
                    bottom: `calc(22vh + ${palette.orbLift})`,
                    transform: 'translateX(-50%)',
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
    badge,
    gaitCycle = 440,
    height = 'clamp(64px, 11vh, 112px)',
    bottom = 14,
    character = defaultWorkerCharacter,
}: {
    startX: string
    walks: WorkerWalk[]
    wave?: { start: number; duration: number; iterations?: number | 'infinite' }
    /**
     * Employee badge in the front hand: 'scan' raises it to a card reader in
     * front of the worker and taps it, 'lower' puts the arm back down.
     * Takes over the wave while set.
     */
    badge?: 'scan' | 'lower'
    gaitCycle?: number
    height?: number | string
    bottom?: number
    /** Same character as the user's avatar (side view). */
    character?: WorkerCharacter
}) {
    const { skin, hat, vest, accessory } = character

    const gait = (name: typeof limbSwing, period: number, easing = 'linear') =>
        walks.length
            ? walks
                .map((walk) => `${name} ${period}ms ${easing} ${walk.start}ms ${walk.duration / period}`)
                .join(', ')
            : 'none'

    // Thin dark outline keeps the small figure crisp on any background.
    const outline = { stroke: 'rgba(15,23,42,0.55)', strokeWidth: 0.6 }
    const shirt = '#1e3a5f'

    // Each moving part is its own HTML layer holding an SVG with the same
    // 40×76 viewBox, stacked. A transform on an SVG <g> repaints the drawing
    // on the main thread every frame (it stutters while React is busy);
    // on an HTML layer the GPU only moves the already drawn part.
    const part = (className: string, children: ReactNode) => (
        <Box className={`worker-layer ${className}`}>
            <svg viewBox="0 0 40 76" shapeRendering="geometricPrecision">{children}</svg>
        </Box>
    )

    const figure = (
        <Box className="worker-layer">
            <svg viewBox="0 0 40 76">
                <ellipse cx="21" cy="73" rx="9" ry="2" fill="rgba(0,0,0,0.28)" />
            </svg>

            <Box className="worker-layer worker-bob">
                {/* BACK LIMBS */}
                {part('worker-arm-back', (
                    <>
                        <rect x="17.5" y="26" width="5" height="16" rx="2.5" fill={shade(shirt, -0.2)} {...outline} />
                        <circle cx="20" cy="43.4" r="2.6" fill="#cbd5e1" {...outline} />
                    </>
                ))}
                {part('worker-leg-back', (
                    <>
                        <rect x="17" y="45" width="6" height="22" rx="3" fill="#1b3354" {...outline} />
                        <rect x="16.5" y="65.6" width="11" height="4.8" rx="2.2" fill="#111827" {...outline} />
                    </>
                ))}
                {part('worker-leg-front', (
                    <>
                        <rect x="17" y="45" width="6" height="22" rx="3" fill="#274b77" {...outline} />
                        <rect x="16.5" y="65.6" width="11" height="4.8" rx="2.2" fill="#1f2937" {...outline} />
                        <rect x="16.5" y="69.2" width="11" height="1.3" rx="0.6" fill="#475569" />
                    </>
                ))}

                <svg viewBox="0 0 40 76" shapeRendering="geometricPrecision">
                    {/* TORSO: work shirt, hi-vis vest with 2 reflective stripes, ID badge, belt */}
                    <rect x="13" y="24" width="14" height="25" rx="6" fill={shirt} {...outline} />
                    <rect x="13" y="25.6" width="14" height="19.4" rx="5.4" fill={vest} {...outline} />
                    <path d="M19 24.4 L21.4 28 L23.8 24.4 Z" fill={shirt} />
                    <rect x="13.3" y="33" width="13.4" height="1.9" fill="#f1f5f9" opacity={0.92} />
                    <rect x="13.3" y="38.4" width="13.4" height="1.9" fill="#f1f5f9" opacity={0.92} />
                    <rect x="22" y="27.6" width="3.4" height="4.2" rx="0.8" fill="#f8fafc" />
                    <rect x="22.4" y="28.2" width="2.6" height="1.1" fill="#2563eb" />
                    <rect x="13" y="44.4" width="14" height="2.6" fill="#0f172a" />
                    <rect x="22.4" y="44.7" width="2.4" height="2" rx="0.4" fill="#94a3b8" />

                    {/* NECK + HEAD (facing right) */}
                    <rect x="19.2" y="20.6" width="4" height="4.4" fill={shade(skin, -0.08)} />
                    {accessory === 'pencil' && (
                        <path d="M15.4 18.6 L18.6 12.4" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" />
                    )}
                    <circle cx="21" cy="16" r="6.6" fill={skin} {...outline} />
                    <circle cx="27.4" cy="16.9" r="1.15" fill={skin} />
                    <path d="M14.4 13.6 Q14 17 15.6 18.6 L17.4 17.4 Q16.4 15.6 16.8 13.6 Z" fill="#3b2a20" />
                    <ellipse cx="19.6" cy="16.9" rx="1.3" ry="1.6" fill={shade(skin, -0.12)} />
                    <ellipse cx="24.5" cy="15.8" rx="0.8" ry="1" fill="#1f2937" />
                    <circle cx="24.75" cy="15.45" r="0.28" fill="#fff" />
                    <circle cx="24.1" cy="18.5" r="1.1" fill="#f87171" opacity={0.3} />
                    <path d="M25.1 19.2 Q26.2 20 27.1 19" stroke="#7c2d12" strokeWidth="0.7" strokeLinecap="round" fill="none" />
                    {accessory === 'earmuffs' && <circle cx="19.6" cy="16.9" r="2.4" fill="#ef4444" {...outline} />}
                    {accessory === 'mustache' && <ellipse cx="26.4" cy="18.3" rx="1.7" ry="0.75" fill="#4b2e1e" />}

                    {/* HARD HAT: dome, ridge, highlight, front-peaked brim */}
                    <path d="M13.5 13.6 A7.5 7.5 0 0 1 28.5 13.6 Z" fill={hat} {...outline} />
                    <rect x="19.6" y="6.3" width="2.8" height="7.3" rx="1.4" fill={shade(hat, -0.12)} />
                    <path d="M15.6 11.6 Q16.6 8.6 19.4 7.4" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity={0.6} />
                    <rect x="12.6" y="12.8" width="19.4" height="1.9" rx="0.95" fill={shade(hat, -0.15)} {...outline} />
                    {accessory === 'goggles' && (
                        <>
                            <rect x="21.5" y="9.4" width="6.5" height="2.4" rx="1.2" fill="#334155" />
                            <circle cx="26.4" cy="10.6" r="0.9" fill="#7dd3fc" />
                        </>
                    )}
                    {accessory === 'headlamp' && (
                        <>
                            <rect x="26" y="9.5" width="3" height="2.6" rx="0.8" fill="#374151" />
                            <circle cx="28.6" cy="10.8" r="0.7" fill="#fef08a" />
                        </>
                    )}
                </svg>

                {/* FRONT ARM (waves / swipes the badge) */}
                <Box className="worker-layer worker-wave">
                    <Box className="worker-layer worker-arm-front">
                        {/* Badge held below the glove (drawn hanging, turns with the arm) */}
                        <Box className="worker-layer worker-badge">
                            <svg viewBox="0 0 40 76" shapeRendering="geometricPrecision">
                                <rect x="16.9" y="44" width="6.2" height="5.2" rx="0.8" fill="#f8fafc" {...outline} />
                                <rect x="16.9" y="44" width="6.2" height="1.4" rx="0.6" fill={vest} />
                                <rect x="17.7" y="46.1" width="1.7" height="2.1" rx="0.3" fill={skin} />
                                <path d="M20.2 46.5 H22.4 M20.2 47.7 H21.8" stroke="#94a3b8" strokeWidth="0.5" />
                            </svg>
                        </Box>
                        <svg viewBox="0 0 40 76" shapeRendering="geometricPrecision">
                            <rect x="17.5" y="26" width="5" height="16" rx="2.5" fill={shade(shirt, 0.12)} {...outline} />
                            <circle cx="20" cy="43.4" r="2.7" fill="#e2e8f0" {...outline} />
                        </svg>
                    </Box>
                </Box>
            </Box>
        </Box>
    )

    const moved = walks.reduceRight<ReactNode>(
        (inner, walk) => (
            <Box
                sx={{
                    '--walk-dx': walk.dx,
                    position: 'absolute',
                    inset: 0,
                    // Layer ready before the walk starts (no promotion hitch)
                    willChange: 'transform',
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
                bottom,
                height,
                aspectRatio: '40 / 76',
                // No will-change here: it freezes the layer's raster scale and the
                // figure turns blurry inside a scaled / moving parent.
                animation: `${sceneFade} 200ms ease-out both`,

                '& .worker-layer': { position: 'absolute', inset: 0 },
                '& svg': {
                    position: 'absolute',
                    inset: 0,
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    overflow: 'visible',
                },
                // Moving parts keep their own GPU layer (rotate / translate only,
                // never scaled, so they stay sharp). Pivots: shoulder (20,27)
                // and hip (20,47) of the 40×76 viewBox, in %.
                '& .worker-bob, & .worker-arm-back, & .worker-arm-front, & .worker-wave, & .worker-leg-back, & .worker-leg-front': {
                    willChange: 'transform',
                },
                '& .worker-bob': { animation: gait(bodyBob, gaitCycle / 2, 'ease-in-out') },
                '& .worker-arm-back, & .worker-arm-front, & .worker-wave': {
                    transformOrigin: '50% 35.53%',
                },
                '& .worker-leg-back, & .worker-leg-front': {
                    transformOrigin: '50% 61.84%',
                },
                '& .worker-wave': {
                    animation: badge === 'scan'
                        ? `${armRaise} 280ms cubic-bezier(.3,.7,.4,1) forwards`
                        : badge === 'lower'
                            ? `${armLower} 380ms ease-in-out forwards`
                            : wave
                                ? `${armWave} ${wave.duration}ms ease-in-out ${wave.start}ms ${wave.iterations ?? 1}`
                                : 'none',
                },
                '& .worker-badge': {
                    willChange: 'transform, opacity',
                    opacity: badge === 'scan' ? 1 : 0,
                    transition: 'opacity 100ms ease',
                    animation: badge === 'scan'
                        ? `${badgeTap} 640ms ease-in-out 300ms infinite`
                        : badge === 'lower'
                            ? `${badgeHide} 380ms linear`
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
// CARD READER
// =========================================================

// Waiting LED, field waves toward the badge, accepted ping
const readerBlink = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.25; }
`

const readerWave = keyframes`
    0% { opacity: 0; transform: translateX(2px); }
    40% { opacity: 1; }
    100% { opacity: 0; transform: translateX(-3px); }
`

const readerPing = keyframes`
    from { opacity: 0.9; transform: scale(0.4); }
    to { opacity: 0; transform: scale(2.6); }
`

const beepPop = keyframes`
    0% { opacity: 0; transform: translateY(5px) scale(0.6); }
    30% { opacity: 1; transform: translateY(-2px) scale(1.06); }
    45% { transform: translateY(0) scale(1); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
`

export type ReaderState = 'idle' | 'scan' | 'ok'

const readerTones: Record<ReaderState, { led: string; screen: string; icon: string; glow: string }> = {
    idle: { led: '#475569', screen: '#0f172a', icon: '#64748b', glow: 'transparent' },
    scan: { led: '#f59e0b', screen: '#2a1d05', icon: '#fbbf24', glow: 'rgba(245,158,11,0.8)' },
    ok: { led: '#22c55e', screen: '#052e16', icon: '#4ade80', glow: 'rgba(34,197,94,0.85)' },
}

// Drawn in reader units: 18 × 62, sized for a 64px-tall worker (1 unit = 1px).
// The scan face (y 23) is where that worker's raised badge ends up when the
// reader stands 36 units in front of them, on the same ground line.
const readerHeight = 62
const readerScanY = 23

// Card reader post. Idle: dim. Scan: amber LED blinks, contactless waves
// run toward the badge. OK: green check, ping rings and a "Beep!" tag.
// Moving parts are HTML layers (GPU only). `unit` scales it with the worker
// (e.g. 'clamp(1px, 11vh / 64, 1.75px)' next to a clamp(64px, 11vh, 112px) one).
export function CardReader({
    state,
    animate,
    left,
    bottom,
    unit = '1px',
}: {
    state: ReaderState
    animate: boolean
    left: number | string
    bottom: number | string
    unit?: string
}) {
    const { t } = useI18n()
    const tone = readerTones[state]
    const screen = { left: 3.2, top: 15, width: 11.6, height: 10 }
    const u = (value: number) => `calc(var(--reader-unit) * ${value})`
    const box = (rect: { left: number; top: number; width: number; height: number }) => ({
        left: u(rect.left),
        top: u(rect.top),
        width: u(rect.width),
        height: u(rect.height),
    })
    const iconSize = { width: u(9), height: u(7.5) }

    return (
        <Box
            aria-hidden
            sx={{
                '--reader-unit': unit,
                position: 'absolute',
                left,
                bottom,
                width: u(18),
                height: u(readerHeight),

                '& svg': { display: 'block', overflow: 'visible' },
                '& .reader-layer': { position: 'absolute' },
            }}
        >
            <svg viewBox={`0 0 18 ${readerHeight}`} width="100%" height="100%" shapeRendering="geometricPrecision">
                <ellipse cx={9} cy={61.4} rx={8.5} ry={1.4} fill="rgba(0,0,0,0.3)" />

                {/* Post with a hazard band, on a base plate */}
                <rect x={6.5} y={30} width={5} height={30} fill="#475569" stroke="#0f172a" strokeWidth={0.6} />
                <rect x={7.2} y={30} width={1} height={30} fill="#94a3b8" opacity={0.55} />
                <rect x={6.5} y={44} width={5} height={5} fill="#f59e0b" />
                <path d="M6.5 46.5 L9 44 M6.5 49 L11.5 44 M9 49 L11.5 46.5" stroke="#111827" strokeWidth={1.1} />
                <rect x={3} y={59} width={12} height={2.6} rx={1} fill="#334155" stroke="#0f172a" strokeWidth={0.6} />

                {/* Head: housing, top highlight, screen, card slot */}
                <rect x={1} y={10} width={16} height={21} rx={3} fill="#1f2937" stroke="#0f172a" strokeWidth={0.6} />
                <rect x={2} y={10.8} width={14} height={1.8} rx={0.9} fill="#374151" />
                <rect
                    x={screen.left}
                    y={screen.top}
                    width={screen.width}
                    height={screen.height}
                    rx={1.4}
                    fill={tone.screen}
                    stroke="#0b1220"
                    strokeWidth={0.5}
                    style={{ transition: animate ? 'fill 160ms ease' : 'none' }}
                />
                <path d="M5 28 H13" stroke="#0b1220" strokeWidth={1.2} strokeLinecap="round" />
            </svg>

            {/* LED bar on top */}
            <Box
                className="reader-layer"
                sx={{
                    ...box({ left: 3, top: 7.4, width: 12, height: 2.2 }),
                    borderRadius: u(2),
                    bgcolor: tone.led,
                    boxShadow: state === 'idle' ? 'none' : `0 0 6px 1px ${tone.glow}`,
                    animation: state === 'scan' && animate ? `${readerBlink} 0.5s steps(1, end) infinite` : 'none',
                }}
            />

            {/* Screen icon: contactless symbol, or a check once accepted */}
            <Box
                className="reader-layer"
                sx={{
                    ...box(screen),
                    display: 'grid',
                    placeItems: 'center',
                    animation: state === 'scan' && animate ? `${readerBlink} 1s ease-in-out infinite` : 'none',
                }}
            >
                {state === 'ok' ? (
                    <svg viewBox="0 0 12 10" style={iconSize}>
                        <path d="M2.4 5.2 L5 7.6 L9.6 2.4" fill="none" stroke={tone.icon} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
                    <svg viewBox="0 0 12 10" style={iconSize}>
                        <path
                            d="M3 3.4 Q4.2 5 3 6.6 M5.4 2.2 Q7.3 5 5.4 7.8 M7.8 1 Q10.4 5 7.8 9"
                            fill="none"
                            stroke={tone.icon}
                            strokeWidth={0.9}
                            strokeLinecap="round"
                        />
                    </svg>
                )}
            </Box>

            {/* Field waves running from the reader to the badge */}
            {state === 'scan' && animate && [0, 0.18].map((delay) => (
                <Box
                    key={delay}
                    className="reader-layer"
                    sx={{
                        ...box({ left: -6, top: readerScanY - 5, width: 6, height: 10 }),
                        opacity: 0,
                        willChange: 'transform, opacity',
                        animation: `${readerWave} 0.72s ease-out ${delay}s infinite`,
                    }}
                >
                    <svg viewBox="0 0 6 10" width="100%" height="100%">
                        <path d="M4.6 2 Q2.6 5 4.6 8" fill="none" stroke="#fbbf24" strokeWidth={1} strokeLinecap="round" />
                    </svg>
                </Box>
            ))}

            {/* Accepted: two ping rings from the screen and a "Beep!" tag */}
            {state === 'ok' && animate && [0, 0.14].map((delay) => (
                <Box
                    key={delay}
                    className="reader-layer"
                    sx={{
                        ...box({ left: 9 - 7, top: screen.top + screen.height / 2 - 7, width: 14, height: 14 }),
                        borderRadius: '50%',
                        border: `${u(1.5)} solid ${tone.icon}`,
                        opacity: 0,
                        animation: `${readerPing} 520ms ease-out ${delay}s forwards`,
                    }}
                />
            ))}
            {state === 'ok' && (
                <Box className="reader-layer" sx={{ left: '50%', bottom: u(readerHeight + 4), transform: 'translateX(-50%)' }}>
                    <Box
                        sx={{
                            px: u(4.8),
                            borderRadius: u(6),
                            bgcolor: '#22c55e',
                            color: '#052e16',
                            fontFamily: monoFont,
                            fontSize: u(10),
                            fontWeight: 700,
                            lineHeight: u(15),
                            whiteSpace: 'nowrap',
                            boxShadow: '0 0 10px rgba(34,197,94,0.6)',
                            animation: animate ? `${beepPop} 420ms ease-out both` : 'none',
                        }}
                    >
                        {t.logout.beep}
                    </Box>
                </Box>
            )}
        </Box>
    )
}

// =========================================================
// STEEL SHUTTER
// =========================================================

export function ShutterPanel({
    animation,
    railHeight = 22,
    children,
}: {
    animation: string
    railHeight?: number
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
                        height: railHeight,
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

// Signboard bolted to the shutter: it swings in from its top edge,
// then the label is stamped, then the greeting and time card follow.
const signSwing = keyframes`
    0% { opacity: 0; transform: translateY(-18px) rotate(-7deg); }
    35% { opacity: 1; transform: translateY(0) rotate(4deg); }
    60% { transform: rotate(-2deg); }
    80% { transform: rotate(1deg); }
    100% { opacity: 1; transform: rotate(0deg); }
`

const labelStamp = keyframes`
    0% { opacity: 0; transform: scale(1.7); }
    70% { opacity: 1; transform: scale(0.94); }
    100% { opacity: 1; transform: scale(1); }
`

const lampPulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
`

const signTones = {
    green: { main: '#22c55e', glow: 'rgba(34,197,94,0.55)' },
    amber: { main: '#f59e0b', glow: 'rgba(245,158,11,0.55)' },
} as const

export function ShutterMessage({
    tone,
    label,
    title,
    subtitle,
    timeLabel,
    time,
    delay,
}: {
    tone: keyof typeof signTones
    label: string
    title: string
    subtitle: string
    timeLabel?: string
    time?: string
    delay: number
}) {
    const color = signTones[tone]
    const rivet = 'radial-gradient(circle, #cbd5e1 0 2px, #64748b 2.5px, transparent 3.5px)'

    return (
        <Box
            sx={{
                position: 'relative',
                mx: 2,
                px: { xs: 3, sm: 5 },
                pt: 2.5,
                pb: 2.25,
                minWidth: { sm: 420 },
                textAlign: 'center',
                color: '#f8fafc',
                bgcolor: '#0f172a',
                border: '3px solid',
                borderColor: color.main,
                borderRadius: 2,
                backgroundImage: [rivet, rivet, rivet, rivet].join(', '),
                backgroundPosition: '8px 8px, calc(100% - 8px) 8px, 8px calc(100% - 8px), calc(100% - 8px) calc(100% - 8px)',
                backgroundSize: '8px 8px',
                backgroundRepeat: 'no-repeat',
                boxShadow: `0 14px 30px rgba(0,0,0,0.45), 0 0 26px ${color.glow}, inset 0 0 0 2px rgba(255,255,255,0.06)`,
                transformOrigin: '50% -40px',
                animation: `${signSwing} 900ms ease-out ${delay}ms both`,
                '@media (prefers-reduced-motion: reduce)': {
                    '&, & *': { animation: 'none !important' },
                },
            }}
        >
            {/* Hanging brackets up to the shutter slats */}
            {['18%', '82%'].map((left) => (
                <Box
                    key={left}
                    aria-hidden
                    sx={{
                        position: 'absolute',
                        left,
                        top: -22,
                        width: 4,
                        height: 22,
                        bgcolor: '#475569',
                        borderRadius: 1,
                    }}
                />
            ))}

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    animation: `${labelStamp} 380ms cubic-bezier(.3,1.6,.5,1) ${delay + 220}ms both`,
                }}
            >
                <Box
                    aria-hidden
                    sx={{
                        width: 14,
                        height: 14,
                        flexShrink: 0,
                        borderRadius: '50%',
                        bgcolor: color.main,
                        boxShadow: `0 0 12px ${color.main}`,
                        animation: `${lampPulse} 700ms ease-in-out ${delay + 600}ms infinite`,
                    }}
                />
                <Typography
                    component="p"
                    sx={{
                        fontSize: 'clamp(30px, 5vw, 58px)',
                        fontWeight: 900,
                        letterSpacing: '0.22em',
                        lineHeight: 1.1,
                        mr: '-0.22em',
                        color: color.main,
                        textShadow: `0 0 18px ${color.glow}`,
                    }}
                >
                    {label}
                </Typography>
            </Box>

            <Box
                aria-hidden
                sx={{
                    my: 1.5,
                    height: 0,
                    borderTop: '2px dashed',
                    borderColor: alpha(color.main, 0.45),
                }}
            />

            <Typography
                sx={{
                    fontSize: 'clamp(15px, 1.9vw, 22px)',
                    fontWeight: 800,
                    letterSpacing: '0.22em',
                    animation: `${fadeUp} 320ms ease-out ${delay + 420}ms both`,
                }}
            >
                {title}
            </Typography>

            <Box
                sx={{
                    mt: 1.5,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.5,
                    animation: `${fadeUp} 320ms ease-out ${delay + 540}ms both`,
                }}
            >
                <Typography
                    sx={{
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '0.16em',
                        color: '#cbd5e1',
                    }}
                >
                    {subtitle}
                </Typography>

                {time && (
                    <Box
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.25,
                            py: 0.25,
                            borderRadius: 1,
                            bgcolor: '#020617',
                            border: '1px solid',
                            borderColor: alpha(color.main, 0.5),
                            fontFamily: monoFont,
                        }}
                    >
                        {timeLabel && (
                            <Typography
                                component="span"
                                sx={{
                                    fontFamily: 'inherit',
                                    fontSize: 11,
                                    letterSpacing: '0.12em',
                                    color: '#94a3b8',
                                }}
                            >
                                {timeLabel}
                            </Typography>
                        )}
                        <Typography
                            component="span"
                            sx={{
                                fontFamily: 'inherit',
                                fontSize: 18,
                                fontWeight: 700,
                                letterSpacing: '0.12em',
                                color: color.main,
                                textShadow: `0 0 8px ${color.glow}`,
                            }}
                        >
                            {time}
                        </Typography>
                    </Box>
                )}
            </Box>
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
                        // Layers made at mount, not all at once when the burst starts
                        willChange: 'transform, opacity',
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
    beam = 420,
}: {
    tone: keyof typeof beaconTones
    start: number
    duration: number
    /** Diameter of the sweeping light; keep it small in small scenes. */
    beam?: number
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
                    width: beam,
                    height: beam,
                    mt: `${-beam / 2}px`,
                    ml: `${-beam / 2}px`,
                    borderRadius: '50%',
                    background: `conic-gradient(from 0deg, rgba(${rgb},0.55), rgba(${rgb},0) 55deg, transparent 180deg, rgba(${rgb},0.55) 180deg, rgba(${rgb},0) 235deg, transparent 360deg)`,
                    WebkitMaskImage: 'radial-gradient(circle, #000 0, #000 15%, transparent 70%)',
                    maskImage: 'radial-gradient(circle, #000 0, #000 15%, transparent 70%)',
                    // Own layer: drawn once, then only rotated by the GPU
                    willChange: 'transform',
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
                        willChange: 'transform',
                        animation: `${beaconSpin} 0.9s linear infinite`,
                    },
                }}
            />
        </Box>
    )
}
