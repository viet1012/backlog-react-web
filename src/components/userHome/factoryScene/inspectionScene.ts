import {
  C,
  INK,
  TAU,
  box,
  breathe,
  clamp01,
  dot,
  drawBeltFrame,
  drawBeltMotion,
  drawTowerBack,
  drawTowerLamps,
  drawWalker,
  glow,
  hash,
  limb,
  line,
  shadowBox,
  type Ctx,
  type FactoryScene,
} from './primitives'

// 6 loại phôi lặp lại (6 nhịp × 4s = 24s); loại 4 là hàng lỗi (NG).
const PARTS = [C.steel, C.cyan, C.steel, C.orange, C.steel, C.steel]
const NG = 4
const SPEED = 10
const GAP = 40

function badge(ctx: Ctx, x: number, y: number, scale: number, ok: boolean) {
  const r = 3.3 * scale
  dot(ctx, x, y, r, ok ? C.green : C.red, 0.9)
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 1.1 * scale
  ctx.lineCap = 'round'
  ctx.beginPath()
  if (ok) {
    ctx.moveTo(x - 1.6 * scale, y)
    ctx.lineTo(x - 0.4 * scale, y + 1.3 * scale)
    ctx.lineTo(x + 1.7 * scale, y - 1.3 * scale)
  } else {
    ctx.moveTo(x - 1.3 * scale, y - 1.3 * scale)
    ctx.lineTo(x + 1.3 * scale, y + 1.3 * scale)
    ctx.moveTo(x + 1.3 * scale, y - 1.3 * scale)
    ctx.lineTo(x - 1.3 * scale, y + 1.3 * scale)
  }
  ctx.stroke()
}

