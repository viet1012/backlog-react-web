// The user's factory character: shared by the sidebar / logout avatar
// (front view) and the walking worker of the clock-in / clock-out
// animations (side view). Every feature is picked from a seed, so the
// same seed always gives the same character.

const backgrounds = ['#dbeafe', '#fef3c7', '#dcfce7', '#fce7f3', '#e0e7ff', '#ffedd5']
const skins = ['#f8d5bd', '#eab894', '#d39a72', '#a8714e', '#7a4e33']
const hats = ['#facc15', '#f97316', '#f8fafc', '#3b82f6', '#ef4444', '#22c55e']
const vests = ['#f97316', '#facc15', '#22c55e', '#2563eb']
const mouths = ['smile', 'grin', 'open', 'smirk'] as const
const accessories = ['none', 'goggles', 'earmuffs', 'mustache', 'headlamp', 'pencil'] as const

export type WorkerMouth = typeof mouths[number]
export type WorkerAccessory = typeof accessories[number]

export interface WorkerCharacter {
    background: string
    skin: string
    hat: string
    vest: string
    mouth: WorkerMouth
    accessory: WorkerAccessory
    blinkDelay: number
}

// Look of the worker before characters existed (no seed available).
export const defaultWorkerCharacter: WorkerCharacter = {
    background: '#dbeafe',
    skin: '#f0c39a',
    hat: '#facc15',
    vest: '#2563eb',
    mouth: 'smile',
    accessory: 'none',
    blinkDelay: 0,
}

// FNV-1a, then xorshift for a stream of picks
function createRandom(seed: string) {
    let state = 2166136261
    for (let index = 0; index < seed.length; index++) {
        state ^= seed.charCodeAt(index)
        state = Math.imul(state, 16777619)
    }

    return () => {
        state ^= state << 13
        state ^= state >>> 17
        state ^= state << 5
        return (state >>> 0) / 4294967296
    }
}

export function buildWorkerCharacter(seed: string): WorkerCharacter {
    const random = createRandom(seed || 'worker')
    const pick = <T,>(list: readonly T[]) => list[Math.floor(random() * list.length)]

    return {
        background: pick(backgrounds),
        skin: pick(skins),
        hat: pick(hats),
        vest: pick(vests),
        mouth: pick(mouths),
        accessory: pick(accessories),
        blinkDelay: Math.round(random() * 3000),
    }
}

export function randomAvatarSeed() {
    return Math.random().toString(36).slice(2, 10)
}

// =========================================================
// PER-USER SEED
// Storage may be unavailable: the username is the fallback seed.
// =========================================================

const avatarSeedKey = (username: string) => `factoryAvatarSeed:${username}`

export function readAvatarSeed(username: string) {
    try {
        return localStorage.getItem(avatarSeedKey(username)) ?? username
    } catch {
        return username
    }
}

export function writeAvatarSeed(username: string, seed: string) {
    try {
        localStorage.setItem(avatarSeedKey(username), seed)
    } catch {
        // Keep the new character for this session only
    }
}

// =========================================================
// COLOR
// =========================================================

/** Darken (amount < 0) or lighten (amount > 0) a #rrggbb color. */
export function shade(hex: string, amount: number) {
    const value = parseInt(hex.slice(1), 16)
    const mix = (channel: number) => Math.round(amount < 0
        ? channel * (1 + amount)
        : channel + (255 - channel) * amount)

    const r = mix(value >> 16)
    const g = mix((value >> 8) & 255)
    const b = mix(value & 255)

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
