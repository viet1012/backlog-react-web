import { C, INK, SIGN_FAMILY, TAU, W, H, LOOP, box, dot, glow, shadowBox, type Ctx, type Statics } from './primitives'

// Khung chung mọi cảnh: tường kính, mái răng cưa, cửa sổ, biển hiệu, đèn trần, vạch cảnh báo, sàn.
const WINDOWS = [
  { x: 10, y: 17, w: 48, h: 24 },
  { x: 262, y: 17, w: 48, h: 24 },
]
const SUN = { x: 22, y: 25 }
const LAMPS = [86, 234]
const STARS = [
  [16, 21], [33, 20], [44, 23], [52, 19], [40, 33], [51, 30],
  [268, 21], [279, 24], [289, 20], [307, 22],
]

export function drawShellBack(ctx: Ctx, dark: boolean, sign: string) {
  // Tường kính mờ: để lộ background phía sau
  ctx.fillStyle = dark ? 'rgba(28, 24, 64, 0.30)' : 'rgba(196, 228, 255, 0.10)'
  ctx.fillRect(0, 0, W, 89)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 32; x < W; x += 32) {
    ctx.moveTo(x, 14)
    ctx.lineTo(x, 84)
  }
  ctx.stroke()

  // Vệt nắng ban ngày / quầng đèn ban đêm
  ctx.fillStyle = dark ? 'rgba(255,210,63,0.10)' : 'rgba(255,210,63,0.16)'
  if (dark) {
    for (const x of LAMPS) {
      ctx.beginPath()
      ctx.moveTo(x - 3, 21)
      ctx.lineTo(x + 3, 21)
      ctx.lineTo(x + 24, 89)
      ctx.lineTo(x - 24, 89)
      ctx.closePath()
      ctx.fill()
    }
  } else {
    for (const x of [60, 140, 220]) {
      ctx.beginPath()
      ctx.moveTo(x, 12)
      ctx.lineTo(x + 8, 12)
      ctx.lineTo(x + 40, 89)
      ctx.lineTo(x + 24, 89)
      ctx.closePath()
      ctx.fill()
    }
  }

  // Mái răng cưa + kính mái
  ctx.beginPath()
  ctx.moveTo(0, 13)
  for (let x = 0; x < W; x += 20) {
    ctx.lineTo(x, 3)
    ctx.lineTo(x + 20, 13)
  }
  ctx.closePath()
  ctx.fillStyle = dark ? '#2B1D5C' : C.steel
  ctx.fill()
  ctx.strokeStyle = INK
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = dark ? '#4A3A8C' : '#BFEAFF'
  for (let x = 0; x < W; x += 20) ctx.fillRect(x + 0.8, 4.8, 2.2, 7.4)
  box(ctx, -2, 12, W + 4, 3, dark ? '#3B2F73' : C.midSteel, 0)

  // Cửa sổ
  for (const win of WINDOWS) {
    const sky = ctx.createLinearGradient(0, win.y, 0, win.y + win.h)
    sky.addColorStop(0, dark ? '#0B0A26' : '#5EC8FF')
    sky.addColorStop(1, dark ? '#2B1D5C' : '#BFEFFF')
    ctx.fillStyle = sky
    ctx.fillRect(win.x, win.y, win.w, win.h)
  }
  if (dark) {
    dot(ctx, SUN.x, SUN.y, 4.5, '#FFF4C8', 0.8)
    dot(ctx, SUN.x - 1.5, SUN.y - 1, 1, 'rgba(20,18,31,0.15)', 0)
    dot(ctx, SUN.x + 1.6, SUN.y + 1.4, 0.8, 'rgba(20,18,31,0.15)', 0)
  } else {
    dot(ctx, SUN.x, SUN.y, 4, C.yellow, 0.8)
  }
  ctx.fillStyle = dark ? '#151233' : '#8DA1C0'
  ctx.fillRect(264, 33, 14, 8)
  ctx.fillRect(278, 30, 12, 11)
  ctx.fillRect(296, 27, 4, 14)
  ctx.fillRect(302, 34, 8, 7)
  if (dark) {
    ctx.fillStyle = C.yellow
    for (const [x, y] of [[267, 35], [272, 35], [281, 33], [285, 33], [305, 36]]) ctx.fillRect(x, y, 1.6, 1.6)
  }
  for (const win of WINDOWS) {
    ctx.lineWidth = 1.5
    ctx.strokeStyle = INK
    ctx.strokeRect(win.x, win.y, win.w, win.h)
    box(ctx, win.x - 2, win.y + win.h, win.w + 4, 2.5, C.steel, 0.5, 1)
  }

  // Biển hiệu
  ctx.strokeStyle = INK
  ctx.lineWidth = 0.8
  ctx.beginPath()
  ctx.moveTo(124, 15)
  ctx.lineTo(124, 19)
  ctx.moveTo(196, 15)
  ctx.lineTo(196, 19)
  ctx.stroke()
  shadowBox(ctx, 112, 19, 96, 17, C.blue, 2, 1.4)
  ctx.beginPath()
  ctx.roundRect(113.8, 20.8, 92.4, 13.4, 1.2)
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'
  ctx.lineWidth = 0.7
  ctx.stroke()
  ctx.save()
  ctx.font = `11px ${SIGN_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  const k = Math.min(1, 84 / ctx.measureText(sign).width)
  ctx.translate(160, 28)
  ctx.scale(k, 1)
  ctx.lineWidth = 2.6
  ctx.strokeStyle = INK
  ctx.strokeText(sign, 0, 0)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(sign, 0, 0)
  ctx.restore()

  // Chao đèn trần
  for (const x of LAMPS) {
    ctx.strokeStyle = INK
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(x, 13)
    ctx.lineTo(x, 17)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x - 2, 17)
    ctx.lineTo(x + 2, 17)
    ctx.lineTo(x + 4.5, 21)
    ctx.lineTo(x - 4.5, 21)
    ctx.closePath()
    ctx.fillStyle = dark ? '#3B2F73' : C.steel
    ctx.fill()
    ctx.lineWidth = 1
    ctx.stroke()
  }

  // Vạch cảnh báo
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 84, W, 5)
  ctx.clip()
  ctx.fillStyle = C.yellow
  ctx.fillRect(0, 84, W, 5)
  ctx.fillStyle = INK
  for (let x = -8; x < W + 8; x += 8) {
    ctx.beginPath()
    ctx.moveTo(x, 89)
    ctx.lineTo(x + 4, 89)
    ctx.lineTo(x + 9, 84)
    ctx.lineTo(x + 5, 84)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()

  // Sàn + làn kẻ đứt
  ctx.fillStyle = dark ? 'rgba(37, 32, 74, 0.45)' : 'rgba(150, 190, 225, 0.22)'
  ctx.fillRect(0, 89, W, H - 89)
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 12; x < W + 12; x += 24) {
    ctx.moveTo(x, 89)
    ctx.lineTo(x - 8, H)
  }
  ctx.stroke()
  ctx.strokeStyle = INK
  ctx.beginPath()
  ctx.moveTo(0, 84)
  ctx.lineTo(W, 84)
  ctx.moveTo(0, 89)
  ctx.lineTo(W, 89)
  ctx.stroke()
  ctx.setLineDash([6, 4])
  ctx.strokeStyle = C.cyan
  ctx.lineWidth = 1.3
  ctx.beginPath()
  ctx.moveTo(0, 117)
  ctx.lineTo(W, 117)
  ctx.stroke()
  ctx.setLineDash([])
}

export function drawShellFront(ctx: Ctx, s: Statics, t: number, dark: boolean) {
  const [w0, w1] = WINDOWS
  const clouds = (win: (typeof WINDOWS)[number], offsets: number[], ys: number[]) => {
    offsets.forEach((off, i) => {
      // Trôi đúng 1 vòng mẫu (68 đơn vị) mỗi 24s
      const x = win.x - 14 + (((t / LOOP) * 68 + off) % 68)
      ctx.save()
      ctx.translate(x, ys[i])
      ctx.lineWidth = 1.6
      ctx.strokeStyle = INK
      ctx.stroke(s.cloud)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill(s.cloud)
      ctx.restore()
    })
  }

  ctx.save()
  ctx.beginPath()
  ctx.rect(w0.x + 0.75, w0.y + 0.75, w0.w - 1.5, w0.h - 1.5)
  ctx.clip()
  if (!dark) {
    const a0 = (t / 12) * TAU
    ctx.strokeStyle = C.yellow
    ctx.lineWidth = 1.3
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (let i = 0; i < 8; i++) {
      const a = a0 + (i * TAU) / 8
      ctx.moveTo(SUN.x + Math.cos(a) * 6, SUN.y + Math.sin(a) * 6)
      ctx.lineTo(SUN.x + Math.cos(a) * 8.5, SUN.y + Math.sin(a) * 8.5)
    }
    ctx.stroke()
    clouds(w0, [0, 34], [24, 33])
  }
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.rect(w1.x + 0.75, w1.y + 0.75, w1.w - 1.5, w1.h - 1.5)
  ctx.clip()
  if (!dark) clouds(w1, [20], [22])
  for (let i = 0; i < 3; i++) {
    const p = ((t + i) % 3) / 3
    ctx.globalAlpha = 0.85 * (1 - p)
    dot(ctx, 298 + p * 7, 26 - p * 11, 1.4 + p * 2.6, dark ? '#8C84B8' : '#FFFFFF', 0.6)
  }
  ctx.globalAlpha = 1
  ctx.restore()

  if (dark) {
    ctx.fillStyle = '#FFFFFF'
    STARS.forEach(([x, y], i) => {
      const period = [2, 3, 4][i % 3]
      ctx.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((TAU * t) / period + i * 1.7))
      ctx.fillRect(x - 0.4, y - 1.4, 0.8, 2.8)
      ctx.fillRect(x - 1.4, y - 0.4, 2.8, 0.8)
    })
    ctx.globalAlpha = 1
  }

  ctx.strokeStyle = INK
  ctx.lineWidth = 1.2
  ctx.beginPath()
  for (const win of WINDOWS) {
    ctx.moveTo(win.x + win.w / 2, win.y)
    ctx.lineTo(win.x + win.w / 2, win.y + win.h)
  }
  ctx.stroke()

  // Bóng đèn trần: sáng/tối dần, lệch pha
  LAMPS.forEach((x, i) => {
    if (dark) glow(ctx, s, x, 21, 14, '255,210,63', 0.7 + 0.2 * Math.sin((TAU * t) / 4 + i * Math.PI))
    dot(ctx, x, 21.5, 1.6, dark ? '#FFE89A' : '#FFF6D0', 0.6)
  })
}
