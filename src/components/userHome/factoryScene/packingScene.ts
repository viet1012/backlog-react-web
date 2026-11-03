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
  drawWalker,
  ease,
  glow,
  limb,
  line,
  shadowBox,
  type FactoryScene,
} from './primitives'

/*
 * Nhịp 4s (6 nhịp / 24s):
 * - Băng sản phẩm 6 đơn vị/s, khoảng cách 24 → mỗi 4s có 1 sản phẩm tới điểm gắp.
 * - Tay robot gắp → thả vào thùng; băng thùng tiến 1 bước 40 đơn vị rồi dán băng keo, dán nhãn.
 */
const PICK = { x: 116, y: 61 }
const DROP = { x: 161, y: 52 }
const SHOULDER = { x: 136, y: 56 }
const L1 = 17
const L2 = 17
const PRODUCTS = [C.cyan, C.red, C.yellow]
const TAPE_X = 212
const LABEL_X = 232

function lerp(a: number, b: number, u: number) {
  return a + (b - a) * u
}

// Gắp theo cung: nhấc lên giữa đường
function tipAt(r: number) {
  if (r < 0.4) return { ...PICK, grip: ease(r / 0.4) }
  if (r < 1.6) {
    const u = ease((r - 0.4) / 1.2)
    return { x: lerp(PICK.x, DROP.x, u), y: lerp(PICK.y, DROP.y, u) - 12 * Math.sin(Math.PI * u), grip: 1 }
  }
  if (r < 2) {
    const u = (r - 1.6) / 0.4
    return { x: DROP.x, y: DROP.y + 4 * Math.sin(Math.PI * u), grip: r < 1.8 ? 1 : 1 - ease((r - 1.8) / 0.2) }
  }
  if (r < 3.4) {
    const u = ease((r - 2) / 1.4)
    return { x: lerp(DROP.x, PICK.x, u), y: lerp(DROP.y, PICK.y - 4, u) - 10 * Math.sin(Math.PI * u), grip: 0 }
  }
  return { x: PICK.x, y: PICK.y - 4 * (1 - ease((r - 3.4) / 0.6)), grip: 0 }
}

// IK 2 khớp, chọn nghiệm khuỷu tay hướng lên
function elbow(tx: number, ty: number) {
  const dx = tx - SHOULDER.x
  const dy = ty - SHOULDER.y
  const d = Math.min(Math.hypot(dx, dy), L1 + L2 - 0.01)
  const a = Math.atan2(dy, dx)
  const b = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))))
  const e1 = { x: SHOULDER.x + Math.cos(a - b) * L1, y: SHOULDER.y + Math.sin(a - b) * L1 }
  const e2 = { x: SHOULDER.x + Math.cos(a + b) * L1, y: SHOULDER.y + Math.sin(a + b) * L1 }
  return e1.y < e2.y ? e1 : e2
}

