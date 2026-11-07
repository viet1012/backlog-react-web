import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

import { C, INK } from '../factoryScene/primitives'

/*
 * Texture vẽ bằng canvas cho kệ / thùng 3D: không tải gì từ mạng, chữ dùng font hệ thống (có dấu tiếng Việt).
 * Texture riêng từng thùng do component tự dispose; texture dùng chung (carton, sàn kệ, trụ, lưới) tạo 1 lần.
 */
const SANS = '"Segoe UI", system-ui, Roboto, Arial, sans-serif'
const MARKER = '"Segoe Print", "Comic Sans MS", "Segoe UI", cursive'
const STAMP = '"Arial Black", "Segoe UI Black", Arial, sans-serif'
const MONO = 'ui-monospace, Consolas, "Courier New", monospace'
const TAU = Math.PI * 2
// Nhãn có chữ vẽ gấp đôi độ phân giải (toạ độ vẽ giữ nguyên) để chữ nét khi camera lại gần
const LABEL_SCALE = 2

function createCanvas(width: number, height: number, scale = 1) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  ctx.scale(scale, scale)
  return { canvas, ctx }
}

function toTexture(canvas: HTMLCanvasElement, color = true) {
  const texture = new CanvasTexture(canvas)
  if (color) texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

// Thu nhỏ chữ tới `min`, vẫn tràn thì cắt "…"; trả về chuỗi sẽ vẽ (ctx.font đã đặt sẵn)
function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, min: number, weight: number, family: string) {
  let s = size
  ctx.font = `${weight} ${s}px ${family}`
  while (s > min && ctx.measureText(text).width > maxWidth) {
    s -= 2
    ctx.font = `${weight} ${s}px ${family}`
  }
  if (ctx.measureText(text).width <= maxWidth) return text
  let cut = text
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1)
  return `${cut}…`
}

// Icon SVG (đen) -> canvas tô màu
function tintedIcon(img: HTMLImageElement, color: string, size: number) {
  const { canvas, ctx } = createCanvas(size, size)
  ctx.drawImage(img, 0, 0, size, size)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = color
  ctx.fillRect(0, 0, size, size)
  return canvas
}

// Số giả ngẫu nhiên ổn định (vân giấy, mã vạch)
function rand(n: number) {
  const s = Math.sin(n * 12.9898) * 43758.5453
  return s - Math.floor(s)
}

// =========================================================
// THÙNG HÀNG
// =========================================================

export const STICKER_ASPECT = 3

interface StickerOptions {
  title: string
  hint?: string
  action: string
  group: string
  color: string
}

// Nhãn dán thùng "dùng ngay": tên trang, mô tả, nhóm, đèn xanh + VIEW/INPUT
export function readyStickerTexture({ title, hint, action, group, color }: StickerOptions) {
  const W = 768
  const H = W / STICKER_ASPECT
  const { canvas, ctx } = createCanvas(W, H, LABEL_SCALE)

  const paper = ctx.createLinearGradient(0, 0, 0, H)
  paper.addColorStop(0, '#fdfcf7')
  paper.addColorStop(1, '#f1efe6')
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 22, H)

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#1d2733'
  ctx.fillText(fitText(ctx, title, W - 90, 76, 40, 800, SANS), 52, 96)

  if (hint) {
    ctx.fillStyle = '#5b6774'
    ctx.fillText(fitText(ctx, hint, W - 90, 40, 26, 500, SANS), 52, 152)
  }

  ctx.strokeStyle = 'rgba(29, 39, 51, 0.2)'
  ctx.lineWidth = 3
  ctx.setLineDash([12, 9])
  ctx.beginPath()
  ctx.moveTo(52, 184)
  ctx.lineTo(W - 30, 184)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = color
  ctx.fillText(fitText(ctx, group, W * 0.55, 30, 20, 800, SANS), 52, 230)

  ctx.font = `800 28px ${SANS}`
  const actionWidth = ctx.measureText(action).width
  ctx.fillStyle = '#5b6774'
  ctx.fillText(action, W - 30 - actionWidth, 230)
  ctx.beginPath()
  ctx.arc(W - 30 - actionWidth - 22, 220, 10, 0, TAU)
  ctx.fillStyle = '#2ec46a'
  ctx.fill()

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)'
  ctx.lineWidth = 4
  ctx.strokeRect(2, 2, W - 4, H - 4)

  return toTexture(canvas)
}

