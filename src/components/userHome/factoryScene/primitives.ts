/*
 * Hằng số + hàm vẽ dùng chung cho hoạt cảnh nhà máy.
 * Lưới thiết kế 320×120 đơn vị; mọi chu kỳ con chia hết LOOP (24s) để vòng lặp liền mạch.
 */
export const W = 320
export const H = 120
export const LOOP = 24
export const TAU = Math.PI * 2
export const INK = '#14121F'
export const SIGN_FAMILY = 'Bangers, Impact, "Arial Black", sans-serif'

export const C = {
  yellow: '#FFD23F',
  cyan: '#2FD3E0',
  orange: '#FF7A3D',
  red: '#E8384F',
  green: '#2EA05A',
  blue: '#2F7DE0',
  steel: '#9AA6BD',
  carton: '#D9A066',
  skin: '#F2C39B',
  darkSteel: '#3A3F55',
  midSteel: '#6E7A93',
  screen: '#0E1A2B',
}

export type Ctx = CanvasRenderingContext2D

export interface Statics {
  gearA: Path2D
  gearB: Path2D
  cloud: Path2D
  glows: Map<string, CanvasGradient>
}

export interface FactoryScene {
  key: string
  title: string
  sign: string
  drawBack: (ctx: Ctx, dark: boolean) => void
  drawFront: (ctx: Ctx, s: Statics, t: number, dark: boolean) => void
}

export const hash = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}
export const ease = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * u)
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const breathe = (t: number, period: number, phase = 0) => 0.5 + 0.5 * Math.sin((TAU * t) / period + phase)

export function box(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, r = 1, lw = 1) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fillStyle = fill
  ctx.fill()
  if (lw > 0) {
    ctx.lineWidth = lw
    ctx.strokeStyle = INK
    ctx.stroke()
  }
}

export function shadowBox(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, r = 1.5, lw = 1) {
  ctx.beginPath()
  ctx.roundRect(x + 1.5, y + 1.5, w, h, r)
  ctx.fillStyle = 'rgba(20, 18, 31, 0.35)'
  ctx.fill()
  box(ctx, x, y, w, h, fill, r, lw)
}

export function dot(ctx: Ctx, x: number, y: number, r: number, fill: string, lw = 1) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fillStyle = fill
  ctx.fill()
  if (lw > 0) {
    ctx.lineWidth = lw
    ctx.strokeStyle = INK
    ctx.stroke()
  }
}

export function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color = INK, lw = 1) {
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.stroke()
}

export function limb(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, w: number, ink = 2.6) {
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = INK
  ctx.lineWidth = w + ink * 2
  ctx.stroke()
  ctx.strokeStyle = color
  ctx.lineWidth = w
  ctx.stroke()
}

// Quầng sáng: shader cache theo (màu, bán kính), độ sáng chỉnh bằng globalAlpha.
export function glow(ctx: Ctx, s: Statics, x: number, y: number, r: number, rgb: string, alpha: number) {
  const key = `${rgb}|${r}`
  let g = s.glows.get(key)
  if (!g) {
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, r)
    g.addColorStop(0, `rgba(${rgb}, 0.9)`)
    g.addColorStop(0.35, `rgba(${rgb}, 0.35)`)
    g.addColorStop(1, `rgba(${rgb}, 0)`)
    s.glows.set(key, g)
  }
  ctx.save()
  ctx.translate(x, y)
  ctx.globalAlpha = alpha
  ctx.fillStyle = g
  ctx.fillRect(-r, -r, r * 2, r * 2)
  ctx.restore()
}

function gearPath(r: number, teeth: number, h: number) {
  const p = new Path2D()
  const step = TAU / teeth
  const pt = (ang: number, rad: number) => [Math.cos(ang) * rad, Math.sin(ang) * rad] as const
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    const [x0, y0] = pt(a - step * 0.25, r)
    if (i === 0) p.moveTo(x0, y0)
    else p.lineTo(x0, y0)
    p.lineTo(...pt(a - step * 0.13, r + h))
    p.lineTo(...pt(a + step * 0.13, r + h))
    p.lineTo(...pt(a + step * 0.25, r))
    p.arc(0, 0, r, a + step * 0.25, a + step * 0.75)
  }
  p.closePath()
  p.moveTo(r * 0.35, 0)
  p.arc(0, 0, r * 0.35, 0, TAU, true)
  return p
}

