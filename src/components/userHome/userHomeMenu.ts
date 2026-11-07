import { hasAnyRole } from '../../services/authService'
import { menuGroups, type MenuGroupId, type MenuItemConfig } from '../layout/sidebarConfig'

/*
 * Chia menu sidebar thành 3 nhóm cho trang chủ, cùng quy tắc với LeftSidebar:
 * - ready: mở được ngay (đủ quyền, đã xong) -> lối tắt
 * - locked: đã xong nhưng cần vai trò khác -> gợi ý xin quyền
 * - upcoming: đủ quyền nhưng chưa xong / đang tắt -> sắp ra mắt
 */
export interface HomeMenuEntry {
  item: MenuItemConfig
  groupId: MenuGroupId
}

export interface HomeMenu {
  ready: HomeMenuEntry[]
  locked: HomeMenuEntry[]
  upcoming: HomeMenuEntry[]
}

const HOME_PATH = '/user-home'

export function buildHomeMenu(): HomeMenu {
  const menu: HomeMenu = { ready: [], locked: [], upcoming: [] }

  for (const group of menuGroups) {
    for (const item of group.items) {
      if (item.path === HOME_PATH) continue

      const entry = { item, groupId: group.id }
      const allowed = !item.roles || hasAnyRole(item.roles)
      const ready = (item.status ?? 'ready') === 'ready' && !item.disabled

      if (allowed && ready) menu.ready.push(entry)
      else if (allowed) menu.upcoming.push(entry)
      else if (ready) menu.locked.push(entry)
    }
  }

  return menu
}
