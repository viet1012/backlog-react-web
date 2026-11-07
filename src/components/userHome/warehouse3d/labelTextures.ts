import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

import { C, INK } from '../factoryScene/primitives'

/*
 * Texture vẽ bằng canvas cho kệ / thùng 3D (không tải gì từ mạng).
 * Chỉ vẽ phần hình (giấy, vạch màu, băng keo, mã vạch...); CHỮ vẽ bằng SDF (FitText) đặt chồng lên,
 * vì chữ trong texture bị mờ khi thu nhỏ trên màn hình. Các hằng *_LAYOUT là toạ độ (tỉ lệ 0..1 tính từ
 * mép trái / mép trên) để component đặt chữ khớp với hình.
 * Texture riêng từng thùng do component tự dispose; texture dùng chung (carton, sàn kệ, trụ, lưới) tạo 1 lần.
 */
const TAU = Math.PI * 2
// Vẽ gấp đôi độ phân giải (toạ độ vẽ giữ nguyên) để nét viền / icon không bị bết
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

export const STICKER_ASPECT = 2.3

export const STICKER_LAYOUT = {
  // Mép trái vùng chữ / mép phải vùng chữ
  left: 0.08,
  right: 0.95,
  // Vùng tên trang (từ trên xuống)
  titleTop: 0.08,
  titleBottom: 0.62,
  // Vạch đứt ngăn cách; dòng nhóm + hành động nằm giữa vạch và mép dưới
  divider: 0.66,
}

// Nhãn dán thùng "dùng ngay": giấy + vạch màu nhóm + vạch đứt (chữ đặt chồng bằng SDF)
export function readyStickerTexture(color: string) {
  const W = 512
  const H = Math.round(W / STICKER_ASPECT)
  const { canvas, ctx } = createCanvas(W, H, LABEL_SCALE)

  const paper = ctx.createLinearGradient(0, 0, 0, H)
  paper.addColorStop(0, '#fdfcf7')
  paper.addColorStop(1, '#f1efe6')
  ctx.fillStyle = paper
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, W * 0.035, H)

  ctx.strokeStyle = 'rgba(29, 39, 51, 0.22)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 6])
  ctx.beginPath()
  ctx.moveTo(W * STICKER_LAYOUT.left, H * STICKER_LAYOUT.divider)
  ctx.lineTo(W * STICKER_LAYOUT.right, H * STICKER_LAYOUT.divider)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.14)'
  ctx.lineWidth = 3
  ctx.strokeRect(1.5, 1.5, W - 3, H - 3)

  return toTexture(canvas)
}

// Biểu tượng in trên thùng carton
export function printedIconTexture(img: HTMLImageElement, color: string) {
  const { canvas, ctx } = createCanvas(256, 256, LABEL_SCALE)
  ctx.globalAlpha = 0.88
  ctx.drawImage(tintedIcon(img, color, 256 * LABEL_SCALE), 0, 0, 256, 256)
  return toTexture(canvas)
}

// Mặt trước thùng (tỉ lệ = CRATE_RATIO)
const FACE_W = 512
const FACE_H = 394

export const UPCOMING_LAYOUT = {
  // Tâm dòng tên viết tay
  titleY: 0.32,
  titleTilt: -0.05,
  // Băng keo vàng ghi trạng thái
  tapeY: 0.68,
  tapeHeight: 0.2,
  tapeTilt: -0.035,
}

// Mặt trước thùng "sắp ra mắt": băng keo vàng viền mực (nền trong suốt; tên + trạng thái đặt chồng bằng SDF)
export function upcomingFaceTexture() {
  const W = FACE_W
  const H = FACE_H
  const { canvas, ctx } = createCanvas(W, H, LABEL_SCALE)
  const tapeH = H * UPCOMING_LAYOUT.tapeHeight

  ctx.translate(W / 2, H * UPCOMING_LAYOUT.tapeY)
  ctx.rotate(UPCOMING_LAYOUT.tapeTilt)
  ctx.fillStyle = C.yellow
  ctx.fillRect(-W * 0.6, -tapeH / 2, W * 1.2, tapeH)
  ctx.fillStyle = INK
  ctx.fillRect(-W * 0.6, -tapeH / 2, W * 1.2, 5)
  ctx.fillRect(-W * 0.6, tapeH / 2 - 5, W * 1.2, 5)

  return toTexture(canvas)
}

export const LOCKED_LAYOUT = {
  // Tâm tên trang trên thẻ tên / chiều cao vùng chữ
  titleY: 0.73,
  titleHeight: 0.26,
  titleWidth: 0.68,
}

// Mặt trước thùng nhựa "cần quyền": gân thùng, lỗ tay cầm, thẻ tên + icon (nền trong suốt)
export function lockedFaceTexture(img: HTMLImageElement | undefined) {
  const W = FACE_W
  const H = FACE_H
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
    const size = H * 0.2
    ctx.drawImage(tintedIcon(img, '#6b7684', Math.round(size * LABEL_SCALE)), W / 2 - size / 2, H * 0.36, size, size)
  }

  return toTexture(canvas)
}

export const TAG_ASPECT = 2

export const TAG_LAYOUT = {
  // Chữ vai trò bắt đầu sau ổ khoá
  textLeft: 0.38,
  textRight: 0.94,
}

// Thẻ đỏ treo trên thùng khoá: lỗ xỏ dây + ổ khoá (vai trò đặt chồng bằng SDF)
export function roleTagTexture() {
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

  return toTexture(canvas)
}

// =========================================================
// KỆ
// =========================================================

export const PLATE_ASPECT = 8

const BARCODE = Array.from({ length: 30 }, (_, i) => 2 + Math.floor(rand(i + 1) * 4))

export const PLATE_LAYOUT = {
  codeLeft: 0.028,
  // Vạch ngăn sau mã ô
  divider: 0.2,
  labelLeft: 0.225,
  // Số lượng canh phải sát trước mã vạch
  countRight: 0.77,
  barcodeLeft: 0.79,
}

// Nhãn vị trí kho trên thanh ngang: viền, vạch ngăn, mã vạch (mã ô, tên tầng, số lượng đặt chồng bằng SDF)
export function tierPlateTexture() {
  const W = 1024
  const H = W / PLATE_ASPECT
  const { canvas, ctx } = createCanvas(W, H, LABEL_SCALE)

  ctx.fillStyle = '#fdfdf8'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = INK
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, W - 6, H - 6)

  ctx.fillStyle = 'rgba(20, 18, 31, 0.3)'
  ctx.fillRect(W * PLATE_LAYOUT.divider, 22, 3, H - 44)

  ctx.fillStyle = INK
  let x = W * PLATE_LAYOUT.barcodeLeft
  BARCODE.forEach((width, i) => {
    // Không vẽ đè viền phải
    if (i % 2 === 0 && x + width * 2 <= W - 26) ctx.fillRect(x, 26, width * 2, H - 52)
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
