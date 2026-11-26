import CenterFocusStrongOutlinedIcon from '@mui/icons-material/CenterFocusStrongOutlined'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'
import { Box, Checkbox, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { DxfPreview } from '../../types/pdf2cad'
import { uiTokens } from '../../theme/uiTokens'
import { dxfBbox, type Bbox } from './dxfBounds'
import { usePdf2cadText } from './pdf2cadText'

/** Màu layer giống web pdf2cad (nền tối kiểu CAD) */
const LAYER_COLORS: Record<string, string> = {
  OUTLINE: '#ffffff',
  THIN: '#4fc3f7',
  HIDDEN: '#ffd54f',
  CENTER: '#ef5350',
  FILL: '#9e9e9e',
  TEXT: '#e0e0e0',
  TEXT_OCR: '#81c784',
  TEXT_CHECK: '#ff5252',
  RASTER: '#ce93d8',
  DIM: '#81c784',
  FRAME: '#9e9e9e',
  TEXT_PARAM: '#e040fb',
  TEXT_GLYPH: '#9e9e9e',
  REVISION: '#ff5252',
}

export type ViewerSource =
  | { kind: 'image'; url: string }
  | { kind: 'dxf'; preview: DxfPreview }

type Scene =
  | { kind: 'image'; img: HTMLImageElement; bbox: Bbox }
  | { kind: 'dxf'; preview: DxfPreview; bbox: Bbox }

interface Engine {
  setScene: (scene: Scene | null) => void
  setOff: (off: Set<string>) => void
  fit: () => void
  destroy: () => void
}

/** Canvas zoom / pan ngoài React: kéo chuột không làm render lại component */
function createEngine(canvas: HTMLCanvasElement, stage: HTMLElement): Engine {
  const ctx = canvas.getContext('2d')!
  let scene: Scene | null = null
  let off = new Set<string>()
  const view = { s: 1, x: 0, y: 0 }
  let drag: [number, number, number, number] | null = null
  const dpr = () => window.devicePixelRatio || 1

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!scene) return
    ctx.setTransform(view.s, 0, 0, view.s, view.x, view.y)

    if (scene.kind === 'image') {
      ctx.imageSmoothingEnabled = view.s < 2
      ctx.drawImage(scene.img, 0, 0)
      return
    }

    const lw = (1 / view.s) * dpr()
    for (const [name, L] of Object.entries(scene.preview.layers)) {
      if (off.has(name)) continue
      const col = LAYER_COLORS[name] ?? '#ffffff'
      ctx.strokeStyle = col
      ctx.lineWidth = (name === 'OUTLINE' ? 1.6 : 1) * lw
      ctx.setLineDash(
        name === 'HIDDEN' ? [6 * lw, 4 * lw] : name === 'CENTER' ? [12 * lw, 3 * lw, 2 * lw, 3 * lw] : [],
      )
      ctx.beginPath()
      for (const [a, b, c, d] of L.l) {
        ctx.moveTo(a, -b)
        ctx.lineTo(c, -d)
      }
      for (const [x, y, r] of L.c) {
        ctx.moveTo(x + r, -y)
        ctx.arc(x, -y, r, 0, Math.PI * 2)
      }
      for (const [x, y, r, a0, a1] of L.a) {
        const s = (-a0 * Math.PI) / 180
        const e = (-a1 * Math.PI) / 180
        ctx.moveTo(x + r * Math.cos(s), -y + r * Math.sin(s))
        ctx.arc(x, -y, r, s, e, true)
      }
      for (const p of L.p) {
        if (!p.length) continue
        ctx.moveTo(p[0][0], -p[0][1])
        for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], -p[i][1])
      }
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = col
      if (L.f?.length) {
        ctx.beginPath()
        for (const p of L.f) {
          ctx.moveTo(p[0][0], -p[0][1])
          for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], -p[i][1])
          ctx.closePath()
        }
        ctx.fill('evenodd')
      }
      for (const [x, y, h, rot, wf, t] of L.t) {
        ctx.save()
        ctx.translate(x, -y)
        ctx.rotate((-rot * Math.PI) / 180)
        ctx.scale(wf || 1, 1)
        ctx.font = `${h * 1.38}px Arial, sans-serif`
        ctx.textBaseline = 'alphabetic'
        ctx.fillText(t, 0, 0)
        ctx.restore()
      }
    }
  }

  function fit() {
    if (!scene) return draw()
    const W = canvas.width
    const H = canvas.height
    const b = scene.bbox
    const bw = b[2] - b[0] || 1
    const bh = b[3] - b[1] || 1
    view.s = Math.min(W / bw, H / bh) * 0.94
    view.x = W / 2 - (b[0] + bw / 2) * view.s
    view.y = H / 2 - (b[1] + bh / 2) * view.s
    draw()
  }

  let sized = false
  function resize() {
    const r = stage.getBoundingClientRect()
    if (!r.width || !r.height) return
    canvas.width = Math.round(r.width * dpr())
    canvas.height = Math.round(r.height * dpr())
    // lần đầu có kích thước (tab đang ẩn → hiện) thì vừa khung
    if (!sized) {
      sized = true
      fit()
    } else draw()
  }

  const onWheel = (e: WheelEvent) => {
    if (!scene) return
    e.preventDefault()
    const f = e.deltaY < 0 ? 1.2 : 1 / 1.2
    const mx = e.offsetX * dpr()
    const my = e.offsetY * dpr()
    view.x = mx - (mx - view.x) * f
    view.y = my - (my - view.y) * f
    view.s *= f
    draw()
  }
  const onDown = (e: PointerEvent) => {
    if (e.button !== 0 || !scene) return
    canvas.setPointerCapture(e.pointerId)
    drag = [e.clientX, e.clientY, view.x, view.y]
    canvas.style.cursor = 'grabbing'
  }
  const onMove = (e: PointerEvent) => {
    if (!drag) return
    view.x = drag[2] + (e.clientX - drag[0]) * dpr()
    view.y = drag[3] + (e.clientY - drag[1]) * dpr()
    draw()
  }
  const onUp = () => {
    drag = null
    canvas.style.cursor = 'grab'
  }

  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointercancel', onUp)
  canvas.addEventListener('dblclick', fit)
  const ro = new ResizeObserver(resize)
  ro.observe(stage)
  resize()

  return {
    setScene(next) {
      scene = next
      // khung đang ẩn (tab khác) → chờ lần resize đầu tiên mới vừa khung
      const r = stage.getBoundingClientRect()
      sized = r.width > 0 && r.height > 0
      if (sized) resize()
      fit()
    },
    setOff(next) {
      off = next
      draw()
    },
    fit,
    destroy() {
      ro.disconnect()
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointercancel', onUp)
      canvas.removeEventListener('dblclick', fit)
    },
  }
}

