import { memo } from 'react'

import { Box } from '@mui/material'
import { keyframes } from '@mui/material/styles'

import treesDayBottom from '../../assets/login-trees-day-bottom.webp'
import treesDayRight from '../../assets/login-trees-day-right.webp'
import treesNightBottom from '../../assets/login-trees-night-bottom.webp'
import treesNightRight from '../../assets/login-trees-night-right.webp'
import { FactoryVehicle, vehicleSize, type VehicleKind } from '../layout/FactoryVehicle'
import { BG_LAYER_INSET, BG_MOTION_ANIMATION, cinematicMotionKeyframes } from './loginStyles'

// Vehicles driving on the roads of the login background photo.
// The layer copies the background's box (inset, cover, cinematic motion), so
// a point given in % of the photo stays on the same spot of the road.

type Point = [x: number, y: number]
type Photo = 'day' | 'night'

// =========================================================
// ROADS (traced from the center dashes of each photo, in % of the photo)
// =========================================================

// Width / height of the background photos (background-size: cover)
const photoRatio: Record<Photo, number> = {
    day: 2752 / 1536,
    night: 1672 / 941,
}

// Bottom road: cubic fit of its center line, y (% of the height) at x
const bottomRoadFit: Record<Photo, [number, number, number, number]> = {
    day: [1.990165e-7, -2.743839e-4, 4.984794e-2, 91.81892],
    night: [6.051951e-7, -2.66431e-4, 4.597361e-2, 91.44972],
}

// Right road: center line to past the right edge. By day it comes down from
// the top and takes a sharp bend near (82.5, 49.5); the night photo shows
// it coming in from the left instead (the upper part is dark there).
const rightRoadCenter: Record<Photo, Point[]> = {
    day: [
        [86.4, 40.5], [85.65, 42], [84.15, 45], [83.05, 47.3], [82.5, 48.7], [82.45, 49.6],
        [82.8, 50.5], [83.62, 52], [85.8, 56], [88, 60], [90.05, 64],
        [92.05, 68], [94.05, 72], [96.05, 76], [98.05, 80], [100.05, 84], [102.05, 88],
    ],
    night: [
        [81.9, 50.85], [82.6, 51.05], [83.4, 51.5], [84.1, 52.3], [86.05, 56],
        [88.1, 60], [90.05, 64], [92.2, 68], [94.1, 72], [96, 76], [98.15, 80], [100.15, 84], [102.15, 88],
    ],
}

// Tree canopy cut out of each photo (same pixels, transparent elsewhere),
// laid over the vehicles so they drive under the trees in front of the road.
// Box: [x, y, width, height] in pixels of the photo it was cut from.
const treeOverlays: Record<Photo, { size: Point; parts: { src: string; box: [number, number, number, number] }[] }> = {
    day: {
        size: [2752, 1536],
        parts: [
            { src: treesDayBottom, box: [0, 1367, 2752, 153] },
            { src: treesDayRight, box: [2201, 599, 551, 814] },
        ],
    },
    night: {
        size: [1672, 941],
        parts: [
            { src: treesNightBottom, box: [0, 837, 1672, 94] },
            { src: treesNightRight, box: [1337, 366, 335, 499] },
        ],
    },
}

function bottomRoadCenter(photo: Photo): Point[] {
    const [a, b, c, d] = bottomRoadFit[photo]
    const points: Point[] = []

    for (let x = -8; x <= 108; x += 4) {
        points.push([x, ((a * x + b) * x + c) * x + d])
    }
    return points
}

/**
 * The lane `offset` (% of the photo width) to the right of a center line
 * driven in the order given (traffic keeps right).
 */
function laneFrom(center: Point[], offset: number, ratio: number): Point[] {
    return center.map(([x, y], index) => {
        const [ax, ay] = center[Math.max(index - 1, 0)]
        const [bx, by] = center[Math.min(index + 1, center.length - 1)]
        // In photo-width units, so the normal is a true right angle on screen
        const dx = bx - ax
        const dy = (by - ay) / ratio
        const length = Math.hypot(dx, dy)

        return [x - (dy / length) * offset, y + (dx / length) * offset * ratio]
    })
}

// =========================================================
// LANE ANIMATION
// The mover box is the photo's size, so translate(x%, y%) puts its top-left
// corner (where the vehicle sits) at x% / y% of the photo. Stops are spaced by
// distance (constant speed) and the heading turns smoothly through the bends.
// =========================================================

