/**
 * Xoay mascot 360° bằng chuột (bàn xoay dưới chân).
 *
 * Store nhỏ ngoài React: góc xoay đổi ~60 lần/giây nhưng chỉ component con đăng ký
 * (useSyncExternalStore) render lại – Mascot (chat, bubble…) không bị render theo.
 * Vòng requestAnimationFrame chỉ chạy khi đang kéo / trôi quán tính / quay về mặt trước;
 * đứng yên → không tốn gì.
 */
import { prefersReducedMotion } from './useMascotBehavior'

/** độ / px khi kéo */
const DEG_PER_PX = 1.4
/** quán tính: vận tốc giảm còn ~e^-1 sau mỗi FRICTION_MS */
const FRICTION_MS = 260
/** đứng yên bao lâu thì tự quay về mặt trước */
const RETURN_DELAY_MS = 1600
const RETURN_MS = 650
const SPIN_ONCE_MS = 1100
/** vận tốc tối đa khi thả tay (độ / ms) */
const MAX_VELOCITY = 2.2

type Phase =
  | { kind: 'idle' }
  | { kind: 'drag' }
  | { kind: 'coast'; velocity: number; stillSince: number | null }
  | { kind: 'tween'; from: number; to: number; start: number; duration: number; ease: (t: number) => number }

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/** đưa góc về (-180, 180] */
function wrap(angle: number) {
  const a = ((angle % 360) + 360) % 360
  return a > 180 ? a - 360 : a
}

export interface MascotSpin {
  /** góc hiện tại (độ); 0 = nhìn thẳng */
  get: () => number
  subscribe: (listener: () => void) => () => void
  grab: (clientX: number) => void
  move: (clientX: number) => void
  release: () => void
  /** xoay trọn 1 vòng (bấm bàn xoay / Enter) */
  spinOnce: () => void
  /** xoay từng nấc bằng bàn phím */
  nudge: (deg: number) => void
  /** quay tới góc chỉ định theo đường ngắn nhất (nút Trước / Nghiêng / Sau) */
  turnTo: (deg: number) => void
  dispose: () => void
}

export interface MascotSpinOptions {
  /** đứng yên một lúc thì tự quay về mặt trước (mascot nổi: có; Phòng thay đồ: không – để ngắm mặt sau) */
  autoReturn?: boolean
}

export function createMascotSpin({ autoReturn = true }: MascotSpinOptions = {}): MascotSpin {
  let angle = 0
  let phase: Phase = { kind: 'idle' }
  let frame = 0
  let lastTime = 0
  let lastX = 0
  // mẫu di chuyển gần nhất để tính vận tốc lúc thả tay
  let samples: { t: number; a: number }[] = []
  const listeners = new Set<() => void>()

  function set(next: number) {
    if (next === angle) return
    angle = next
    listeners.forEach((listener) => listener())
  }

  function ensureLoop() {
    if (!frame) {
      lastTime = performance.now()
      frame = window.requestAnimationFrame(tick)
    }
  }

  function returnHome(now: number) {
    const from = wrap(angle)
    if (Math.abs(from) < 0.5 || prefersReducedMotion()) {
      set(0)
      phase = { kind: 'idle' }
      return
    }
    // đổi sang góc tương đương trong (-180, 180] (không nhảy hình) rồi quay về 0
    set(from)
    phase = { kind: 'tween', from, to: 0, start: now, duration: RETURN_MS, ease: easeOutCubic }
  }

  function tick(now: number) {
    frame = 0
    const dt = Math.min(64, now - lastTime)
    lastTime = now

    if (phase.kind === 'coast') {
      const coast = phase
      if (Math.abs(coast.velocity) > 0.01) {
        set(angle + coast.velocity * dt)
        coast.velocity *= Math.exp(-dt / FRICTION_MS)
      } else if (!autoReturn) {
        phase = { kind: 'idle' }
      } else {
        coast.velocity = 0
        coast.stillSince ??= now
        if (now - coast.stillSince >= RETURN_DELAY_MS) returnHome(now)
      }
    } else if (phase.kind === 'tween') {
      const t = Math.min(1, (now - phase.start) / phase.duration)
      set(phase.from + (phase.to - phase.from) * phase.ease(t))
      if (t >= 1) {
        set(wrap(phase.to) === 0 ? 0 : wrap(phase.to))
        phase = phase.to % 360 === 0 || !autoReturn ? { kind: 'idle' } : { kind: 'coast', velocity: 0, stillSince: now }
      }
    }

    if (phase.kind === 'coast' || phase.kind === 'tween') frame = window.requestAnimationFrame(tick)
  }

  return {
    get: () => angle,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    grab(clientX) {
      window.cancelAnimationFrame(frame)
      frame = 0
      phase = { kind: 'drag' }
      lastX = clientX
      samples = [{ t: performance.now(), a: angle }]
    },
    move(clientX) {
      if (phase.kind !== 'drag') return
      set(angle + (clientX - lastX) * DEG_PER_PX)
      lastX = clientX
      const now = performance.now()
      samples.push({ t: now, a: angle })
      samples = samples.filter((s) => now - s.t <= 100)
    },
    release() {
      if (phase.kind !== 'drag') return
      if (prefersReducedMotion()) {
        if (autoReturn) set(0)
        phase = { kind: 'idle' }
        return
      }
      const first = samples[0]
      const last = samples[samples.length - 1]
      const span = last && first ? last.t - first.t : 0
      const raw = span > 0 ? (last.a - first.a) / span : 0
      const velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, raw))
      phase = { kind: 'coast', velocity, stillSince: null }
      ensureLoop()
    },
    spinOnce() {
      if (prefersReducedMotion() || phase.kind === 'drag') return
      const from = wrap(angle)
      set(from)
      phase = { kind: 'tween', from, to: from >= 0 ? 360 : -360, start: performance.now(), duration: SPIN_ONCE_MS, ease: easeInOutCubic }
      ensureLoop()
    },
    nudge(deg) {
      if (phase.kind === 'drag') return
      const from = angle
      if (prefersReducedMotion()) {
        set(wrap(from + deg))
        phase = autoReturn ? { kind: 'coast', velocity: 0, stillSince: performance.now() } : { kind: 'idle' }
      } else {
        phase = { kind: 'tween', from, to: from + deg, start: performance.now(), duration: 220, ease: easeOutCubic }
      }
      ensureLoop()
    },
    turnTo(deg) {
      if (phase.kind === 'drag') return
      const from = wrap(angle)
      const to = from + wrap(deg - from)
      if (prefersReducedMotion() || Math.abs(to - from) < 0.5) {
        set(wrap(to))
        phase = autoReturn && wrap(to) !== 0 ? { kind: 'coast', velocity: 0, stillSince: performance.now() } : { kind: 'idle' }
      } else {
        set(from)
        phase = { kind: 'tween', from, to, start: performance.now(), duration: 500, ease: easeInOutCubic }
      }
      ensureLoop()
    },
    dispose() {
      window.cancelAnimationFrame(frame)
      frame = 0
    },
  }
}