interface DxfViewerProps {
  source: ViewerSource | null
  /** dòng mô tả bên phải thanh tab (tên file, số đối tượng…) */
  info?: string
  loading?: boolean
  /** chữ khi chưa có gì để xem */
  emptyText: string
  /** tab / tiêu đề bên trái thanh trên */
  toolbar?: ReactNode
}

export function DxfViewer({ source, info, loading = false, emptyText, toolbar }: DxfViewerProps) {
  const { tx } = usePdf2cadText()
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const [off, setOff] = useState<Set<string>>(() => new Set())
  const [layersOpen, setLayersOpen] = useState(true)
  const [imageFailed, setImageFailed] = useState<string | null>(null)

  useEffect(() => {
    const engine = createEngine(canvasRef.current!, stageRef.current!)
    engineRef.current = engine
    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [])

  // nguồn mới → dựng scene (ảnh: chờ tải xong)
  useEffect(() => {
    const engine = engineRef.current
    if (!engine) return
    if (!source) {
      engine.setScene(null)
      return
    }
    if (source.kind === 'dxf') {
      engine.setScene({ kind: 'dxf', preview: source.preview, bbox: dxfBbox(source.preview) })
      return
    }
    let alive = true
    const img = new Image()
    img.onload = () => {
      if (alive) engine.setScene({ kind: 'image', img, bbox: [0, 0, img.naturalWidth, img.naturalHeight] })
    }
    img.onerror = () => {
      if (alive) setImageFailed(source.url)
    }
    img.src = source.url
    return () => {
      alive = false
    }
  }, [source])

  // layer tắt: đổi bản xem trước thì bật lại hết
  const preview = source?.kind === 'dxf' ? source.preview : null
  const [offFor, setOffFor] = useState<DxfPreview | null>(null)
  if (offFor !== preview) {
    setOffFor(preview)
    setOff(new Set())
  }
  useEffect(() => {
    engineRef.current?.setOff(off)
  }, [off])

  const layerNames = useMemo(() => (preview ? Object.keys(preview.layers).sort() : []), [preview])
  const failed = source?.kind === 'image' && imageFailed === source.url

  function toggleLayer(name: string) {
    setOff((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: uiTokens.card.borderRadius,
        bgcolor: 'background.paper',
      })}
    >
      <Box
        sx={(theme) => ({
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minHeight: 38,
          px: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        {toolbar}
        <Typography
          noWrap
          title={info}
          sx={{ ml: 'auto', minWidth: 0, fontSize: uiTokens.header.metaFontSize, color: 'text.secondary' }}
        >
          {info}
        </Typography>
        <Tooltip title={tx.fit}>
          <span>
            <IconButton size="small" disabled={!source} onClick={() => engineRef.current?.fit()} aria-label={tx.fit}>
              <CenterFocusStrongOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Box ref={stageRef} sx={{ position: 'relative', flex: 1, minHeight: 280, bgcolor: '#1e1e1e' }}>
        <Box
          component="canvas"
          ref={canvasRef}
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'grab', touchAction: 'none' }}
        />

        {(!source || failed) && !loading && (
          <Typography
            sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', p: 2, textAlign: 'center', color: '#9e9e9e', fontSize: 13 }}
          >
            {failed ? tx.noPreview : emptyText}
          </Typography>
        )}

        {loading && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', bgcolor: 'rgba(0,0,0,0.25)' }}>
            <CircularProgress size={28} sx={{ color: '#90caf9' }} />
          </Box>
        )}

        {layerNames.length > 0 && (
          <Box
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              maxHeight: 'calc(100% - 16px)',
              overflow: 'auto',
              borderRadius: '8px',
              bgcolor: 'rgba(0,0,0,0.6)',
              color: '#ddd',
              fontSize: 12,
              py: 0.25,
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => setLayersOpen((v) => !v)}
              aria-expanded={layersOpen}
              sx={{
                all: 'unset',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.25,
                fontWeight: 700,
                '&:focus-visible': { outline: '2px solid #90caf9' },
              }}
            >
              <LayersOutlinedIcon sx={{ fontSize: 15 }} />
              {tx.layers} ({layerNames.length - off.size}/{layerNames.length})
            </Box>
            {layersOpen && layerNames.map((name) => (
              <Box
                key={name}
                component="label"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pr: 1.25, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <Checkbox
                  size="small"
                  checked={!off.has(name)}
                  onChange={() => toggleLayer(name)}
                  sx={{ p: 0.25, color: '#aaa', '&.Mui-checked': { color: '#90caf9' }, '& svg': { fontSize: 16 } }}
                />
                <Box component="i" sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: LAYER_COLORS[name] ?? '#fff' }} />
                {name}
              </Box>
            ))}
          </Box>
        )}

        <Typography sx={{ position: 'absolute', left: 8, bottom: 6, color: '#8a8a8a', fontSize: 11, pointerEvents: 'none' }}>
          {tx.viewerHint}
        </Typography>
      </Box>
    </Box>
  )
}
