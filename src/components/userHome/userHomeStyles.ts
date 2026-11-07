import { C, INK } from './factoryScene/primitives'

/*
 * Bảng màu nền xưởng: sáng = xưởng ban ngày (bê tông), tối = ca đêm (thép, đèn high-bay).
 */
export interface HomePalette {
  ceiling: string
  wall: string
  floor: string
  grid: string
  lane: string
  truss: string
  silhouette: string
  lampGlow: string
  fog: string
}

export function getHomePalette(dark: boolean): HomePalette {
  return dark
    ? {
      ceiling: '#070f1b',
      wall: '#102136',
      floor: '#0a1524',
      grid: 'rgba(120, 182, 232, 0.16)',
      lane: 'rgba(255, 210, 63, 0.55)',
      truss: 'rgba(130, 170, 210, 0.10)',
      silhouette: 'rgba(4, 10, 20, 0.72)',
      lampGlow: 'rgba(255, 214, 150, 0.22)',
      fog: 'rgba(16, 33, 54, 0.95)',
    }
    : {
      ceiling: '#e8eef4',
      wall: '#d3dde7',
      floor: '#bcc8d4',
      grid: 'rgba(40, 70, 105, 0.14)',
      lane: 'rgba(224, 170, 20, 0.75)',
      truss: 'rgba(60, 90, 120, 0.10)',
      silhouette: 'rgba(70, 95, 122, 0.30)',
      lampGlow: 'rgba(255, 255, 255, 0.55)',
      fog: 'rgba(211, 221, 231, 0.95)',
    }
}

// Sọc cảnh báo vàng-đen kiểu vạch an toàn trong xưởng
export function hazardStripes(size = 10) {
  return `repeating-linear-gradient(-45deg, ${C.yellow} 0 ${size}px, ${INK} ${size}px ${size * 2}px)`
}
