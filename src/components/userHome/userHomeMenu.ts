import { hasAnyRole } from '../../services/authService'
import { menuGroups, type MenuGroupId, type MenuItemConfig } from '../layout/sidebarConfig'

/*
 * Chia menu sidebar thành nhóm cho trang chủ, cùng quy tắc với LeftSidebar:
 * - ready: mở được ngay (đủ quyền, đã xong) -> lối tắt
 * - upcoming: đủ quyền nhưng chưa xong / đang tắt -> sắp ra mắt
 * Trang không có quyền (vd. trang ADMIN với tài khoản thường) không hiện.
 */
export interface HomeMenuEntry {
  item: MenuItemConfig
  groupId: MenuGroupId
}

export interface HomeMenu {
  ready: HomeMenuEntry[]
  upcoming: HomeMenuEntry[]
}

const HOME_PATH = '/user-home'

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

  return menu
}
