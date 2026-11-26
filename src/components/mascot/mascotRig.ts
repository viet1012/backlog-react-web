/**
 * "Khung xương" 3D cho mascot SVG: mỗi bộ phận là một khối đơn giản (đầu = cầu, thân = trụ,
 * tay / chân / lọn tóc đặt theo góc quanh trục dọc). Xoay quanh trục dọc x = 80 rồi chiếu lên mặt phẳng.
 *
 * Quy ước: x0 = lệch ngang so với trục (đơn vị viewBox), z0 = độ sâu (dương = hướng về người xem
 * ở góc 0). Ánh sáng giữ cố định (không xoay theo mascot) → đổ bóng vẫn đúng khi xoay.
 * Góc 0: cos = 1, sin = 0 chính xác → hình học trùng khớp bản vẽ gốc.
 */

export const AXIS_X = 80

export interface Rig {
  c: number
  s: number
  /** đang lệch khỏi mặt trước → bật nhánh vẽ 3D (lúc nhìn thẳng dùng nguyên bản vẽ gốc) */
  rotated: boolean
}

export function makeRig(turnDeg = 0): Rig {
  const rad = (turnDeg * Math.PI) / 180
  const c = Math.cos(rad)
  const s = Math.sin(rad)
  return { c, s, rotated: Math.abs(s) > 0.015 || c < 0 }
}

/** làm tròn cho thuộc tính SVG ngắn gọn */
export const n = (v: number) => Math.round(v * 100) / 100

/** tọa độ x trên màn hình của điểm (x gốc ở góc 0, độ sâu z0) */
export function px(r: Rig, x: number, z0 = 0) {
  return AXIS_X + (x - AXIS_X) * r.c + z0 * r.s
}

/** độ sâu sau khi xoay (dương = gần người xem hơn) */
export function depthOf(r: Rig, x: number, z0 = 0) {
  return -(x - AXIS_X) * r.s + z0 * r.c
}

/**
 * Mảng bề mặt (mặt, yếm…) nằm trên mặt trước (side 1) / mặt sau (side -1) của khối, cách trục `radius`:
 * dịch theo sin, co ngang theo cos. Nhìn từ mặt sau thì lật gương (cos âm × side âm = dương).
 */
export function patchTransform(r: Rig, radius: number, side: 1 | -1) {
  const c = r.c * side
  const s = r.s * side
  return `translate(${n(AXIS_X + radius * s)} 0) scale(${n(c)} 1) translate(${-AXIS_X} 0)`
}

/** mảng bề mặt có quay về phía người xem không */
export function patchVisible(r: Rig, side: 1 | -1) {
  return r.c * side > 0.03
}

// ---------------- Tay ----------------

export interface Limb {
  sx: number
  sy: number
  ex: number
  ey: number
  hx: number
  hy: number
  /** độ sâu của đầu mút tay / bàn tay (tay hơi đưa ra trước → nhìn nghiêng không bị dựng thẳng đứng) */
  ez?: number
  hz?: number
}

export const ARM_LEFT: Limb = { sx: 58, sy: 110, ex: 47, ey: 146, hx: 46, hy: 152, ez: 4, hz: 5 }
export const ARM_RIGHT: Limb = { sx: 102, sy: 110, ex: 122, ey: 80, hx: 125, hy: 74, ez: 9, hz: 11 }

export function projectLimb(r: Rig, limb: Limb): Limb {
  return { ...limb, sx: px(r, limb.sx), ex: px(r, limb.ex, limb.ez), hx: px(r, limb.hx, limb.hz) }
}

/** pháp tuyến đơn vị của tay, quay về phía nguồn sáng (trên-trái) */
function lightNormal(limb: Limb) {
  const dx = limb.ex - limb.sx
  const dy = limb.ey - limb.sy
  const len = Math.hypot(dx, dy) || 1
  let nx = -dy / len
  let ny = dx / len
  if (nx + ny > 0) {
    nx = -nx
    ny = -ny
  }
  return { nx, ny }
}

/** điểm đầu / cuối gradient khối trụ vuông góc với tay (bề rộng tay 12) */
export function limbGradient(limb: Limb) {
  const { nx, ny } = lightNormal(limb)
  const mx = (limb.sx + limb.ex) / 2
  const my = (limb.sy + limb.ey) / 2
  return { x1: n(mx + 6 * nx), y1: n(my + 6 * ny), x2: n(mx - 6 * nx), y2: n(my - 6 * ny) }
}

/** dải bóng dọc tay (phía sáng) */
export function limbHighlight(limb: Limb) {
  const { nx, ny } = lightNormal(limb)
  const dx = limb.ex - limb.sx
  const dy = limb.ey - limb.sy
  const a = 0.1
  const b = 0.82
  return `M${n(limb.sx + dx * a + nx * 3.2)} ${n(limb.sy + dy * a + ny * 3.2)} L${n(limb.sx + dx * b + nx * 3.2)} ${n(limb.sy + dy * b + ny * 3.2)}`
}

