import { hasAnyRole } from '../../services/authService'
import { getPageUsage } from '../layout/pageUsage'
import { menuGroups, type MenuGroupId, type MenuItemConfig } from '../layout/sidebarConfig'

/*
 * Chia menu sidebar thành nhóm cho trang chủ, cùng quy tắc với LeftSidebar:
 * - ready: mở được ngay (đủ quyền, đã xong) -> lối tắt
 * - upcoming: đủ quyền nhưng chưa xong / đang tắt -> sắp ra mắt
 * Trang không có quyền (vd. trang ADMIN với tài khoản thường) không hiện.
 *
 * Trang hay dùng (pageUsage) được đánh dấu `frequent` và xếp lên đầu tầng "Dùng ngay".
 * Giữa các trang hay dùng vẫn theo thứ tự sidebar để vị trí thùng ít xáo trộn.
 */
export interface HomeMenuEntry {
  item: MenuItemConfig
  groupId: MenuGroupId
  frequent?: boolean
}

export interface HomeMenu {
  ready: HomeMenuEntry[]
  upcoming: HomeMenuEntry[]
}

const HOME_PATH = '/user-home'
const MAX_FREQUENT = 3
// Khoảng 2 lần mở gần đây trở lên mới tính là hay dùng
const MIN_FREQUENT_SCORE = 1.5

export function buildHomeMenu(): HomeMenu {
  const menu: HomeMenu = { ready: [], upcoming: [] }

  for (const group of menuGroups) {
    for (const item of group.items) {
      if (item.path === HOME_PATH) continue

      // Không có quyền: không hiện
      if (item.roles && !hasAnyRole(item.roles)) continue

      const entry = { item, groupId: group.id }
      const ready = (item.status ?? 'ready') === 'ready' && !item.disabled

      if (ready) menu.ready.push(entry)
      else menu.upcoming.push(entry)
    }
  }

  const usage = getPageUsage()
  const frequent = new Set(
    menu.ready
      .map((entry) => ({ path: entry.item.path, score: usage[entry.item.path] ?? 0 }))
      .filter(({ score }) => score >= MIN_FREQUENT_SCORE)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_FREQUENT)
      .map(({ path }) => path),
  )

  // Chỉ đánh dấu khi còn trang khác: 1-3 trang thì không cần nổi bật
  if (frequent.size > 0 && frequent.size < menu.ready.length) {
    const marked = menu.ready.map((entry) => (frequent.has(entry.item.path) ? { ...entry, frequent: true } : entry))
    menu.ready = [...marked.filter((entry) => entry.frequent), ...marked.filter((entry) => !entry.frequent)]
  }

  return menu
}
