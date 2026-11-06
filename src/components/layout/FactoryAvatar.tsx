import { Box } from '@mui/material'
import { keyframes } from '@mui/material/styles'

import type { DayPeriod } from '../shift/shiftParts'
import { buildWorkerCharacter, shade, type WorkerMouth } from '../shift/workerCharacter'

// Thin dark outline keeps the small drawing crisp on any background.
const outline = { stroke: 'rgba(15,23,42,0.35)', strokeWidth: 0.6 }

// Front view of the user's factory character (see workerCharacter).

// =========================================================
// KEYFRAMES (transform / opacity only)
// =========================================================

const blink = keyframes`
    0%, 90%, 100% { transform: scaleY(1); }
    94% { transform: scaleY(0.1); }
`

// Runs on an HTML layer around the head SVG, so the GPU moves it
// without repainting the drawing every frame.
const bob = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-1px); }
`

// New character hops in. No scale: a scaled parent would leave the head
// layer rasterized small, i.e. blurry.
const pop = keyframes`
    0% { transform: translateY(6px); opacity: 0; }
    60% { transform: translateY(-2px); opacity: 1; }
    100% { transform: translateY(0); opacity: 1; }
`

// =========================================================
// PARTS
// =========================================================

function MouthShape({ mouth }: { mouth: WorkerMouth }) {
    const stroke = { stroke: '#7c2d12', strokeWidth: 1, strokeLinecap: 'round' as const, fill: 'none' }

    if (mouth === 'grin') return <path d="M17.4 22.4 Q20 25.8 22.6 22.4 Z" fill="#7c2d12" />
    if (mouth === 'open') return <ellipse cx={20} cy={23.4} rx={1.2} ry={1} fill="#7c2d12" />
    if (mouth === 'smirk') return <path d="M18 23 Q20.6 24.2 22.6 22.3" {...stroke} />
    return <path d="M17.6 22.6 Q20 24.6 22.4 22.6" {...stroke} />
}

// =========================================================
// AVATAR
// The parent controls the hat tip with `.factory-avatar-hat`
// on hover (see LeftSidebar).
// =========================================================

export function FactoryAvatar({
    seed,
    size = 34,
    period,
    animate = true,
}: {
    seed: string
    size?: number
    period: DayPeriod
    animate?: boolean
}) {
    const character = buildWorkerCharacter(seed)
    const { skin, hat, vest, accessory } = character
    const night = period === 'night'

    return (
        <Box
            // Remount on a new seed so the pop plays
            key={seed}
            aria-hidden
            sx={{
                position: 'relative',
                width: size,
                height: size,
                animation: animate ? `${pop} 380ms ease-out` : 'none',

                '& svg': {
                    position: 'absolute',
                    inset: 0,
                    display: 'block',
                    width: '100%',
                    height: '100%',
                },
                '& .factory-avatar-head': {
                    position: 'absolute',
                    inset: 0,
                    animation: animate ? `${bob} 2.6s ease-in-out infinite` : 'none',
                },
                '& .factory-avatar-eyes': {
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                    animation: animate
                        ? `${blink} 4.2s ease-in-out ${character.blinkDelay}ms infinite`
                        : 'none',
                },
                '& .factory-avatar-hat': {
                    transformBox: 'fill-box',
                    transformOrigin: '15% 100%',
                    transition: 'transform 220ms cubic-bezier(.3,1.4,.5,1)',
                },
            }}
        >
            {/* Background + body (static) */}
            <svg viewBox="0 0 40 40" shapeRendering="geometricPrecision">
                <rect width={40} height={40} fill={character.background} />
                <path d="M5 40 C5 31 12 28 20 28 C28 28 35 31 35 40 Z" fill={vest} {...outline} />
                <path d="M7 35.5 H33" stroke="#f1f5f9" strokeWidth={1.6} opacity={0.9} />
                <path d="M16 28.4 L20 33 L24 28.4 Z" fill="#e2e8f0" />
                <rect x={17.5} y={24} width={5} height={5} fill={shade(skin, -0.08)} />
            </svg>

            {/* Head on its own layer (bobs) */}
            <Box className="factory-avatar-head">
                <svg viewBox="0 0 40 40" shapeRendering="geometricPrecision">
                    {/* Head */}
                    <circle cx={12.2} cy={19.6} r={1.6} fill={shade(skin, -0.06)} {...outline} />
                    <circle cx={27.8} cy={19.6} r={1.6} fill={shade(skin, -0.06)} {...outline} />
                    <circle cx={20} cy={19} r={8} fill={skin} {...outline} />

                    {accessory === 'earmuffs' && (
                        <>
                            <circle cx={11.8} cy={19.6} r={2.6} fill="#ef4444" {...outline} />
                            <circle cx={28.2} cy={19.6} r={2.6} fill="#ef4444" {...outline} />
                        </>
                    )}

                    <g className="factory-avatar-eyes">
                        <circle cx={17} cy={19.4} r={1.1} fill="#1f2937" />
                        <circle cx={23} cy={19.4} r={1.1} fill="#1f2937" />
                        <circle cx={17.35} cy={19.05} r={0.35} fill="#fff" />
                        <circle cx={23.35} cy={19.05} r={0.35} fill="#fff" />
                    </g>

                    <circle cx={15.2} cy={22} r={1.2} fill="#f87171" opacity={0.35} />
                    <circle cx={24.8} cy={22} r={1.2} fill="#f87171" opacity={0.35} />

                    {accessory === 'mustache' && (
                        <path
                            d="M16.8 21.9 Q18.5 20.7 20 21.8 Q21.5 20.7 23.2 21.9 Q21.8 23 20 22.3 Q18.2 23 16.8 21.9 Z"
                            fill="#4b2e1e"
                        />
                    )}
                    <MouthShape mouth={character.mouth} />

                    {accessory === 'pencil' && (
                        <g>
                            <path d="M26.6 21.4 L30.6 14.6" stroke="#facc15" strokeWidth={1.8} strokeLinecap="round" />
                            <path d="M26.6 21.4 L27.1 20.5" stroke="#374151" strokeWidth={1.8} strokeLinecap="round" />
                        </g>
                    )}

                    {/* Hard hat (tips on hover) */}
                    <g className="factory-avatar-hat">
                        <path d="M11 16.6 C11 9.6 15 7 20 7 C25 7 29 9.6 29 16.6 Z" fill={hat} {...outline} />
                        <rect x={19} y={7.2} width={2} height={9.2} rx={1} fill="#000" opacity={0.12} />
                        <path d="M14 12.4 Q15.4 9.2 18.6 8.4" stroke="#fff" strokeWidth={1} strokeLinecap="round" fill="none" opacity={0.55} />
                        <rect x={9} y={15.6} width={22} height={2.6} rx={1.3} fill={hat} {...outline} />
                        <rect x={9} y={16.9} width={22} height={1.3} rx={0.65} fill="#000" opacity={0.15} />

                        {accessory === 'goggles' && (
                            <>
                                <rect x={13.5} y={11.4} width={13} height={3.6} rx={1.8} fill="#334155" />
                                <circle cx={17} cy={13.2} r={1.3} fill="#7dd3fc" />
                                <circle cx={23} cy={13.2} r={1.3} fill="#7dd3fc" />
                            </>
                        )}

                        {accessory === 'headlamp' && (
                            <>
                                {/* Lamp lights up at night */}
                                {night && <circle cx={20} cy={13.2} r={4} fill="#fde047" opacity={0.45} />}
                                <rect x={17.8} y={11.6} width={4.4} height={3.2} rx={1} fill="#374151" />
                                <circle cx={20} cy={13.2} r={1.1} fill={night ? '#fef08a' : '#cbd5e1'} />
                            </>
                        )}
                    </g>
                </svg>
            </Box>
        </Box>
    )
}
