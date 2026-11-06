import type { ComponentType } from 'react'

import { shade } from '../shift/workerCharacter'

// Top-down vehicles for the aerial factory photo. Each one is drawn with its
// front at the bottom of the viewBox; a vehicle driving up is rotated 180°.

export type VehicleKind = 'car' | 'van' | 'truck' | 'bus' | 'motorbike'

// Footprint in % of the photo width (the van parked in the photo is ~0.93 × 2.4)
export const vehicleSize: Record<VehicleKind, { width: number; length: number }> = {
    car: { width: 0.8, length: 1.8 },
    van: { width: 0.92, length: 2.35 },
    truck: { width: 1.12, length: 3.5 },
    bus: { width: 1.12, length: 4.1 },
    motorbike: { width: 0.3, length: 0.78 },
}

const glass = '#1c2636'
const glassShine = 'rgba(203,213,225,0.35)'
const headlight = '#fef9c3'
const taillight = '#dc2626'
const tire = '#0f172a'

function Car({ color }: { color: string }) {
    const roof = shade(color, 0.12)

    return (
        <svg viewBox="-1 0 20 40" preserveAspectRatio="none">
            {/* mirrors */}
            <rect x={-0.8} y={24.5} width={2} height={1.6} rx={0.6} fill={shade(color, -0.25)} />
            <rect x={16.8} y={24.5} width={2} height={1.6} rx={0.6} fill={shade(color, -0.25)} />
            <rect x={0.5} y={0.5} width={17} height={39} rx={5.5} fill={color} />
            <rect x={0.5} y={0.5} width={17} height={39} rx={5.5} fill="none" stroke={shade(color, -0.3)} strokeWidth={0.6} />
            {/* rear window, roof, windshield */}
            <path d="M3 11 L15 11 L16 6.8 Q9 5.4 2 6.8 Z" fill={glass} />
            <rect x={2.6} y={11} width={12.8} height={13.5} rx={1.6} fill={roof} />
            <path d="M2.6 24.5 L15.4 24.5 L16.6 30.6 Q9 32.2 1.4 30.6 Z" fill={glass} />
            <path d="M4.5 26 L9 26 L6.5 30.2 L3.2 29.8 Z" fill={glassShine} />
            {/* hood crease */}
            <path d="M5 34.5 Q9 33.6 13 34.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={0.7} />
            <rect x={2.2} y={37.6} width={3.6} height={1.5} rx={0.7} fill={headlight} />
            <rect x={12.2} y={37.6} width={3.6} height={1.5} rx={0.7} fill={headlight} />
            <rect x={1.8} y={0.9} width={3.4} height={1.3} rx={0.5} fill={taillight} />
            <rect x={12.8} y={0.9} width={3.4} height={1.3} rx={0.5} fill={taillight} />
        </svg>
    )
}

function Van({ color }: { color: string }) {
    return (
        <svg viewBox="-1 0 22 50" preserveAspectRatio="none">
            <rect x={-0.8} y={39} width={2} height={1.8} rx={0.6} fill={shade(color, -0.25)} />
            <rect x={18.8} y={39} width={2} height={1.8} rx={0.6} fill={shade(color, -0.25)} />
            <rect x={0.5} y={0.5} width={19} height={49} rx={3.5} fill={color} />
            <rect x={0.5} y={0.5} width={19} height={49} rx={3.5} fill="none" stroke={shade(color, -0.3)} strokeWidth={0.6} />
            {/* long roof with rails, short hood */}
            <rect x={2.4} y={2.4} width={15.2} height={35} rx={1.6} fill={shade(color, 0.1)} />
            <path d="M3.4 4 V35.5 M16.6 4 V35.5" stroke={shade(color, -0.2)} strokeWidth={0.6} />
            <path d="M5 13 H15 M5 24 H15" stroke={shade(color, -0.12)} strokeWidth={0.5} />
            <path d="M2.4 37.4 L17.6 37.4 L18.6 42.6 Q10 44 1.4 42.6 Z" fill={glass} />
            <path d="M4.5 38.6 L9 38.6 L7 42.4 L3.2 42 Z" fill={glassShine} />
            <rect x={2.2} y={47.6} width={4} height={1.5} rx={0.6} fill={headlight} />
            <rect x={13.8} y={47.6} width={4} height={1.5} rx={0.6} fill={headlight} />
            <rect x={1.6} y={0.9} width={2.6} height={2.6} rx={0.6} fill={taillight} />
            <rect x={15.8} y={0.9} width={2.6} height={2.6} rx={0.6} fill={taillight} />
        </svg>
    )
}

