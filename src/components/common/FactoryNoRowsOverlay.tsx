import { useId, type ReactNode } from 'react'
import { Box, Button, GlobalStyles, Typography } from '@mui/material'
import { keyframes } from '@mui/material/styles'
import { RefreshRounded } from '@mui/icons-material'

import { useI18n } from '../../i18n/useI18n'
import { FACTORY_NAME, monoFont } from '../shift/shiftParts'
import { HOME_FONT, homeFontFaces } from '../userHome/homeFonts'
import { SegmentDisplay } from '../userHome/warehouse/SegmentDisplay'

/*
 * Empty storage bay: the shutter rolls up (same move as the logout gate),
 * the bay lamp flickers on over an empty pallet, the LED counter reads 000
 * and a dashed "ghost crate" marks where goods would be.
 * Same industrial palette as the logout dialog and the user home
 * (steel shutter, amber hazard, LED board, carton wood).
 *
 * tone="error" (API failed): same bay, but the shutter jams half-way and
 * throws sparks, the lamp and beacon flash red, a striped barrier blocks
 * the bay and the LED board reads "API Err". Shows the error message and
 * a Retry switch.
 *
 * variant="compact": LED board + text only, for small cells (chart cards,
 * sub-tables) where several states can show at once.
 */

type Tone = 'empty' | 'error'

const AMBER = '#f59e0b'
const RED = '#ef4444'
const LED_AMBER = '#ffbe5c'
const LED_GREEN = '#52f59a'
const LED_RED = '#ff6b6b'

// Same amber/charcoal tile as the logout button's hazard strip
const hazardTile = 'linear-gradient(45deg, #111827 25%, #f59e0b 25%, #f59e0b 50%, #111827 50%, #111827 75%, #f59e0b 75%, #f59e0b)'

// Shutter travel (viewBox units): fully closed → bottom edge at y = 76
const shutterLift = 74

// Error: the shutter stops short and drops on its right side (pivot: top-left of the opening)
const jamLift = 36
const jamTilt = 2.5

const shutterRise = keyframes`
    0% { transform: translateY(0); animation-timing-function: ease-out; }
    12% { transform: translateY(3px); animation-timing-function: cubic-bezier(.7,0,.3,1); }
    100% { transform: translateY(-${shutterLift}px); }
`

const shutterJam = keyframes`
    0% { transform: translateY(0) rotate(0deg); animation-timing-function: ease-out; }
    10% { transform: translateY(3px) rotate(0deg); animation-timing-function: cubic-bezier(.7,0,.3,1); }
    55% { transform: translateY(-52px) rotate(0deg); animation-timing-function: ease-in; }
    66% { transform: translateY(-34px) rotate(3deg); animation-timing-function: ease-out; }
    74% { transform: translateY(-39px) rotate(2deg); }
    82% { transform: translateY(-35px) rotate(2.8deg); }
    90% { transform: translateY(-37px) rotate(2.4deg); }
    100% { transform: translateY(-${jamLift}px) rotate(${jamTilt}deg); }
`

const powerOn = keyframes`
    0% { opacity: 0; }
    10% { opacity: 0.8; }
    16% { opacity: 0.1; }
    30% { opacity: 0.9; }
    36% { opacity: 0.3; }
    100% { opacity: 1; }
`

const alarmPulse = keyframes`
    0%, 100% { opacity: 0.25; }
    50% { opacity: 1; }
`

const ledBlink = keyframes`
    0%, 60% { opacity: 1; }
    61%, 100% { opacity: 0.15; }
`

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`

const marchingAnts = keyframes`
    to { stroke-dashoffset: -18; }
`

const chevronBob = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(3px); }
`

const dustFloat = keyframes`
    0% { transform: translate(0, 0); opacity: 0; }
    20% { opacity: 0.85; }
    100% { transform: translate(6px, -34px); opacity: 0; }
`

// Short burst, then idle until the next one
const sparkFly = keyframes`
    0% { transform: translate(0, 0); opacity: 0; }
    3% { opacity: 1; }
    30% { transform: translate(var(--dx), var(--dy)); opacity: 0; }
    100% { transform: translate(var(--dx), var(--dy)); opacity: 0; }
`

