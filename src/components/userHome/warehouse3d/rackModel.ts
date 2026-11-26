import type { HomeMenu, HomeMenuEntry } from '../userHomeMenu'
import { CRATE_RATIO, crateCell, fitCrates } from '../warehouse/crateLayout'
import type { CrateKind } from '../warehouse/UserHomeCrate'

/*
 * Kích thước kệ 3D (mét). Gốc toạ độ: giữa kệ, mặt sàn, mép trước dầm (z = 0); kệ lùi về z âm.
 */
export const RACK = {
  // Khoảng cách tâm 2 trụ trái - phải
  width: 5.6,
  depth: 0.95,
  post: 0.09,
  beam: 0.11,
  beamDepth: 0.05,
  deck: 0.03,
  // Khe từ sàn tới dầm tầng thấp nhất
  base: 0.16,
  sideMargin: 0.14,
  gap: 0.14,
  // Mặt trước thùng lùi so với mép dầm
  frontInset: 0.07,
}

export interface TierSpec {
  kind: CrateKind
  code: string
  // Chiều cao thông thuỷ của tầng
  clear: number
  maxSize: number
}

// Từ dưới lên: dùng ngay -> sắp ra mắt
export const TIERS: TierSpec[] = [
  { kind: 'ready', code: 'A-02', clear: 1.15, maxSize: 1.05 },
  { kind: 'upcoming', code: 'A-03', clear: 0.8, maxSize: 0.58 },
]

export interface CratePlacement {
  entry: HomeMenuEntry
  kind: CrateKind
  // Tâm thùng
  x: number
  y: number
  z: number
  w: number
  h: number
  d: number
}

export interface TierLayout {
  spec: TierSpec
  // Mặt trên dầm = mặt sàn kệ
  deckY: number
  topY: number
  count: number
}

export interface RackLayout {
  tiers: TierLayout[]
  crates: CratePlacement[]
  height: number
}

/*
 * Tầng "Sắp ra mắt" không bấm được: ít thùng (vừa 1 hàng ở cỡ tối đa) thì hạ thấp tầng,
 * kệ thấp hơn -> camera đứng gần hơn -> thùng dùng ngay to hơn trên màn hình.
 */
function tierClear(spec: TierSpec, count: number) {
  if (spec.kind !== 'upcoming') return spec.clear
  if (count === 0) return 0.45
  // Thùng cỡ tối đa cao maxSize / CRATE_RATIO; chừa 8% phía trên như fitCrates bên dưới
  if (count <= 3) return Math.min(spec.clear, spec.maxSize / CRATE_RATIO / 0.92 + 0.04)
  return spec.clear
}

export function buildRackLayout(menu: HomeMenu): RackLayout {
  const byKind: Record<CrateKind, HomeMenuEntry[]> = {
    ready: menu.ready,
    upcoming: menu.upcoming,
  }
  const innerWidth = RACK.width - RACK.post - RACK.sideMargin * 2
  const tiers: TierLayout[] = []
  const crates: CratePlacement[] = []
  let deckY = RACK.base + RACK.beam

  for (const baseSpec of TIERS) {
    const entries = byKind[baseSpec.kind]
    const spec = { ...baseSpec, clear: tierClear(baseSpec, entries.length) }
    // Chừa 8% phía trên cho thoáng
    const fit = fitCrates(entries.length, innerWidth, spec.clear * 0.92, { gap: RACK.gap, maxSize: spec.maxSize })
    const w = fit.size
    const h = w / CRATE_RATIO
    const d = Math.min(w * 0.8, RACK.depth - 0.14)
    const rowWidth = fit.cols * w + (fit.cols - 1) * RACK.gap

    entries.forEach((entry, index) => {
      const { gridRow, gridColumn } = crateCell(index, fit)
      const level = fit.rows - gridRow
      crates.push({
        entry,
        kind: spec.kind,
        x: -rowWidth / 2 + w / 2 + (gridColumn - 1) * (w + RACK.gap),
        y: deckY + h / 2 + level * h,
        z: -RACK.frontInset - d / 2,
        w,
        h,
        d,
      })
    })

    tiers.push({ spec, deckY, topY: deckY + spec.clear, count: entries.length })
    deckY += spec.clear + RACK.beam
  }

  return { tiers, crates, height: tiers[tiers.length - 1].topY + 0.06 }
}