export function createStatics(): Statics {
  const cloud = new Path2D()
  cloud.moveTo(6, 0)
  cloud.arc(3, 0, 3, 0, TAU)
  cloud.moveTo(11, -2)
  cloud.arc(7, -2, 4, 0, TAU)
  cloud.moveTo(14, 0)
  cloud.arc(11, 0, 3, 0, TAU)
  cloud.rect(3, 0, 8, 3)
  return { gearA: gearPath(8, 10, 2), gearB: gearPath(5.6, 7, 2), cloud, glows: new Map() }
}

/* ───────── Băng chuyền dùng chung ───────── */

export function drawBeltFrame(ctx: Ctx, x: number, w: number, legs: number[]) {
  for (const lx of legs) box(ctx, lx - 1.5, 76, 3, 8, C.midSteel, 0.5, 0.8)
  box(ctx, x, 68.5, w, 8.5, C.darkSteel, 1.5, 1)
}

// Mặt băng + con lăn; pattern 12 đơn vị, con lăn quay theo quãng đường.
export function drawBeltMotion(ctx: Ctx, x: number, w: number, t: number, speed: number) {
  ctx.fillStyle = '#2A2D3E'
  ctx.fillRect(x, 67.5, w, 1.8)
  ctx.fillStyle = C.midSteel
  for (let dx = x - 12 + ((t * speed) % 12); dx < x + w; dx += 12) {
    ctx.fillRect(Math.max(dx, x), 67.8, Math.min(5, x + w - dx), 1.2)
  }
  const ra = (((t * speed) % 12) / 12) * TAU
  for (let rx = x + 8; rx < x + w - 2; rx += 14) dot(ctx, rx, 72.7, 2.5, C.midSteel, 0.8)
  ctx.strokeStyle = INK
  ctx.lineWidth = 0.7
  ctx.beginPath()
  for (let rx = x + 8; rx < x + w - 2; rx += 14) {
    ctx.moveTo(rx + Math.cos(ra) * 2, 72.7 + Math.sin(ra) * 2)
    ctx.lineTo(rx - Math.cos(ra) * 2, 72.7 - Math.sin(ra) * 2)
  }
  ctx.stroke()
}

export function drawTowerBack(ctx: Ctx, x: number) {
  box(ctx, x - 1, 52, 2.5, 32, C.midSteel, 0.5, 0.8)
  box(ctx, x - 5, 82, 10, 3, C.darkSteel, 1, 1)
}

// Tháp đèn đỏ/vàng/xanh; mỗi giá trị 0..1 là độ sáng.
export function drawTowerLamps(ctx: Ctx, s: Statics, x: number, red: number, yellow: number, green: number) {
  box(ctx, x - 3.5, 48, 7, 2, C.darkSteel, 0.6, 0.8)
  const lamps = [
    [50, C.red, red, '232,56,79'],
    [54, C.yellow, yellow, '255,210,63'],
    [58, C.green, green, '46,160,90'],
  ] as const
  for (const [y, fill, level] of lamps) {
    box(ctx, x - 3.5, y, 7, 4, fill, 0.4, 0.8)
    if (level < 1) {
      ctx.fillStyle = `rgba(20,18,31,${0.55 * (1 - level)})`
      ctx.fillRect(x - 3, y + 0.5, 6, 3)
    }
  }
  for (const [y, , level, rgb] of lamps) {
    if (level > 0.02) glow(ctx, s, x, y + 2, 10, rgb, 0.65 * level)
  }
}

/* ───────── Công nhân ───────── */

export type Pose = 'push' | 'weld' | 'clipboard'

function leg(ctx: Ctx, angle: number, color: string) {
  ctx.save()
  ctx.translate(0, -40)
  ctx.rotate(angle)
  box(ctx, -4.5, -2, 9, 38, color, 3, 2.6)
  box(ctx, -5, 33, 14, 7, '#3A2A1F', 2.5, 2.6)
  ctx.restore()
}