function laneKeyframes(points: Point[], ratio: number) {
    const lengths = [0]
    for (let i = 1; i < points.length; i++) {
        const dx = points[i][0] - points[i - 1][0]
        const dy = (points[i][1] - points[i - 1][1]) / ratio
        lengths.push(lengths[i - 1] + Math.hypot(dx, dy))
    }
    const total = lengths[lengths.length - 1]

    let previous: number | null = null
    const headings = points.map((_, index) => {
        const [ax, ay] = points[Math.max(index - 1, 0)]
        const [bx, by] = points[Math.min(index + 1, points.length - 1)]
        let angle = Math.atan2((by - ay) / ratio, bx - ax) * 180 / Math.PI
        // Unwrap so the vehicle never spins the long way round
        if (previous !== null) {
            while (angle - previous > 180) angle -= 360
            while (angle - previous < -180) angle += 360
        }
        previous = angle
        return angle
    })

    const stops = points.map(([x, y], index) => {
        const at = (lengths[index] / total * 100).toFixed(3)
        // Drawings face down (90°): turn them to the heading
        const turn = (headings[index] - 90).toFixed(2)
        return `${at}% { transform: translate(${x.toFixed(3)}%, ${y.toFixed(3)}%) rotate(${turn}deg); }`
    })

    return {
        animation: keyframes`${stops.join('\n')}`,
        meanHeading: headings.reduce((sum, angle) => sum + angle, 0) / headings.length,
    }
}

// Lanes that start inside the frame fade in / out at their ends.
const fadeEnds = keyframes`
    0% { opacity: 0; }
    6% { opacity: 1; }
    94% { opacity: 1; }
    100% { opacity: 0; }
`

interface LaneVehicle {
    kind: VehicleKind
    color: string
    delay: number
}

interface LaneSpec {
    id: string
    center: (photo: Photo) => Point[]
    /** Distance from the center line, % of the photo width */
    offset: (ratio: number) => number
    duration: number
    /** Vehicle size on this road (the photo is in perspective: far roads look smaller) */
    scale: number
    fade?: boolean
    traffic: LaneVehicle[]
}

const reversed = (points: Point[]) => [...points].reverse()

// Bottom road lanes: 1.5% of the photo height either side of the center line
const bottomOffset = (ratio: number) => 1.5 / ratio
const rightOffset = () => 0.36

const laneSpecs: LaneSpec[] = [
    {
        id: 'bottom-west',
        center: (photo) => reversed(bottomRoadCenter(photo)),
        offset: bottomOffset,
        duration: 30,
        scale: 0.85,
        traffic: [
            { kind: 'car', color: '#f8fafc', delay: -3 },
            { kind: 'truck', color: '#1d4ed8', delay: -13 },
            { kind: 'car', color: '#991b1b', delay: -23 },
        ],
    },
    {
        id: 'bottom-east',
        center: (photo) => bottomRoadCenter(photo),
        offset: bottomOffset,
        duration: 34,
        scale: 0.85,
        traffic: [
            { kind: 'bus', color: '#2563eb', delay: -8 },
            { kind: 'motorbike', color: '#facc15', delay: -16 },
            { kind: 'car', color: '#9ca3af', delay: -22 },
            { kind: 'van', color: '#f1f5f9', delay: -30 },
        ],
    },
    {
        id: 'right-down',
        center: (photo) => rightRoadCenter[photo],
        offset: rightOffset,
        duration: 24,
        scale: 0.5,
        fade: true,
        traffic: [
            { kind: 'car', color: '#1f2937', delay: -4 },
            { kind: 'van', color: '#f1f5f9', delay: -15 },
        ],
    },
    {
        id: 'right-up',
        center: (photo) => reversed(rightRoadCenter[photo]),
        offset: rightOffset,
        duration: 26,
        scale: 0.5,
        fade: true,
        traffic: [
            { kind: 'truck', color: '#dc2626', delay: -9 },
            { kind: 'car', color: '#f8fafc', delay: -20 },
        ],
    },
]

// Built once per photo
function buildLanes(photo: Photo) {
    const ratio = photoRatio[photo]

    return laneSpecs.map((spec) => {
        const path = laneFrom(spec.center(photo), spec.offset(ratio), ratio)
        const { animation, meanHeading } = laneKeyframes(path, ratio)
        // Screen shadow (sun from the top left) in the drawing's own frame
        const turn = (meanHeading - 90) * Math.PI / 180
        const shadow = {
            x: Math.cos(turn) + 1.5 * Math.sin(turn),
            y: -Math.sin(turn) + 1.5 * Math.cos(turn),
        }

        return { ...spec, animation, shadow }
    })
}