/** điểm trên trục tay theo tỉ lệ t (0 = vai, 1 = cổ tay) */
function limbAt(limb: Limb, t: number) {
  return { x: limb.sx + (limb.ex - limb.sx) * t, y: limb.sy + (limb.ey - limb.sy) * t }
}

/** vạch ngang qua tay tại t, từ phía sáng (from) sang phía tối (to); bend: độ cong dọc theo tay */
export function limbCross(limb: Limb, t: number, from = 6, to = -6, bend = 0) {
  const { nx, ny } = lightNormal(limb)
  const len = Math.hypot(limb.ex - limb.sx, limb.ey - limb.sy) || 1
  const dx = (limb.ex - limb.sx) / len
  const dy = (limb.ey - limb.sy) / len
  const p = limbAt(limb, t)
  const a = { x: p.x + nx * from, y: p.y + ny * from }
  const b = { x: p.x + nx * to, y: p.y + ny * to }
  if (!bend) return `M${n(a.x)} ${n(a.y)} L${n(b.x)} ${n(b.y)}`
  const c = { x: (a.x + b.x) / 2 + dx * bend, y: (a.y + b.y) / 2 + dy * bend }
  return `M${n(a.x)} ${n(a.y)} Q${n(c.x)} ${n(c.y)} ${n(b.x)} ${n(b.y)}`
}

/** đoạn trục tay từ t0 đến t1 (vẽ cổ tay áo) */
export function limbSegment(limb: Limb, t0: number, t1: number) {
  const a = limbAt(limb, t0)
  const b = limbAt(limb, t1)
  return { x1: n(a.x), y1: n(a.y), x2: n(b.x), y2: n(b.y) }
}

// ---------------- Chân ----------------

export const LEGS = [
  { x: 67.5, boot: 66.5 },
  { x: 92.5, boot: 93.5 },
] as const

// ---------------- Tóc xoăn ----------------

export interface Curl {
  key: string
  x0: number
  z0: number
  y: number
  r: number
}

const deg = (d: number) => (d * Math.PI) / 180

function onRing(key: string, x: number, y: number, r: number, radius: number): Curl {
  const x0 = x - AXIS_X
  return { key, x0, z0: Math.sqrt(Math.max(0, radius * radius - x0 * x0)), y, r }
}

function ringArc(prefix: string, fromDeg: number, toDeg: number, stepDeg: number, radius: number, y: number, r: number): Curl[] {
  const out: Curl[] = []
  for (let a = fromDeg; a <= toDeg + 0.001; a += stepDeg) {
    out.push({ key: `${prefix}${a}`, x0: radius * Math.sin(deg(a)), z0: radius * Math.cos(deg(a)), y, r })
  }
  return out
}

/** toàn bộ lọn tóc quanh đầu (kể cả gáy) – chỉ dùng khi đang xoay */
export function buildCurls(
  fringeX: readonly number[],
  temples: readonly (readonly [number, number])[],
  crown: readonly (readonly [number, number])[] | null,
): Curl[] {
  const curls: Curl[] = []
  fringeX.forEach((x, i) => curls.push(onRing(`f${x}`, x, i % 2 ? 62 : 63.5, 4.6, 27)))
  temples.forEach(([x, y]) => curls.push(onRing(`t${x}-${y}`, x, y, 4.2, 31)))
  // gáy: 3 hàng lọn so le
  curls.push(...ringArc('b1-', 100, 260, 20, 28, 63.5, 4.6))
  curls.push(...ringArc('b2-', 110, 250, 20, 29.5, 71, 4.5))
  curls.push(...ringArc('b3-', 125, 235, 22, 28, 79, 4.3))
  if (crown) {
    crown.forEach(([x, y]) => {
      const x0 = x - AXIS_X
      // hàng trước của đỉnh đầu nằm hơi nhô về phía trước
      const front = y >= 49 && y <= 51
      curls.push({ key: `c${x}-${y}`, x0, z0: front ? 12 : 0, y, r: 5 })
      if (front) {
        curls.push({ key: `cb${x}-${y}`, x0, z0: -12, y, r: 5 })
      } else if (Math.abs(x0) > 3) {
        // lọn hai bên đỉnh: thêm các lọn cùng vòng ở chéo trước / chéo sau / chính sau
        // → nhìn nghiêng hay từ sau đỉnh đầu vẫn kín tóc (không dồn thành một dải giữa)
        const rho = Math.abs(x0)
        curls.push({ key: `cdf${x}-${y}`, x0: x0 * 0.7, z0: rho * 0.7, y, r: 5 })
        curls.push({ key: `cdb${x}-${y}`, x0: x0 * 0.7, z0: -rho * 0.7, y, r: 5 })
        if (x0 > 0) curls.push({ key: `cz${y}`, x0: 0, z0: -rho, y, r: 5 })
      }
    })
  }
  return curls
}

