import { memo, useEffect, useMemo, useRef, useState } from 'react'

import {
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

import factoryDay from '../../assets/logout-scene-day.webp'
import factoryNight from '../../assets/logout-scene-night.webp'
import { useI18n } from '../../i18n/useI18n'

import {
    Beacon,
    DustBurst,
    formatClock,
    getDayPeriod,
    monoFont,
    type DayPeriod,
    ShiftOverlayRoot,
    ShiftScene,
    ShutterMessage,
    ShutterPanel,
    shutterDrop,
    Worker,
} from '../shift/shiftParts'
import { buildWorkerCharacter, readAvatarSeed, type WorkerCharacter } from '../shift/workerCharacter'

import { FactoryAvatar } from './FactoryAvatar'

interface LogoutConfirmDialogProps {
    open: boolean
    username: string
    role?: string
    /** Seed of the user's character; defaults to the stored one. */
    avatarSeed?: string
    onCancel: () => void
    onConfirm: () => void
}

// =========================================================
// TIMELINE (ms from the Sign out click)
// =========================================================

// The gate in the dialog header closes first, then the full-screen
// clock-out sequence takes over.
const shutterStartAt = 600
// The full-screen overlay is mounted (invisible) shortly after the click,
// once the click feedback has painted, and revealed at shutterStartAt.
const overlayMountAt = 80

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
const gateHeight = 180
const gateRail = 10

// Slide + fade only: scaling the paper would rasterize its content at
// 90% and leave the character / text slightly blurry.
const paperSpring = keyframes`
    from { opacity: 0; transform: translateY(16px); }
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

// Slow drone pan across the factory photo. Translation only: scaling a
// GPU layer stretches the bitmap and makes the photo look blurry.
const dronePan = keyframes`
    from { transform: translateX(-3%); }
    to { transform: translateX(3%); }
`

const cloudDrift = keyframes`
    from { transform: translateX(-120px); }
    to { transform: translateX(560px); }
`

const laneScroll = keyframes`
    from { transform: translateX(0); }
    to { transform: translateX(28px); }
`

const lampBlink = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.2; }
`

// Sun / moon glow breathing in a corner of the photo.
const glowPulse = keyframes`
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 0.95; transform: scale(1.12); }
`

// Street lamps of the night photo.
const lightTwinkle = keyframes`
    0%, 100% { opacity: 0.35; }
    50% { opacity: 1; }
`

// A vehicle on the factory road. The animated box is as tall as the lane,
// so translateY(-100%) → 0 drives the vehicle drawn at its bottom edge
// from the far end of the lane to the near end.
const drive = keyframes`
    0% { transform: translateY(-100%); opacity: 0; }
    12% { opacity: 1; }
    85% { opacity: 1; }
    100% { transform: translateY(0); opacity: 0; }
`

const birdFly = keyframes`
    from { transform: translateX(-70px); }
    to { transform: translateX(540px); }
`

const birdFlap = keyframes`
    from { transform: scaleY(1); }
    to { transform: scaleY(0.35); }
`

// Moves a strip one tile wider than the button instead of animating
// background-position (which repaints every frame).
const hazardRun = keyframes`
    from { transform: translateX(-8px); }
    to { transform: translateX(0); }
`

const scanSweep = keyframes`
    from { transform: translateX(-140%) skewX(-20deg); }
    to { transform: translateX(300%) skewX(-20deg); }
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
// Worker: walks in from off-frame and stops at workerRestX.
const workerHeight = 64
const workerStartX = -40
const workerRestX = 96
const workerWalkIn = { dx: `${workerRestX - workerStartX}px`, start: gateRiseDelay + 200, duration: gaitCycle * 2 }
// Confirm: worker heads out while the shutter comes down.
const workerWalkOut = { dx: '360px', start: 0, duration: gaitCycle * 2 }
// Stable arrays / objects so a hover re-render does not restyle the worker.
const walksOpen = [workerWalkIn]
const walksClose = [workerWalkIn, workerWalkOut]
const walksNone: typeof walksOpen = []
const waveLoop = { start: 0, duration: waveDuration, iterations: 'infinite' as const }

// The factory photo (same aerial view by day and by night). Overlays are
// placed in % of the photo, so they stay on the road / lamps when it scales.
const scenePhotos = {
    day: { src: factoryDay, ratio: 1800 / 1005 },
    night: { src: factoryNight, ratio: 1672 / 941 },
}

// Part of the photo shown: the photo is wider than the header (zoomed in
// on the factory), centered on the main road, and the frame starts this far
// down the photo (factory roofs, the MISUMI bridge and the main road).
const photoWidth = 'max(135%, 480px)'
const photoCenterX = '-55%'
const photoOffset = '-33%'

// Two lanes of the main road under the MISUMI bridge (left in % of the photo).
// Each lane runs two vehicles, offset by negative delays (s).
const lanes = [
    { left: 53.9, reverse: false, duration: 7, delays: [0, -3.6] },
    { left: 55.3, reverse: true, duration: 8.5, delays: [-1.8, -6] },
] as const

// Lamps along the main road in the night photo: [left %, top %]
const roadLamps = [
    [52, 47], [58.6, 50], [51.4, 69], [59.2, 69], [50.8, 80.8], [59.8, 80.8],
] as const

// Per time of day: tint over the photo, where the sun / moon glows,
// and what lives in the sky. Birds fly to work in the morning, home in the afternoon.
interface GatePalette {
    photo: keyof typeof scenePhotos
    tint: string
    glow: { left: string; color: string; size: number }
    moon?: boolean
    cloud: string | null
    birds: { color: string; reverse: boolean } | null
    ground: string
}

const gatePalettes: Record<DayPeriod, GatePalette> = {
    morning: {
        photo: 'day',
        tint: 'linear-gradient(180deg, rgba(251,207,232,0.26) 0%, rgba(254,215,170,0.1) 40%, transparent 70%)',
        glow: { left: '6%', color: 'rgba(255,237,213,0.95)', size: 120 },
        cloud: 'rgba(255,241,242,0.75)',
        birds: { color: '#334155', reverse: false },
        ground: '#3f3f46',
    },
    noon: {
        photo: 'day',
        tint: 'linear-gradient(180deg, rgba(186,230,253,0.2) 0%, transparent 45%)',
        glow: { left: '50%', color: 'rgba(255,255,255,0.9)', size: 110 },
        cloud: 'rgba(255,255,255,0.85)',
        birds: null,
        ground: '#3f3f46',
    },
    afternoon: {
        photo: 'day',
        tint: 'linear-gradient(180deg, rgba(251,146,60,0.32) 0%, rgba(234,88,12,0.14) 55%, rgba(124,45,18,0.18) 100%)',
        glow: { left: '92%', color: 'rgba(253,186,116,0.95)', size: 130 },
        cloud: 'rgba(255,237,213,0.55)',
        birds: { color: '#7c2d12', reverse: true },
        ground: '#3b2f2a',
    },
    night: {
        photo: 'night',
        tint: 'linear-gradient(180deg, rgba(15,23,42,0.25) 0%, transparent 55%)',
        glow: { left: '88%', color: 'rgba(226,232,240,0.55)', size: 70 },
        moon: true,
        cloud: null,
        birds: null,
        ground: '#111827',
    },
}

// [x, y, flap delay s] inside the flock
const flock = [[0, 6, 0], [14, 0, 0.12], [26, 9, 0.24]] as const

// Memoized: the dialog re-renders on every hover / focus of the buttons.
const GateScene = memo(function GateScene({
    period,
    warn,
    closing,
    reduceMotion,
    character,
}: {
    period: DayPeriod
    warn: boolean
    closing: boolean
    reduceMotion: boolean
    character: WorkerCharacter
}) {
    const { t } = useI18n()
    const gate = gatePalettes[period]
    const photo = scenePhotos[gate.photo]

    // A new random line each time the hover starts (never the same twice in a row).
    const byeLines = [...t.logout.byeLines, ...t.logout.byeByPeriod[period]]
    const [byeIndex, setByeIndex] = useState(0)
    const [prevWarn, setPrevWarn] = useState(warn)

    if (warn !== prevWarn) {
        setPrevWarn(warn)

        if (warn) {
            const next = Math.floor(Math.random() * (byeLines.length - 1))
            setByeIndex(next >= byeIndex ? next + 1 : next)
        }
    }
    const night = gate.photo === 'night'
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
                bgcolor: night ? '#0b1330' : '#93c5fd',
                // Keep the scene's repaints from spreading to the rest of the dialog
                contain: 'paint',
                isolation: 'isolate',

                '& .gate-cloud': {
                    position: 'absolute',
                    left: 0,
                    height: 12,
                    // Soft edge drawn by the gradient (an animated blur filter is costly)
                    background: `radial-gradient(closest-side, ${gate.cloud} 55%, transparent)`,
                    willChange: 'transform',
                    animation: animate ? `${cloudDrift} 28s linear infinite` : 'none',
                },
                '& .gate-bird': {
                    transformOrigin: '50% 100%',
                    animation: animate ? `${birdFlap} 0.32s ease-in-out infinite alternate` : 'none',
                },
                '& .gate-lane': {
                    position: 'absolute',
                    top: '62%',
                    height: '24%',
                    width: '1.1%',
                },
                '& .gate-vehicle': {
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    willChange: 'transform, opacity',
                    animation: animate ? `${drive} var(--drive-duration) linear var(--drive-delay) infinite` : 'none',
                    animationPlayState: running,

                    // The vehicle itself, at the near end of the lane box
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: '13%',
                        borderRadius: '1.5px',
                        bgcolor: night ? '#cbd5e1' : '#f8fafc',
                        boxShadow: night
                            ? '0 3px 5px rgba(253,224,71,0.9)'
                            : '0 1px 1px rgba(15,23,42,0.45)',
                    },
                },
                '& .gate-vehicle-up': {
                    animationDirection: 'reverse',
                    '&::after': night ? { boxShadow: '0 3px 5px rgba(239,68,68,0.85)' } : {},
                },
                '& .gate-lamp': {
                    position: 'absolute',
                    width: '2.4%',
                    aspectRatio: '1',
                    ml: '-1.2%',
                    mt: '-1.2%',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(253,224,71,0.95) 0%, rgba(253,224,71,0) 70%)',
                    animation: animate ? `${lightTwinkle} 2.2s ease-in-out infinite` : 'none',
                },
            }}
        >
            {/* FACTORY PHOTO (slow drone pan) + things that move on it */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    width: photoWidth,
                    aspectRatio: `${photo.ratio}`,
                    transform: `translate(${photoCenterX}, ${photoOffset})`,
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        willChange: animate ? 'transform' : 'auto',
                        animation: animate ? `${dronePan} 24s ease-in-out infinite alternate` : 'none',
                        animationPlayState: running,
                    }}
                >
                    <Box
                        component="img"
                        src={photo.src}
                        alt=""
                        decoding="async"
                        draggable={false}
                        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
                    />

                    {lanes.map((lane) => (
                        <Box key={lane.left} className="gate-lane" style={{ left: `${lane.left}%` }}>
                            {lane.delays.map((delay) => (
                                <Box
                                    key={delay}
                                    className={lane.reverse ? 'gate-vehicle gate-vehicle-up' : 'gate-vehicle'}
                                    style={{
                                        ['--drive-duration' as string]: `${lane.duration}s`,
                                        ['--drive-delay' as string]: `${delay}s`,
                                    }}
                                />
                            ))}
                        </Box>
                    ))}

                    {night && roadLamps.map(([left, top], index) => (
                        <Box
                            key={`${left}-${top}`}
                            className="gate-lamp"
                            style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${index * 0.37}s` }}
                        />
                    ))}
                </Box>
            </Box>

            {/* TIME-OF-DAY TINT */}
            <Box sx={{ position: 'absolute', inset: 0, background: gate.tint }} />

            {/* SUN / MOON GLOW in a top corner */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -gate.glow.size / 2,
                    left: gate.glow.left,
                    width: gate.glow.size,
                    height: gate.glow.size,
                    ml: `${-gate.glow.size / 2}px`,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${gate.glow.color} 0%, transparent 65%)`,
                    willChange: animate ? 'transform, opacity' : 'auto',
                    animation: animate ? `${glowPulse} 4s ease-in-out infinite` : 'none',
                }}
            />
            {gate.moon && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 8,
                        left: gate.glow.left,
                        width: 14,
                        height: 14,
                        ml: '-7px',
                        borderRadius: '50%',
                        bgcolor: '#e2e8f0',
                        boxShadow: 'inset -3px -2px 0 rgba(148,163,184,0.6)',
                    }}
                />
            )}

            {gate.cloud && [
                { top: 10, width: 54, delay: -6 },
                { top: 26, width: 38, delay: -19 },
            ].map((cloud) => (
                <Box
                    key={cloud.top}
                    className="gate-cloud"
                    style={{ top: cloud.top, width: cloud.width, animationDelay: `${cloud.delay}s` }}
                />
            ))}

            {/* BIRDS */}
            {gate.birds && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 18,
                        left: 0,
                        width: 40,
                        height: 16,
                        willChange: 'transform',
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

            {/* LIGHTS OUT on confirm: the factory goes dark behind the shutter */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    bgcolor: '#020617',
                    opacity: closing ? 0.55 : 0,
                    transition: animate ? 'opacity 500ms ease' : 'none',
                }}
            />

            {/* FOREGROUND GATE ROAD + MOVING LANE MARKING (the worker walks here) */}
            <Box
                sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 12,
                    height: 26,
                    background: 'linear-gradient(to bottom, transparent, rgba(2,6,23,0.45))',
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 12,
                    overflow: 'hidden',
                    bgcolor: gate.ground,
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
                        willChange: 'transform',
                        animation: animate ? `${laneScroll} 0.9s linear infinite` : 'none',
                        animationPlayState: running,
                    }}
                />
            </Box>

            {/* Walks in on open, waves goodbye on hover, walks out on confirm */}
            <Worker
                startX={animate ? `${workerStartX}px` : `${workerRestX}px`}
                walks={!animate ? walksNone : closing ? walksClose : walksOpen}
                wave={warn && animate ? waveLoop : undefined}
                gaitCycle={gaitCycle}
                height={workerHeight}
                bottom={6}
                character={character}
            />

            {/* Speech bubble above the worker while hovering Sign out */}
            <Box
                sx={{
                    position: 'absolute',
                    left: workerRestX + 6,
                    bottom: 6 + workerHeight + 6,
                    px: 1,
                    py: 0.4,
                    borderRadius: '10px',
                    bgcolor: '#ffffff',
                    color: '#111827',
                    fontSize: 11,
                    fontWeight: 800,
                    lineHeight: 1.3,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(2,6,23,0.3)',
                    pointerEvents: 'none',
                    opacity: warn ? 1 : 0,
                    transform: warn ? 'translateY(0)' : 'translateY(4px)',
                    transition: animate ? 'opacity 160ms ease, transform 220ms cubic-bezier(.34,1.56,.64,1)' : 'none',

                    // Tail pointing at the worker
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        left: 10,
                        bottom: -4,
                        width: 8,
                        height: 8,
                        bgcolor: '#ffffff',
                        transform: 'rotate(45deg)',
                    },
                }}
            >
                {byeLines[byeIndex % byeLines.length]}
            </Box>

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
                <Beacon tone="amber" start={0} duration={shutterStartAt + 200} beam={180} />
            )}
        </Box>
    )
})

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
    character,
    onSkip,
}: {
    username: string
    checkoutTime: string | null
    character: WorkerCharacter
    onSkip: () => void
}) {
    const { t } = useI18n()
    const [period] = useState(() => getDayPeriod(new Date()))
    // Mounted early (overlayMountAt) and revealed at shutterStartAt:
    // every time below is shifted by that lead.
    const lead = shutterStartAt - overlayMountAt

    return (
        <ShiftOverlayRoot onSkip={onSkip} revealAt={lead} shakeAt={lead + shutterImpact}>
            <ShiftScene period={period} />

            <ShutterPanel animation={`${shutterDrop} ${dropDuration}ms ${lead + dropDelay}ms both`}>
                <ShutterMessage
                    tone="amber"
                    label={t.shift.signedOut}
                    title={t.shift.farewell[period]}
                    subtitle={username}
                    timeLabel={t.shift.timeAt}
                    time={checkoutTime ?? undefined}
                    delay={lead + messageAt}
                />
            </ShutterPanel>

            <DustBurst at={lead + shutterImpact} />
            <Beacon tone="amber" start={lead + dropDelay} duration={shutterImpact - dropDelay + 250} />

            {/* Walks out in front of the closing shutter */}
            <Worker
                startX="68vw"
                walks={[{ dx: '40vw', start: lead + walkStart, duration: walkDuration }]}
                wave={{ start: lead, duration: waveDuration }}
                gaitCycle={gaitCycle}
                character={character}
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
    avatarSeed,
    onCancel,
    onConfirm,
}: LogoutConfirmDialogProps) {
    const { t } = useI18n()
    const seed = avatarSeed ?? readAvatarSeed(username)
    // Stable object so the memoized GateScene skips hover re-renders
    const character = useMemo(() => buildWorkerCharacter(seed), [seed])
    const reduceMotion = useMediaQuery(
        '(prefers-reduced-motion: reduce)',
        { noSsr: true },
    )

    // Time of day, taken again each time the dialog opens
    const [period, setPeriod] = useState(() => getDayPeriod(new Date()))

    useEffect(() => {
        if (open) setPeriod(getDayPeriod(new Date()))
    }, [open])

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

    // Warm the photo cache so the scene is ready the first time the dialog opens.
    useEffect(() => {
        for (const src of [factoryDay, factoryNight]) {
            const image = new Image()
            image.src = src
        }
    }, [])

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
            setTimeout(() => setShutterOn(true), overlayMountAt),
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
                    // No backdrop blur: the sidebar keeps animating underneath and a
                    // full-screen blur would be recomputed on every frame (lag).
                    backdrop: {
                        sx: { backgroundColor: 'rgba(8,18,32,0.58)' },
                    },
                }}
            >
                <GateScene
                    period={period}
                    warn={warn}
                    closing={stopped}
                    reduceMotion={reduceMotion}
                    character={character}
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
                                willChange: stopped ? 'transform, opacity' : 'auto',
                                animation: stopped && !reduceMotion
                                    ? `${cardSink} ${shutterStartAt}ms cubic-bezier(.5,0,.75,0) forwards`
                                    : 'none',

                                // Hi-vis stripe in the color of the character's vest
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    bottom: 0,
                                    left: 0,
                                    width: 4,
                                    bgcolor: character.vest,
                                },
                            })}
                        >
                            {/* Same character as the sidebar and the walking worker; tips the hat on hover */}
                            <Box
                                sx={(theme) => ({
                                    width: 36,
                                    height: 36,
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                    borderRadius: '10px',
                                    border: '1px solid',
                                    borderColor: theme.palette.mode === 'dark'
                                        ? 'rgba(255,255,255,0.14)'
                                        : 'rgba(15,23,42,0.08)',
                                    boxShadow: '0 4px 10px rgba(15,23,42,0.18)',
                                    '&:hover .factory-avatar-hat': {
                                        transform: 'translateY(-2.5px) rotate(-14deg)',
                                    },
                                })}
                            >
                                <FactoryAvatar
                                    seed={seed}
                                    size={36}
                                    period={period}
                                    animate={!reduceMotion}
                                />
                            </Box>

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

                            // Hazard strip along the bottom edge (one tile wider so it can slide).
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                right: -8,
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
                        {stopped ? t.logout.signingOut : t.logout.signOut}
                    </Button>
                </DialogActions>
            </Dialog>

            {shutterOn && (
                <ShutterOverlay
                    username={username}
                    checkoutTime={checkoutTime}
                    character={character}
                    onSkip={handleSkip}
                />
            )}
        </>
    )
}
