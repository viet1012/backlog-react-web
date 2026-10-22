import { Box } from '@mui/material'
import type { PointerEvent as ReactPointerEvent } from 'react'

import type {
  FitMode,
  FitSession,
} from '../../types/machineLocator'
import {
  FIT_MODE_LABEL,
  FIT_MODES,
} from '../../utils/machineLocatorFit'
import {
  outlinePath,
  rectPath,
} from '../../utils/machineLocatorGeometry'
import { mapColors } from './machineLocatorColors'

interface FitPreviewsProps {
  fx: FitSession
  image: string
  crop: [number, number, number, number]
  // kiểu đang chọn của khung
  mode: FitMode
  onPick: (mode: FitMode) => void
}

const THUMB_W = 72
const THUMB_H = 54

// không cho thao tác trên ảnh xem trước lọt xuống bản đồ (kéo / click nền)
const stop = (e: ReactPointerEvent) => e.stopPropagation()

// 3 ảnh xem trước nhỏ (Sát / Gọn / Chữ nhật) ngay dưới khung vừa ôm; bấm để chọn kiểu.
// Đặt trong .ml-anchor nên giữ cỡ cố định trên màn hình khi zoom
export function FitPreviews({ fx, image, crop, mode, onPick }: FitPreviewsProps) {
  const [CX, CY, CW, CH] = crop
  const { variants } = fx.view

  // vùng nhìn: bao khung lúc ôm + mọi kết quả, nới 15%, giữ tỉ lệ ô xem trước
  let [x0, y0, x1, y1] = [fx.recipe.b[0], fx.recipe.b[1], fx.recipe.b[0] + fx.recipe.b[2], fx.recipe.b[1] + fx.recipe.b[3]]

  for (const m of FIT_MODES) {
    const r = variants[m]

    if (!r) continue

    x0 = Math.min(x0, r.b[0])
    y0 = Math.min(y0, r.b[1])
    x1 = Math.max(x1, r.b[0] + r.b[2])
    y1 = Math.max(y1, r.b[1] + r.b[3])
  }

  const pad = Math.max(x1 - x0, y1 - y0) * 0.15
  let vw = x1 - x0 + pad * 2
  let vh = y1 - y0 + pad * 2

  if (vw / vh > THUMB_W / THUMB_H) vh = vw * THUMB_H / THUMB_W
  else vw = vh * THUMB_W / THUMB_H

  const vx = (x0 + x1 - vw) / 2
  const vy = (y0 + y1 - vh) / 2

  return (
    <Box
      role="group"
      aria-label="Kiểu ôm khung"
      onPointerDown={stop}
      onPointerUp={stop}
      onPointerMove={stop}
      sx={{
        position: 'absolute',
        left: 0,
        top: 6,
        display: 'flex',
        gap: '4px',
        p: '4px',
        borderRadius: '8px',
        bgcolor: 'background.paper',
        boxShadow: '0 2px 10px rgba(0,0,0,.25)',
        pointerEvents: 'auto',
        cursor: 'default',
      }}
    >
      {FIT_MODES.map((m) => {
        const r = variants[m]
        const sel = m === mode

        return (
          <Box
            key={m}
            component="button"
            type="button"
            disabled={!r}
            aria-pressed={sel}
            title={r ? `Kiểu ôm: ${FIT_MODE_LABEL[m]}` : 'Không có kết quả cho kiểu này'}
            onClick={() => onPick(m)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              p: '2px',
              border: '2px solid',
              borderColor: sel ? mapColors.edit : 'divider',
              borderRadius: '6px',
              bgcolor: 'background.paper',
              color: 'text.primary',
              font: 'inherit',
              fontSize: 11,
              fontWeight: sel ? 700 : 500,
              cursor: r ? 'pointer' : 'not-allowed',
              opacity: r ? 1 : 0.45,
              '&:focus-visible': { outline: `2px solid ${mapColors.edit}`, outlineOffset: 1 },
            }}
          >
            <svg width={THUMB_W} height={THUMB_H} viewBox={`${vx} ${vy} ${vw} ${vh}`} aria-hidden>
              <image href={image} x={CX} y={CY} width={CW} height={CH} preserveAspectRatio="none" />
              {r && (
                <path
                  d={r.p ? outlinePath(r.p) : rectPath({ x: r.b[0], y: r.b[1], w: r.b[2], h: r.b[3] })}
                  fill={mapColors.edit}
                  fillOpacity={0.18}
                  stroke={mapColors.edit}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
            {FIT_MODE_LABEL[m]}
          </Box>
        )
      })}
    </Box>
  )
}
