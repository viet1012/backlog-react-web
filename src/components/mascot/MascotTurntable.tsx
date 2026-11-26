import { useRef, useSyncExternalStore } from 'react'
import type { ComponentProps, PointerEvent as ReactPointerEvent } from 'react'
import styles from './Mascot.module.css'
import { MascotSvg } from './MascotSvg'
import type { MascotSpin } from './mascotSpin'

/** góc xoay hiện tại – chỉ component gọi hook này render lại khi xoay */
export function useSpinAngle(spin: MascotSpin) {
  return useSyncExternalStore(spin.subscribe, spin.get, spin.get)
}

/**
 * Mascot theo góc xoay. Chỉ component này render lại mỗi frame khi đang xoay
 * (component cha – chat, tủ đồ… – không bị render theo).
 */
export function SpinningMascotSvg({ spin, ...props }: { spin: MascotSpin } & ComponentProps<typeof MascotSvg>) {
  const turn = useSpinAngle(spin)
  return <MascotSvg {...props} turn={turn} />
}

/**
 * Kéo ngang để xoay (gắn vào bất kỳ phần tử nào: bàn xoay, hình mascot ở Phòng thay đồ…).
 * `consumeClick()` → true nếu click vừa rồi là cuối một lần kéo (bỏ qua).
 */
export function useSpinDrag(spin: MascotSpin) {
  const drag = useRef<{ x: number; moved: boolean } | null>(null)
  const dragged = useRef(false)

  function onPointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0 || !event.isPrimary) return
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { x: event.clientX, moved: false }
    spin.grab(event.clientX)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const state = drag.current
    if (!state) return
    if (Math.abs(event.clientX - state.x) > 3) state.moved = true
    spin.move(event.clientX)
  }

  function onPointerEnd() {
    const state = drag.current
    if (!state) return
    drag.current = null
    // kéo xong vẫn sinh click → không tính là bấm
    dragged.current = state.moved
    spin.release()
  }

  function consumeClick() {
    if (!dragged.current) return false
    dragged.current = false
    return true
  }

  return {
    handlers: { onPointerDown, onPointerMove, onPointerUp: onPointerEnd, onPointerCancel: onPointerEnd },
    consumeClick,
  }
}

// vòng bàn xoay (elip phối cảnh) trong viewBox 72×22
const CX = 36
const CY = 10
const RX = 30
const RY = 6.5

/** điểm trên vòng elip theo góc (0° = chính giữa phía trước, gần người xem) */
function onRing(deg: number) {
  const a = (deg * Math.PI) / 180
  return { x: CX + RX * Math.sin(a), y: CY + RY * Math.cos(a), front: Math.cos(a) }
}

const r2 = (v: number) => Math.round(v * 100) / 100

/**
 * Bàn xoay dưới chân mascot: vòng elip như mặt bàn xoay nhìn nghiêng + núm chỉ hướng mặt mascot
 * (núm chạy quanh vòng theo góc xoay thật – ra sau thì nhỏ / mờ đi).
 * Kéo ngang để xoay, bấm để xoay 1 vòng, ← → xoay từng nấc.
 */
export function MascotTurntable({
  spin,
  label,
  variant = 'float',
}: {
  spin: MascotSpin
  label: string
  /** float: mascot nổi góc màn hình (hiện khi hover); stage: sân khấu Phòng thay đồ (luôn hiện, to hơn) */
  variant?: 'float' | 'stage'
}) {
  const turn = useSpinAngle(spin)
  const { handlers, consumeClick } = useSpinDrag(spin)

  const knob = onRing(turn)
  // 0 (sau lưng) → 1 (trước mặt)
  const near = (knob.front + 1) / 2
  const knobR = r2(2.2 + 1.3 * near)

  const knobEl = (
    <g className={styles.turntableKnob} opacity={r2(0.45 + 0.55 * near)}>
      <circle cx={r2(knob.x)} cy={r2(knob.y)} r={r2(knobR + 1.4)} fill="#fff" />
      <circle cx={r2(knob.x)} cy={r2(knob.y)} r={knobR} fill="currentColor" />
      <circle cx={r2(knob.x - knobR * 0.35)} cy={r2(knob.y - knobR * 0.35)} r={r2(knobR * 0.35)} fill="#fff" opacity="0.6" />
    </g>
  )

  return (
    <button
      type="button"
      className={`${styles.turntable} ${variant === 'stage' ? styles.turntableStage : ''}`}
      aria-label={label}
      title={label}
      {...handlers}
      onClick={() => {
        if (consumeClick()) return
        spin.spinOnce()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        spin.nudge(event.key === 'ArrowLeft' ? -30 : 30)
      }}
    >
      <svg viewBox="0 0 72 22" aria-hidden="true" focusable="false">
        {/* mặt bàn: elip mờ */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} className={styles.turntableDisc} />

        {/* núm ở nửa sau vẽ trước, bị nửa trước của vòng che */}
        {knob.front < 0 && knobEl}

        {/* nửa sau của vòng: nét đứt, nhạt */}
        <path
          d={`M${CX - RX} ${CY} A${RX} ${RY} 0 0 1 ${CX + RX} ${CY}`}
          className={styles.turntableBack}
        />
        {/* nửa trước: viền trắng làm nền (nổi trên mọi màu nền) + nét chính */}
        <path d={`M${CX - RX} ${CY} A${RX} ${RY} 0 0 0 ${CX + RX} ${CY}`} className={styles.turntableHalo} />
        <path d={`M${CX - RX} ${CY} A${RX} ${RY} 0 0 0 ${CX + RX} ${CY}`} className={styles.turntableFront} />

        {/* mũi tên chiều xoay ở hai đầu vòng */}
        <path d={`M${CX + RX - 3.2} ${CY - 0.6} L${CX + RX} ${CY - 3.4} L${CX + RX + 2.6} ${CY - 0.2}`} className={styles.turntableArrow} />
        <path d={`M${CX - RX - 2.6} ${CY + 0.2} L${CX - RX} ${CY + 3.4} L${CX - RX + 3.2} ${CY + 0.6}`} className={styles.turntableArrow} />

        {knob.front >= 0 && knobEl}
      </svg>
    </button>
  )
}
