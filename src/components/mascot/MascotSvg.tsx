import { useId, useMemo } from 'react'
import type { ReactNode } from 'react'
import styles from './Mascot.module.css'
import type { MascotState } from './mascotConfig'
import { useMascotSkin } from './mascotContext'
import {
  ARM_LEFT,
  ARM_RIGHT,
  LEGS,
  beanieStripes,
  beardPath,
  buildCurls,
  depthOf,
  domePoint,
  helmetRidgePath,
  meridianPath,
  limbCross,
  limbGradient,
  limbHighlight,
  limbSegment,
  makeRig,
  n,
  patchTransform,
  patchVisible,
  placeCurls,
  projectLimb,
  px,
} from './mascotRig'
import type { Dome, Limb, Rig } from './mascotRig'
import { shade } from './mascotSkin'
import type { MascotHat, MascotSkin } from './mascotSkin'

// Tọa độ các lọn tóc xoăn: mái dưới vành mũ + hai bên thái dương
const FRINGE_X = [57, 64, 71, 78, 85, 92, 99]
const TEMPLES: [number, number][] = [
  [51, 64], [49, 70], [50, 76],
  [109, 64], [111, 70], [110, 76],
]
/** không đội mũ → thêm lọn xoăn trên đỉnh đầu */
const CROWN: [number, number][] = [
  [62, 47], [71, 43], [80, 41.5], [89, 43], [98, 47], [56, 54], [104, 54], [67, 51], [80, 49], [93, 51],
]

interface CurlSpot {
  key: string
  cx: number
  cy: number
  r: number
}

const FRINGE_CURLS: CurlSpot[] = FRINGE_X.map((x, i) => ({ key: `f${x}`, cx: x, cy: i % 2 ? 62 : 63.5, r: 4.6 }))
const TEMPLE_CURLS: CurlSpot[] = TEMPLES.map(([x, y]) => ({ key: `t${x}-${y}`, cx: x, cy: y, r: 4.2 }))
const CROWN_CURLS: CurlSpot[] = CROWN.map(([x, y]) => ({ key: `c${x}-${y}`, cx: x, cy: y, r: 5 }))
const STATIC_CURLS = [...FRINGE_CURLS, ...TEMPLE_CURLS]
const STATIC_CURLS_BARE = [...CROWN_CURLS, ...FRINGE_CURLS, ...TEMPLE_CURLS]

/** băm khóa lọn tóc → biến thể ổn định (không nhấp nháy khi xoay / sắp xếp lại) */
function curlVariant(key: string) {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0
  return Math.abs(h)
}

const circleD = (cx: number, cy: number, r: number) =>
  `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(2 * r)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-2 * r)} 0`

/**
 * Lớp tóc xoăn: (1) nền tối lấp khe giữa các lọn + bóng đổ lên da, (2) từng lọn là khối cầu
 * (2 tông màu xen kẽ, to nhỏ khác nhau chút), (3) vòng xoắn tối bên trong + (4) ánh bóng nhỏ.
 * Lớp 1, 3, 4 gộp thành 1 path mỗi lớp → ít phần tử DOM, xoay vẫn nhẹ.
 */
function CurlLayer({ curls, g, hair }: { curls: CurlSpot[]; g: GradientRefs; hair: string }) {
  if (curls.length === 0) return null
  let base = ''
  let swirl = ''
  let glint = ''
  const bodies = curls.map((curl) => {
    const v = curlVariant(curl.key)
    const r = curl.r * (1 + ((v % 7) - 3) * 0.035)
    base += circleD(curl.cx + 0.6, curl.cy + 0.9, r + 0.75)
    // vòng xoắn: cung lớn từ dưới-trái vòng qua đỉnh xuống dưới-phải (chiều xoắn đổi theo lọn)
    const flip = v % 2 ? 1 : -1
    swirl += `M${n(curl.cx - flip * r * 0.5)} ${n(curl.cy + r * 0.2)}A${n(r * 0.46)} ${n(r * 0.46)} 0 1 ${flip > 0 ? 1 : 0} ${n(curl.cx + flip * r * 0.28)} ${n(curl.cy + r * 0.38)}`
    glint += circleD(curl.cx - r * 0.36, curl.cy - r * 0.42, r * 0.2)
    return { key: curl.key, cx: n(curl.cx), cy: n(curl.cy), r: n(r), alt: v % 3 === 0 }
  })
  return (
    <g>
      <path d={base} fill={shade(hair, -0.5)} opacity="0.85" />
      {bodies.map((b) => (
        <circle key={b.key} cx={b.cx} cy={b.cy} r={b.r} fill={b.alt ? g.url.hairAlt : g.url.hair} />
      ))}
      <path d={swirl} fill="none" stroke={shade(hair, -0.55)} strokeOpacity="0.6" strokeWidth="0.6" strokeLinecap="round" />
      <path d={glint} fill="#fff" opacity="0.42" />
    </g>
  )
}

/** viewBox đầy đủ (giữ tỉ lệ 160:200) và viewBox cắt phần đầu cho avatar thu nhỏ */
export const MASCOT_VIEWBOX = { width: 160, height: 200 }
const FULL_VIEWBOX = `0 0 ${MASCOT_VIEWBOX.width} ${MASCOT_VIEWBOX.height}`
const HEAD_VIEWBOX = '38 24 84 84'

/** Biểu cảm = trạng thái mascot (xem MascotState trong mascotConfig) */
export type MascotMood = MascotState

// chi tiết vải áo: nếp gấp (vạch tối + viền sáng đi kèm), đường may
const CREASE = { fill: 'none', stroke: '#000', strokeOpacity: 0.2, strokeWidth: 1.1, strokeLinecap: 'round' } as const
const CREASE_LIGHT = { fill: 'none', stroke: '#fff', strokeOpacity: 0.26, strokeWidth: 0.9, strokeLinecap: 'round' } as const
const SEAM = { fill: 'none', stroke: '#000', strokeOpacity: 0.22, strokeWidth: 0.9, strokeLinecap: 'round' } as const
// chỉ may nổi màu vàng đồng (kiểu quần jean) – nét đứt
const STITCH = { fill: 'none', stroke: '#E9B65C', strokeOpacity: 0.7, strokeWidth: 0.55, strokeDasharray: '1.3 1', strokeLinecap: 'round' } as const

const EYE = '#2B1A0E'
const MOUTH = '#8A3B1F'

// lông mày [trái, phải] theo biểu cảm
const BROWS: Record<MascotMood, [string, string]> = {
  idle: ['M64 67 Q69.5 63.5 75 66.5', 'M85 66.5 Q90.5 63.5 96 67'],
  talking: ['M64 67 Q69.5 63.5 75 66.5', 'M85 66.5 Q90.5 63.5 96 67'],
  greeting: ['M64 65.5 Q69.5 62 75 65', 'M85 65 Q90.5 62 96 65.5'],
  happy: ['M64 65.5 Q69.5 62 75 65', 'M85 65 Q90.5 62 96 65.5'],
  thinking: ['M64 67 Q69.5 63.5 75 66.5', 'M85 64.5 Q90.5 61 96 64'],
  sad: ['M64 67.5 Q69.5 66 75 63.5', 'M85 63.5 Q90.5 66 96 67.5'],
  confused: ['M64 65 Q69.5 61.5 75 64.5', 'M85 67.5 L96 65.5'],
  sleepy: ['M64 68 Q69.5 66.5 75 68', 'M85 68 Q90.5 66.5 96 68'],
}

/** biểu cảm mà mắt được nhìn theo con trỏ (thinking có hướng liếc riêng, sleepy nhắm mắt…) */
const FOLLOW_MOODS: MascotMood[] = ['idle', 'greeting', 'talking', 'confused']

interface MascotSvgProps {
  waving: boolean
  /** chỉ hiện phần đầu – dùng cho avatar khi thu nhỏ */
  headOnly?: boolean
  mood?: MascotMood
  /**
   * Chớp mắt do cha điều khiển (chớp ngẫu nhiên): true → chớp 1 lần (animationend 'blinkOnce').
   * Bỏ trống → tự chớp đều theo CSS.
   */
  blink?: boolean
  /** mắt nhìn theo con trỏ (chỉ các biểu cảm mở mắt bình thường) */
  followCursor?: boolean
  /** skin xem trước (Phòng thay đồ); bỏ trống → skin đang áp dụng */
  skin?: MascotSkin
  /** góc xoay quanh trục dọc (độ) – 0 / bỏ trống = nhìn thẳng, y hệt bản vẽ gốc */
  turn?: number
  className?: string
}

