import { C, INK, TAU, box, clamp01, dot, ease, glow, hash, limb, type Ctx, type FactoryScene } from './primitives'

// 5 bàn dev chia flex 10/10/12/10/10 trên x 14→306; bàn giữa là lead.
const FLEX = [10, 10, 12, 10, 10]
const UNIT = 292 / FLEX.reduce((a, b) => a + b, 0)
const DESKS = FLEX.map((f, i) => {
  const left = 14 + FLEX.slice(0, i).reduce((a, b) => a + b, 0) * UNIT
  const w = f * UNIT
  const lead = i === 2
  const mw = lead ? 38 : 30
  const mh = lead ? 22 : 19
  const my = lead ? 48 : 51
  return { left, w, cx: left + w / 2, mw, mh, my }
})
const SHIRTS = [C.blue, '#7B4FD6', C.green, C.red, C.cyan]
const HAIR = ['#2B1A12', '#4A2E1E', '#1B1B24', '#6B3E26', '#2B1A12']
const CODE_COLORS = [C.cyan, C.yellow, C.orange, '#7BE08A']
// Tốc độ cuộn (đơn vị/s) – mẫu 16 dòng × 3 = 48 đơn vị, nên tốc độ là bội của 2.
const SCROLL = [2, 4, 0, 6, 4]

function codeScreen(ctx: Ctx, m: number, x: number, y: number, w: number, h: number, t: number) {
  const scroll = t * SCROLL[m]
  const base = Math.floor(scroll / 3)
  const frac = scroll % 3
  const rows = Math.ceil(h / 3) + 1
  for (let j = 0; j < rows; j++) {
    const idx = (base + j) % 16
    const len = 3 + hash(idx + m * 31) * (w - 8)
    const indent = Math.floor(hash(idx * 7 + m) * 3) * 2
    ctx.fillStyle = CODE_COLORS[Math.floor(hash(idx + m * 17) * 4)]
    ctx.fillRect(x + 1.5 + indent, y + 1.2 + j * 3 - frac, len, 1.2)
  }
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(x + 1.5, y + h - 2.6, 1.4, 1.8)
  }
}

