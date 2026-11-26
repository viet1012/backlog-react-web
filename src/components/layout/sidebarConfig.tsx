import type {
    ReactNode,
} from 'react'

import type { Messages } from '../../i18n/messages/en'
import { appPages, type PagePerm } from '../../routes/appPages'


// =========================================================
// TYPES
// =========================================================

export type MenuItemStatus =
    | 'ready'
    | 'developing'
    | 'todo'

export type MenuGroupId = keyof Messages['nav']['groups']

export type MenuItemLabelKey = Exclude<keyof Messages['nav'], 'groups'>

// Labels are i18n keys: group label = t.nav.groups[id], item label = t.nav[labelKey].
export interface MenuGroupConfig {
    id: MenuGroupId
    items: MenuItemConfig[]
}

export interface GroupAccent {
    light: string
    dark: string
}

export type MenuItemAction =
    | 'view'
    | 'input'

export interface MenuItemConfig {
    labelKey: MenuItemLabelKey
    path: string
    icon: ReactNode
    status?: MenuItemStatus
    disabled?: boolean

    /** Quyền xem (từ /me), cùng giá trị với route guard */
    perm?: PagePerm
    action?: MenuItemAction
}

// =========================================================
// MENU (sinh từ routes/appPages.tsx – không sửa tay ở đây)
// =========================================================

const GROUP_ORDER: MenuGroupId[] = [
    'production',
    'planning',
    'management',
    'monitoring',
    'setting',
]

export const menuGroups:
    MenuGroupConfig[] = GROUP_ORDER.map((id) => ({
        id,
        items: appPages
            .filter((page) => page.group === id && page.label)
            .map((page) => ({
                labelKey: page.label!,
                path: page.path,
                icon: page.icon,
                status: page.status,
                disabled: page.disabled,
                perm: page.perm,
                action: page.action,
            })),
    }))


// =========================================================
// GROUP ACCENT
// =========================================================

// Solid group colors: group dot, active item tint and icon color.
export const groupAccent:
    Record<MenuGroupId, GroupAccent> = {
    production: { light: '#2563eb', dark: '#60a5fa' },
    planning: { light: '#0284c7', dark: '#38bdf8' },
    management: { light: '#7c3aed', dark: '#a78bfa' },
    monitoring: { light: '#d97706', dark: '#fbbf24' },
    setting: { light: '#059669', dark: '#34d399' },
}

export function getGroupColor(
    id: MenuGroupId,
    mode: 'light' | 'dark',
) {
    return groupAccent[id][mode]
}