export function MascotSvg({
  waving,
  headOnly = false,
  mood = 'idle',
  blink,
  followCursor = false,
  skin: skinProp,
  turn = 0,
  className,
}: MascotSvgProps) {
  const appliedSkin = useMascotSkin()
  const skin = skinProp ?? appliedSkin
  const thinking = mood === 'thinking'
  const sad = mood === 'sad'
  const confused = mood === 'confused'
  const [browLeft, browRight] = BROWS[mood] ?? BROWS.idle

  // id gradient riêng cho từng instance (avatar header chat, thumbnail Phòng thay đồ… cùng lúc trên trang)
  const uid = `m${useId().replace(/[^\w-]/g, '')}`
  const g = useMemo(() => gradientRefs(uid), [uid])

  const beard = shade(skin.hairColor, 0.12)
  const beardSheen = shade(skin.hairColor, 0.55)
  const eyesClass = blink === undefined ? styles.eyes : blink ? styles.blinkOnce : styles.eyesStatic
  // quay đầu giả 3D: mặt / mũ dịch theo con trỏ nhiều hơn khối đầu (parallax)
  const turning = followCursor && FOLLOW_MOODS.includes(mood)

  // ---- xoay 360° (chỉ mascot đầy đủ) ----
  const r = useMemo(() => makeRig(headOnly ? 0 : turn), [headOnly, turn])
  const R = r.rotated
  const clipHead = `url(#${uid}-ch)`
  const clipBody = `url(#${uid}-cb)`
  const faceShown = !R || patchVisible(r, 1)
  const faceT = R ? patchTransform(r, 27, 1) : undefined
  const beard3d = R && skin.beard ? beardPath(r) : null
  const armL = projectLimb(r, ARM_LEFT)
  const armR = projectLimb(r, ARM_RIGHT)
  // tai trái / phải: lệch ngang ±29.6, hơi lùi sau (z -1.5) → nhìn nghiêng tai nằm giữa má
  const ears = [-1, 1].map((side) => ({
    side,
    x: px(r, 80 + 29.6 * side, -1.5),
    depth: depthOf(r, 80 + 29.6 * side, -1.5),
  }))
  // thứ tự vẽ theo độ sâu; lúc nhìn thẳng: tay trái sau thân, tay phải trước thân (như bản gốc)
  const leftArmFront = -(ARM_LEFT.sx - 80) * r.s > 8
  const rightArmFront = -(ARM_RIGHT.sx - 80) * r.s > -8
  // quay sang trái nhiều: tay phải giơ lên ở phía gần người xem → vẽ đè lên cả đầu
  const rightArmOverHead = -(ARM_RIGHT.sx - 80) * r.s > 15
  const legs = LEGS
    .map((leg, id) => ({ id, x: px(r, leg.x), boot: px(r, leg.boot), depth: depthOf(r, leg.x) }))
    .sort((a, b) => a.depth - b.depth)
  const curls = R ? placeCurls(r, buildCurls(FRINGE_X, TEMPLES, skin.hat === 'none' ? CROWN : null)) : []
  // nhìn thẳng: đúng vị trí bản vẽ gốc (khóa trùng buildCurls → độ to / màu lọn không đổi khi bắt đầu xoay)
  const staticCurls = R ? [] : skin.hat === 'none' ? STATIC_CURLS_BARE : STATIC_CURLS

  const leftArm = (
    <>
      <line x1={n(armL.sx)} y1={armL.sy} x2={n(armL.ex)} y2={armL.ey} stroke={g.url.armL} strokeWidth="12" strokeLinecap="round" />
      {/* nếp gấp vải ở khuỷu tay */}
      <path d={limbCross(armL, 0.5, 5.4, -3.2, 2.6)} {...CREASE} />
      <path d={limbCross(armL, 0.43, 5, -2.2, 2.2)} {...CREASE_LIGHT} />
      <Cuff limb={armL} stroke={g.url.armL} />
      <circle cx={n(armL.hx)} cy={armL.hy} r="6.5" fill={g.url.skin} />
      <ellipse cx={n(armL.hx - 2.4)} cy={armL.hy - 2.4} rx="2" ry="1.3" fill="#fff" opacity="0.5" />
    </>
  )
  const rightArm = (
    <g
      className={`${styles.arm} ${waving ? styles.waving : ''}`}
      // tâm xoay khi vẫy = vai phải (đã chiếu theo góc xoay)
      style={R ? { transformOrigin: `${n(px(r, 103))}px 110px` } : undefined}
    >
      {/* bóng tay đổ lên vai */}
      <ellipse cx={n(px(r, 100))} cy="112" rx="5.5" ry="3.5" fill="#000" opacity="0.18" />
      <line x1={n(armR.sx)} y1={armR.sy} x2={n(armR.ex)} y2={armR.ey} stroke={g.url.armR} strokeWidth="12" strokeLinecap="round" />
      <path
        d={R ? limbHighlight(armR) : 'M101.4 106.4 L117.6 82.2'}
        stroke="#fff"
        strokeOpacity="0.32"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* tay giơ lên → vải dồn nếp gần vai */}
      <path d={limbCross(armR, 0.2, 5.2, -4, -2.4)} {...CREASE} />
      <path d={limbCross(armR, 0.26, 4.6, -3, -2)} {...CREASE_LIGHT} />
      <path d={limbCross(armR, 0.38, 4.2, -2.6, -2)} {...CREASE} />
      <Cuff limb={armR} stroke={g.url.armR} />
      <circle cx={n(armR.hx)} cy={armR.hy} r="6.5" fill={g.url.skin} />
      <ellipse cx={n(armR.hx - 2.4)} cy={armR.hy - 2.4} rx="2" ry="1.3" fill="#fff" opacity="0.5" />
    </g>
  )

  return (
    <svg
      className={className}
      data-mood={mood}
      viewBox={headOnly ? HEAD_VIEWBOX : FULL_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <MascotDefs g={g} skin={skin} armL={armL} armR={armR} />
      {R && (
        <defs>
          <clipPath id={`${uid}-ch`}>
            <circle cx="80" cy="68" r="30" />
          </clipPath>
          <clipPath id={`${uid}-cb`}>
            <rect x="54" y="100" width="52" height="68" rx="14" />
          </clipPath>
        </defs>
      )}

      {/* bóng đổ dưới chân (gradient, không dùng filter → không tốn paint) */}
      {!headOnly && (
        <>
          <ellipse cx="82" cy="193" rx="40" ry="6.5" fill={g.url.ground} />
          {/* bóng tiếp xúc đậm ngay dưới đế ủng */}
          {legs.map((leg) => (
            <ellipse
              key={leg.id}
              cx={n(leg.boot + 0.5 + BOOT_TOE_SHIFT * r.s)}
              cy="194.2"
              rx={n(13.5 * bootSpan(r))}
              ry="2"
              fill="#000"
              opacity="0.26"
            />
          ))}
        </>
      )}

      {/* ---- Chân + ủng (chân xa vẽ trước) ---- */}
      {legs.map((leg) => (
        <g key={leg.id}>
          <rect x={n(leg.x - 9.5)} y="160" width="19" height="28" rx="4" fill={g.url.overall} />
          {/* ánh vải ở đầu gối + nếp nhăn gom ở cổ chân */}
          <ellipse cx={n(leg.x - 3.2)} cy="172" rx="2.6" ry="5.5" fill="#fff" opacity="0.1" />
          <path d={`M${n(leg.x - 8.6)} 174.2 Q${n(leg.x - 3)} 176.6 ${n(leg.x + 2)} 173.8`} {...CREASE} />
          <path d={`M${n(leg.x - 8.4)} 173.2 Q${n(leg.x - 3)} 175.5 ${n(leg.x + 1.8)} 172.8`} {...CREASE_LIGHT} />
          <path d={`M${n(leg.x - 1)} 177.2 Q${n(leg.x + 4)} 175.6 ${n(leg.x + 8.6)} 177.6`} {...CREASE} />
          {/* gấu quần lật lên (mặt trái vải sáng hơn) + chỉ may */}
          <rect x={n(leg.x - 9.9)} y="178" width="19.8" height="6.5" rx="2.2" fill={g.url.turnup} />
          <path d={`M${n(leg.x - 9.3)} 178.4 H${n(leg.x + 9.3)}`} stroke="#000" strokeOpacity="0.22" strokeWidth="0.9" />
          <path d={`M${n(leg.x - 8.6)} 180.3 H${n(leg.x + 8.6)}`} {...STITCH} />
          <Boot cx={leg.boot} r={r} g={g} />
        </g>
      ))}
      {/* bóng ống quần đổ xuống chân */}
      <ellipse cx="80" cy="168.5" rx="25" ry="3" fill="#000" opacity="0.28" />

      {/* phần trên (thân + tay + đầu) thở nhẹ */}
      <g className={headOnly ? undefined : styles.upper}>
      {/* ---- Tay ở phía sau thân ---- */}
      {!leftArmFront && leftArm}
      {!rightArmFront && rightArm}

      {/* ---- Thân: áo + quần yếm ---- */}
      <rect x="54" y="100" width="52" height="58" rx="14" fill={g.url.shirt} />
      {/* ánh sáng viền (rim) mép phải + bóng tay trái đổ lên thân */}
      <path d="M103 108 Q106 118 105.6 140" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M57 104 Q62 103 66 104 L60 112 Z" fill="#fff" opacity="0.22" />
      <path d="M54.6 112 Q57.5 124 56 140" fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="3" strokeLinecap="round" />
      {/* đường may nách áo (theo vai khi xoay) */}
      {22 * r.s >= -8 && (
        <path
          d="M61 103.5 Q63.6 111 59.6 118.6"
          transform={R ? `translate(${n(px(r, 58) - 58)} 0)` : undefined}
          {...SEAM}
        />
      )}
      {-22 * r.s >= -8 && (
        <path
          d="M99 103.5 Q96.4 111 100.4 118.6"
          transform={R ? `translate(${n(px(r, 102) - 102)} 0)` : undefined}
          {...SEAM}
        />
      )}
      {/* vải áo dồn nếp phía trên cạp quần (hai bên yếm) */}
      <g>
        <path d="M55.6 139.2 Q59.2 142 63.4 138.6 M56.2 133.4 Q59.4 135.8 63 133" {...CREASE} />
        <path d="M55.8 138.2 Q59.2 140.9 63.2 137.6" {...CREASE_LIGHT} />
        <path d="M104.4 139.2 Q100.8 142 96.6 138.6 M103.8 133.4 Q100.6 135.8 97 133" {...CREASE} />
        <path d="M104.2 138.2 Q100.8 140.9 96.8 137.6" {...CREASE_LIGHT} />
      </g>
      <path d="M54 146 H106 V164 Q106 168 102 168 H58 Q54 168 54 164 Z" fill={g.url.overall} />
      {/* áo sơ vin: mép áo phồng nhẹ đổ bóng xuống cạp quần */}
      <path d="M55 147.1 H105" stroke="#000" strokeOpacity="0.24" strokeWidth="1.8" strokeLinecap="round" />

      {/* mặt sau quần yếm: dây đeo bắt chéo + miếng yếm sau (chỉ khi quay lưng) */}
      {R && patchVisible(r, -1) && (
        <Patch clip={clipBody} transform={patchTransform(r, 22, -1)}>
          <path d="M63.4 103.4 L92.4 137.6 M99.2 103.4 L70.2 137.6" stroke="#000" strokeOpacity="0.2" strokeWidth="5" strokeLinecap="round" />
          <path d="M62 102 L91 136 M98 102 L69 136" stroke={g.url.strap} strokeWidth="5" strokeLinecap="round" />
          <rect x="64" y="134" width="32" height="14" rx="4" fill={g.url.overall} />
          <rect x="65.6" y="135.6" width="28.8" height="10.8" rx="2.8" {...STITCH} />
          <circle cx="69" cy="136.5" r="2.4" fill={g.url.button} />
          <circle cx="91" cy="136.5" r="2.4" fill={g.url.button} />
          {/* túi sau + đường may giữa */}
          <path d="M80 148 V167.5" {...SEAM} />
          {[0, 25].map((dx) => (
            <g key={dx} transform={dx ? `translate(${dx} 0)` : undefined}>
              <path d="M61.5 150.5 H74 V159.6 Q67.75 163.4 61.5 159.6 Z" fill="#000" opacity="0.18" transform="translate(0.6 1)" />
              <path d="M61.5 150.5 H74 V159.6 Q67.75 163.4 61.5 159.6 Z" fill={g.url.pocket} />
              <path d="M62.6 151.6 H72.9 V159 Q67.75 162.2 62.6 159 Z" {...STITCH} />
            </g>
          ))}
        </Patch>
      )}

      {/* mặt trước quần (dưới yếm): túi chéo hông, nút hông, đường may đũng, chỗ chia ống */}
      <Patch
        clip={R ? clipBody : undefined}
        transform={R ? patchTransform(r, 22, 1) : undefined}
        hidden={R && !patchVisible(r, 1)}
      >
        <path d="M55.4 149.6 Q60.6 151.2 62.9 159" stroke="#000" strokeOpacity="0.32" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M55.4 150.8 Q60 152.2 62 159" {...CREASE_LIGHT} />
        <path d="M104.6 149.6 Q99.4 151.2 97.1 159" stroke="#000" strokeOpacity="0.32" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d="M104.6 150.8 Q100 152.2 98 159" {...CREASE_LIGHT} />
        <circle cx="58.4" cy="148.9" r="1.5" fill={g.url.brass} />
        <circle cx="101.6" cy="148.9" r="1.5" fill={g.url.brass} />
        {/* đũng: đường may + chỉ đôi, bóng chữ V ngược chỗ chia hai ống */}
        <path d="M80 155 V160" {...SEAM} />
        <path d="M82 155 V160.5 Q82 163.2 80 164.4" {...STITCH} />
        <path d="M80 158.5 Q80.4 164.8 76.6 168 H83.4 Q79.6 164.8 80 158.5 Z" fill="#000" opacity="0.24" />
      </Patch>

      {/* mặt trước quần yếm (yếm, túi, dây, nút) – trượt quanh thân khi xoay */}
      <Patch
        clip={R ? clipBody : undefined}
        transform={R ? patchTransform(r, 22, 1) : undefined}
        hidden={R && !patchVisible(r, 1)}
      >
      {/* yếm: bóng đổ xuống áo (nổi lớp) */}
      <rect x="65.2" y="121.6" width="32" height="34" rx="4" fill="#000" opacity="0.2" />
      <rect x="64" y="120" width="32" height="34" rx="4" fill={g.url.overall} />
      <rect x="64.8" y="120.8" width="30.4" height="1.4" rx="0.7" fill="#fff" opacity="0.28" />
      {/* chỉ may viền yếm (kiểu vải jean) */}
      <rect x="65.7" y="122.6" width="28.6" height="29.6" rx="2.8" {...STITCH} />
      {/* túi ngực: bóng đổ + thân túi khối + miệng túi tối + chỉ may; bút cài trong túi */}
      <rect x="72.7" y="128.9" width="16" height="10" rx="2" fill="#000" opacity="0.22" />
      <rect x="83.2" y="124.6" width="2.2" height="5.6" rx="1" fill="#D64545" />
      <rect x="84.6" y="125.2" width="0.6" height="3.6" rx="0.3" fill="#E8E8E8" />
      <rect x="72" y="128" width="16" height="10" rx="2" fill={g.url.pocket} />
      <rect x="72" y="128" width="16" height="2.4" rx="1" fill="#000" opacity="0.32" />
      <path d="M73.2 131.4 V136.4 Q73.2 136.9 73.7 136.9 H86.3 Q86.8 136.9 86.8 136.4 V131.4" {...STITCH} />
      <path d="M72.6 137.6 H87.4" stroke="#fff" strokeOpacity="0.18" strokeWidth="0.7" />
      {/* dây đeo + bóng của dây + chỉ may giữa dây */}
      <path d="M63.4 103 L68.2 122.6 M99.2 103 L94.4 122.6" stroke="#000" strokeOpacity="0.2" strokeWidth="5" strokeLinecap="round" />
      <path d="M62 102 L67 122" stroke={g.url.strap} strokeWidth="5" strokeLinecap="round" />
      <path d="M98 102 L93 122" stroke={g.url.strap} strokeWidth="5" strokeLinecap="round" />
      <path d="M61.2 103 L65.4 119.8 M97.2 103.4 L93.6 117.6" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M62.5 104.5 L66.3 119.6 M97.5 104.5 L93.7 119.6" {...STITCH} />
      {/* khóa cài kim loại ở đầu dây + đinh tán */}
      <Buckle cx={67} cy={122.4} angle={-14} g={g} />
      <Buckle cx={93} cy={122.4} angle={14} g={g} />
      </Patch>

      {/* ---- Tay ở phía trước thân (nhìn thẳng: tay phải giơ lên vẫy) ---- */}
      {leftArmFront && leftArm}
      {rightArmFront && !rightArmOverHead && rightArm}

      {/* ---- Cổ + đầu ---- */}
      {/* bóng của đầu đổ xuống cổ áo */}
      <ellipse cx="80" cy="101.5" rx="17" ry="4.2" fill="#000" opacity="0.22" />
      {/* lòng cổ áo (phần tối phía trong, lộ ra ở đáy chữ V) */}
      <g transform={R ? patchTransform(r, 22, 1) : undefined} display={R && !patchVisible(r, 1) ? 'none' : undefined}>
        <path d="M73.5 99.4 L80 106.2 L86.5 99.4 Z" fill={shade(skin.shirtColor, -0.45)} />
      </g>
      <rect x="73" y="92" width="14" height="12" rx="3" fill={g.url.neck} />
      {/* cổ áo bẻ + nẹp áo + cúc (mặt trước) */}
      <g transform={R ? patchTransform(r, 22, 1) : undefined} display={R && !patchVisible(r, 1) ? 'none' : undefined}>
        <Collar g={g} shirt={skin.shirtColor} />
      </g>
      {/* quay lưng: bản cổ áo sau gáy */}
      {R && patchVisible(r, -1) && (
        <g transform={patchTransform(r, 22, -1)}>
          <path d="M70.5 100.6 Q80 96 89.5 100.6 L89.5 104.4 Q80 100.2 70.5 104.4 Z" fill="#000" opacity="0.2" transform="translate(0 1.2)" />
          <path d="M70.5 100.6 Q80 96 89.5 100.6 L89.5 104.4 Q80 100.2 70.5 104.4 Z" fill={g.url.collar} />
          <path d="M71 101 Q80 96.8 89 101" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.8" />
        </g>
      )}
      {/* đầu: nghiêng khi hover (CSS) */}
      <g className={headOnly ? undefined : styles.head}>
      {/* đang xoay: lọn tóc nằm phía sau khối đầu (chỉ ló ra ở viền) */}
      {R && <CurlLayer curls={curls.filter((curl) => curl.depth < 0)} g={g} hair={skin.hairColor} />}
      {/* tai phía sau khối đầu (nhìn thẳng: chỉ dái tai ló ra hai bên) */}
      {ears.filter((ear) => ear.depth < 10).map((ear) => (
        <Ear key={ear.side} x={ear.x} s={r.s} skin={skin.skinTone} g={g} />
      ))}
      <circle cx="80" cy="68" r="30" fill={g.url.skin} />
      {/* tai quay về phía người xem (nhìn nghiêng): nằm trên má, dưới lọn tóc mai */}
      {ears.filter((ear) => ear.depth >= 10).map((ear) => (
        <Ear key={ear.side} x={ear.x} s={r.s} skin={skin.skinTone} g={g} />
      ))}
      {/* ánh sáng viền phía tối của đầu + điểm bóng trên gò má */}
      <path d="M107.5 76 A28.6 28.6 0 0 1 94 93" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" />
      <ellipse cx="62" cy="74.5" rx="5" ry="3" transform="rotate(-25 62 74.5)" fill="#fff" opacity="0.28" />

      {/* quay lưng: mảng tóc sau gáy */}
      {R && patchVisible(r, -1) && (
        <Patch clip={clipHead} transform={patchTransform(r, 22, -1)}>
          <ellipse cx="80" cy="67" rx="27" ry="24" fill={shade(skin.hairColor, -0.35)} />
          <ellipse cx="80" cy="64" rx="22" ry="18" fill={g.url.hair} opacity="0.7" />
        </Patch>
      )}

      {/* tóc xoăn: mái + thái dương (+ đỉnh đầu khi không đội mũ) – mỗi lọn là một lọn xoắn có khối */}
      {skin.hat === 'none' && (
        <>
          {/* khối tóc nền trên đỉnh (vòm tối, đối xứng quanh trục → xoay góc nào cũng kín, không hở khe giữa các lọn) */}
          <path d="M50.5 64 A29.5 29.5 0 0 1 109.5 64 Q96 55 80 55 Q64 55 50.5 64 Z" fill={g.url.hairBase} />
        </>
      )}
      <CurlLayer curls={R ? curls.filter((curl) => curl.depth >= 0) : staticCurls} g={g} hair={skin.hairColor} />

      {/* bóng vành mũ đổ lên trán */}
      {skin.hat !== 'none' && <ellipse cx="80" cy="64" rx="27" ry="4" fill="#000" opacity="0.2" />}

      {R && skin.beard && beard3d && (
        <>
          <path d={beard3d} fill="none" stroke={beard} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={beard3d} fill="none" stroke={beardSheen} strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" transform="translate(-0.6 -1.1)" />
        </>
      )}

      {/* mặt (râu, mày, mắt, kính, mũi, miệng) – dịch theo con trỏ → cảm giác quay đầu;
          khi xoay 360°: cả mảng mặt trượt quanh khối cầu đầu */}
      <Patch clip={R ? clipHead : undefined} transform={faceT} hidden={!faceShown}>
      <g className={turning ? styles.face : undefined}>
      {/* râu quai nón ngắn theo viền hàm (đang xoay: vẽ bản 3D bên ngoài mảng mặt) */}
      {skin.beard && !R && (
        <>
          <path
            d="M52.9 72.8 A27.5 27.5 0 0 0 107.1 72.8"
            fill="none"
            stroke={beard}
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* ánh sáng trên mép râu (sợi râu có khối) */}
          <path d="M54.4 75.4 A26 26 0 0 0 70 92.8" fill="none" stroke={beardSheen} strokeOpacity="0.4" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}

      {/* hốc mắt: vùng tối nhẹ dưới cung mày → mắt "lõm" vào khối đầu */}
      <ellipse cx="70" cy="70.6" rx="5.8" ry="2.5" fill={shade(skin.skinTone, -0.35)} opacity="0.22" />
      <ellipse cx="90" cy="70.6" rx="5.8" ry="2.5" fill={shade(skin.skinTone, -0.35)} opacity="0.22" />

      {/* lông mày theo biểu cảm: nét chính + ánh sáng mảnh phía trên */}
      <g fill="none" stroke={skin.hairColor} strokeWidth="2.2" strokeLinecap="round">
        <path d={browLeft} />
        <path d={browRight} />
      </g>
      <g fill="none" stroke={beardSheen} strokeOpacity="0.45" strokeWidth="0.7" strokeLinecap="round" transform="translate(-0.3 -0.7)">
        <path d={browLeft} />
        <path d={browRight} />
      </g>

      {/* mắt; suy nghĩ → liếc lên phải */}
      <g transform={thinking ? 'translate(1.6 -1.6)' : undefined}>
        {/* nhìn theo con trỏ: độ lệch lấy từ CSS var --eye-x / --eye-y (Mascot ghi lên phần tử gốc) */}
        <g className={followCursor && FOLLOW_MOODS.includes(mood) ? styles.look : undefined}>
          <Eyes mood={mood} className={eyesClass} eyeFill={g.url.eye} />
        </g>
      </g>

      {/* kính */}
      {skin.glasses === 'round' && (
        <g>
          {/* bóng gọng đổ lên mặt */}
          <g fill="none" stroke="#000" strokeOpacity="0.14" strokeWidth="1.8" transform="translate(0.7 1.3)">
            <circle cx="70" cy="73" r="6.2" />
            <circle cx="90" cy="73" r="6.2" />
          </g>
          <g fill="#ffffff" fillOpacity="0.18" stroke="#2B2B2B" strokeWidth="1.8">
            <circle cx="70" cy="73" r="6.2" />
            <circle cx="90" cy="73" r="6.2" />
            <path d="M76.2 72.5 Q80 70.5 83.8 72.5" fill="none" />
            <path d="M63.8 72 L54 70" fill="none" />
            <path d="M96.2 72 L106 70" fill="none" />
          </g>
          {/* phản chiếu trên mắt kính + ánh kim trên gọng */}
          <path d="M66 71.4 L68.6 68.9 M67.4 73.2 L71.2 69.6 M86 71.4 L88.6 68.9 M87.4 73.2 L91.2 69.6" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.7" strokeLinecap="round" />
          <path d="M65.6 68.4 A6.2 6.2 0 0 1 72.6 67.4 M85.6 68.4 A6.2 6.2 0 0 1 92.6 67.4" fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.6" strokeLinecap="round" />
        </g>
      )}
      {skin.glasses === 'sunglasses' && (
        <g>
          <path d="M62 69 H77.5 V74 Q77.5 79.5 71 79.5 H68 Q62 79.5 62 74 Z" fill="#1D1F24" />
          <path d="M82.5 69 H98 V74 Q98 79.5 92 79.5 H89 Q82.5 79.5 82.5 74 Z" fill="#1D1F24" />
          <path d="M77.5 70.5 Q80 69 82.5 70.5" fill="none" stroke="#1D1F24" strokeWidth="1.8" />
          <path d="M62 70 L53 68.5 M98 70 L107 68.5" stroke="#1D1F24" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M65 71.5 L69 71.5 M85.5 71.5 L89.5 71.5" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )}

      {/* má hồng loang mềm (gradient) + ánh sáng gò má */}
      <ellipse cx="62.5" cy="80" rx="5.2" ry="3.3" fill={g.url.blush} />
      <ellipse cx="97.5" cy="80" rx="5.2" ry="3.3" fill={g.url.blush} />
      <ellipse cx="61.4" cy="78.6" rx="1.6" ry="0.8" fill="#fff" opacity="0.3" />
      <ellipse cx="96.4" cy="78.6" rx="1.6" ry="0.8" fill="#fff" opacity="0.22" />

      {/* mũi: sống mũi sáng, bóng mũi đổ xuống-phải, cánh mũi + lỗ mũi */}
      <path d="M79.4 73.6 Q79.1 75.6 79.3 77" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="0.9" strokeLinecap="round" />
      <ellipse cx="81.3" cy="80.5" rx="2.5" ry="0.95" fill={shade(skin.skinTone, -0.35)} opacity="0.4" />
      <ellipse cx="80" cy="78.5" rx="2.2" ry="1.7" fill={g.url.nose} />
      <circle cx="78.9" cy="79.6" r="0.42" fill={shade(skin.skinTone, -0.55)} opacity="0.55" />
      <circle cx="81.1" cy="79.6" r="0.42" fill={shade(skin.skinTone, -0.55)} opacity="0.55" />
      <circle cx="79.2" cy="77.8" r="0.6" fill="#fff" opacity="0.7" />

      {/* rãnh nhân trung + ánh sáng cằm */}
      <path d="M80 81.1 V83.6" stroke={shade(skin.skinTone, -0.3)} strokeOpacity="0.35" strokeWidth="1.1" strokeLinecap="round" />
      <ellipse cx="79" cy="93.4" rx="3.6" ry="1.2" fill="#fff" opacity="0.18" />

      {/* ria mép mỏng (đi cùng râu) + miệng */}
      {skin.beard && (
        <>
          <path d="M72 82.6 Q76 80.4 80 82 Q84 80.4 88 82.6" fill="none" stroke={beard} strokeWidth="2" strokeLinecap="round" />
          <path d="M73.2 81.8 Q76 80.2 79 81.2" fill="none" stroke={beardSheen} strokeOpacity="0.45" strokeWidth="0.6" strokeLinecap="round" />
        </>
      )}
      <Mouth mood={mood} g={g} skin={skin.skinTone} />
      </g>
      </Patch>

      {/* ---- Mũ ---- (dịch ít hơn mặt: lớp giữa của parallax) */}
      <g className={turning ? styles.hatTurn : undefined}>
        <Hat hat={skin.hat} color={skin.hatColor} g={g} r={r} />
      </g>

      {/* giọt mồ hôi / nước mắt nằm trên mặt → xoay cùng mặt */}
      <Patch clip={R ? clipHead : undefined} transform={faceT} hidden={!faceShown}>
      {/* bối rối: giọt mồ hôi bên thái dương */}
      {confused && (
        <path
          className={styles.sweat}
          d="M108 70 Q104.5 75.5 106.2 78 Q108 80 109.8 78 Q111.5 75.5 108 70 Z"
          fill="#8EC5F4"
          stroke="#5A9BD8"
          strokeWidth="0.8"
        />
      )}

      {/* buồn: giọt nước mắt dưới mắt trái */}
      {sad && (
        <path
          className={styles.tear}
          d="M66 77 Q63.8 80.8 64.9 82.4 Q66 83.6 67.1 82.4 Q68.2 80.8 66 77 Z"
          fill="#8EC5F4"
          stroke="#5A9BD8"
          strokeWidth="0.7"
        />
      )}
      </Patch>
      </g>
      {rightArmOverHead && rightArm}
      </g>

      {/* bối rối: dấu "?" trên đầu */}
      {confused && !headOnly && (
        <text className={styles.floatMark} x="116" y="40" fontSize="20" fontWeight="700" fill="#E0A030" stroke="#fff" strokeWidth="0.6">?</text>
      )}

      {/* buồn ngủ: "z z Z" bay lên */}
      {mood === 'sleepy' && !headOnly && (
        <g fill="#6B8CC7" fontWeight="700">
          <text className={styles.zzz} x="110" y="46" fontSize="9">z</text>
          <text className={styles.zzz} x="118" y="36" fontSize="12" style={{ animationDelay: '0.6s' }}>z</text>
          <text className={styles.zzz} x="128" y="24" fontSize="15" style={{ animationDelay: '1.2s' }}>Z</text>
        </g>
      )}

      {/* vui: lấp lánh hai bên đầu */}
      {mood === 'happy' && !headOnly && (
        <g fill="#F5C342">
          <path className={styles.sparkle} d="M36 44 L38 49 L43 51 L38 53 L36 58 L34 53 L29 51 L34 49 Z" />
          <path className={styles.sparkle} d="M124 30 L125.5 34 L129.5 35.5 L125.5 37 L124 41 L122.5 37 L118.5 35.5 L122.5 34 Z" style={{ animationDelay: '0.35s' }} />
        </g>
      )}

      {/* suy nghĩ: 3 chấm bong bóng suy nghĩ phía trên phải đầu (không hiện ở avatar) */}
      {thinking && !headOnly && (
        // nền xanh nhạt + viền xanh đậm → nổi rõ trên nền trang trắng lẫn tối
        <g fill="#E3F0FC" stroke="#378ADD" strokeWidth="1.6">
          <circle className={styles.thoughtDot} cx="114" cy="42" r="2.8" />
          <circle className={styles.thoughtDot} cx="122" cy="32" r="4" style={{ animationDelay: '0.2s' }} />
          {/* bong bóng lớn có "…" bên trong */}
          <g className={styles.thoughtDot} style={{ animationDelay: '0.4s' }}>
            <ellipse cx="139" cy="15" rx="13" ry="9.5" />
            <g fill="#378ADD" stroke="none">
              <circle cx="133.5" cy="15" r="1.7" />
              <circle cx="139" cy="15" r="1.7" />
              <circle cx="144.5" cy="15" r="1.7" />
            </g>
          </g>
        </g>
      )}
    </svg>
  )
}

/**
 * Tai: khối tròn dẹt màu da. Nhìn thẳng thấy cạnh (hẹp, chỉ dái tai ló ra sau má);
 * nhìn nghiêng thấy cả vành tai + hốc tai.
 */
function Ear({ x, s, skin, g }: { x: number; s: number; skin: string; g: GradientRefs }) {
  const side = Math.abs(s)
  const rx = 3 + 1.8 * side
  return (
    <g>
      <ellipse cx={n(x)} cy="80.5" rx={n(rx)} ry="5.6" fill={g.url.skin} />
      {side > 0.2 && (
        <g opacity={n(Math.min(1, (side - 0.2) * 1.6))}>
          <ellipse cx={n(x)} cy="81" rx={n(rx * 0.5)} ry="3.3" fill={shade(skin, -0.28)} />
          <path d={`M${n(x - rx * 0.62)} 77.4 Q${n(x)} 75.4 ${n(x + rx * 0.62)} 77.4`} fill="none" stroke="#fff" strokeOpacity="0.35" strokeWidth="0.7" strokeLinecap="round" />
        </g>
      )}
    </g>
  )
}

function Eyes({ mood, className, eyeFill }: { mood: MascotMood; className?: string; eyeFill: string }) {
  // vui / chào lúc hover: mắt cười "^ ^"
  if (mood === 'happy') {
    return (
      <g className={className} fill="none" stroke={EYE} strokeWidth="2.2" strokeLinecap="round">
        <path d="M66.5 74.5 Q70 69.5 73.5 74.5" />
        <path d="M86.5 74.5 Q90 69.5 93.5 74.5" />
      </g>
    )
  }
  // buồn ngủ: mắt nhắm
  if (mood === 'sleepy') {
    return (
      <g fill="none" stroke={EYE} strokeWidth="2" strokeLinecap="round">
        <path d="M66.5 73.5 Q70 76 73.5 73.5" />
        <path d="M86.5 73.5 Q90 76 93.5 73.5" />
      </g>
    )
  }
  // mắt tròn bóng như hạt thủy tinh: gradient (dưới hơi sáng – ánh dội) + đốm sáng chính + đốm phụ
  if (mood === 'sad') {
    return (
      <g className={className} fill={eyeFill}>
        <circle cx="70" cy="74" r="2.3" />
        <circle cx="90" cy="74" r="2.3" />
        <g fill="#fff">
          <circle cx="70.8" cy="73.2" r="0.8" />
          <circle cx="90.8" cy="73.2" r="0.8" />
          <circle cx="69.3" cy="75" r="0.35" opacity="0.6" />
          <circle cx="89.3" cy="75" r="0.35" opacity="0.6" />
        </g>
      </g>
    )
  }
  // bối rối: một mắt nheo
  if (mood === 'confused') {
    return (
      <g className={className} fill={eyeFill}>
        <circle cx="70" cy="73" r="2.7" />
        <ellipse cx="90" cy="73.5" rx="2.4" ry="1.5" />
        <circle cx="70.9" cy="72.1" r="0.95" fill="#fff" />
        <circle cx="69.2" cy="74.1" r="0.4" fill="#fff" opacity="0.6" />
      </g>
    )
  }
  return (
    <g className={className} fill={eyeFill}>
      <circle cx="70" cy="73" r="2.6" />
      <circle cx="90" cy="73" r="2.6" />
      <g fill="#fff">
        <circle cx="70.9" cy="72.1" r="0.95" />
        <circle cx="90.9" cy="72.1" r="0.95" />
        <circle cx="69.2" cy="74.2" r="0.4" opacity="0.6" />
        <circle cx="89.2" cy="74.2" r="0.4" opacity="0.6" />
      </g>
    </g>
  )
}

/**
 * Miệng: lòng miệng tối dần vào trong (gradient), răng / lưỡi có khối,
 * môi dưới có ánh sáng (dải sáng dưới miệng), khóe miệng có rãnh nhẹ khi cười.
 */
function Mouth({ mood, g, skin }: { mood: MascotMood; g: GradientRefs; skin: string }) {
  const crease = shade(skin, -0.4)
  const lip = <path d="M76 91.2 Q80 92.9 84 91.2" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="0.9" strokeLinecap="round" />
  switch (mood) {
    case 'greeting':
    case 'happy':
      // cười mở miệng: răng trên + lưỡi + khóe miệng
      return (
        <g>
          <path d="M73 85.5 Q80 95 87 85.5 Z" fill={g.url.mouth} />
          <path d="M74.2 86.1 Q80 87.1 85.8 86.1 Q85.3 87.5 84.4 87.9 Q80 88.8 75.6 87.9 Q74.7 87.5 74.2 86.1 Z" fill="#FBF6EF" />
          <ellipse cx="80" cy="88.9" rx="2.8" ry="1.2" fill="#E46F6F" />
          <ellipse cx="79.2" cy="88.6" rx="1" ry="0.4" fill="#fff" opacity="0.35" />
          <path d="M72.2 84.4 Q71.7 85.7 72.6 86.6 M87.8 84.4 Q88.3 85.7 87.4 86.6" fill="none" stroke={crease} strokeOpacity="0.35" strokeWidth="0.7" strokeLinecap="round" />
          <path d="M76 92 Q80 93.6 84 92" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="0.9" strokeLinecap="round" />
        </g>
      )
    case 'talking':
      // miệng mấp máy (nhóm ngoài giữ lớp sáng môi đứng yên)
      return (
        <g>
          <ellipse className={styles.talkMouth} cx="80" cy="88" rx="3.6" ry="2.6" fill={g.url.mouth} />
          {lip}
        </g>
      )
    case 'thinking':
      return (
        <g>
          <ellipse cx="82" cy="87.5" rx="2.4" ry="2.1" fill={g.url.mouth} />
          <path d="M79.6 90.6 Q82 91.8 84.4 90.6" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      )
    case 'sleepy':
      return <ellipse className={styles.yawn} cx="80" cy="88" rx="2" ry="2.4" fill={g.url.mouth} />
    case 'sad':
      return (
        <g>
          <path d="M74 89.5 Q80 84.5 86 89.5" fill="none" stroke={MOUTH} strokeWidth="2" strokeLinecap="round" />
          <path d="M76.4 90.4 Q80 87.8 83.6 90.4" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      )
    case 'confused':
      return (
        <g>
          <path
            d="M73.5 88 Q76.75 85.5 80 88 Q83.25 90.5 86.5 88"
            fill="none"
            stroke={MOUTH}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M76.5 90 Q80 91.4 83.5 90.8" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="0.8" strokeLinecap="round" />
        </g>
      )
    default:
      return (
        <g>
          <path d="M73.5 86 Q80 92.5 86.5 86" fill="none" stroke={MOUTH} strokeWidth="2" strokeLinecap="round" />
          {/* khóe miệng + môi dưới có khối */}
          <path d="M72.6 85 Q72.3 86.3 73.2 87 M87.4 85 Q87.7 86.3 86.8 87" fill="none" stroke={crease} strokeOpacity="0.3" strokeWidth="0.6" strokeLinecap="round" />
          {lip}
        </g>
      )
  }
}

/**
 * Mảng bề mặt (mặt, yếm, túi…) khi xoay: clip theo khối ở nhóm NGOÀI (không transform),
 * dịch/co ở nhóm TRONG. clipPath gắn cùng phần tử có transform sẽ bị biến đổi theo → không cắt được.
 */
function Patch({ clip, transform, hidden, children }: { clip?: string; transform?: string; hidden?: boolean; children: ReactNode }) {
  return (
    <g clipPath={clip} display={hidden ? 'none' : undefined}>
      <g transform={transform}>{children}</g>
    </g>
  )
}

/** ủng hướng mũi ra trước (z): nhìn nghiêng → dài ra (gót – mũi) và lệch về phía mũi */
const BOOT_TOE_SHIFT = 3
const bootSpan = (r: Rig) => (25 * Math.abs(r.c) + 31 * Math.abs(r.s)) / 25

/**
 * Ủng bảo hộ: đế cao su có rãnh + viền chỉ, thân da đổ khối, mũi thép bóng phía trước,
 * dây giày + khoen đồng; quay lưng thấy gót (mũi giày khuất sau).
 */
function Boot({ cx, r, g }: { cx: number; r: Rig; g: GradientRefs }) {
  const w = 25 * bootSpan(r)
  const c = cx + BOOT_TOE_SHIFT * r.s
  const left = c - w / 2
  const right = c + w / 2
  // mũi giày: z ≈ +7 → lệch theo sin, hiện khi quay về phía người xem
  const toeX = cx + 7 * r.s
  const toeRx = 8.2 * Math.abs(r.c) + 6.5 * Math.abs(r.s)
  const toeFront = r.c > -0.15
  const lacesShown = r.c > 0.3
  const laceX = cx + 3.5 * r.s
  const lw = 2.8 * r.c
  const treads: number[] = []
  for (let i = -5; i <= 5; i++) treads.push(c + i * (w / 12.5))
  return (
    <g>
      {/* thân ủng (da) */}
      <path
        d={`M${n(left)} 191.6 V188.4 Q${n(left)} 184 ${n(left + 4.6)} 184 H${n(right - 4.6)} Q${n(right)} 184 ${n(right)} 188.4 V191.6 Z`}
        fill={g.url.boot}
      />
      {/* quay lưng: miếng ốp gót */}
      {!toeFront && (
        <path d={`M${n(cx - 7)} 191.4 V188 Q${n(cx)} 185.6 ${n(cx + 7)} 188 V191.4 Z`} fill="#000" opacity="0.22" />
      )}
      {/* mũi thép bóng */}
      {toeFront && (
        <>
          <ellipse cx={n(toeX)} cy="189.4" rx={n(toeRx)} ry="3.5" fill={g.url.toe} />
          <ellipse cx={n(toeX - toeRx * 0.38)} cy="188.3" rx={n(Math.max(1, toeRx * 0.3))} ry="0.95" fill="#fff" opacity="0.55" />
        </>
      )}
      {/* dây giày + khoen đồng */}
      {lacesShown && (
        <g>
          <path
            d={`M${n(laceX - lw)} 185 L${n(laceX + lw)} 186.6 M${n(laceX + lw)} 185 L${n(laceX - lw)} 186.6`}
            stroke="#E9D9B8"
            strokeWidth="0.75"
            strokeLinecap="round"
          />
          {[185, 186.6].map((y) => (
            <g key={y}>
              <circle cx={n(laceX - lw)} cy={y} r="0.6" fill={g.url.brass} />
              <circle cx={n(laceX + lw)} cy={y} r="0.6" fill={g.url.brass} />
            </g>
          ))}
        </g>
      )}
      {/* viền ánh sáng mép trên thân ủng */}
      <path d={`M${n(left + 2.4)} 185.2 Q${n(left + 4.6)} 184.5 ${n(c - 1)} 184.5`} stroke="#fff" strokeOpacity="0.25" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      {/* đế cao su: khối + mép sáng + chỉ khâu đế + rãnh chống trơn */}
      <rect x={n(left - 0.6)} y="190.8" width={n(w + 1.2)} height="3.8" rx="1.6" fill={g.url.sole} />
      <path d={`M${n(left + 0.4)} 191.1 H${n(right - 0.4)}`} stroke="#fff" strokeOpacity="0.22" strokeWidth="0.6" />
      <path d={`M${n(left + 1)} 192 H${n(right - 1)}`} {...STITCH} strokeOpacity={0.5} />
      <g stroke="#000" strokeOpacity="0.45" strokeWidth="0.6">
        {treads.map((x) => (
          <path key={n(x)} d={`M${n(x)} 193.1 V194.4`} />
        ))}
      </g>
    </g>
  )
}

/** khóa cài yếm (đồng thau): khung bo góc + khe tối + đinh tán bên dưới, xoay theo dây */
function Buckle({ cx, cy, angle, g }: { cx: number; cy: number; angle: number; g: GradientRefs }) {
  return (
    <g transform={`rotate(${angle} ${cx} ${cy})`}>
      <rect x={cx - 3.6} y={cy - 2.4} width="7.2" height="5.2" rx="1.4" fill="#000" opacity="0.25" transform="translate(0.5 0.8)" />
      <rect x={cx - 3.6} y={cy - 2.4} width="7.2" height="5.2" rx="1.4" fill={g.url.brass} />
      <rect x={cx - 2.2} y={cy - 0.9} width="4.4" height="1.6" rx="0.6" fill="#4A3510" opacity="0.75" />
      <path d={`M${cx - 3} ${cy - 1.9} H${cx + 2.6}`} stroke="#fff" strokeOpacity="0.7" strokeWidth="0.6" strokeLinecap="round" />
      <circle cx={cx} cy={cy + 4.6} r="1.5" fill={g.url.button} />
      <circle cx={cx - 0.5} cy={cy + 4.1} r="0.5" fill="#fff" opacity="0.9" />
    </g>
  )
}

/** cổ tay áo: dải vải đậm hơn ở cuối ống tay + mép viền */
function Cuff({ limb, stroke }: { limb: Limb; stroke: string }) {
  const seg = limbSegment(limb, 0.83, 1)
  return (
    <g>
      <line {...seg} stroke={stroke} strokeWidth="12.6" />
      <line {...seg} stroke="#000" strokeOpacity="0.12" strokeWidth="12.6" />
      <path d={limbCross(limb, 0.83, 6.3, -6.3)} {...SEAM} strokeOpacity="0.32" />
      <path d={limbCross(limb, 0.865, 5.4, -4.6)} {...CREASE_LIGHT} />
    </g>
  )
}

/** cổ áo bẻ hai vạt + nẹp + 2 cúc – tọa độ mặt trước thân (gốc 80) */
function Collar({ g, shirt }: { g: GradientRefs; shirt: string }) {
  const edge = shade(shirt, -0.38)
  const button = shade(shirt, -0.32)
  const left = 'M73.2 98.6 L80 105.8 L70.2 109.8 Q69.4 104 73.2 98.6 Z'
  const right = 'M86.8 98.6 L80 105.8 L89.8 109.8 Q90.6 104 86.8 98.6 Z'
  return (
    <g>
      {/* nẹp áo + cúc */}
      <path d="M80 106 V120" stroke={edge} strokeOpacity="0.55" strokeWidth="0.8" />
      {[112.4, 117.6].map((cy) => (
        <g key={cy}>
          <circle cx="80" cy={cy} r="1.15" fill={button} />
          <circle cx="79.6" cy={cy - 0.4} r="0.4" fill="#fff" opacity="0.6" />
        </g>
      ))}
      {/* bóng vạt cổ áo đổ xuống ngực */}
      <path d={left} fill="#000" opacity="0.22" transform="translate(0.9 1.5)" />
      <path d={right} fill="#000" opacity="0.22" transform="translate(0.9 1.5)" />
      <path d={left} fill={g.url.collar} stroke={edge} strokeOpacity="0.6" strokeWidth="0.6" strokeLinejoin="round" />
      <path d={right} fill={g.url.collar} stroke={edge} strokeOpacity="0.6" strokeWidth="0.6" strokeLinejoin="round" />
      {/* mép gập sáng của cổ áo */}
      <path d="M73.6 99.4 L79.4 105.4 M86.4 99.4 L80.6 105.4" stroke="#fff" strokeOpacity="0.45" strokeWidth="0.7" strokeLinecap="round" />
    </g>
  )
}

const HELMET_DOME: Dome = { cx: 80, cy: 58, rx: 32, ry: 32 }
const CAP_DOME: Dome = { cx: 80, cy: 60, rx: 31, ry: 31 }
const BEANIE_DOME: Dome = { cx: 80, cy: 60, rx: 30, ry: 32 }
/** búi len quanh quả bông (tâm 80,27) */
const POMPOM_TUFTS: [number, number][] = Array.from({ length: 10 }, (_, k) => {
  const a = (k * 36 * Math.PI) / 180
  return [n(80 + 5.4 * Math.cos(a)), n(27 + 5.4 * Math.sin(a))]
})

function Hat({ hat, color, g, r }: { hat: MascotHat; color: string; g: GradientRefs; r: Rig }) {
  if (hat === 'helmet') {
    // mũ bảo hộ: vòm nhựa bóng + gờ giữa + 2 gờ phụ + tem chữ thập xanh + vành cong (thấy cả mặt dưới)
    const ridge = r.rotated ? helmetRidgePath(r) : 'M76 28.5 Q80 27 84 28.5 L85 57 H75 Z'
    const ribs = [-13, 13].map((lateral) => helmetRidgePath(r, lateral, 1.5, 0.5))
    const sticker = domePoint(r, 0, 20, HELMET_DOME)
    return (
      <g>
        <path d="M48 58 A32 32 0 0 1 112 58 Z" fill={g.url.hat} />
        {ribs.map((rib, i) => rib && (
          <g key={i}>
            <path d={rib} fill="#000" opacity="0.14" transform="translate(0.9 0.4)" />
            <path d={rib} fill={g.url.ridge} opacity="0.75" />
          </g>
        ))}
        {ridge && (
          <>
            <path d={ridge} fill="#000" opacity="0.14" transform="translate(1.2 0.4)" />
            <path d={ridge} fill={g.url.ridge} />
          </>
        )}
        {/* tem an toàn chữ thập xanh phía trước (dán trên vòm → co lại khi xoay nghiêng) */}
        {sticker.front > 0.12 && (
          <g transform={`translate(${n(sticker.x)} ${n(sticker.y)}) scale(${n(sticker.front)} 1)`}>
            <rect x="-4" y="-3.6" width="8" height="7.2" rx="1.4" fill="#000" opacity="0.18" transform="translate(0.5 0.6)" />
            <rect x="-4" y="-3.6" width="8" height="7.2" rx="1.4" fill="#FAFAF5" />
            <path d="M-0.9 -2.6 H0.9 V-0.9 H2.6 V0.9 H0.9 V2.6 H-0.9 V0.9 H-2.6 V-0.9 H-0.9 Z" fill="#1E9E4A" />
            <path d="M-3.4 -3 H2.6" stroke="#fff" strokeOpacity="0.9" strokeWidth="0.6" strokeLinecap="round" />
          </g>
        )}
        <ellipse cx="62" cy="42" rx="7.5" ry="3.6" transform="rotate(-38 62 42)" fill="#fff" opacity="0.55" />
        <circle cx="58.5" cy="46" r="1.3" fill="#fff" opacity="0.8" />
        {/* ánh sáng viền phía tối của vòm */}
        <path d="M108.5 50 A30.5 30.5 0 0 0 98 33.5" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.4" strokeLinecap="round" />
        {/* vành mũ cong theo phối cảnh: mặt dưới tối + mặt trên + mép sáng */}
        <path d="M42.4 60.6 Q80 58.8 117.6 60.6 Q118 61.8 116 62.3 Q80 63.8 44 62.3 Q42 61.8 42.4 60.6 Z" fill={shade(color, -0.5)} />
        <path d="M42 58.4 Q80 52.6 118 58.4 Q119.6 59.6 117.6 60.6 Q80 58.8 42.4 60.6 Q40.4 59.6 42 58.4 Z" fill={g.url.brim} />
        <path d="M44.5 58.1 Q80 53.4 115.5 58.1" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    )
  }
  if (hat === 'cap') {
    // mũ lưỡi trai: vòm + nút trên đỉnh + lưỡi trai chìa sang phải
    const billColor = shade(color, -0.25)
    const seamColor = shade(color, -0.15)
    // lưỡi trai chìa ngang (x0 ≈ +33): xoay → co theo cos; khi chĩa về / ra xa người xem thấy phần vành dẹt
    const billInFront = r.rotated && -33 * r.s > 8
    const thread = shade(color, 0.4)
    const bill = (
      <g>
        <g transform={r.rotated ? `translate(80 0) scale(${n(r.c)} 1) translate(-80 0)` : undefined}>
          {/* mặt dưới lưỡi trai (tối) lộ ở mép dưới + mặt trên + chỉ may song song mép */}
          <path d="M100 62.5 L120 63.5 Q130 64 133 60.5 Q131.4 64.6 120 65 L100 64 Z" fill={shade(color, -0.5)} />
          <path d="M100 57 Q124 54.5 133 60.5 Q130 64 120 63.5 L100 62.5 Z" fill={billColor} />
          <path d="M101 57.6 Q122 55.6 130.5 59.8" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M102 59.4 Q121 57.6 129 61.2 M102 61 Q119.5 59.8 126.4 62.4" {...STITCH} stroke={thread} strokeOpacity={0.6} />
        </g>
        {r.rotated && Math.abs(r.s) > 0.2 && (
          <ellipse cx={n(80 + 22 * r.c)} cy="61.5" rx={n(13 * Math.abs(r.s))} ry="3" fill={billColor} />
        )}
      </g>
    )
    // 6 mảnh vải: đường may theo kinh tuyến (xoay quanh vòm đúng 3D) + chỉ đôi hai bên
    const seamPaths = [0, 45, -45, 135, -135, 180]
      .map((phi) => ({ phi, d: meridianPath(r, phi, 4, 86, CAP_DOME) }))
      .filter((s): s is { phi: number; d: string } => s.d !== null)
    const eyelets = [-30, 30, 150, -150].map((phi) => domePoint(r, phi, 58, CAP_DOME)).filter((p) => p.front > 0.15)
    const badge = domePoint(r, 0, 26, CAP_DOME)
    return (
      <g>
        {!billInFront && bill}
        <path d="M49 60 A31 31 0 0 1 111 60 Z" fill={g.url.hat} />
        {seamPaths.map(({ phi, d }) => (
          <g key={phi}>
            <path d={d} fill="none" stroke={seamColor} strokeWidth="1.3" />
            <path d={d} fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="0.6" transform="translate(-0.9 0)" />
          </g>
        ))}
        {/* lỗ thoáng khí (khoen thêu) trên các mảnh */}
        {eyelets.map((p, i) => (
          <ellipse key={i} cx={n(p.x)} cy={n(p.y)} rx={n(1.1 * p.front)} ry="1.1" fill={shade(color, -0.5)} stroke={thread} strokeOpacity="0.7" strokeWidth="0.5" />
        ))}
        {/* huy hiệu thêu phía trước (bánh răng) */}
        {badge.front > 0.15 && (
          <g transform={`translate(${n(badge.x)} ${n(badge.y)}) scale(${n(badge.front)} 1)`}>
            <ellipse rx="6" ry="4.2" fill="#000" opacity="0.18" transform="translate(0.5 0.6)" />
            <ellipse rx="6" ry="4.2" fill="#F3EFE4" stroke={shade(color, -0.2)} strokeWidth="0.6" />
            <circle r="2" fill="none" stroke={shade(color, -0.1)} strokeWidth="1.3" strokeDasharray="0.9 0.7" />
            <circle r="0.8" fill={shade(color, -0.1)} />
          </g>
        )}
        <ellipse cx="63" cy="43" rx="5.5" ry="2.8" transform="rotate(-40 63 43)" fill="#fff" opacity="0.3" />
        <circle cx="80" cy="29.5" r="3" fill={g.url.knob} />
        <rect x="48" y="56.5" width="64" height="5" rx="2.5" fill={g.url.brim} />
        <path d="M50 57.4 H110" stroke="#fff" strokeOpacity="0.3" strokeWidth="0.7" strokeLinecap="round" />
        {billInFront && bill}
      </g>
    )
  }
  if (hat === 'beanie') {
    // mũ len: vòm có gân len chạy dọc (kinh tuyến) + gấu gập + quả bông xù trên đỉnh (len → không bóng)
    const ribs: { key: number; d: string }[] = []
    for (let phi = -180; phi < 180; phi += 12) {
      const d = meridianPath(r, phi, 14, 80, BEANIE_DOME, 0.05)
      if (d) ribs.push({ key: phi, d })
    }
    const label = domePoint(r, -32, 0, { cx: 80, cy: 58.5, rx: 33, ry: 0 })
    return (
      <g>
        {/* quả bông: các búi len quanh lõi */}
        <g fill={g.url.knob}>
          {POMPOM_TUFTS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" />
          ))}
          <circle cx="80" cy="27" r="5.8" />
        </g>
        <ellipse cx="77.6" cy="24.6" rx="2.2" ry="1.4" fill="#fff" opacity="0.35" />
        <path d="M50 60 A30 32 0 0 1 110 60 Z" fill={g.url.hat} />
        {/* gân len: rãnh tối + sống sáng */}
        <g fill="none" strokeLinecap="round">
          {ribs.map(({ key, d }) => (
            <g key={key}>
              <path d={d} stroke={shade(color, -0.35)} strokeOpacity="0.5" strokeWidth="1.1" />
              <path d={d} stroke={shade(color, 0.25)} strokeOpacity="0.3" strokeWidth="0.7" transform="translate(-1.2 0)" />
            </g>
          ))}
        </g>
        {/* gấu gập: bóng đổ lên vòm + khối gấu + mép gập sáng + bóng mép dưới */}
        <rect x="51.5" y="51.4" width="57" height="3" rx="1.5" fill="#000" opacity="0.18" />
        <rect x="46" y="53" width="68" height="11" rx="5.5" fill={g.url.brim} />
        <g stroke={shade(color, -0.3)} strokeWidth="1.1" strokeLinecap="round">
          {(r.rotated ? beanieStripes(r) : [54, 62, 70, 78, 86, 94, 102]).map((x, i) => (
            <path key={i} d={`M${x} 55.5 V61.5`} />
          ))}
        </g>
        <path d="M49 54.2 H111" stroke="#fff" strokeOpacity="0.32" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M49 62.9 H111" stroke="#000" strokeOpacity="0.2" strokeWidth="0.9" strokeLinecap="round" />
        {/* nhãn da khâu trên gấu */}
        {label.front > 0.2 && (
          <g transform={`translate(${n(label.x)} ${n(label.y)}) scale(${n(label.front)} 1)`}>
            <rect x="-3.8" y="-2.6" width="7.6" height="5.2" rx="0.8" fill="#8B5E3C" />
            <rect x="-3.1" y="-1.9" width="6.2" height="3.8" rx="0.5" {...STITCH} stroke="#F2DDB8" />
          </g>
        )}
      </g>
    )
  }
  return null
}

