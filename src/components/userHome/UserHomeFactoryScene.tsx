import { Box, ButtonBase } from '@mui/material'
import type { PaletteMode } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'

import { C, H, INK, LOOP, SIGN_FAMILY, W, createStatics, type Ctx } from './factoryScene/primitives'
import { SCENES } from './factoryScene/scenes'
import { drawShellBack, drawShellFront } from './factoryScene/shell'

/*
 * Hoạt cảnh nhà máy kiểu truyện tranh, nhiều cảnh.
 * 2 lớp canvas: back (tĩnh, vẽ lại khi đổi theme/kích thước/cảnh) và front (chỉ phần chuyển động).
 * Tự đổi cảnh mỗi 15s kiểu xáo bài, tạm dừng khi hover; chuyển cảnh "lật trang" 420ms.
 */
const STILL_T = 1
const MAX_DPR = 1.5
const FLIP_MS = 420
const ROTATE_MS = 15000
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const ALL = SCENES.map((_, i) => i)

const easeInOutCubic = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2)

function shuffled(items: number[]) {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Mép chéo quét trái → phải: cảnh mới lộ bên trái, cảnh cũ (ảnh chụp) đứng yên bên phải.
function drawFlip(ctx: Ctx, snapshot: HTMLCanvasElement, p: number, scale: number) {
  const top = p * (W + 30)
  const bottom = top - 30
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(top, 0)
  ctx.lineTo(W, 0)
  ctx.lineTo(W, H)
  ctx.lineTo(bottom, H)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(snapshot, 0, 0, W, H)
  ctx.restore()
  ctx.lineCap = 'butt'
  ctx.beginPath()
  ctx.moveTo(top, 0)
  ctx.lineTo(bottom, H)
  ctx.strokeStyle = INK
  ctx.lineWidth = 6 / scale
  ctx.stroke()
  ctx.strokeStyle = C.yellow
  ctx.lineWidth = 2.5 / scale
  ctx.stroke()
}

interface SceneEngine {
  show: (index: number) => void
}

interface UserHomeFactorySceneProps {
  mode: PaletteMode
}

export function UserHomeFactoryScene({ mode }: UserHomeFactorySceneProps) {
  const backRef = useRef<HTMLCanvasElement>(null)
  const frontRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<SceneEngine | null>(null)
  const bagRef = useRef<number[] | null>(null)
  const [scene, setScene] = useState(() => Math.floor(Math.random() * SCENES.length))
  const sceneRef = useRef(scene)
  const [hovered, setHovered] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia(REDUCED_MOTION).matches)
  const dark = mode === 'dark'

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION)
    const onChange = () => setReducedMotion(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const back = backRef.current
    const front = frontRef.current
    const bctx = back?.getContext('2d')
    const fctx = front?.getContext('2d')
    if (!back || !front || !bctx || !fctx) return

    const statics = createStatics()
    const motion = window.matchMedia(REDUCED_MOTION)
    const snapshot = document.createElement('canvas')
    const sctx = snapshot.getContext('2d')
    let current = sceneRef.current
    let flipStart = -1
    let scale = back.width / W
    let raf = 0
    let disposed = false
    let visible = true

    const paintBack = () => {
      bctx.setTransform(1, 0, 0, 1, 0, 0)
      bctx.clearRect(0, 0, back.width, back.height)
      bctx.setTransform(scale, 0, 0, scale, 0, 0)
      drawShellBack(bctx, dark, SCENES[current].sign)
      SCENES[current].drawBack(bctx, dark)
    }
    const paintFront = (now: number) => {
      const t = motion.matches ? STILL_T : (now / 1000) % LOOP
      fctx.setTransform(1, 0, 0, 1, 0, 0)
      fctx.clearRect(0, 0, front.width, front.height)
      fctx.setTransform(scale, 0, 0, scale, 0, 0)
      drawShellFront(fctx, statics, t, dark)
      SCENES[current].drawFront(fctx, statics, t, dark)
      if (flipStart >= 0) {
        const p = (now - flipStart) / FLIP_MS
        if (p >= 1) flipStart = -1
        else drawFlip(fctx, snapshot, easeInOutCubic(Math.max(0, p)), scale)
      }
    }
    const resize = () => {
      const cssWidth = back.clientWidth
      if (!cssWidth) return
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const pw = Math.round(cssWidth * dpr)
      const ph = Math.round((cssWidth * H * dpr) / W)
      if (back.width !== pw || back.height !== ph) {
        back.width = front.width = pw
        back.height = front.height = ph
      }
      scale = pw / W
      paintBack()
      paintFront(performance.now())
    }
    const tick = (now: number) => {
      paintFront(now)
      raf = requestAnimationFrame(tick)
    }
    const start = () => {
      cancelAnimationFrame(raf)
      raf = 0
      flipStart = -1
      paintFront(performance.now())
      if (!motion.matches && visible) raf = requestAnimationFrame(tick)
    }

    engineRef.current = {
      show(index) {
        if (index === current) return
        if (!motion.matches && sctx) {
          snapshot.width = back.width
          snapshot.height = back.height
          sctx.drawImage(back, 0, 0)
          sctx.drawImage(front, 0, 0)
          flipStart = performance.now()
        }
        current = index
        paintBack()
        paintFront(performance.now())
      },
    }

    const observer = new ResizeObserver(resize)
    observer.observe(back)
    // Cuộn khuất panel thì dừng vẽ
    const viewport = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible && !raf) start()
      else if (!visible) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    })
    viewport.observe(back)
    resize()
    start()
    motion.addEventListener('change', start)
    void document.fonts?.ready.then(() => {
      if (!disposed) paintBack()
    })

    return () => {
      disposed = true
      engineRef.current = null
      cancelAnimationFrame(raf)
      observer.disconnect()
      viewport.disconnect()
      motion.removeEventListener('change', start)
    }
  }, [dark])

  useEffect(() => {
    sceneRef.current = scene
    engineRef.current?.show(scene)
  }, [scene])

  // Xáo bài: chiếu đủ mọi cảnh rồi mới xáo lại, không lặp ngay cảnh vừa chiếu.
  useEffect(() => {
    if (hovered || reducedMotion || SCENES.length < 2) return
    const id = window.setTimeout(() => {
      let bag = bagRef.current ?? shuffled(ALL.filter((i) => i !== scene))
      if (bag.length === 0) {
        bag = shuffled(ALL)
        if (bag[0] === scene) bag.push(bag.shift() as number)
      }
      setScene(bag.shift() as number)
      bagRef.current = bag
    }, ROTATE_MS)
    return () => window.clearTimeout(id)
  }, [scene, hovered, reducedMotion])

  const selectScene = (index: number) => {
    bagRef.current = (bagRef.current ?? shuffled(ALL)).filter((i) => i !== index)
    setScene(index)
  }

  return (
    <Box onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Box
        role="img"
        aria-label={`Animated factory scene: ${SCENES[scene].title}`}
        sx={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          border: `2.5px solid ${INK}`,
          borderRadius: '12px',
          background: `
            linear-gradient(
              145deg,
              rgba(132, 211, 255, 0.14) 0%,
              rgba(35, 88, 126, 0.06) 50%,
              rgba(255, 255, 255, 0.04) 100%
            )
          `,
          // Không dùng backdrop-filter ở đây: card cha đã blur, lồng thêm sẽ phải blur lại mỗi frame.
          // Tách panel thành layer riêng để canvas đổi mỗi frame không kéo card vẽ lại.
          isolation: 'isolate',
          contain: 'layout paint',
          transform: 'translateZ(0)',
          boxShadow: dark
            ? `0 0 0 2px rgba(255,255,255,0.8), 4px 4px 0 2px ${INK}, inset 0 1px 0 rgba(235,250,255,0.25)`
            : `4px 4px 0 ${INK}, inset 0 1px 0 rgba(235,250,255,0.25)`,
          '& canvas': { display: 'block', width: '100%' },
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 32%)',
          },
        }}
      >
        <canvas ref={backRef} width={W * 2} height={H * 2} style={{ height: 'auto' }} />
        <canvas
          ref={frontRef}
          width={W * 2}
          height={H * 2}
          style={{ position: 'absolute', inset: 0, height: '100%' }}
        />
        <Box
          key={SCENES[scene].key}
          aria-hidden
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            px: 1,
            py: 0.2,
            color: INK,
            bgcolor: C.yellow,
            border: `2px solid ${INK}`,
            borderRadius: '6px',
            boxShadow: `2px 2px 0 ${INK}`,
            fontFamily: SIGN_FAMILY,
            fontSize: 13,
            letterSpacing: '0.06em',
            lineHeight: 1.2,
            pointerEvents: 'none',
            animation: 'factorySceneLabel 2.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both',
            '@keyframes factorySceneLabel': {
              '0%': { opacity: 0, transform: 'translateX(-120%)' },
              '14%, 82%': { opacity: 1, transform: 'translateX(0)' },
              '100%': { opacity: 0, transform: 'translateX(-120%)' },
            },
            '@media (prefers-reduced-motion: reduce)': { display: 'none' },
          }}
        >
          {SCENES[scene].title}
        </Box>
      </Box>

      <Box sx={{ mt: 1.2, display: 'flex', justifyContent: 'center', gap: 0.8 }}>
        {SCENES.map((item, i) => (
          <ButtonBase
            key={item.key}
            aria-label={`Show ${item.title}`}
            aria-pressed={i === scene}
            onClick={() => selectScene(i)}
            sx={{
              width: i === scene ? 22 : 9,
              height: 9,
              borderRadius: 999,
              border: `1.5px solid ${INK}`,
              bgcolor: i === scene ? C.yellow : 'rgba(255,255,255,0.55)',
              boxShadow: `1.5px 1.5px 0 ${INK}`,
              transition: 'width 220ms ease, background-color 220ms ease',
              '&:hover': { bgcolor: i === scene ? C.yellow : 'rgba(255,255,255,0.85)' },
            }}
          />
        ))}
      </Box>
    </Box>
  )
}
