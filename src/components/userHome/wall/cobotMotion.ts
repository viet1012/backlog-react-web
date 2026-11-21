/*
 * Động học cobot vẽ nghiêng (2D), không phụ thuộc React: tính sẵn góc khớp theo thời gian để làm keyframes CSS.
 *
 * Mô hình: đế xoay quanh trục đứng (yaw) + tay 2 đoạn (vai, khuỷu) trong mặt phẳng tay + cổ tay giữ đầu kẹp
 * luôn hướng xuống. Nhìn nghiêng thì yaw = co giãn ngang scaleX(cos yaw) quanh trục đế: chuyển hàng từ phải
 * sang trái bằng cách xoay đế 180° (tay ngắn lại khi chĩa về phía người xem) như cobot thật, không lật khuỷu.
 *
 * Đường đi khai báo cho ĐẦU KẸP (tầm với ngang, độ cao) theo thời gian; góc vai / khuỷu giải bằng IK 2 đoạn,
 * luôn chọn nhánh "khuỷu ở trên" (tầm với luôn dương trong mặt phẳng tay nên không bao giờ đổi nhánh).
 * Nhờ vậy đầu kẹp hạ thẳng xuống, nhấc thẳng lên đúng chỗ món hàng.
 *
 * Quy ước hình vẽ (khớp với Cobot.tsx): lúc mọi góc = 0, cánh tay trên dựng đứng (vai -> khuỷu hướng lên),
 * cẳng tay nằm ngang sang phải, đầu kẹp chĩa xuống. SVG: y hướng xuống, rotate(+) = theo chiều kim đồng hồ.
 */

// [t (0..1), yaw (độ), tầm với ngang của đầu kẹp tính từ trục đế (>0), y của đầu kẹp]
export type CobotWaypoint = [t: number, yaw: number, reach: number, tipY: number]

export interface CobotSpec {
  id: string
  // Tâm đế (x) và mặt gắn đế (y) trong hệ toạ độ SVG của cụm máy
  x: number
  mount: number
  upper: number
  fore: number
  // Cổ tay -> mũi kẹp
  tool: number
  cycle: number
  path: CobotWaypoint[]
  // Khoảng thời gian kẹp đang khép (đang cầm hàng)
  grip: [number, number]
}

// Vai nằm trên mặt gắn đế
export const SHOULDER_RISE = 16

export interface CobotSample {
  t: number
  // scaleX của cả cánh tay = cos(yaw)
  yawScale: number
  shoulder: number
  elbow: number
  wrist: number
  // Vị trí mũi kẹp trên màn hình
  tipX: number
  tipY: number
}

const smoothstep = (u: number) => u * u * (3 - 2 * u)
const lerp = (a: number, b: number, u: number) => a + (b - a) * u
const deg = (rad: number) => (rad * 180) / Math.PI
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function pathAt(path: CobotWaypoint[], t: number) {
  let i = 0
  while (i < path.length - 2 && t > path[i + 1][0]) i++
  const [t0, yaw0, reach0, y0] = path[i]
  const [t1, yaw1, reach1, y1] = path[i + 1]
  const u = smoothstep(clamp((t - t0) / Math.max(t1 - t0, 1e-6), 0, 1))
  return { yaw: lerp(yaw0, yaw1, u), reach: lerp(reach0, reach1, u), tipY: lerp(y0, y1, u) }
}

// IK 2 đoạn trong mặt phẳng tay: trả về góc xoay (độ) của vai, khuỷu, cổ tay theo quy ước hình vẽ
export function solveCobot(spec: CobotSpec, reach: number, tipY: number) {
  const l1 = spec.upper
  const l2 = spec.fore
  let dx = reach
  let dy = tipY - spec.tool - (spec.mount - SHOULDER_RISE)
  let d = Math.hypot(dx, dy)
  const max = l1 + l2 - 0.5
  const min = Math.abs(l1 - l2) + 0.5
  if (d > max || d < min) {
    const k = clamp(d, min, max) / Math.max(d, 1e-6)
    dx *= k
    dy *= k
    d = clamp(d, min, max)
  }
  const phi = Math.atan2(dy, dx)
  const alpha = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1))
  // Khuỷu ở trên đường vai -> cổ tay (dx > 0 nên luôn là phi - alpha)
  const a1 = phi - alpha
  const ex = l1 * Math.cos(a1)
  const ey = l1 * Math.sin(a1)
  const a2 = Math.atan2(dy - ey, dx - ex)

  const shoulder = deg(a1) + 90
  const elbow = deg(a2) - shoulder
  return { shoulder, elbow, wrist: -deg(a2) }
}

export function sampleCobot(spec: CobotSpec, samples = 80): CobotSample[] {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = i / samples
    const { yaw, reach, tipY } = pathAt(spec.path, t)
    const yawScale = Math.cos((yaw * Math.PI) / 180)
    return { t, yawScale, ...solveCobot(spec, reach, tipY), tipX: spec.x + yawScale * reach, tipY }
  })
}

/*
 * Cobot cấp phôi cho máy CNC (cụm trái): đặt trên bàn thép, gắp phôi trong thùng nhựa bên phải,
 * xoay đế sang trái, đặt phôi lên khay nạp ở hông máy CNC.
 */
export const TEND_COBOT: CobotSpec = {
  id: 'tend',
  x: 333,
  mount: 150,
  upper: 44,
  fore: 40,
  tool: 19,
  cycle: 7,
  path: [
    [0, 0, 38, 116],
    [0.1, 0, 38, 137],
    [0.18, 0, 38, 137],
    [0.28, 0, 38, 114],
    [0.52, 180, 27, 100],
    [0.62, 180, 27, 121],
    [0.7, 180, 27, 121],
    [0.78, 180, 27, 100],
    [1, 0, 38, 116],
  ],
  grip: [0.14, 0.67],
}

/*
 * Cobot xếp hàng (cụm phải): trên trụ đứng giữa pallet và đầu băng chuyền, gắp thùng carton
 * ở đầu băng chuyền (bên phải), xoay đế sang trái, đặt lên chồng thùng trên pallet.
 */
export const PALLETIZE_COBOT: CobotSpec = {
  id: 'palletize',
  x: 93,
  mount: 120,
  upper: 44,
  fore: 40,
  tool: 19,
  cycle: 7.6,
  path: [
    [0, 0, 44, 110],
    [0.1, 0, 44, 130],
    [0.18, 0, 44, 130],
    [0.28, 0, 44, 106],
    [0.52, 180, 50, 90],
    [0.62, 180, 50, 108],
    [0.7, 180, 50, 108],
    [0.78, 180, 50, 90],
    [1, 0, 44, 110],
  ],
  grip: [0.14, 0.67],
}