const beaconPulse = keyframes`
    0%, 100% { opacity: 0.2; }
    50% { opacity: 0.85; }
`

const spin = keyframes`
    to { transform: rotate(360deg); }
`

// [cx, cy, r, delay s] inside the light cone
const dust = [
    [188, 138, 1.2, 0],
    [211, 130, 1, -1.4],
    [203, 112, 1.3, -2.6],
    [182, 120, 0.9, -3.8],
    [219, 142, 1.1, -4.9],
] as const

// [dx, dy, delay s] from the jammed corner of the shutter
const sparks = [
    [-10, 7, 0],
    [-6, 12, 0.08],
    [-13, 2, 0.16],
    [-3, 14, 0.9],
    [-11, 9, 1.0],
] as const

// LED board: stock counter (empty) or status code (error).
// Every size is a multiple of --u so the board scales as one piece.
function LedBoard({ unit, tone, sx }: { unit: string; tone: Tone; sx?: object }) {
    const error = tone === 'error'

    return (
        <Box
            aria-hidden
            sx={{
                '--u': unit,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--u)',
                py: 'calc(var(--u) * 1.6)',
                px: 'calc(var(--u) * 2.4)',
                borderRadius: 'calc(var(--u) * 1.6)',
                bgcolor: '#07090d',
                border: '2px solid #2b333e',
                boxShadow: '0 6px 14px rgba(0,0,0,0.3), inset 0 0 12px rgba(0,0,0,0.9)',
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 0.8px, transparent 1.2px)',
                backgroundSize: '4px 4px',
                ...sx,
            }}
        >
            <Box
                sx={{
                    fontFamily: HOME_FONT,
                    fontSize: 'calc(var(--u) * 2.3)',
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: '0.18em',
                    color: LED_AMBER,
                    textShadow: `0 0 8px ${LED_AMBER}55`,
                }}
            >
                {error ? 'API' : 'QTY'}
            </Box>
            <Box className="nr-led-digits" sx={{ fontSize: 'calc(var(--u) * 5.6)', lineHeight: 1 }}>
                <SegmentDisplay text={error ? 'Err' : '000'} color={error ? LED_RED : LED_GREEN} />
            </Box>
        </Box>
    )
}

// Amber "switch" with a hazard strip, same family as the logout Sign out button
function RetrySwitch({ onClick, retrying, compact }: { onClick: () => void; retrying: boolean; compact: boolean }) {
    const { t } = useI18n()

    return (
        <Button
            variant="contained"
            size={compact ? 'small' : 'medium'}
            onClick={onClick}
            disabled={retrying}
            startIcon={(
                <RefreshRounded
                    sx={{
                        animation: retrying ? `${spin} 0.9s linear infinite` : 'none',
                        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                    }}
                />
            )}
            sx={{
                position: 'relative',
                overflow: 'hidden',
                minWidth: compact ? 96 : 132,
                px: compact ? 1.5 : 2.25,
                py: compact ? 0.4 : 0.75,
                borderRadius: '10px',
                fontWeight: 800,
                textTransform: 'none',
                color: '#111827',
                bgcolor: AMBER,
                boxShadow: 'none',
                transition: 'transform 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
                '&:hover': {
                    bgcolor: '#fbbf24',
                    boxShadow: '0 6px 16px rgba(245,158,11,0.32)',
                },
                '&:active': { transform: 'scale(0.96)' },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 3,
                    backgroundImage: hazardTile,
                    backgroundSize: '8px 8px',
                    pointerEvents: 'none',
                },
                '&.Mui-disabled': {
                    color: '#111827',
                    bgcolor: '#d97706',
                    opacity: 0.85,
                },
            }}
        >
            {retrying ? t.common.loading : t.common.retry}
        </Button>
    )
}

interface FactoryNoRowsOverlayProps {
    /** Defaults to "No data" / "Could not load data" */
    title?: ReactNode
    /** Defaults to the generic hint on the scene, none on compact; null hides it */
    hint?: ReactNode | null
    /** Button(s) under the text, e.g. Clear filters (pointer events re-enabled) */
    action?: ReactNode
    variant?: 'scene' | 'compact'
    tone?: Tone
    /** Error message from the API, shown as a code tag (tone="error") */
    detail?: string | null
    /** Shows the Retry switch (tone="error") */
    onRetry?: () => void
    retrying?: boolean
    minHeight?: number | string
}

