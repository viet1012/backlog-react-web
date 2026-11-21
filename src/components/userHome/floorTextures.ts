/*
 * Texture sàn epoxy xưởng (theo ảnh xưởng thật), vẽ bằng SVG data URI, tạo 1 lần mỗi chế độ sáng / tối.
 * Mọi lớp đều tĩnh; được lát lặp trên mặt sàn nghiêng (phối cảnh tự làm lớp ở gần to, ở xa nhỏ).
 *
 * Thứ tự lớp (trên -> dưới) do UserHomeBackdrop ghép:
 *   bong sơn (đè cả vạch vàng) -> vết xước -> vết bánh xe -> vạch vàng -> mạch cắt có gờ -> mảng vá
 *   -> vùng mòn sáng -> loang tối vừa -> loang lớn -> hạt thô -> đốm cốt liệu
 */

type Rgb = [number, number, number]

interface NoiseOptions {
  octaves?: number
  // Màu chấm (0..1), mặc định đen
  color?: Rgb
  // Ngưỡng: chỉ phần nhiễu vượt ngưỡng mới hiện (mảng có ranh giới rõ); bỏ trống = chuyển mềm
  threshold?: number
  seed?: number
}

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

function noise(freq: number | string, alpha: number, size: number, options: NoiseOptions = {}) {
  const { octaves = 2, color = [0, 0, 0], threshold, seed = 1 } = options
  const [r, g, b] = color
  // Có ngưỡng: A = k * (nhiễu - ngưỡng), nhiễu ~0.2..0.8 nên k = alpha / (0.8 - ngưỡng)
  const alphaRow = threshold === undefined
    ? `${alpha} 0 0 0 0`
    : `${(alpha / (0.8 - threshold)).toFixed(3)} 0 0 0 ${(-(alpha / (0.8 - threshold)) * threshold).toFixed(3)}`
  return svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>`
    + `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch'/>`
    + `<feColorMatrix values='0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  ${alphaRow}'/></filter>`
    + `<rect width='100%' height='100%' filter='url(#n)'/></svg>`,
  )
}

// Số giả ngẫu nhiên ổn định (vết xước / bánh xe giống nhau mỗi lần tải)
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Vết bánh xe: từng cặp vệt cong song song (2 bánh), mờ nhoè
function tireMarks(alpha: number, w: number, h: number) {
  const rand = rng(7)
  let paths = ''
  for (let i = 0; i < 6; i++) {
    const x0 = rand() * w
    const y0 = rand() * h
    const dx = (rand() - 0.5) * w * 0.9
    const dy = (rand() - 0.2) * h * 0.8
    const bend = (rand() - 0.5) * 260
    const width = 7 + rand() * 6
    const gap = 26 + rand() * 10
    const opacity = (0.45 + rand() * 0.55) * alpha
    for (const offset of [0, gap]) {
      paths += `<path d='M${x0 + offset} ${y0} C ${x0 + offset + bend} ${y0 + dy * 0.35}, ${x0 + offset + dx - bend} ${y0 + dy * 0.65}, ${x0 + offset + dx} ${y0 + dy}' `
        + `stroke='#000' stroke-opacity='${opacity.toFixed(3)}' stroke-width='${width.toFixed(1)}' fill='none' stroke-linecap='round'/>`
    }
  }
  return svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>`
    + `<filter id='b' x='-10%' y='-10%' width='120%' height='120%'><feGaussianBlur stdDeviation='3.5'/></filter>`
    + `<g filter='url(#b)'>${paths}</g></svg>`,
  )
}

// Vết xước ngắn, mảnh, nhiều hướng (sáng hơn nền: lớp epoxy bị cào lộ màu nhạt)
function scratches(alpha: number, size: number) {
  const rand = rng(31)
  let lines = ''
  for (let i = 0; i < 70; i++) {
    const x = rand() * size
    const y = rand() * size
    const angle = rand() * Math.PI
    const length = 8 + rand() * 46
    const x2 = x + Math.cos(angle) * length
    const y2 = y + Math.sin(angle) * length
    lines += `<line x1='${x.toFixed(1)}' y1='${y.toFixed(1)}' x2='${x2.toFixed(1)}' y2='${y2.toFixed(1)}' `
      + `stroke='#fff' stroke-opacity='${((0.4 + rand() * 0.6) * alpha).toFixed(3)}' stroke-width='${(0.6 + rand() * 1.1).toFixed(2)}'/>`
  }
  return svgUrl(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>${lines}</svg>`)
}