export function placeCurls(r: Rig, curls: Curl[]) {
  return curls
    .map((curl) => ({
      key: curl.key,
      cx: n(AXIS_X + curl.x0 * r.c + curl.z0 * r.s),
      cy: curl.y,
      r: curl.r,
      depth: -curl.x0 * r.s + curl.z0 * r.c,
    }))
    .sort((a, b) => a.depth - b.depth)
}

// ---------------- Râu ----------------

/**
 * Râu quai nón theo viền hàm, dựng 3D: nhìn thẳng trùng cung gốc (tâm 80,67.5 bán kính 27.5),
 * cằm nhô về trước (z) → khi xoay, râu ôm theo hàm thay vì bẹp thành nét cong phẳng.
 * Chỉ vẽ phần quay về phía người xem.
 */
export function beardPath(r: Rig) {
  const runs: string[][] = []
  let run: string[] = []
  for (let a = -79; a <= 79; a += 6) {
    const x0 = 27.5 * Math.sin(deg(a))
    const z0 = 13 * Math.cos(deg(a))
    const y = 67.5 + 27.5 * Math.cos(deg(a))
    if (-x0 * r.s + z0 * r.c < -1) {
      if (run.length) runs.push(run)
      run = []
      continue
    }
    run.push(`${n(AXIS_X + x0 * r.c + z0 * r.s)} ${n(y)}`)
  }
  if (run.length) runs.push(run)
  return runs.filter((pts) => pts.length > 1).map((pts) => `M${pts.join(' L')}`).join(' ') || null
}

// ---------------- Mũ ----------------

/**
 * Gờ mũ bảo hộ chạy từ trước ra sau qua đỉnh, nằm trên mặt phẳng lệch ngang `lateral` so với trục
 * (0 = gờ giữa, ±12 = gờ phụ hai bên), chiếu theo góc xoay; chỉ vẽ phần quay về người xem.
 */
export function helmetRidgePath(r: Rig, lateral = 0, halfWidth = 5, minHalf = 1.4) {
  const radius = Math.sqrt(Math.max(0, 31 * 31 - lateral * lateral))
  const yScale = 29.5 / 31
  const left: string[] = []
  const right: string[] = []
  for (let a = 0; a <= 180; a += 10) {
    const z = radius * Math.cos(deg(a))
    if (-lateral * r.s + z * r.c < -1) continue
    const y = 57.5 - radius * yScale * Math.sin(deg(a))
    const half = Math.max((halfWidth - Math.sin(deg(a)) * halfWidth * 0.2) * Math.abs(r.c), minHalf)
    const x = AXIS_X + lateral * r.c + z * r.s
    left.push(`${n(x - half)} ${n(y)}`)
    right.unshift(`${n(x + half)} ${n(y)}`)
  }
  if (left.length < 2) return null
  return `M${left.join(' L')} L${right.join(' L')} Z`
}

/** vòm mũ: nửa elip-xoay tâm (cx, cy), bán kính ngang = sâu rx, cao ry */
export interface Dome {
  cx: number
  cy: number
  rx: number
  ry: number
}

/** điểm trên vòm ở kinh độ φ (0 = chính diện, + = sang phải) và vĩ độ lat (0 = vành, 90 = đỉnh) */
export function domePoint(r: Rig, phiDeg: number, latDeg: number, dome: Dome) {
  const a = deg(phiDeg) + Math.atan2(r.s, r.c)
  const cl = Math.cos(deg(latDeg))
  return {
    x: dome.cx + dome.rx * Math.sin(a) * cl,
    y: dome.cy - dome.ry * Math.sin(deg(latDeg)),
    /** cos góc so với hướng nhìn: > 0 là quay về người xem */
    front: Math.cos(a),
  }
}

/** đường kinh tuyến trên vòm (sọc len, đường may mũ…) từ vĩ độ lat0 lên lat1; null nếu đang khuất */
export function meridianPath(r: Rig, phiDeg: number, lat0: number, lat1: number, dome: Dome, minFront = 0.08) {
  if (domePoint(r, phiDeg, 0, dome).front < minFront) return null
  const pts: string[] = []
  for (let lat = lat0; lat <= lat1 + 0.001; lat += (lat1 - lat0) / 8) {
    const p = domePoint(r, phiDeg, lat, dome)
    pts.push(`${n(p.x)} ${n(p.y)}`)
  }
  return `M${pts.join(' L')}`
}

/** sọc len quanh gấu mũ len – vị trí x các sọc đang quay về phía trước */
export function beanieStripes(r: Rig) {
  const xs: number[] = []
  for (let k = 0; k < 27; k++) {
    const a = deg((k * 360) / 27) + Math.atan2(r.s, r.c)
    if (Math.cos(a) > 0.3) xs.push(n(AXIS_X + 30 * Math.sin(a)))
  }
  return xs
}
