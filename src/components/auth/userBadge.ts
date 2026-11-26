import type { Messages } from '../../i18n/messages/en'
import type { AuthUser } from '../../services/authStore'

/*
 * Badge bộ phận hiển thị dưới tên người dùng (sidebar, hộp thoại đăng xuất, thanh trang chủ).
 * Roles ở đây CHỈ để hiển thị trong tooltip; kiểm quyền luôn dùng perms (can / usePerm).
 */

export interface UserBadge {
  /** section, nếu rỗng thì dept */
  label: string
  /** "Fac · Dept · Section · Line · Group" + dòng "Quyền: ..." */
  tooltip: string
}

type BadgeLabels = Pick<Messages['sidebar'], 'permsLabel' | 'roleNames'>

// '' = ẩn role đó; role không có trong roleNames hiện nguyên mã
function roleName(role: string, names: Record<string, string>): string {
  return Object.prototype.hasOwnProperty.call(names, role) ? names[role] : role
}

export function getUserBadge(user: AuthUser | null | undefined, labels: BadgeLabels): UserBadge | null {
  const label = user?.section || user?.dept
  if (!user || !label) return null

  const org = [user.fac, user.dept, user.section, user.line, user.group].filter(Boolean).join(' · ')
  const roles = user.roles.map((role) => roleName(role, labels.roleNames)).filter(Boolean)

  return {
    label,
    tooltip: [org, roles.length ? `${labels.permsLabel}${roles.join(', ')}` : ''].filter(Boolean).join('\n'),
  }
}
