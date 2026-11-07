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
  // Giây bắt đầu thả hàng của tầng
  delay: number
}

// Từ dưới lên: cần quyền -> dùng ngay (ngang tầm mắt) -> sắp ra mắt
export const TIERS: TierSpec[] = [
  { kind: 'locked', code: 'A-01', clear: 0.85, maxSize: 0.8, delay: 0.8 },
  { kind: 'ready', code: 'A-02', clear: 1.15, maxSize: 1.05, delay: 0.15 },
  { kind: 'upcoming', code: 'A-03', clear: 0.8, maxSize: 0.58, delay: 0.5 },
]

export interface CratePlacement {
  entry: HomeMenuEntry
  kind: CrateKind
  delay: number
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

export function buildRackLayout(menu: HomeMenu): RackLayout {
  const byKind: Record<CrateKind, HomeMenuEntry[]> = {
    locked: menu.locked,
    ready: menu.ready,
    upcoming: menu.upcoming,
  }
  const innerWidth = RACK.width - RACK.post - RACK.sideMargin * 2
  const tiers: TierLayout[] = []
  const crates: CratePlacement[] = []
  let deckY = RACK.base + RACK.beam

  for (const spec of TIERS) {
    const entries = byKind[spec.kind]
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
        delay: spec.delay + index * 0.07,
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
