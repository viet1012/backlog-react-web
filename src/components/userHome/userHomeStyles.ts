import { C, INK } from './factoryScene/primitives'

/*
 * Bảng màu nền xưởng, lấy theo ảnh xưởng thật: trần bê tông màu be + đèn tuýp, tường sơn trắng ngà,
 * cửa cuốn xanh xám, sàn epoxy xám đậm, vạch vàng.
 * Sáng = ca ngày, tối = ca đêm dưới đèn ấm (cùng bố cục, tông nâu vàng; đèn tuýp vẫn sáng).
 */
export interface HomePalette {
  // Trần: phía người xem -> phía xa (sát tường, sáng hơn vì dày đèn)
  ceilingNear: string
  ceilingFar: string
  tube: string
  tubeGlow: string
  tubeHousing: string
  tray: string
  duct: string
  // Tường: trên -> sát chân tường
  wallTop: string
  wallLow: string
  skirting: string
  shutter: string
  shutterSlat: string
  // Sàn epoxy: phía xa -> phía người xem
  floorFar: string
  floorNear: string
  joint: string
  lane: string
  // Ánh đèn phản chiếu trên sàn bóng
  reflection: string
  // Bóng tối chỗ tường giáp sàn / trần giáp tường
  wallFoot: string
}

// Bề rộng khối nội dung trang chủ (thanh trên / kệ hàng): min(1220px, 100%)
export const HOME_CONTENT_WIDTH = 1220

export function getHomePalette(dark: boolean): HomePalette {
  return dark
    // Ca đêm dưới đèn tuýp trắng ấm: tông nâu vàng, không xanh lạnh
    ? {
      ceilingNear: '#2a231a',
      ceilingFar: '#6b5a42',
      tube: '#fff3dc',
      tubeGlow: 'rgba(255, 206, 140, 0.75)',
      tubeHousing: '#6a6257',
      tray: 'rgba(15, 11, 6, 0.7)',
      duct: '#6e675d',
      wallTop: '#5a4f40',
      wallLow: '#433b31',
      skirting: '#2a251f',
      shutter: '#4a5446',
      shutterSlat: 'rgba(0, 0, 0, 0.28)',
      floorFar: '#5a5249',
      floorNear: '#2f2b27',
      joint: 'rgba(0, 0, 0, 0.38)',
      lane: 'rgba(240, 186, 40, 0.88)',
      reflection: 'rgba(255, 196, 120, 0.3)',
      wallFoot: 'rgba(10, 6, 0, 0.42)',
    }
    : {
      ceilingNear: '#a79e8e',
      ceilingFar: '#d9d2c4',
      tube: '#ffffff',
      tubeGlow: 'rgba(255, 255, 250, 0.8)',
      tubeHousing: '#8d887e',
      tray: 'rgba(40, 40, 42, 0.7)',
      duct: '#b9bcbf',
      wallTop: '#ecebe6',
      wallLow: '#dddcd5',
      skirting: '#6f7275',
      shutter: '#8ea595',
      shutterSlat: 'rgba(40, 60, 48, 0.22)',
      floorFar: '#7a7e82',
      floorNear: '#55595e',
      joint: 'rgba(30, 32, 35, 0.25)',
      lane: 'rgba(232, 184, 24, 0.95)',
      reflection: 'rgba(255, 255, 255, 0.32)',
      wallFoot: 'rgba(30, 32, 36, 0.35)',
    }
}

/*
 * Ô lát trần (vẽ trên mặt trần trước khi nghiêng), như ảnh xưởng thật:
 * 1 đèn tuýp dài chạy DỌC theo chiều sâu (các ô nối nhau thành dãy đèn hút về điểm tụ) có chụp mảnh,
 * quầng sáng 2 lớp (rộng mềm + hẹp chói) để đèn trông đang bật; 1 đoạn máng cáp chạy song song.
 */
export const CEILING_TILE = { width: 260, height: 150 }

export function ceilingTile(p: HomePalette) {
  const { width: w, height: h } = CEILING_TILE
  const tube = { x: 106, y: 12, w: 8, h: h - 24 }
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>`
    + `<filter id='wide' x='-200%' y='-20%' width='500%' height='140%'><feGaussianBlur stdDeviation='14'/></filter>`
    + `<filter id='tight' x='-200%' y='-20%' width='500%' height='140%'><feGaussianBlur stdDeviation='3.5'/></filter>`
    // Máng cáp
    + `<rect x='200' y='0' width='24' height='${h}' fill='${p.tray}' opacity='0.3'/>`
    + `<rect x='200' y='0' width='3.5' height='${h}' fill='${p.tray}'/>`
    + `<rect x='220.5' y='0' width='3.5' height='${h}' fill='${p.tray}'/>`
    // Quầng sáng rộng hắt lên trần + quầng chói sát bóng đèn
    + `<rect x='${tube.x - 34}' y='${tube.y - 6}' width='${tube.w + 68}' height='${tube.h + 12}' rx='30' fill='${p.tubeGlow}' opacity='0.55' filter='url(#wide)'/>`
    + `<rect x='${tube.x - 6}' y='${tube.y - 2}' width='${tube.w + 12}' height='${tube.h + 4}' rx='8' fill='${p.tubeGlow}' filter='url(#tight)'/>`
    // Chụp đèn mảnh + bóng tuýp
    + `<rect x='${tube.x - 2.5}' y='${tube.y}' width='${tube.w + 5}' height='${tube.h}' rx='2' fill='${p.tubeHousing}'/>`
    + `<rect x='${tube.x}' y='${tube.y + 2}' width='${tube.w}' height='${tube.h - 4}' rx='4' fill='${p.tube}'/>`
    + `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/*
 * Vân nhiễu (bê tông, sơn) dạng SVG feTurbulence, chấm tối trong suốt.
 * freq cao = hạt mịn; thấp = vệt loang lớn. Vẽ 1 lần rồi lát lặp, không tốn khi đứng yên.
 */
// freq có thể là "fx fy": fx cao, fy thấp = vệt chảy dọc (vết bẩn trên vách)
export function noiseTexture(freq: number | string, alpha: number, size = 180, octaves = 2) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>`
    + `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${octaves}' stitchTiles='stitch'/>`
    + `<feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${alpha} 0 0 0 0'/></filter>`
    + `<rect width='100%' height='100%' filter='url(#n)'/></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

// Màu đèn LED trên các bảng điện tử (thanh trên trang chủ, số LED 7 đoạn)
export const LED = {
  amber: '#ffbe5c',
  green: '#52f59a',
  cyan: '#6fd8ff',
  red: '#ff6b6b',
}

// Sọc cảnh báo vàng-đen kiểu vạch an toàn trong xưởng
export function hazardStripes(size = 10) {
  return `repeating-linear-gradient(-45deg, ${C.yellow} 0 ${size}px, ${INK} ${size}px ${size * 2}px)`
}