export function FactoryNoRowsOverlay({
    title,
    hint,
    action,
    variant = 'scene',
    tone = 'empty',
    detail,
    onRetry,
    retrying = false,
    minHeight,
}: FactoryNoRowsOverlayProps = {}) {
    const { t } = useI18n()

    const compact = variant === 'compact'
    const error = tone === 'error'
    const defaultHint = error ? t.common.loadErrorHint : t.status.noRowsHint
    const hintText = hint === undefined ? (compact ? null : defaultHint) : hint

    const text = (
        <Box
            role={error ? 'alert' : undefined}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 460 }}
        >
            <Typography
                sx={{
                    mt: compact ? 1 : 1.5,
                    fontFamily: HOME_FONT,
                    fontSize: compact ? 13 : 15.5,
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: 'text.primary',
                    textAlign: 'center',
                }}
            >
                {title ?? (error ? t.common.loadErrorTitle : t.common.noData)}
            </Typography>

            {hintText && (
                <Typography
                    sx={{
                        mt: 0.4,
                        fontSize: compact ? 12 : 12.5,
                        color: 'text.secondary',
                        textAlign: 'center',
                    }}
                >
                    {hintText}
                </Typography>
            )}

            {/* Raw API message, printed like an error code tag */}
            {error && detail && (
                <Box
                    component="code"
                    title={detail}
                    sx={(theme) => ({
                        mt: 0.9,
                        maxWidth: '100%',
                        display: 'inline-flex',
                        alignItems: 'baseline',
                        gap: 0.75,
                        px: 0.9,
                        py: 0.3,
                        borderRadius: '6px',
                        border: '1px dashed',
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(248,113,113,0.45)' : 'rgba(220,38,38,0.35)',
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
                        fontFamily: monoFont,
                        fontSize: 11,
                        lineHeight: '17px',
                        color: theme.palette.mode === 'dark' ? '#fca5a5' : '#b91c1c',
                    })}
                >
                    <Box component="span" sx={{ flexShrink: 0, fontWeight: 800, letterSpacing: '0.08em' }}>
                        ERR
                    </Box>
                    <Box
                        component="span"
                        sx={{
                            minWidth: 0,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word',
                        }}
                    >
                        {detail}
                    </Box>
                </Box>
            )}

            {(action || (error && onRetry)) && (
                // DataGrid overlays block pointer events by default
                <Box sx={{ mt: compact ? 1 : 1.25, display: 'flex', gap: 1, pointerEvents: 'auto' }}>
                    {error && onRetry && <RetrySwitch onClick={onRetry} retrying={retrying} compact={compact} />}
                    {action}
                </Box>
            )}
        </Box>
    )

    if (compact) {
        return (
            <Box
                sx={{
                    width: '100%',
                    height: '100%',
                    minHeight: minHeight ?? 140,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    px: 2,
                    py: 1.5,

                    '& .nr-led-digits': {
                        animation: error
                            ? `${powerOn} 700ms ease-out 150ms both, ${ledBlink} 1.2s steps(1, end) 900ms infinite`
                            : `${powerOn} 700ms ease-out 150ms both`,
                    },
                    '@media (prefers-reduced-motion: reduce)': {
                        '& .nr-led-digits': { animation: 'none' },
                    },
                }}
            >
                <GlobalStyles styles={homeFontFaces} />
                <LedBoard unit="4px" tone={tone} />
                {text}
            </Box>
        )
    }

    return <FactoryScene tone={tone} minHeight={minHeight}>{text}</FactoryScene>
}