// Biểu tượng in trên thùng carton
export function printedIconTexture(img: HTMLImageElement, color: string) {
  const { canvas, ctx } = createCanvas(256, 256, LABEL_SCALE)
  ctx.globalAlpha = 0.88
  ctx.drawImage(tintedIcon(img, color, 256 * LABEL_SCALE), 0, 0, 256, 256)
  return toTexture(canvas)
}

// Mặt trước thùng "sắp ra mắt": tên viết bút lông + băng keo vàng ghi trạng thái (nền trong suốt)
export function upcomingFaceTexture(title: string, status: string) {
  const W = 512
  const H = 394
  const { canvas, ctx } = createCanvas(W, H, LABEL_SCALE)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.save()
  ctx.translate(W / 2, H * 0.32)
  ctx.rotate(-0.05)
  ctx.fillStyle = 'rgba(50, 28, 8, 0.82)'
  ctx.fillText(fitText(ctx, title, W * 0.86, 80, 34, 700, MARKER), 0, 0)
  ctx.restore()

  ctx.save()
  ctx.translate(W / 2, H * 0.68)
  ctx.rotate(-0.035)
  ctx.fillStyle = C.yellow
  ctx.fillRect(-W * 0.6, -H * 0.1, W * 1.2, H * 0.2)
  ctx.fillStyle = INK
  ctx.fillRect(-W * 0.6, -H * 0.1, W * 1.2, 5)
  ctx.fillRect(-W * 0.6, H * 0.1 - 5, W * 1.2, 5)
  ctx.fillText(fitText(ctx, status.toUpperCase(), W * 0.86, 46, 22, 900, STAMP), 0, 2)
  ctx.restore()

  return toTexture(canvas)
}

// Mặt trước thùng nhựa "cần quyền": gân thùng, lỗ tay cầm, thẻ tên (nền trong suốt)
export function lockedFaceTexture(title: string, img: HTMLImageElement | undefined) {
  const W = 512
  const H = 394
  const { canvas, ctx } = createCanvas(W, H, LABEL_SCALE)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)'
  for (let y = 10; y < H; y += 22) ctx.fillRect(0, y, W, 3)

  ctx.fillStyle = 'rgba(10, 16, 24, 0.62)'
  ctx.beginPath()
  ctx.roundRect(W * 0.33, H * 0.08, W * 0.34, H * 0.12, 24)
  ctx.fill()

  ctx.fillStyle = 'rgba(242, 245, 248, 0.94)'
  ctx.beginPath()
  ctx.roundRect(W * 0.12, H * 0.3, W * 0.76, H * 0.58, 10)
  ctx.fill()

  if (img) {
    const size = H * 0.22
    ctx.drawImage(tintedIcon(img, '#6b7684', Math.round(size * LABEL_SCALE)), W / 2 - size / 2, H * 0.35, size, size)
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#3d4753'
  ctx.fillText(fitText(ctx, title, W * 0.68, 46, 22, 800, SANS), W / 2, H * 0.76)

  return toTexture(canvas)
}

export const TAG_ASPECT = 2

// Thẻ đỏ treo trên thùng khoá: ổ khoá + vai trò cần có
export function roleTagTexture(roles: string) {
  const W = 256
  const H = W / TAG_ASPECT
  const { canvas, ctx } = createCanvas(W, H, LABEL_SCALE)

  ctx.fillStyle = C.red
  ctx.strokeStyle = INK
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.roundRect(3, 3, W - 6, H - 6, 12)
  ctx.fill()
  ctx.stroke()

  // Lỗ xỏ dây
  ctx.fillStyle = '#f6d7da'
  ctx.beginPath()
  ctx.arc(24, H / 2, 8, 0, TAU)
  ctx.fill()

  // Ổ khoá
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(66, H / 2 - 8, 13, Math.PI, 0)
  ctx.stroke()
  ctx.fillRect(48, H / 2 - 8, 36, 30)

  ctx.textBaseline = 'middle'
  ctx.fillText(fitText(ctx, roles, W - 112, 44, 20, 900, SANS), 98, H / 2 + 2)

  return toTexture(canvas)
}

// =========================================================
// KỆ
// =========================================================

export const PLATE_ASPECT = 8

const BARCODE = Array.from({ length: 30 }, (_, i) => 2 + Math.floor(rand(i + 1) * 4))