// Box truck: cargo box behind a cab of the given color
function Truck({ color }: { color: string }) {
    return (
        <svg viewBox="-1 0 26 70" preserveAspectRatio="none">
            {/* cargo box with roof ribs */}
            <rect x={0.4} y={0.4} width={23.2} height={50} rx={1.2} fill="#e5e7eb" stroke="#64748b" strokeWidth={0.6} />
            <path
                d="M1.5 7 H22.5 M1.5 13.5 H22.5 M1.5 20 H22.5 M1.5 26.5 H22.5 M1.5 33 H22.5 M1.5 39.5 H22.5 M1.5 46 H22.5"
                stroke="#cbd5e1"
                strokeWidth={0.8}
            />
            <rect x={1} y={0.8} width={3} height={1.6} fill={taillight} />
            <rect x={20} y={0.8} width={3} height={1.6} fill={taillight} />
            {/* cab */}
            <rect x={-0.8} y={60} width={2} height={2.4} rx={0.6} fill="#1f2937" />
            <rect x={22.8} y={60} width={2} height={2.4} rx={0.6} fill="#1f2937" />
            <rect x={1.5} y={51.2} width={21} height={18.3} rx={2.5} fill={color} stroke={shade(color, -0.3)} strokeWidth={0.6} />
            <rect x={4} y={52.6} width={16} height={7.4} rx={1.4} fill={shade(color, 0.14)} />
            <path d="M3 61 L21 61 L21.8 65.2 Q12 66.6 2.2 65.2 Z" fill={glass} />
            <rect x={2.8} y={67.6} width={4} height={1.5} rx={0.6} fill={headlight} />
            <rect x={17.2} y={67.6} width={4} height={1.5} rx={0.6} fill={headlight} />
        </svg>
    )
}

// Worker shuttle bus: white roof, AC unit, colored side stripes
function Bus({ color }: { color: string }) {
    return (
        <svg viewBox="-1 0 27 82" preserveAspectRatio="none">
            <rect x={-0.8} y={73} width={2} height={2.4} rx={0.6} fill="#1f2937" />
            <rect x={23.8} y={73} width={2} height={2.4} rx={0.6} fill="#1f2937" />
            <rect x={0.5} y={0.5} width={24} height={81} rx={3.5} fill="#f1f5f9" stroke="#64748b" strokeWidth={0.6} />
            <path d="M1.4 3 V78 M23.6 3 V78" stroke={color} strokeWidth={1.6} />
            <rect x={6} y={30} width={13} height={15} rx={1.5} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={0.5} />
            <path d="M8 33 H17 M8 36 H17 M8 39 H17 M8 42 H17" stroke="#94a3b8" strokeWidth={0.5} />
            <rect x={8.5} y={12} width={8} height={6} rx={1} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.5} />
            <rect x={8.5} y={56} width={8} height={6} rx={1} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={0.5} />
            <path d="M2.6 75.5 L22.4 75.5 L23.2 79.6 Q12.5 81 1.8 79.6 Z" fill={glass} />
            <rect x={2.2} y={80} width={4.2} height={1.3} rx={0.5} fill={headlight} />
            <rect x={18.6} y={80} width={4.2} height={1.3} rx={0.5} fill={headlight} />
            <rect x={1.6} y={0.9} width={3} height={1.4} rx={0.5} fill={taillight} />
            <rect x={20.4} y={0.9} width={3} height={1.4} rx={0.5} fill={taillight} />
        </svg>
    )
}

// Motorbike seen from above: wheels, rider's shoulders and helmet
function Motorbike({ color }: { color: string }) {
    return (
        <svg viewBox="0 0 8 20" preserveAspectRatio="none">
            <rect x={3} y={0.5} width={2} height={4} rx={1} fill={tire} />
            <rect x={3} y={15.5} width={2} height={4} rx={1} fill={tire} />
            <path d="M0.6 14.6 H7.4" stroke="#334155" strokeWidth={0.9} strokeLinecap="round" />
            <ellipse cx={4} cy={8.5} rx={3.6} ry={2.6} fill={shade(color, -0.25)} />
            <circle cx={4} cy={10.2} r={2.3} fill={color} />
            <circle cx={3.4} cy={9.6} r={0.7} fill="rgba(255,255,255,0.55)" />
        </svg>
    )
}

const drawings: Record<VehicleKind, ComponentType<{ color: string }>> = {
    car: Car,
    van: Van,
    truck: Truck,
    bus: Bus,
    motorbike: Motorbike,
}

export function FactoryVehicle({ kind, color }: { kind: VehicleKind; color: string }) {
    const Drawing = drawings[kind]

    return <Drawing color={color} />
}
