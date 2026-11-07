import { Box } from '@mui/material'

import { INK } from '../factoryScene/primitives'
import type { GraphicsLevel } from './graphicsQuality'

const LOAD_COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444']

interface QualityBarsProps {
  value: number
  color: string
  max?: number
  size?: 'sm' | 'md'
}

// Vạch mức kiểu cột sóng: càng nhiều vạch càng đẹp (và càng nặng)
export function QualityBars({ value, color, max = 5, size = 'sm' }: QualityBarsProps) {
  const unit = size === 'sm' ? 2.2 : 3
  return (
    <Box aria-hidden sx={{ display: 'inline-flex', alignItems: 'flex-end', gap: size === 'sm' ? '2px' : '3px', height: unit * (max + 1) }}>
      {Array.from({ length: max }, (_, i) => (
        <Box
          key={i}
          sx={{
            width: size === 'sm' ? 3 : 4,
            height: unit * (i + 2),
            borderRadius: '1px',
            bgcolor: i < value ? color : 'action.disabledBackground',
            transition: 'background-color 200ms ease',
          }}
        />
      ))}
    </Box>
  )
}

// Thanh tải GPU 5 nấc, màu xanh -> đỏ
export function GpuLoadMeter({ load }: { load: number }) {
  return (
    <Box aria-hidden sx={{ display: 'flex', gap: '3px' }}>
      {LOAD_COLORS.map((color, i) => (
        <Box
          key={color}
          sx={{
            width: 18,
            height: 6,
            borderRadius: 999,
            bgcolor: i < load ? color : 'action.disabledBackground',
            transition: 'background-color 200ms ease',
          }}
        />
      ))}
    </Box>
  )
}

/*
 * Ảnh xem trước mini: một thùng hàng vẽ theo đúng phong cách của mức đó
 * 2D phẳng -> Thấp nét viền -> Vừa có khối + bóng -> Cao bóng mềm + ánh bóng -> Tối đa phát sáng + hạt bụi.
 */
export function QualityThumb({ level, dark }: { level: GraphicsLevel; dark: boolean }) {
  const outline = level === 'low' ? `1.5px solid ${INK}` : level === 'flat' ? `1px solid ${INK}` : 'none'
  const solid = level === 'flat' || level === 'low'
  const front = solid ? '#d9a066' : 'linear-gradient(180deg, #e2b27a 0%, #b9824a 100%)'
  const top = solid ? '#e9c08c' : 'linear-gradient(90deg, #f2cf9f 0%, #e3b47c 100%)'
  const side = solid ? '#b07a44' : 'linear-gradient(180deg, #a8733f 0%, #84582d 100%)'

  return (
    <Box
      aria-hidden
      sx={{
        position: 'relative',
        flexShrink: 0,
        width: 56,
        height: 44,
        overflow: 'hidden',
        borderRadius: '10px',
        border: '1px solid',
        borderColor: 'divider',
        background: level === 'ultra'
          ? `radial-gradient(circle at 50% 70%, rgba(255, 196, 92, ${dark ? 0.35 : 0.3}) 0%, transparent 65%), ${dark ? '#121a26' : '#eef2f7'}`
          : dark ? '#121a26' : '#eef2f7',
      }}
    >
      {/* Bóng đổ */}
      {!solid && (
        <Box
          sx={{
            position: 'absolute',
            left: level === 'medium' ? 14 : 10,
            right: level === 'medium' ? 14 : 8,
            bottom: 5,
            height: level === 'medium' ? 4 : 6,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.35)',
            filter: `blur(${level === 'medium' ? 1 : 2.5}px)`,
          }}
        />
      )}
      {level === 'low' && <Box sx={{ position: 'absolute', left: 14, right: 12, bottom: 6, height: 3, borderRadius: '50%', bgcolor: 'rgba(0, 0, 0, 0.25)' }} />}

      {/* Nóc + hông (2D chỉ có mặt trước) */}
      {level !== 'flat' && (
        <>
          <Box sx={{ position: 'absolute', left: 16, bottom: 25, width: 22, height: 6, background: top, border: outline, borderBottom: 'none', transformOrigin: 'bottom left', transform: 'skewX(-45deg)', boxSizing: 'border-box' }} />
          <Box sx={{ position: 'absolute', left: 38, bottom: 8, width: 6, height: 17, background: side, border: outline, borderLeft: 'none', transformOrigin: 'bottom left', transform: 'skewY(-45deg)', boxSizing: 'border-box' }} />
        </>
      )}
      {/* Mặt trước */}
      <Box sx={{ position: 'absolute', left: 16, bottom: 8, width: 22, height: 17, background: front, border: outline, boxSizing: 'border-box', borderRadius: level === 'high' || level === 'ultra' ? '1.5px' : 0 }}>
        <Box sx={{ position: 'absolute', left: 3, right: 3, bottom: 2, height: 5, bgcolor: '#fbfaf4', borderRadius: '1px' }} />
        {(level === 'high' || level === 'ultra') && (
          <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(120deg, rgba(255, 255, 255, 0.35) 0%, transparent 40%)' }} />
        )}
      </Box>

      {/* Tối đa: LED sáng + hạt bụi */}
      {level === 'ultra' && (
        <>
          <Box sx={{ position: 'absolute', left: 33, bottom: 11, width: 3, height: 3, borderRadius: '50%', bgcolor: '#3ee07a', boxShadow: '0 0 4px #3ee07a' }} />
          {[[8, 10], [46, 8], [12, 30], [48, 26], [28, 6]].map(([x, y]) => (
            <Box key={`${x}:${y}`} sx={{ position: 'absolute', left: x, top: y, width: 2, height: 2, borderRadius: '50%', bgcolor: '#ffe2b0', boxShadow: '0 0 3px #ffd27a' }} />
          ))}
        </>
      )}
    </Box>
  )
}