function FactoryScene({ tone, minHeight, children }: { tone: Tone; minHeight?: number | string; children: ReactNode }) {
    const error = tone === 'error'
    const lampColor = error ? '#ff4d4d' : '#fff4d6'
    const beaconColor = error ? RED : AMBER

    const uid = useId().replace(/:/g, '')
    const ribsId = `nr-ribs-${uid}`
    const ribGradId = `nr-rib-grad-${uid}`
    const hazardId = `nr-hazard-${uid}`
    const barrierId = `nr-barrier-${uid}`
    const coneId = `nr-cone-${uid}`
    const lampGlowId = `nr-lamp-glow-${uid}`
    const beaconGlowId = `nr-beacon-glow-${uid}`
    const floorId = `nr-floor-${uid}`
    const bayClipId = `nr-bay-${uid}`

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                minHeight: minHeight ?? 300,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                px: 2,
                py: 1.5,
            }}
        >
            <GlobalStyles styles={homeFontFaces} />

            {/* FRAME: same paper as the logout dialog, hazard strip along the bottom */}
            <Box
                sx={(theme) => {
                    const dark = theme.palette.mode === 'dark'

                    return {
                        width: 'min(420px, 100%)',
                        aspectRatio: '400 / 190',
                        position: 'relative',
                        flexShrink: 0,
                        overflow: 'hidden',
                        borderRadius: '14px',
                        border: '1px solid',
                        borderColor: error
                            ? dark ? 'rgba(248,113,113,0.32)' : 'rgba(220,38,38,0.28)'
                            : dark ? 'rgba(110,195,245,0.16)' : 'rgba(92,146,190,0.16)',
                        boxShadow: error
                            ? dark ? '0 12px 30px rgba(0,0,0,0.38), 0 0 0 3px rgba(239,68,68,0.08)' : '0 12px 30px rgba(127,29,29,0.12), 0 0 0 3px rgba(239,68,68,0.06)'
                            : dark ? '0 12px 30px rgba(0,0,0,0.38)' : '0 12px 30px rgba(30,60,100,0.12)',
                        containerType: 'inline-size',
                        isolation: 'isolate',

                        '--nr-wall': dark ? '#1c232c' : '#e3e8ee',
                        '--nr-seam': dark ? '#262e39' : '#cfd6de',
                        '--nr-beam': dark ? '#2c3540' : '#b3bcc6',
                        '--nr-steel': dark ? '#3b4552' : '#8f9aa6',
                        '--nr-steel-edge': dark ? '#0f1318' : '#6b7682',
                        '--nr-floor-top': dark ? '#1a2027' : '#d3d9e0',
                        '--nr-floor-bottom': dark ? '#10151a' : '#bac2cb',
                        '--nr-floor-line': dark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.08)',
                        '--nr-interior': dark ? '#05080c' : '#18212b',
                        '--nr-rack': dark ? '#2d3946' : '#3b4a5c',
                        '--nr-shutter-text': dark ? 'rgba(229,231,235,0.7)' : 'rgba(31,41,55,0.65)',
                        '--nr-rib-hi': dark ? '#6b7480' : '#e2e6ea',
                        '--nr-rib-body': dark ? '#4b5360' : '#bfc6ce',
                        '--nr-rib-shade': dark ? '#2a3038' : '#98a1ab',
                        '--nr-rib-groove': dark ? '#181c21' : '#7b848e',
                        '--nr-wood-top': dark ? '#c99a63' : '#e9c08c',
                        '--nr-wood': dark ? '#a8763f' : '#c78d53',
                        '--nr-wood-dark': dark ? '#6f4a26' : '#9c6b38',
                        '--nr-shadow': dark ? 'rgba(0,0,0,0.5)' : 'rgba(15,23,42,0.2)',

                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            height: 4,
                            backgroundImage: hazardTile,
                            backgroundSize: '8px 8px',
                            pointerEvents: 'none',
                        },

                        // Base styles are the end state, so reduced motion shows the final scene
                        '& .nr-shutter': error
                            ? {
                                transformBox: 'view-box',
                                transformOrigin: '110px 40px',
                                transform: `translateY(-${jamLift}px) rotate(${jamTilt}deg)`,
                                animation: `${shutterJam} 1400ms 250ms both`,
                            }
                            : {
                                transform: `translateY(-${shutterLift}px)`,
                                animation: `${shutterRise} 1000ms 250ms both`,
                            },
                        '& .nr-lamp': {
                            animation: error
                                ? `${alarmPulse} 1.1s ease-in-out 1300ms infinite both`
                                : `${powerOn} 700ms ease-out 1100ms both`,
                        },
                        '& .nr-led-digits': {
                            animation: error
                                ? `${powerOn} 700ms ease-out 700ms both, ${ledBlink} 1.2s steps(1, end) 1400ms infinite`
                                : `${powerOn} 700ms ease-out 700ms both`,
                        },
                        '& .nr-ghost': {
                            animation: `${fadeIn} 400ms ease 1600ms both`,
                        },
                        '& .nr-ghost-line': {
                            animation: `${marchingAnts} 1.2s linear infinite`,
                        },
                        '& .nr-chevron': {
                            animation: `${chevronBob} 1.4s ease-in-out infinite`,
                        },
                        '& .nr-dust': {
                            animation: `${dustFloat} 6s ease-in-out infinite`,
                        },
                        '& .nr-spark': {
                            opacity: 0,
                            animation: `${sparkFly} 2.2s ease-out infinite`,
                        },
                        '& .nr-beacon': {
                            animation: `${beaconPulse} ${error ? '0.9s' : '2.4s'} ease-in-out infinite`,
                        },
                        '& .nr-alarm': {
                            animation: `${alarmPulse} 0.9s ease-in-out infinite`,
                        },
                        '@media (prefers-reduced-motion: reduce)': {
                            '& .nr-shutter, & .nr-lamp, & .nr-led-digits, & .nr-ghost, & .nr-ghost-line, & .nr-chevron, & .nr-beacon, & .nr-alarm': {
                                animation: 'none',
                            },
                            '& .nr-dust, & .nr-spark': { display: 'none' },
                        },
                    }
                }}
            >
                <svg
                    viewBox="0 0 400 190"
                    width="100%"
                    height="100%"
                    role="presentation"
                    aria-hidden="true"
                    focusable="false"
                    style={{ display: 'block' }}
                >
                    <defs>
                        <linearGradient id={ribGradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--nr-rib-hi)" />
                            <stop offset="30%" stopColor="var(--nr-rib-body)" />
                            <stop offset="80%" stopColor="var(--nr-rib-shade)" />
                            <stop offset="84%" stopColor="var(--nr-rib-groove)" />
                            <stop offset="100%" stopColor="var(--nr-rib-groove)" />
                        </linearGradient>
                        <pattern id={ribsId} patternUnits="userSpaceOnUse" x="0" y="40" width="180" height="11">
                            <rect width="180" height="11" fill={`url(#${ribGradId})`} />
                        </pattern>
                        <pattern id={hazardId} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                            <rect width="5" height="10" fill={AMBER} />
                            <rect x="5" width="5" height="10" fill="#111827" />
                        </pattern>
                        <pattern id={barrierId} patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
                            <rect width="6" height="12" fill="#dc2626" />
                            <rect x="6" width="6" height="12" fill="#f8fafc" />
                        </pattern>
                        <linearGradient id={coneId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={lampColor} stopOpacity={error ? 0.4 : 0.55} />
                            <stop offset="100%" stopColor={lampColor} stopOpacity="0" />
                        </linearGradient>
                        <radialGradient id={lampGlowId}>
                            <stop offset="0%" stopColor={lampColor} stopOpacity="0.9" />
                            <stop offset="100%" stopColor={lampColor} stopOpacity="0" />
                        </radialGradient>
                        <radialGradient id={beaconGlowId}>
                            <stop offset="0%" stopColor={beaconColor} stopOpacity="0.9" />
                            <stop offset="100%" stopColor={beaconColor} stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id={floorId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--nr-floor-top)" />
                            <stop offset="100%" stopColor="var(--nr-floor-bottom)" />
                        </linearGradient>
                        <clipPath id={bayClipId}>
                            <rect x="110" y="40" width="180" height="110" />
                        </clipPath>
                    </defs>

                    {/* WALL: cladding seams + roof beam */}
                    <rect width="400" height="150" fill="var(--nr-wall)" />
                    {[40, 80, 120, 280, 320, 360].map((x) => (
                        <path key={x} d={`M${x} 12V150`} stroke="var(--nr-seam)" strokeWidth="1.2" />
                    ))}
                    <rect y="6" width="400" height="6" fill="var(--nr-beam)" />
                    {[20, 100, 180, 260, 340].map((x) => (
                        <circle key={x} cx={x} cy="9" r="1.1" fill="var(--nr-steel-edge)" opacity="0.6" />
                    ))}

                    {/* BAY INTERIOR: an empty rack in the dark */}
                    <rect x="110" y="40" width="180" height="110" fill="var(--nr-interior)" />
                    <g opacity="0.75">
                        <path d="M132 46V150M268 46V150" stroke="var(--nr-rack)" strokeWidth="4" />
                        <path d="M132 84H268M132 118H268" stroke="#d9772b" strokeWidth="3" opacity="0.55" />
                        <path d="M132 84L268 118M132 118L268 84" stroke="var(--nr-rack)" strokeWidth="0.8" opacity="0.5" />
                    </g>

                    {/* GHOST CRATE: where the goods would sit */}
                    {!error && (
                        <g className="nr-ghost">
                            <g fill="none" stroke={AMBER} strokeWidth="1.4" strokeLinejoin="round">
                                <path className="nr-ghost-line" d="M168 100L174 95H238L232 100" strokeDasharray="5 4" />
                                <path className="nr-ghost-line" d="M232 100L238 95V138L232 143" strokeDasharray="5 4" />
                                <rect className="nr-ghost-line" x="168" y="100" width="64" height="43" rx="1.5" fill={AMBER} fillOpacity="0.07" strokeDasharray="5 4" />
                            </g>
                            <g className="nr-chevron">
                                <path d="M194 81L200 87L206 81" fill="none" stroke={AMBER} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </g>
                        </g>
                    )}

                    {/* SHUTTER: rolls up on mount (jams half-way on error), clipped to the opening */}
                    <g clipPath={`url(#${bayClipId})`}>
                        <g className="nr-shutter">
                            <rect x="104" y="0" width="192" height="150" fill={`url(#${ribsId})`} />
                            <rect x="110" y="40" width="180" height="110" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="6" />
                            {/* Same label as the logout gate shutter; sits on the part left showing once raised */}
                            <text
                                x="200"
                                y="134"
                                textAnchor="middle"
                                fontFamily={monoFont}
                                fontSize="9"
                                fontWeight="800"
                                letterSpacing="2.9"
                                fill="var(--nr-shutter-text)"
                            >
                                {FACTORY_NAME}
                            </text>
                            <rect x="104" y="143" width="192" height="7" fill={`url(#${hazardId})`} />
                            <path d="M104 143H296" stroke="var(--nr-steel-edge)" strokeWidth="1.5" />
                        </g>
                    </g>

                    {/* BAY FRAME: header, jambs with hazard guards */}
                    <rect x="100" y="30" width="200" height="10" fill="var(--nr-steel)" />
                    <rect x="100" y="40" width="10" height="110" fill="var(--nr-steel)" />
                    <rect x="290" y="40" width="10" height="110" fill="var(--nr-steel)" />
                    <rect x="100" y="112" width="10" height="38" fill={`url(#${hazardId})`} />
                    <rect x="290" y="112" width="10" height="38" fill={`url(#${hazardId})`} />
                    <path d="M100 30H300V150M100 30V150M110 40H290M110 40V150M290 40V150" fill="none" stroke="var(--nr-steel-edge)" strokeWidth="0.8" opacity="0.7" />

                    {/* SPARKS where the shutter jammed against the right jamb */}
                    {error && (
                        <g>
                            {sparks.map(([dx, dy, delay]) => (
                                <circle
                                    key={`${dx}-${dy}`}
                                    className="nr-spark"
                                    cx="288"
                                    cy="121"
                                    r="1.1"
                                    fill="#fde047"
                                    style={{
                                        ['--dx' as string]: `${dx}px`,
                                        ['--dy' as string]: `${dy}px`,
                                        animationDelay: `${1.65 + delay}s`,
                                    }}
                                />
                            ))}
                        </g>
                    )}

                    {/* FLOOR: concrete, bay lane lines */}
                    <rect y="150" width="400" height="40" fill={`url(#${floorId})`} />
                    <path d="M0 150H400" stroke="var(--nr-steel-edge)" strokeWidth="1" opacity="0.5" />
                    <path d="M60 150L22 190M160 150L152 190M240 150L248 190M340 150L378 190" stroke="var(--nr-floor-line)" strokeWidth="1" />
                    <path d="M110 150L94 190M290 150L306 190" stroke="#f5b301" strokeWidth="3" opacity="0.85" />

                    {/* EMPTY PALLET at the threshold */}
                    <ellipse cx="200" cy="166" rx="54" ry="4" fill="var(--nr-shadow)" />
                    <path d="M160 143H240L246 150H154Z" fill="var(--nr-wood-top)" />
                    <path d="M180 143L178 150M200 143V150M220 143L222 150" stroke="var(--nr-wood-dark)" strokeWidth="0.9" />
                    <rect x="154" y="150" width="92" height="4" fill="var(--nr-wood)" />
                    <rect x="154" y="154" width="92" height="7" fill="var(--nr-interior)" opacity="0.55" />
                    {[154, 195, 236].map((x) => (
                        <rect key={x} x={x} y="154" width="10" height="7" fill="var(--nr-wood-dark)" />
                    ))}
                    <rect x="154" y="161" width="92" height="3" fill="var(--nr-wood)" />

                    {/* BARRIER across the bay, with its flashing lamp */}
                    {error && (
                        <g>
                            <ellipse cx="200" cy="182" rx="78" ry="3" fill="var(--nr-shadow)" />
                            <path d="M138 160L132 180M138 160L144 180M262 160L256 180M262 160L268 180" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
                            <rect x="124" y="154" width="152" height="9" rx="1.5" fill={`url(#${barrierId})`} stroke="#7f1d1d" strokeWidth="0.8" />
                            <rect x="127" y="148" width="6" height="6" rx="1" fill="#1f2937" />
                            <circle cx="130" cy="148" r="3" fill={RED} />
                            <circle className="nr-alarm" cx="130" cy="148" r="11" fill={`url(#${beaconGlowId})`} />
                        </g>
                    )}

                    {/* TRAFFIC CONE */}
                    <ellipse cx="342" cy="182" rx="13" ry="2.5" fill="var(--nr-shadow)" />
                    <path d="M336 179L342 156L348 179Z" fill="#f97316" />
                    <path d="M338.9 168H345.1L345.9 171.5H338.1Z" fill="#f8fafc" />
                    <rect x="332" y="179" width="20" height="3" rx="1" fill="#c2410c" />

                    {/* BEACON on its wall bracket: amber when idle, red on error */}
                    <path d="M322 60H340" stroke="var(--nr-steel-edge)" strokeWidth="2" />
                    <rect x="324" y="55" width="12" height="5" rx="1" fill="#1f2937" />
                    <path d="M325 55A5 6 0 0 1 335 55Z" fill={beaconColor} />
                    <circle className="nr-beacon" cx="330" cy="52" r="16" fill={`url(#${beaconGlowId})`} />

                    {/* BAY LAMP: flickers on once the shutter is up (alarm red on error) */}
                    <rect x="188" y="19" width="24" height="7" rx="2" fill="#1f2937" />
                    <g className="nr-lamp">
                        <polygon points="192,26 208,26 264,170 136,170" fill={`url(#${coneId})`} />
                        <ellipse cx="200" cy="27" rx="24" ry="8" fill={`url(#${lampGlowId})`} />
                        <rect x="191" y="25" width="18" height="2" rx="1" fill={lampColor} />
                        {!error && dust.map(([cx, cy, r, delay]) => (
                            <circle
                                key={cx}
                                className="nr-dust"
                                cx={cx}
                                cy={cy}
                                r={r}
                                fill="#fff4d6"
                                style={{ animationDelay: `${delay}s` }}
                            />
                        ))}
                    </g>
                </svg>

                {/* LED BOARD on the left wall (DOM: reuses the home 7-segment digits) */}
                <LedBoard
                    unit="1cqw"
                    tone={tone}
                    sx={{ position: 'absolute', left: '4.5%', top: '27%', width: '18.5%', px: 0 }}
                />
            </Box>

            {children}
        </Box>
    )
}
