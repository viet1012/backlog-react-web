/**
 * Skin (trang phục) của mascot – admin chỉnh ở AI Logs › Phòng thay đồ, lưu ở backend,
 * mọi người dùng thấy giống nhau. Các sắc độ phụ (bóng, viền, túi…) tính từ màu chính.
 */

export type MascotHat = 'helmet' | 'cap' | 'beanie' | 'none'
export type MascotGlasses = 'none' | 'round' | 'sunglasses'

export interface MascotSkin {
  hat: MascotHat
  hatColor: string
  shirtColor: string
  overallColor: string
  strapColor: string
  skinTone: string
  hairColor: string
  beard: boolean
  glasses: MascotGlasses
  /** nền avatar tròn (header chat, thu nhỏ…) */
  avatarBg: string
}

export const DEFAULT_SKIN: MascotSkin = {
  hat: 'helmet',
  hatColor: '#EF9F27',
  shirtColor: '#378ADD',
  overallColor: '#185FA5',
  strapColor: '#E8732A',
  skinTone: '#F0C9A4',
  hairColor: '#412402',
  beard: true,
  glasses: 'none',
  avatarBg: '#DBEAFB',
}

export interface MascotSkinPreset {
  id: string
  skin: MascotSkin
}

/** Bộ trang phục dựng sẵn – tên hiển thị lấy từ i18n theo id */
export const SKIN_PRESETS: MascotSkinPreset[] = [
  { id: 'engineer', skin: DEFAULT_SKIN },
  {
    id: 'night',
    skin: {
      ...DEFAULT_SKIN,
      hat: 'beanie',
      hatColor: '#3B3F6B',
      shirtColor: '#4C5BA8',
      overallColor: '#252A4A',
      strapColor: '#F5C542',
      glasses: 'round',
      avatarBg: '#DCDDF5',
    },
  },
  {
    id: 'forest',
    skin: {
      ...DEFAULT_SKIN,
      hat: 'cap',
      hatColor: '#2F7D4F',
      shirtColor: '#5FAE6E',
      overallColor: '#335C3E',
      strapColor: '#C9873A',
      hairColor: '#6B3E1F',
      avatarBg: '#DDF2E1',
    },
  },
  {
    id: 'sakura',
    skin: {
      ...DEFAULT_SKIN,
      hat: 'beanie',
      hatColor: '#E46C9A',
      shirtColor: '#F29BBE',
      overallColor: '#9C4A78',
      strapColor: '#FFFFFF',
      beard: false,
      avatarBg: '#FCE3EE',
    },
  },
  {
    id: 'cool',
    skin: {
      ...DEFAULT_SKIN,
      hat: 'cap',
      hatColor: '#222831',
      shirtColor: '#E04848',
      overallColor: '#30343C',
      strapColor: '#F2C94C',
      skinTone: '#D8A57E',
      hairColor: '#1E1410',
      glasses: 'sunglasses',
      avatarBg: '#F6DADA',
    },
  },
  {
    id: 'chef',
    skin: {
      ...DEFAULT_SKIN,
      hat: 'none',
      hatColor: '#FFFFFF',
      shirtColor: '#F4F4F4',
      overallColor: '#3A3A3A',
      strapColor: '#D64545',
      skinTone: '#F3D2B5',
      hairColor: '#7A4A22',
      beard: false,
      avatarBg: '#ECEFF3',
    },
  },
]

/** Bảng màu gợi ý cho ô chọn màu */
export const SKIN_SWATCHES = {
  cloth: ['#EF9F27', '#E8732A', '#E04848', '#E46C9A', '#9B59B6', '#4C5BA8', '#378ADD', '#185FA5', '#2BB3A3', '#2F7D4F', '#5FAE6E', '#F5C542', '#30343C', '#F4F4F4'],
  skin: ['#FCE1C8', '#F3D2B5', '#F0C9A4', '#D8A57E', '#B97E57', '#8D5A3B', '#5E3A24'],
  hair: ['#1E1410', '#412402', '#6B3E1F', '#A0612B', '#D9A54A', '#B8B8B8', '#E46C9A', '#378ADD'],
  bg: ['#DBEAFB', '#DDF2E1', '#FCE3EE', '#DCDDF5', '#FFF1D6', '#F6DADA', '#ECEFF3'],
} as const

const HEX = /^#[0-9a-f]{6}$/i
const HATS: readonly MascotHat[] = ['helmet', 'cap', 'beanie', 'none']
const GLASSES: readonly MascotGlasses[] = ['none', 'round', 'sunglasses']

/** Đọc skin từ JSON backend: trường thiếu / sai kiểu → lấy mặc định (không bao giờ ném lỗi) */
export function normalizeSkin(value: unknown): MascotSkin {
  if (!value || typeof value !== 'object') return DEFAULT_SKIN
  const raw = value as Record<string, unknown>
  const color = (key: keyof MascotSkin) => {
    const v = raw[key]
    return typeof v === 'string' && HEX.test(v) ? v.toUpperCase() : DEFAULT_SKIN[key] as string
  }
  return {
    hat: HATS.includes(raw.hat as MascotHat) ? raw.hat as MascotHat : DEFAULT_SKIN.hat,
    hatColor: color('hatColor'),
    shirtColor: color('shirtColor'),
    overallColor: color('overallColor'),
    strapColor: color('strapColor'),
    skinTone: color('skinTone'),
    hairColor: color('hairColor'),
    beard: typeof raw.beard === 'boolean' ? raw.beard : DEFAULT_SKIN.beard,
    glasses: GLASSES.includes(raw.glasses as MascotGlasses) ? raw.glasses as MascotGlasses : DEFAULT_SKIN.glasses,
    avatarBg: color('avatarBg'),
  }
}

export function sameSkin(a: MascotSkin, b: MascotSkin) {
  return (Object.keys(a) as (keyof MascotSkin)[]).every((key) => {
    const x = a[key]
    const y = b[key]
    return typeof x === 'string' && typeof y === 'string' ? x.toUpperCase() === y.toUpperCase() : x === y
  })
}

/** Pha màu: amount > 0 → sáng hơn (pha trắng), < 0 → tối hơn (pha đen); |amount| ≤ 1 */
export function shade(hex: string, amount: number) {
  const n = Number.parseInt(hex.slice(1), 16)
  const target = amount > 0 ? 255 : 0
  const p = Math.abs(amount)
  const mix = (c: number) => Math.round(c + (target - c) * p)
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}
