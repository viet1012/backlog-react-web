import {
  C,
  INK,
  TAU,
  box,
  breathe,
  dot,
  drawBeltFrame,
  drawBeltMotion,
  drawTowerBack,
  drawTowerLamps,
  drawWalker,
  drawWorker,
  ease,
  glow,
  hash,
  shadowBox,
  type FactoryScene,
} from './primitives'

const BOXES = [
  [12, 8, C.carton],
  [9, 6, C.carton],
  [11, 7, C.cyan],
  [10, 8, C.carton],
] as const

// Dây chuyền: cầu trục, bánh răng, băng chuyền thùng hàng, thợ hàn, công nhân đẩy xe.
export const lineScene: FactoryScene = {
  key: 'line',
  title: 'PRODUCTION LINE',
  sign: 'PRODUCTION LINE',

  drawBack(ctx) {
    for (const x of [70, 160, 250]) box(ctx, x - 2, 47, 4, 3, C.midSteel, 0.3, 0.8)
    box(ctx, 4, 44, 312, 3.4, C.yellow, 0.8, 1)
    drawBeltFrame(ctx, 62, 186, [84, 124, 164, 204, 228])
    drawTowerBack(ctx, 258)
    box(ctx, 268, 100, 2, 14, C.midSteel, 0.3, 0.8)
    box(ctx, 280, 100, 2, 14, C.midSteel, 0.3, 0.8)
    shadowBox(ctx, 265, 98, 20, 2.6, C.steel, 0.6, 1)
    box(ctx, 270, 93.5, 9, 4.5, C.midSteel, 0.5, 0.9)
  },

  drawFront(ctx, s, t) {
    // Bánh răng ăn khớp
    const ga = (t / 6) * TAU
    for (const [path, x, y, a] of [
      [s.gearA, 24, 64, ga],
      [s.gearB, 36.5, 73.3, (-ga * 10) / 7 + Math.PI / 7],
    ] as const) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(a)
      ctx.fillStyle = C.steel
      ctx.fill(path, 'evenodd')
      ctx.lineWidth = 1
      ctx.strokeStyle = INK
      ctx.stroke(path)
      ctx.restore()
    }

    // Cầu trục: đi–dừng easeInOut, tấm thép đung đưa theo gia tốc
    const tc = (t + 3) % 12
    let cx = 96
    let swing = 0
    let speed = 0
    if (tc < 4) {
      const u = tc / 4
      cx = 96 + 118 * ease(u)
      swing = 0.16 * Math.sin(TAU * u)
      speed = Math.sin(Math.PI * u)
    } else if (tc < 6) {
      cx = 214
    } else if (tc < 10) {
      const u = (tc - 6) / 4
      cx = 214 - 118 * ease(u)
      swing = -0.16 * Math.sin(TAU * u)
      speed = Math.sin(Math.PI * u)
    }
    swing += 0.035 * Math.sin((TAU * t) / 1.5)
    dot(ctx, cx - 4, 44.3, 1.4, C.darkSteel, 0.7)
    dot(ctx, cx + 4, 44.3, 1.4, C.darkSteel, 0.7)
    box(ctx, cx - 6, 47, 12, 4.5, C.orange, 1, 1)
    glow(ctx, s, cx, 49, 6, '255,210,63', 0.2 + 0.8 * speed * breathe(t, 0.5))
    ctx.save()
    ctx.translate(cx, 51.5)
    ctx.rotate(swing)
    ctx.strokeStyle = INK
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, 2.5)
    ctx.lineTo(-9, 4)
    ctx.moveTo(0, 2.5)
    ctx.lineTo(9, 4)
    ctx.stroke()
    box(ctx, -11, 4, 22, 3.6, C.steel, 0.6, 1)
    ctx.restore()

    // Băng chuyền: 12 đơn vị/s = 8 lần khoảng cách thùng (36) mỗi 24s
    const off = (t * 12) % 36
    ctx.save()
    ctx.beginPath()
    ctx.rect(62, 52, 186, 26)
    ctx.clip()
    drawBeltMotion(ctx, 62, 186, t, 12)
    const cycle = Math.floor(t / 3)
    for (let k = -1; k < 6; k++) {
      const [bw, bh, fill] = BOXES[(((k - cycle) % 4) + 4) % 4]
      const bx = 50 + off + k * 36
      box(ctx, bx, 67.5 - bh, bw, bh, fill, 0.8, 1)
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillRect(bx + bw / 2 - 0.8, 67.5 - bh + 0.5, 1.6, bh - 1)
    }
    ctx.restore()

    // Máy đầu vào: màn hình code + đèn vàng "đang check"
    shadowBox(ctx, 48, 55, 30, 23, C.blue, 2, 1.2)
    box(ctx, 52, 59, 14, 8, C.screen, 1, 0.8)
    ctx.fillStyle = C.green
    ctx.fillRect(54, 60.8, 7, 1)
    ctx.fillStyle = C.cyan
    ctx.fillRect(54, 62.6, 5, 1)
    if (Math.floor(t * 2) % 2 === 0) {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(60, 62.4, 1.4, 1.6)
    }
    glow(ctx, s, 72, 60, 7, '255,210,63', 0.35 + 0.65 * breathe(t, 2))
    dot(ctx, 72, 60, 1.8, C.yellow, 0.8)
    ctx.strokeStyle = INK
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.moveTo(52, 70.5)
    ctx.lineTo(74, 70.5)
    ctx.moveTo(52, 73.5)
    ctx.lineTo(74, 73.5)
    ctx.stroke()

    // Máy đầu ra: đèn xanh sáng đều
    shadowBox(ctx, 234, 57, 18, 21, C.orange, 2, 1.2)
    ctx.beginPath()
    for (const y of [66, 69, 72]) {
      ctx.moveTo(237, y)
      ctx.lineTo(249, y)
    }
    ctx.stroke()
    glow(ctx, s, 243, 61, 7, '46,160,90', 0.7)
    dot(ctx, 243, 61, 1.8, C.green, 0.8)

    drawTowerLamps(ctx, s, 258, 0, 0, 1)

    // Thợ hàn: hàn 2.8s / nghỉ 1.2s, ánh hàn chớp giật
    const welding = t % 4 < 2.8
    const flash = welding ? 0.55 + 0.45 * hash(Math.floor(t * 30)) : 0
    ctx.save()
    ctx.translate(290, 114)
    ctx.scale(-0.38, 0.38)
    drawWorker(ctx, 'weld', 0, 0, 0, flash)
    ctx.restore()
    if (welding) {
      glow(ctx, s, 279, 97.3, 16, '159,232,255', flash * 0.9)
      ctx.lineWidth = 0.8
      ctx.lineCap = 'round'
      for (let i = 0; i < 10; i++) {
        const ph = t / 0.5 + hash(i + 1)
        const p = ph % 1
        const seed = Math.floor(ph) * 13 + i
        const vx = (hash(seed) * 2 - 1) * 26 + 6
        const vy = -(12 + hash(seed + 7) * 28)
        const tau = p * 0.5
        const x = 279 + vx * tau
        const y = 97.3 + vy * tau + 70 * tau * tau
        ctx.globalAlpha = 1 - p
        ctx.strokeStyle = i % 3 ? C.yellow : '#FFFFFF'
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x - vx * 0.03, y - (vy + 140 * tau) * 0.03)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    }

    drawWalker(ctx, t, 34, 142, 'push')
  },
}