// Khu kiểm tra: cổng camera quét laser, phôi được gắn OK/NG, thanh tra đi tuần, bàn QC.
export const inspectionScene: FactoryScene = {
  key: 'inspection',
  title: 'INSPECTION',
  sign: 'INSPECTION',

  drawBack(ctx) {
    drawBeltFrame(ctx, 30, 232, [52, 96, 136, 184, 228])
    // Cổng camera
    box(ctx, 146, 46, 4, 30, C.midSteel, 0.5, 1)
    box(ctx, 170, 46, 4, 30, C.midSteel, 0.5, 1)
    shadowBox(ctx, 143, 42, 34, 6, C.blue, 1.5, 1.1)
    box(ctx, 155, 48, 10, 6, C.darkSteel, 1.2, 1)
    // Màn hình chất lượng
    shadowBox(ctx, 192, 45, 46, 15, C.darkSteel, 1.5, 1.1)
    box(ctx, 194, 47, 42, 11, C.screen, 0.6, 0)
    drawTowerBack(ctx, 270)
    // Bàn QC
    box(ctx, 281, 98, 2, 16, C.midSteel, 0.3, 0.8)
    box(ctx, 309, 98, 2, 16, C.midSteel, 0.3, 0.8)
    shadowBox(ctx, 278, 96, 36, 2.6, C.steel, 0.6, 1)
    box(ctx, 283, 92, 8, 4, C.midSteel, 0.6, 0.8)
    box(ctx, 297, 92.5, 2, 3.5, C.midSteel, 0.3, 0.7)
  },

  drawFront(ctx, s, t, dark) {
    // Biểu đồ tỉ lệ đạt: 12 cột × 4 đơn vị, cuộn 2 đơn vị/s
    ctx.save()
    ctx.beginPath()
    ctx.rect(194, 47, 42, 11)
    ctx.clip()
    const scroll = t * 2
    const base = Math.floor(scroll / 4)
    for (let j = 0; j < 13; j++) {
      const idx = (base + j) % 12
      const hgt = 3 + hash(idx + 41) * 6
      ctx.fillStyle = idx === 7 ? C.red : C.green
      ctx.fillRect(195 + j * 4 - (scroll % 4), 57.5 - hgt, 2.5, hgt)
    }
    ctx.restore()
    line(ctx, 194, 50, 236, 50, 'rgba(255,210,63,0.8)', 0.5)

    // Băng chuyền + phôi
    const off = (t * SPEED) % GAP
    const cycle = Math.floor(t / 4)
    let ngCenter = -1
    ctx.save()
    ctx.beginPath()
    ctx.rect(30, 48, 216, 30)
    ctx.clip()
    drawBeltMotion(ctx, 30, 232, t, SPEED)
    for (let k = -1; k < 7; k++) {
      const type = (((k - cycle) % 6) + 6) % 6
      const left = 18 + off + k * GAP
      const cx = left + 6
      box(ctx, left, 61.5, 12, 6, PARTS[type], 1, 1)
      dot(ctx, cx, 64.5, 1.3, C.darkSteel, 0.6)
      if (type === NG) {
        ngCenter = cx
        line(ctx, left + 2, 62.5, left + 4.5, 66.5, C.red, 0.8)
      }
      if (cx > 170) {
        const sc = clamp01((cx - 170) / 5)
        badge(ctx, cx, 55.5, sc * (1 + 0.25 * Math.sin(Math.PI * sc)), type !== NG)
      }
    }
    ctx.restore()

    // Laser quét qua lại trong cổng
    const lx = 160 + 6 * Math.sin((TAU * t) / 1)
    ctx.fillStyle = 'rgba(232,56,79,0.22)'
    ctx.beginPath()
    ctx.moveTo(160, 54)
    ctx.lineTo(lx - 2.5, 67.5)
    ctx.lineTo(lx + 2.5, 67.5)
    ctx.closePath()
    ctx.fill()
    line(ctx, lx - 3, 67.3, lx + 3, 67.3, C.red, 0.9)
    glow(ctx, s, lx, 67, 5, '232,56,79', dark ? 0.7 : 0.45)
    const scanning = ngCenter > 152 && ngCenter < 168
    dot(ctx, 160, 51, 1.6, scanning ? C.red : C.cyan, 0.7)

    // Máy đầu vào / đầu ra
    shadowBox(ctx, 20, 56, 24, 22, C.blue, 2, 1.2)
    ctx.strokeStyle = INK
    ctx.lineWidth = 0.6
    ctx.beginPath()
    for (const y of [64, 67, 70]) {
      ctx.moveTo(24, y)
      ctx.lineTo(40, y)
    }
    ctx.stroke()
    shadowBox(ctx, 246, 57, 16, 21, C.orange, 2, 1.2)
    glow(ctx, s, 254, 61, 6, '46,160,90', 0.7)
    dot(ctx, 254, 61, 1.6, C.green, 0.8)

    // Tháp đèn: đỏ "thở" khi có hàng NG vừa qua cổng
    const alert = clamp01((ngCenter - 168) / 6) * clamp01((246 - ngCenter) / 6)
    drawTowerLamps(ctx, s, 270, alert * (0.35 + 0.65 * breathe(t, 0.5)), 0, 1 - alert * 0.85)

    // Bàn QC: đồng hồ so dao động, kính lúp loé sáng
    dot(ctx, 298, 88, 5, '#FFFFFF', 1)
    const needle = -Math.PI / 2 + 0.6 * Math.sin((TAU * t) / 3) + 0.08 * Math.sin((TAU * t) / 0.25)
    line(ctx, 298, 88, 298 + Math.cos(needle) * 3.8, 88 + Math.sin(needle) * 3.8, C.red, 0.9)
    dot(ctx, 298, 88, 0.9, INK, 0)
    limb(ctx, 287, 96, 289, 85, C.midSteel, 1.2, 0.7)
    dot(ctx, 289, 82, 4, 'rgba(191,234,255,0.45)', 1)
    ctx.globalAlpha = 0.3 + 0.7 * breathe(t, 3)
    ctx.beginPath()
    ctx.arc(289, 82, 2.6, Math.PI * 1.1, Math.PI * 1.55)
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 0.9
    ctx.stroke()
    ctx.globalAlpha = 1

    drawWalker(ctx, t, 36, 110, 'clipboard')
  },
}
