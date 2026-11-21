import { INK } from '../factoryScene/primitives'
import { HOME_FONT } from '../homeFonts'

/*
 * Logo MiSUMi dùng chung cho băng rôn và nhãn trên xe AMR (cùng 1 hình, cùng 1 chữ).
 * Logo 2 khối (nóc xanh, mặt trắng, hông vàng), khung 76 x 74.
 */
export const LOGO = { blue: '#2563c4', yellow: '#f5d21f', white: '#ffffff' }
export const MISUMI_TEXT = 'MiSUMi'

export function LogoBlocks({ outline = true, mono }: { outline?: boolean; mono?: string }) {
  const stroke = outline ? { stroke: INK, strokeWidth: 3.4, strokeLinejoin: 'round' as const } : {}
  const fill = (color: string) => mono ?? color

  return (
    <g {...stroke}>
      {/* Khối cao phía sau */}
      <polygon points="46,10 58,3 74,12 62,19" fill={fill(LOGO.blue)} />
      <polygon points="46,10 62,19 62,62 46,53" fill={fill(LOGO.white)} />
      <polygon points="62,19 74,12 74,55 62,62" fill={fill(LOGO.yellow)} />
      {/* Khối thấp phía trước */}
      <polygon points="2,24 16,16 46,32 32,40" fill={fill(LOGO.blue)} />
      <polygon points="2,24 32,40 32,72 2,56" fill={fill(LOGO.white)} />
      <polygon points="32,40 46,32 46,64 32,72" fill={fill(LOGO.yellow)} />
    </g>
  )
}

// Chữ MiSUMi đúng kiểu trên băng rôn (font trang chủ, đậm 800, màu gần đen)
export function MisumiWordmark({ x, y, size, anchor = 'start' }: { x: number; y: number; size: number; anchor?: 'start' | 'middle' }) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontFamily={HOME_FONT} fontWeight={800} fontSize={size} fill="#111">
      {MISUMI_TEXT}
    </text>
  )
}