// Nhãn vị trí kho trên thanh ngang: mã ô, tên tầng, số lượng, mã vạch
export function tierPlateTexture(code: string, label: string, count: number) {
  const W = 1024
  const H = W / PLATE_ASPECT
  const { canvas, ctx } = createCanvas(W, H, LABEL_SCALE)

  ctx.fillStyle = '#fdfdf8'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = INK
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, W - 6, H - 6)

  ctx.textBaseline = 'middle'
  ctx.fillStyle = INK
  ctx.font = `900 56px ${MONO}`
  ctx.fillText(code, 26, H / 2 + 2)
  const codeEnd = 26 + ctx.measureText(code).width + 22

  ctx.fillStyle = 'rgba(20, 18, 31, 0.3)'
  ctx.fillRect(codeEnd, 22, 3, H - 44)

  const barcodeWidth = 190
  const countText = String(count)
  ctx.font = `900 52px ${SANS}`
  const countWidth = ctx.measureText(countText).width
  const labelMax = W - codeEnd - 30 - countWidth - 30 - barcodeWidth - 30

  ctx.fillStyle = INK
  const labelText = fitText(ctx, label.toUpperCase(), labelMax, 50, 28, 800, SANS)
  ctx.fillText(labelText, codeEnd + 24, H / 2 + 2)
  const labelEnd = codeEnd + 24 + ctx.measureText(labelText).width

  ctx.font = `900 52px ${SANS}`
  ctx.fillStyle = '#ef7424'
  ctx.fillText(countText, labelEnd + 26, H / 2 + 2)

  ctx.fillStyle = INK
  let x = W - 30 - barcodeWidth
  BARCODE.forEach((width, i) => {
    if (i % 2 === 0) ctx.fillRect(x, 26, width * 2, H - 52)
    x += width * 2 + 2
  })

  return toTexture(canvas)
}

// =========================================================
// TEXTURE DÙNG CHUNG (tạo 1 lần)
// =========================================================

let cartonCache: Texture | null = null
let deckCache: Texture | null = null
let uprightCache: Texture | null = null
let meshCache: Texture | null = null

// Vân giấy carton (nhân với màu vật liệu)
export function cartonTexture() {
  if (cartonCache) return cartonCache
  const { canvas, ctx } = createCanvas(256, 256)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 900; i++) {
    const x = rand(i * 3 + 1) * 256
    const y = rand(i * 3 + 2) * 256
    const len = 4 + rand(i * 3 + 3) * 14
    ctx.strokeStyle = i % 2 ? 'rgba(90, 60, 30, 0.07)' : 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + len, y + (rand(i) - 0.5) * 3)
    ctx.stroke()
  }
  cartonCache = toTexture(canvas)
  return cartonCache
}

// Sàn kệ dạng tấm thép có rãnh
export function deckTexture() {
  if (deckCache) return deckCache
  const { canvas, ctx } = createCanvas(128, 128)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 128, 128)
  ctx.fillStyle = '#9aa3ad'
  for (let i = 0; i < 128; i += 32) {
    ctx.fillRect(i, 0, 4, 128)
    ctx.fillRect(0, i, 128, 3)
  }
  deckCache = toTexture(canvas)
  deckCache.wrapS = deckCache.wrapT = RepeatWrapping
  return deckCache
}

// Lỗ đột trên trụ kệ (lặp theo chiều cao)
export function uprightTexture() {
  if (uprightCache) return uprightCache
  const { canvas, ctx } = createCanvas(64, 128)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 64, 128)
  ctx.fillStyle = '#0d1b2a'
  ;[18, 76].forEach((y) => {
    ctx.beginPath()
    ctx.roundRect(25, y, 14, 34, 7)
    ctx.fill()
  })
  uprightCache = toTexture(canvas)
  uprightCache.wrapS = uprightCache.wrapT = RepeatWrapping
  return uprightCache
}

// Lưới thép cho lồng (dùng làm alphaMap: trắng = sợi thép)
export function meshAlphaTexture() {
  if (meshCache) return meshCache
  const S = 128
  const { canvas, ctx } = createCanvas(S, S)
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, S, S)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 7
  for (const offset of [-S, 0, S]) {
    ctx.beginPath()
    ctx.moveTo(offset, 0)
    ctx.lineTo(offset + S, S)
    ctx.moveTo(offset + S, 0)
    ctx.lineTo(offset, S)
    ctx.stroke()
  }
  meshCache = toTexture(canvas, false)
  meshCache.wrapS = meshCache.wrapT = RepeatWrapping
  return meshCache
}