// Biểu đồ tải chạy ngang: 20 điểm × 2 đơn vị, cuộn 5 đơn vị/s (3 vòng mẫu / 24s).
function chartScreen(ctx: Ctx, x: number, y: number, w: number, h: number, t: number) {
  const scroll = t * 5
  const base = Math.floor(scroll / 2)
  const frac = scroll % 2
  ctx.beginPath()
  for (let j = 0; j <= Math.ceil(w / 2) + 1; j++) {
    const v = 0.25 + 0.6 * hash(((base + j) % 20) + 99)
    const px = x + j * 2 - frac
    const py = y + h - 1.5 - v * (h - 4)
    if (j === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.strokeStyle = C.cyan
  ctx.lineWidth = 0.9
  ctx.stroke()
  ctx.fillStyle = 'rgba(46,160,90,0.8)'
  ctx.fillRect(x + 1.5, y + 1.5, 9, 1.4)
  ctx.fillStyle = 'rgba(255,210,63,0.8)'
  ctx.fillRect(x + 1.5, y + 4, 6, 1.4)
}

// Tổ dev: phòng kính, 5 dev nhìn từ sau lưng.
export const devScene: FactoryScene = {
  key: 'dev',
  title: 'DEV TEAM',
  sign: 'DEV ROOM',

  drawBack(ctx, dark) {
    // Vách kính phòng dev
    ctx.fillStyle = dark ? 'rgba(47,211,224,0.06)' : 'rgba(47,211,224,0.10)'
    ctx.fillRect(6, 44, 308, 40)
    ctx.strokeStyle = 'rgba(20,18,31,0.55)'
    ctx.lineWidth = 1
    ctx.strokeRect(6, 44, 308, 40)
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'
    ctx.beginPath()
    for (const d of DESKS) {
      ctx.moveTo(d.left, 44)
      ctx.lineTo(d.left, 84)
    }
    for (let x = 12; x < 314; x += 26) {
      ctx.moveTo(x, 46)
      ctx.lineTo(x + 8, 54)
    }
    ctx.stroke()

    DESKS.forEach((d, i) => {
      box(ctx, d.left + 6, 79, 2.5, 33, C.midSteel, 0.4, 0.8)
      box(ctx, d.left + d.w - 8.5, 79, 2.5, 33, C.midSteel, 0.4, 0.8)
      box(ctx, d.left + 3, 76, d.w - 6, 3.2, '#C98B55', 0.8, 1)
      box(ctx, d.cx - 2, d.my + d.mh, 4, 76 - d.my - d.mh, C.darkSteel, 0.5, 0.8)
      box(ctx, d.cx - d.mw / 2, d.my, d.mw, d.mh, C.darkSteel, 1.5, 1.2)
      box(ctx, d.cx - d.mw / 2 + 2, d.my + 2, d.mw - 4, d.mh - 4, C.screen, 0.6, 0)
      if (i === 4) {
        box(ctx, d.cx + 17, 70.5, 5.5, 5.5, '#FFFFFF', 1, 0.9)
        ctx.beginPath()
        ctx.arc(d.cx + 23, 73.2, 1.8, -Math.PI / 2, Math.PI / 2)
        ctx.strokeStyle = INK
        ctx.lineWidth = 0.8
        ctx.stroke()
      }
    })
  },

  drawFront(ctx, s, t, dark) {
    DESKS.forEach((d, i) => {
      const sx = d.cx - d.mw / 2 + 2
      const sy = d.my + 2
      const sw = d.mw - 4
      const sh = d.mh - 4
      if (dark) glow(ctx, s, d.cx, d.my + d.mh / 2, d.mw * 0.75, '47,211,224', 0.35)
      ctx.save()
      ctx.beginPath()
      ctx.rect(sx, sy, sw, sh)
      ctx.clip()
      if (i === 2) chartScreen(ctx, sx, sy, sw, sh, t)
      else codeScreen(ctx, i, sx, sy, sw, sh, t)
      ctx.restore()

      // Gõ phím lệch nhịp: biên độ bật/tắt mềm theo chu kỳ 6s, lệch pha mỗi người
      const typing = ease(clamp01(0.5 + Math.sin((TAU * t) / 6 + i * 2.1) * 1.6))
      const tap = (phase: number) => typing * 0.8 * Math.sin((TAU * t) / 0.25 + phase)
      const bobX = i === 1 ? 1.1 * Math.sin((TAU * t) / 0.5) : 0

      // Gãi đầu: tay nâng/hạ dần trong 0.35s thay vì bật cứng
      const ts = t % 6
      const raise = i === 3 ? ease(clamp01(Math.min(ts / 0.35, (2 - ts) / 0.35))) : 0
      const scratch = Math.sin((TAU * t) / 0.25) * 1.2 * raise
      const rightHand = {
        x: d.cx + 11 + (d.cx + 7 + scratch - d.cx - 11) * raise,
        y: 77.5 + tap(i + Math.PI) * (1 - raise) + (68.5 - 77.5) * raise,
      }
      const rightArm = () => {
        limb(ctx, d.cx + 8, 82 - raise, rightHand.x, rightHand.y, SHIRTS[i], 2.6, 0.8)
        if (raise > 0.02) dot(ctx, rightHand.x, rightHand.y, 1.8, C.skin, 0.7)
      }

      limb(ctx, d.cx - 8, 82, d.cx - 11, 77.5 + tap(i), SHIRTS[i], 2.6, 0.8)
      if (raise < 0.5) rightArm()
      box(ctx, d.cx - 10, 78, 20, 16, SHIRTS[i], 5, 1)

      const hx = d.cx + bobX
      dot(ctx, hx - 6, 73, 1.6, C.skin, 0.7)
      dot(ctx, hx + 6, 73, 1.6, C.skin, 0.7)
      dot(ctx, hx, 72, 6, HAIR[i], 1)

      if (i === 1) {
        ctx.beginPath()
        ctx.arc(hx, 72, 7, Math.PI * 1.05, Math.PI * 1.95)
        ctx.strokeStyle = INK
        ctx.lineWidth = 2.2
        ctx.stroke()
        ctx.strokeStyle = C.red
        ctx.lineWidth = 1.2
        ctx.stroke()
        box(ctx, hx - 8.5, 70, 3.5, 5, C.red, 1, 0.8)
        box(ctx, hx + 5, 70, 3.5, 5, C.red, 1, 0.8)
      }
      if (i === 2) {
        ctx.beginPath()
        ctx.arc(hx, 71, 6.8, Math.PI, TAU)
        ctx.closePath()
        ctx.fillStyle = C.yellow
        ctx.fill()
        ctx.strokeStyle = INK
        ctx.lineWidth = 1
        ctx.stroke()
        box(ctx, hx - 8.5, 70, 17, 2.2, C.yellow, 1, 0.9)
      }
      if (raise >= 0.5) rightArm()

      // Ghế
      box(ctx, d.cx - 9, 86, 18, 15, C.darkSteel, 3, 1)
      box(ctx, d.cx - 1.5, 101, 3, 8, C.midSteel, 0.5, 0.8)
      box(ctx, d.cx - 9, 109, 18, 2, C.midSteel, 1, 0.8)
      dot(ctx, d.cx - 8, 112.5, 1.4, INK, 0)
      dot(ctx, d.cx + 8, 112.5, 1.4, INK, 0)
    })

    // Khói cà phê
    const mug = DESKS[4].cx + 19.7
    for (let i = 0; i < 3; i++) {
      const p = ((t / 2) + i / 3) % 1
      ctx.globalAlpha = 0.7 * (1 - p)
      dot(ctx, mug + Math.sin(p * TAU) * 1.2, 69.5 - p * 9, 0.8 + p * 1.4, '#FFFFFF', 0)
    }
    ctx.globalAlpha = 1

    // Đèn trạng thái phòng: xanh sáng đều
    glow(ctx, s, 310, 48, 6, '46,160,90', 0.6)
    dot(ctx, 310, 48, 1.5, C.green, 0.7)
  },
}