// ---------------- Đổ khối 3D bằng gradient ----------------
// Nguồn sáng cố định ở trên-trái. Chỉ dùng gradient (không filter / blur) → chi phí vẽ gần như
// bằng bản phẳng, animation (thở, vẫy, chớp mắt) không bị nặng thêm.

const GRADIENT_KEYS = [
  'skin', 'neck', 'nose', 'hair', 'shirt', 'overall', 'armL', 'armR', 'boot', 'button', 'strap', 'collar',
  'brass', 'pocket', 'turnup', 'toe', 'sole', 'hairAlt', 'hairBase', 'eye', 'mouth', 'blush',
  'ground', 'hat', 'ridge', 'brim', 'knob',
] as const
type GradientKey = (typeof GRADIENT_KEYS)[number]

interface GradientRefs {
  id: Record<GradientKey, string>
  url: Record<GradientKey, string>
}

function gradientRefs(uid: string): GradientRefs {
  const id = {} as Record<GradientKey, string>
  const url = {} as Record<GradientKey, string>
  for (const key of GRADIENT_KEYS) {
    id[key] = `${uid}-${key}`
    url[key] = `url(#${uid}-${key})`
  }
  return { id, url }
}

/**
 * khối cầu: điểm sáng trên-trái → màu gốc → vùng tối (terminator) → mép hơi sáng lại (ánh sáng dội).
 * objectBoundingBox → dùng chung cho mọi hình tròn.
 */
