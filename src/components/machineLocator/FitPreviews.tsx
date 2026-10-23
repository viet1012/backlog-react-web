import {
  Box,
  FormControlLabel,
  Slider,
  Switch,
} from '@mui/material'
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'

import type {
  FitMode,
  FitSession,
} from '../../types/machineLocator'
import {
  FIT_GAP_MAX,
  FIT_GAP_MIN,
  FIT_MODE_LABEL,
  FIT_MODES,
} from '../../utils/machineLocatorFit'
import {
  outlinePath,
  rectPath,
} from '../../utils/machineLocatorGeometry'
import { PanelButton } from './MachineInfo'
import { mapColors } from './machineLocatorColors'

interface FitPreviewsProps {
  fx: FitSession
  image: string
  crop: [number, number, number, number]
  // kiểu đang chọn của khung
  mode: FitMode
  // thanh "Độ sát" 1–10, "Bịt hở" (px), "Nắn vuông góc"
  tightness: number
  ortho: boolean
  gap: number
  // bản xem trước click ngoài khung (Enter mới áp dụng)
  ghost: boolean
  onPick: (mode: FitMode) => void
  onTune: (opts: { tightness?: number, ortho?: boolean, gap?: number }) => void
  onAccept: () => void
  onReject: () => void
}

const THUMB_W = 72
const THUMB_H = 54

// không cho thao tác trên hàng xem trước lọt xuống bản đồ (kéo / click nền / nhấp đúp)
const stop = (e: ReactPointerEvent | ReactMouseEvent) => e.stopPropagation()

// màu điểm tin cậy: < 50 đỏ, < 75 cam, còn lại xanh
function scoreColor(s: number): string {
  return s < 50 ? '#dc2626' : s < 75 ? mapColors.review : '#15903f'
}

// Hàng xem trước dưới khung vừa ôm: 4 kiểu (kèm điểm tin cậy), "Độ sát", "Nắn vuông góc".
// Bấm ô để chọn kiểu; Enter = nhận, Esc = hủy. Đặt trong .ml-anchor nên giữ cỡ cố định khi zoom
export function FitPreviews({
  fx,
  image,
  crop,
  mode,
  tightness,
  ortho,
  gap,
  ghost,
  onPick,
  onTune,
  onAccept,
  onReject,
}: FitPreviewsProps) {
  const [CX, CY, CW, CH] = crop
  const { variants } = fx.view
  // vùng nhìn: bao khung gốc (nếu có) + mọi kết quả, nới 15%, giữ tỉ lệ ô xem trước.
  // Ôm quanh điểm click không có khung gốc: chỉ bao các kết quả (không lấy cả vùng tìm 300 px)
  const anyResult = FIT_MODES.some((m) => variants[m])
  const base = fx.recipe.ref ?? (anyResult ? null : fx.recipe.b)
  let [x0, y0, x1, y1] = base
    ? [base[0], base[1], base[0] + base[2], base[1] + base[3]]
    : [Infinity, Infinity, -Infinity, -Infinity]

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
      aria-label="Kết quả ôm khung"
      onPointerDown={stop}
      onPointerUp={stop}
      onPointerMove={stop}
      onDoubleClick={stop}
      sx={{
        position: 'absolute',
        left: 0,
        top: 6,
        p: '4px',
        borderRadius: '8px',
        bgcolor: 'background.paper',
        boxShadow: '0 2px 10px rgba(0,0,0,.25)',
        pointerEvents: 'auto',
        cursor: 'default',
        fontSize: 11,
        color: 'text.primary',
      }}
    >
      <Box sx={{ display: 'flex', gap: '4px' }}>
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
              title={!r
                ? 'Không có kết quả cho kiểu này'
                : `${FIT_MODE_LABEL[m]} · tin cậy ${r.score}` + (r.fallback ? ' (không thấy viền kín, dùng “Sát”)' : '')}
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
              <span style={{ whiteSpace: 'nowrap' }}>
                {FIT_MODE_LABEL[m]}{r?.fallback ? '*' : ''}
              </span>
              <Box component="span" sx={{ fontWeight: 700, color: r ? scoreColor(r.score) : 'text.disabled' }}>
                {r ? r.score : '–'}
              </Box>
            </Box>
          )
        })}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, px: 0.5 }}>
        <span style={{ whiteSpace: 'nowrap' }}>Độ sát</span>
        <Slider
          size="small"
          min={1}
          max={10}
          step={1}
          value={tightness}
          valueLabelDisplay="auto"
          onChange={(_, v) => onTune({ tightness: v as number })}
          aria-label="Độ sát"
          sx={{ flex: 1, minWidth: 64 }}
        />
        <span style={{ whiteSpace: 'nowrap' }} title="Bịt khe hở của viền (px) trước khi tìm viền kín">Bịt hở</span>
        <Slider
          size="small"
          min={FIT_GAP_MIN}
          max={FIT_GAP_MAX}
          step={1}
          value={gap}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => `${v} px`}
          onChange={(_, v) => onTune({ gap: v as number })}
          aria-label="Bịt hở (px)"
          sx={{ flex: 1, minWidth: 48 }}
        />
        <FormControlLabel
          sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 11, whiteSpace: 'nowrap' } }}
          control={(
            <Switch size="small" checked={ortho} onChange={(e) => onTune({ ortho: e.target.checked })} />
          )}
          label="Nắn vuông góc"
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
        {ghost && (
          <Box component="span" sx={{ mr: 'auto', px: 0.5, color: 'text.secondary' }}>
            Xem trước – chưa đổi khung
          </Box>
        )}
        <PanelButton onClick={onReject} title="Esc">{ghost ? 'Bỏ (Esc)' : 'Hủy (Esc)'}</PanelButton>
        <PanelButton appearance="action" onClick={onAccept} title="Enter">
          {ghost ? 'Áp dụng (Enter)' : 'Nhận (Enter)'}
        </PanelButton>
      </Box>
    </Box>
  )
}