const lanesByPhoto: Record<Photo, ReturnType<typeof buildLanes>> = {
    day: buildLanes('day'),
    night: buildLanes('night'),
}

// =========================================================
// COMPONENT
// =========================================================

export const LoginTraffic = memo(function LoginTraffic({
    night = false,
    running,
}: {
    night?: boolean
    /** Paused while its photo is hidden (day / night) */
    running: boolean
}) {
    const photo: Photo = night ? 'night' : 'day'
    const ratio = photoRatio[photo]

    return (
        <Box
            aria-hidden
            sx={{
                position: 'absolute',
                inset: BG_LAYER_INSET,
                zIndex: 0,
                pointerEvents: 'none',
                // Same box and motion as the background photo layer
                containerType: 'size',
                transformOrigin: 'center center',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                animation: BG_MOTION_ANIMATION,
                '@keyframes factoryCinematicMotion': cinematicMotionKeyframes,

                // Photo-sized, but only the vehicle is painted in its layer
                '& .login-mover': {
                    position: 'absolute',
                    inset: 0,
                    transformOrigin: '0 0',
                    willChange: 'transform',
                    animationPlayState: running ? 'running' : 'paused',
                },
                '& .login-vehicle': {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transform: 'translate(-50%, -50%)',

                    '& svg': {
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        overflow: 'visible',
                        filter: night
                            ? 'brightness(0.7) saturate(0.85)'
                            : 'drop-shadow(var(--shadow-x) var(--shadow-y) 0.8px rgba(15,23,42,0.5))',
                    },
                },
                '& .login-beam': {
                    position: 'absolute',
                    top: '96%',
                    left: '50%',
                    width: '220%',
                    aspectRatio: '1 / 1.3',
                    transform: 'translateX(-50%)',
                    clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0 100%)',
                    background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(254,243,199,0.55), rgba(254,243,199,0) 100%)',
                },
                '& .login-tail': {
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    width: '150%',
                    aspectRatio: '3',
                    transform: 'translate(-50%, -45%)',
                    background: 'radial-gradient(closest-side, rgba(239,68,68,0.7), rgba(239,68,68,0))',
                },

                '@media (prefers-reduced-motion: reduce)': {
                    animation: 'none',
                    '& .login-mover': { animationPlayState: 'paused' },
                },
            }}
        >
            {/* The photo's box under background-size: cover, centered */}
            <Box
                sx={{
                    '--photo-width': `max(100cqw, calc(100cqh * ${ratio}))`,
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 'var(--photo-width)',
                    aspectRatio: `${ratio}`,
                    transform: 'translate(-50%, -50%)',
                }}
            >
                {lanesByPhoto[photo].map((lane) => lane.traffic.map((vehicle) => {
                    const size = vehicleSize[vehicle.kind]
                    const timing = `${lane.duration}s linear ${vehicle.delay}s infinite`

                    return (
                        <Box
                            key={`${lane.id}-${vehicle.delay}`}
                            className="login-mover"
                            sx={{
                                animation: lane.fade
                                    ? `${lane.animation} ${timing}, ${fadeEnds} ${timing}`
                                    : `${lane.animation} ${timing}`,
                            }}
                            style={{
                                ['--shadow-x' as string]: `${lane.shadow.x.toFixed(2)}px`,
                                ['--shadow-y' as string]: `${lane.shadow.y.toFixed(2)}px`,
                            }}
                        >
                            <Box
                                className="login-vehicle"
                                style={{
                                    width: `calc(var(--photo-width) * ${size.width * lane.scale / 100})`,
                                    aspectRatio: `${size.width} / ${size.length}`,
                                }}
                            >
                                {night && <Box className="login-beam" />}
                                <FactoryVehicle kind={vehicle.kind} color={vehicle.color} />
                                {night && <Box className="login-tail" />}
                            </Box>
                        </Box>
                    )
                }))}

                {treeOverlays[photo].parts.map(({ src, box: [x, y, width, height] }) => {
                    const [photoWidth, photoHeight] = treeOverlays[photo].size

                    return (
                        <Box
                            key={src}
                            component="img"
                            src={src}
                            alt=""
                            decoding="async"
                            draggable={false}
                            sx={{ position: 'absolute', display: 'block' }}
                            style={{
                                left: `${x / photoWidth * 100}%`,
                                top: `${y / photoHeight * 100}%`,
                                width: `${width / photoWidth * 100}%`,
                                height: `${height / photoHeight * 100}%`,
                            }}
                        />
                    )
                })}
            </Box>
        </Box>
    )
})