function Sphere({ id, color, light = 0.4, dark = -0.4 }: { id: string; color: string; light?: number; dark?: number }) {
  return (
    <radialGradient id={id} cx="0.42" cy="0.38" r="0.68" fx="0.3" fy="0.24">
      <stop offset="0" stopColor={shade(color, light)} />
      <stop offset="0.38" stopColor={color} />
      <stop offset="0.8" stopColor={shade(color, dark)} />
      <stop offset="1" stopColor={shade(color, dark * 0.6)} />
    </radialGradient>
  )
}

/** khối trụ đứng: mép trái tối, dải sáng lệch trái, tối sâu bên phải, mép phải sáng lại (ánh dội) */
function Cylinder({ id, color }: { id: string; color: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={shade(color, -0.25)} />
      <stop offset="0.22" stopColor={shade(color, 0.28)} />
      <stop offset="0.5" stopColor={color} />
      <stop offset="0.86" stopColor={shade(color, -0.42)} />
      <stop offset="1" stopColor={shade(color, -0.25)} />
    </linearGradient>
  )
}

/** tay (nét vẽ chéo): gradient vuông góc với trục tay, theo tọa độ SVG → xoay cùng khi vẫy */
function LimbShade({ id, color, x1, y1, x2, y2 }: { id: string; color: string; x1: number; y1: number; x2: number; y2: number }) {
  return (
    <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
      <stop offset="0" stopColor={shade(color, 0.2)} />
      <stop offset="0.35" stopColor={shade(color, 0.12)} />
      <stop offset="0.8" stopColor={shade(color, -0.38)} />
      <stop offset="1" stopColor={shade(color, -0.22)} />
    </linearGradient>
  )
}