// Mảng vá sàn: vài hình chữ nhật đậm / nhạt hơn nền, mép hơi nhoè
function repairPatches(alpha: number, w: number, h: number) {
  const rand = rng(53)
  let rects = ''
  for (let i = 0; i < 4; i++) {
    const pw = 120 + rand() * 220
    const ph = 90 + rand() * 160
    const light = rand() > 0.5
    rects += `<rect x='${(rand() * (w - pw)).toFixed(0)}' y='${(rand() * (h - ph)).toFixed(0)}' width='${pw.toFixed(0)}' height='${ph.toFixed(0)}' `
      + `fill='${light ? '#fff' : '#000'}' fill-opacity='${((light ? 0.7 : 1) * alpha).toFixed(3)}'/>`
  }
  return svgUrl(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>`
    + `<filter id='b'><feGaussianBlur stdDeviation='2'/></filter><g filter='url(#b)'>${rects}</g></svg>`,
  )
}

export interface FloorLayer {
  image: string
  size: string
}

export interface FloorTextures {
  // Lớp đè lên vạch vàng (bong sơn, xước, vết bánh xe)
  over: FloorLayer[]
  // Lớp dưới vạch vàng / mạch cắt (vá, mòn, loang, hạt, đốm)
  under: FloorLayer[]
  // Mặt nạ làm ánh đèn phản chiếu loang không đều
  reflectionMask: string
}

const cache = new Map<boolean, FloorTextures>()

export function getFloorTextures(dark: boolean): FloorTextures {
  const hit = cache.get(dark)
  if (hit) return hit

  // Màu sơn nền epoxy (mảng bong sơn phủ đè lên vạch vàng)
  // Ca đêm (đèn ấm): màu sơn nâu xám; vùng mòn / đốm sáng ánh vàng nhạt và nhẹ tay (không loang trắng như tuyết)
  const chipColor: Rgb = dark ? [0.24, 0.215, 0.19] : [0.37, 0.385, 0.4]
  const light: Rgb = dark ? [1, 0.88, 0.7] : [1, 1, 1]
  const textures: FloorTextures = {
    over: [
      { image: noise(0.05, dark ? 0.8 : 0.9, 420, { octaves: 4, color: chipColor, threshold: 0.6, seed: 3 }), size: '420px 420px' },
      { image: scratches(dark ? 0.12 : 0.28, 380), size: '380px 380px' },
      { image: tireMarks(dark ? 0.42 : 0.3, 1100, 800), size: '1100px 800px' },
    ],
    under: [
      { image: repairPatches(dark ? 0.05 : 0.07, 1300, 1000), size: '1300px 1000px' },
      { image: noise(0.007, dark ? 0.05 : 0.3, 700, { octaves: 3, color: light, threshold: 0.48, seed: 11 }), size: '700px 700px' },
      { image: noise(0.035, dark ? 0.24 : 0.22, 360, { octaves: 3, seed: 5 }), size: '360px 360px' },
      { image: noise(0.011, dark ? 0.26 : 0.3, 560, { octaves: 3, seed: 9 }), size: '560px 560px' },
      { image: noise(0.9, dark ? 0.26 : 0.26, 160, { seed: 2 }), size: '160px 160px' },
      { image: noise(0.75, dark ? 0.1 : 0.4, 200, { color: light, threshold: 0.66, seed: 17 }), size: '200px 200px' },
    ],
    reflectionMask: noise(0.02, 1, 400, { octaves: 3, color: [0, 0, 0], threshold: 0.3, seed: 23 }),
  }
  cache.set(dark, textures)
  return textures
}