// Gốc toạ độ ở chân, quay phải, cao ~104 đơn vị gốc; vẽ với scale 0.38.
export function drawWorker(ctx: Ctx, pose: Pose, swing: number, bob: number, wheel: number, lens: number) {
  if (pose === 'push') {
    limb(ctx, 27, -60, 31, -20, C.midSteel, 2.6)
    box(ctx, 28, -23, 42, 5, C.steel, 1.5, 2.4)
    box(ctx, 33, -42, 17, 19, C.carton, 1.5, 2.4)
    box(ctx, 51, -35, 15, 12, C.cyan, 1.5, 2.4)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.fillRect(40.3, -41, 2.4, 17)
    for (const wx of [36, 62]) {
      dot(ctx, wx, -6, 5.5, C.darkSteel, 2.4)
      ctx.save()
      ctx.translate(wx, -6)
      ctx.rotate(wheel)
      ctx.fillStyle = C.steel
      ctx.fillRect(-4, -0.9, 8, 1.8)
      ctx.restore()
    }
  }

  ctx.save()
  ctx.translate(0, -bob)
  if (pose === 'clipboard') limb(ctx, -2, -72, -6 - swing * 18, -46, C.orange, 6.5)
  leg(ctx, -swing, '#22305A')
  leg(ctx, swing, '#2B3A67')

  box(ctx, -12, -80, 24, 42, C.orange, 5, 2.6)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(-10.7, -64, 21.4, 3.5)
  ctx.fillRect(-10.7, -54, 21.4, 3.5)

  dot(ctx, 3, -90, 10, C.skin, 2.6)
  if (pose === 'weld') {
    box(ctx, 4, -98, 12, 15, C.darkSteel, 2, 2.6)
    box(ctx, 8, -94, 7, 4, lens > 0 ? `rgba(159,232,255,${0.4 + 0.6 * lens})` : '#1B2233', 1, 1.6)
  } else {
    dot(ctx, 9.5, -91, 1.4, INK, 0)
  }
  ctx.beginPath()
  ctx.arc(2, -93, 11, Math.PI, TAU)
  ctx.closePath()
  ctx.fillStyle = C.yellow
  ctx.fill()
  ctx.lineWidth = 2.6
  ctx.strokeStyle = INK
  ctx.stroke()
  box(ctx, -10, -95, 27, 3.6, C.yellow, 1.8, 2.2)

  if (pose === 'clipboard') {
    limb(ctx, 2, -72, 16, -64, C.orange, 7)
    box(ctx, 14, -76, 11, 14, '#F4F1E8', 1.2, 2.2)
    box(ctx, 17, -78, 5, 3, C.midSteel, 0.8, 1.6)
    ctx.fillStyle = C.midSteel
    ctx.fillRect(16.5, -71, 6, 1.4)
    ctx.fillRect(16.5, -67.5, 4, 1.4)
    dot(ctx, 16, -64, 3.4, C.skin, 2.2)
  }
  ctx.restore()

  if (pose === 'push') {
    limb(ctx, 2, -72 - bob, 25, -59, C.orange, 7)
    dot(ctx, 26, -59, 3.6, C.skin, 2.2)
  } else if (pose === 'weld') {
    limb(ctx, 2, -72, 20, -52, C.orange, 7)
    limb(ctx, 20, -52, 29, -44, C.darkSteel, 3)
    dot(ctx, 20, -52, 3.6, C.skin, 2.2)
  }
}

/*
 * Đi qua lại trong 12s: đi 5s (easeInOut) – quay đầu 1s kiểu "lật giấy" (scaleX qua 0).
 * Bước chân + bánh xe theo quãng đường nên đứng lại là thôi bước.
 */
export function drawWalker(ctx: Ctx, t: number, from: number, span: number, pose: Pose) {
  const tw = t % 12
  let x = from
  let dist = 0
  let sx = 1
  if (tw < 5) {
    const u = ease(tw / 5)
    x = from + span * u
    dist = span * u
  } else if (tw < 6) {
    x = from + span
    dist = span
    sx = Math.cos(Math.PI * (tw - 5))
  } else if (tw < 11) {
    const u = ease((tw - 6) / 5)
    x = from + span - span * u
    dist = span + span * u
    sx = -1
  } else {
    dist = 2 * span
    sx = -Math.cos(Math.PI * (tw - 11))
  }
  const steps = Math.max(1, Math.round(span / 20))
  const stride = Math.sin((dist / span) * steps * TAU)
  ctx.save()
  ctx.translate(x, 114)
  ctx.scale(sx * 0.38, 0.38)
  drawWorker(ctx, pose, 0.42 * stride, Math.abs(stride) * 1.8, (dist / (2 * span)) * Math.round(span / 6) * TAU, 0)
  ctx.restore()
}