function Vertical({ id, top, bottom }: { id: string; top: string; bottom: string }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={top} />
      <stop offset="1" stopColor={bottom} />
    </linearGradient>
  )
}

function MascotDefs({ g, skin, armL, armR }: { g: GradientRefs; skin: MascotSkin; armL: Limb; armR: Limb }) {
  const { id } = g
  const hat = skin.hatColor
  const gradL = limbGradient(armL)
  const gradR = limbGradient(armR)
  return (
    <defs>
      <Sphere id={id.skin} color={skin.skinTone} light={0.3} dark={-0.26} />
      <Vertical id={id.neck} top={shade(skin.skinTone, -0.45)} bottom={shade(skin.skinTone, -0.12)} />
      <Sphere id={id.nose} color={shade(skin.skinTone, -0.08)} light={0.3} dark={-0.25} />
      <Sphere id={id.hair} color={skin.hairColor} light={0.45} dark={-0.45} />
      <Sphere id={id.hairAlt} color={shade(skin.hairColor, 0.12)} light={0.42} dark={-0.42} />
      {/* mắt: đáy hơi sáng (ánh dội từ má) → tròng mắt có khối */}
      <radialGradient id={id.eye} cx="0.55" cy="0.72" r="0.7">
        <stop offset="0" stopColor="#6B4528" />
        <stop offset="0.45" stopColor={EYE} />
        <stop offset="1" stopColor="#120904" />
      </radialGradient>
      {/* lòng miệng: sâu tối ở trên, đỏ ấm ở mép */}
      <radialGradient id={id.mouth} cx="0.5" cy="0.25" r="0.85">
        <stop offset="0" stopColor="#3E0F08" />
        <stop offset="1" stopColor={MOUTH} />
      </radialGradient>
      <radialGradient id={id.blush}>
        <stop offset="0" stopColor="#F28C84" stopOpacity="0.7" />
        <stop offset="1" stopColor="#F28C84" stopOpacity="0" />
      </radialGradient>
      <Vertical id={id.hairBase} top={shade(skin.hairColor, -0.2)} bottom={shade(skin.hairColor, -0.5)} />
      <Cylinder id={id.shirt} color={skin.shirtColor} />
      <Cylinder id={id.overall} color={skin.overallColor} />
      <Vertical id={id.strap} top={shade(skin.strapColor, 0.15)} bottom={shade(skin.strapColor, -0.25)} />
      <Vertical id={id.collar} top={shade(skin.shirtColor, 0.22)} bottom={shade(skin.shirtColor, -0.06)} />
      <Sphere id={id.brass} color="#D9A441" light={0.55} dark={-0.4} />
      <Vertical id={id.pocket} top={shade(skin.overallColor, -0.02)} bottom={shade(skin.overallColor, -0.26)} />
      <Cylinder id={id.turnup} color={shade(skin.overallColor, 0.22)} />
      {/* vuông góc với trục tay (tính lại theo góc xoay) */}
      <LimbShade id={id.armL} color={skin.shirtColor} {...gradL} />
      <LimbShade id={id.armR} color={skin.shirtColor} {...gradR} />
      <Cylinder id={id.boot} color="#5C4230" />
      <Sphere id={id.toe} color="#6E5039" light={0.5} dark={-0.38} />
      <Vertical id={id.sole} top="#3E342C" bottom="#141010" />
      <Sphere id={id.button} color="#FCE7B5" light={0.5} dark={-0.3} />
      <radialGradient id={id.ground}>
        <stop offset="0" stopColor="#000" stopOpacity="0.28" />
        <stop offset="0.6" stopColor="#000" stopOpacity="0.1" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      {skin.hat !== 'none' && (
        <>
          <Sphere id={id.hat} color={hat} light={skin.hat === 'beanie' ? 0.25 : 0.42} dark={-0.4} />
          <Vertical id={id.ridge} top={shade(hat, 0.45)} bottom={shade(hat, 0.15)} />
          <Vertical
            id={id.brim}
            top={shade(hat, skin.hat === 'helmet' ? -0.18 : skin.hat === 'cap' ? -0.04 : -0.08)}
            bottom={shade(hat, skin.hat === 'helmet' ? -0.45 : skin.hat === 'cap' ? -0.25 : -0.3)}
          />
          <Sphere id={id.knob} color={skin.hat === 'beanie' ? shade(hat, 0.4) : shade(hat, -0.2)} light={0.3} dark={-0.25} />
        </>
      )}
    </defs>
  )
}