// Khu đóng gói: robot gắp sản phẩm vào thùng, dán băng keo, in nhãn, quấn màng pallet.
export const packingScene: FactoryScene = {
  key: 'packing',
  title: 'PACKING',
  sign: 'PACKING AREA',

  drawBack(ctx) {
    drawBeltFrame(ctx, 16, 104, [34, 70, 104])
    drawBeltFrame(ctx, 140, 116, [156, 200, 240])
    // Bệ robot
    shadowBox(ctx, 131, 60, 10, 24, C.darkSteel, 1.5, 1)
    // Đầu dán băng keo + máy in nhãn
    box(ctx, TAPE_X - 1, 44, 2, 6, C.midSteel, 0.3, 0.8)
    shadowBox(ctx, TAPE_X - 7, 48, 14, 6, C.blue, 1.2, 1)
    box(ctx, LABEL_X + 8, 44, 2, 6, C.midSteel, 0.3, 0.8)
    shadowBox(ctx, LABEL_X + 2, 46, 14, 8, C.orange, 1.2, 1)
    // Pallet + bàn xoay quấn màng
    box(ctx, 262, 82, 46, 3, C.darkSteel, 1, 1)
    box(ctx, 266, 78, 38, 4, '#A8743F', 0.6, 1)
    for (const [x, y, w] of [[268, 66, 17], [285, 66, 17], [271, 54, 15], [287, 54, 15]]) {
      box(ctx, x, y, w, 12, C.carton, 0.8, 1)
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillRect(x + w / 2 - 0.8, y + 0.5, 1.6, 11)
    }
    box(ctx, 311, 46, 2.5, 38, C.midSteel, 0.5, 0.8)
  },

  drawFront(ctx, s, t, dark) {
    const r = t % 4
    const cycle = Math.floor(t / 4)

    // Băng sản phẩm: sản phẩm qua điểm gắp thì đã nằm trên tay robot
    ctx.save()
    ctx.beginPath()
    ctx.rect(16, 52, 104, 26)
    ctx.clip()
    drawBeltMotion(ctx, 16, 104, t, 6)
    const off = (t * 6) % 24
    for (let k = -1; k < 5; k++) {
      const left = 16 + off + k * 24
      if (left >= 112) continue
      const n = ((((k - Math.floor(t / 4)) % 3) + 3) % 3)
      box(ctx, left, 61.5, 8, 6, PRODUCTS[n], 1.5, 0.9)
      ctx.fillStyle = 'rgba(255,255,255,0.4)'
      ctx.fillRect(left + 1.5, 62.5, 1.4, 4)
    }
    ctx.restore()
    shadowBox(ctx, 6, 54, 16, 24, C.blue, 2, 1.1)
    glow(ctx, s, 14, 59, 6, '255,210,63', 0.3 + 0.6 * breathe(t, 2))
    dot(ctx, 14, 59, 1.5, C.yellow, 0.7)

    // Băng thùng: đứng yên khi robot thả, tiến 40 đơn vị trong 2.4–3.6s
    const prog = ease(clamp01((r - 2.4) / 1.2))
    ctx.save()
    ctx.beginPath()
    ctx.rect(140, 40, 104, 38)
    ctx.clip()
    drawBeltMotion(ctx, 140, 116, (cycle * 40 + prog * 40) / 12, 12)
    for (let k = -1; k < 3; k++) {
      const left = 152 + 40 * (k + prog)
      box(ctx, left, 55.5, 18, 12, C.carton, 0.8, 1)
      // Nắp gập dần khi rời vị trí thả
      const fold = clamp01((left - 160) / 20)
      ctx.lineCap = 'round'
      for (const side of [-1, 1]) {
        const hx = side < 0 ? left : left + 18
        const ang = side < 0 ? -Math.PI / 2 - (1 - fold) * 0.7 + fold * (Math.PI / 2) : -Math.PI / 2 + (1 - fold) * 0.7 - fold * (Math.PI / 2)
        if (fold < 0.98) {
          const len = 8
          line(ctx, hx, 55.5, hx + Math.cos(ang) * len, 55.5 + Math.sin(ang) * len, INK, 2.6)
          line(ctx, hx, 55.5, hx + Math.cos(ang) * len, 55.5 + Math.sin(ang) * len, C.carton, 1.2)
        }
      }
      const tapeFrom = Math.max(left, TAPE_X)
      if (left + 18 > TAPE_X) {
        ctx.fillStyle = 'rgba(194,140,70,0.95)'
        ctx.fillRect(tapeFrom, 55, left + 18 - tapeFrom, 1.6)
      }
      if (left > LABEL_X + 0.01 || (Math.abs(left - LABEL_X) < 0.01 && r >= 1 && r < 3.6)) {
        box(ctx, left + 10, 59, 6, 5, '#FFFFFF', 0.4, 0.6)
        ctx.fillStyle = INK
        ctx.fillRect(left + 11, 60.2, 4, 0.6)
        ctx.fillRect(left + 11, 61.6, 3, 0.6)
      }
    }
    ctx.restore()
    shadowBox(ctx, 244, 58, 14, 20, C.orange, 2, 1.1)

    // Cuộn băng keo quay khi thùng đi qua, đèn máy in nháy lúc in
    ctx.save()
    ctx.translate(TAPE_X, 51)
    ctx.rotate(((cycle * 40 + prog * 40) / 40) * TAU)
    dot(ctx, 0, 0, 2.4, '#C28C46', 0.8)
    ctx.fillStyle = INK
    ctx.fillRect(-0.5, -2.4, 1, 1.6)
    ctx.restore()
    const printing = r >= 0.6 && r < 1 ? 1 : 0
    if (printing) {
      const drop = (r - 0.6) / 0.4
      box(ctx, LABEL_X + 10, 54 + drop * 4, 6, 3, '#FFFFFF', 0.4, 0.6)
    }
    glow(ctx, s, LABEL_X + 13, 49, 5, '46,160,90', 0.35 + 0.5 * printing)
    dot(ctx, LABEL_X + 13, 49, 1.2, C.green, 0.6)

    // Tay robot 2 khớp
    const tip = tipAt(r)
    const wrist = { x: tip.x, y: tip.y - 5 }
    const el = elbow(wrist.x, wrist.y)
    if (r < 1.8) box(ctx, tip.x - 4, tip.y - 0.5, 8, 6, PRODUCTS[((((4 - cycle) % 3) + 3) % 3)], 1.5, 0.9)
    limb(ctx, SHOULDER.x, SHOULDER.y, el.x, el.y, C.orange, 3.4, 0.9)
    limb(ctx, el.x, el.y, wrist.x, wrist.y, C.orange, 2.8, 0.9)
    dot(ctx, SHOULDER.x, SHOULDER.y, 2.6, C.darkSteel, 0.9)
    dot(ctx, el.x, el.y, 1.8, C.darkSteel, 0.8)
    box(ctx, wrist.x - 3.5, wrist.y - 0.5, 7, 2.2, C.darkSteel, 0.6, 0.8)
    const spread = 4.6 - tip.grip * 1.2
    line(ctx, wrist.x - spread, wrist.y + 1.5, wrist.x - spread, tip.y + 1.5, INK, 1.3)
    line(ctx, wrist.x + spread, wrist.y + 1.5, wrist.x + spread, tip.y + 1.5, INK, 1.3)

    // Bàn xoay quấn màng: sọc màng chạy ngang, cuộn màng lên xuống
    ctx.save()
    ctx.beginPath()
    ctx.rect(268, 54, 34, 24)
    ctx.clip()
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.32)'
    for (let x = 262 + ((t * 12) % 12); x < 304; x += 12) ctx.fillRect(x, 54, 4, 24)
    ctx.restore()
    const ry = 65 + 8 * Math.sin((TAU * t) / 6)
    line(ctx, 309, ry, 302, ry + 1, 'rgba(255,255,255,0.7)', 0.8)
    box(ctx, 307, ry - 4, 6, 8, '#EAF6FF', 1, 0.9)

    drawWalker(ctx, t, 30, 150, 'push')
  },
}
