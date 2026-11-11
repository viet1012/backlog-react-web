import type {
    ReactNode,
} from 'react'

import {
    AssessmentOutlined,
    PrecisionManufacturingOutlined,
    SettingsSuggestOutlined,
    FactCheckOutlined,
    InventoryOutlined,
    EventNoteOutlined,
    AccountBalanceOutlined,
    DeleteSweepOutlined,
    TrendingUpOutlined,
    SpeedOutlined,
    AccessTimeOutlined,
    Inventory2Outlined,
    ReceiptLongOutlined,
    SchoolOutlined,
    FormatListBulletedRounded,
    SummarizeOutlined,
    PendingActionsOutlined,
    HomeOutlined,
    MapOutlined,
    MonitorHeartOutlined,
    SmartToyOutlined,
    TrackChangesOutlined,
} from '@mui/icons-material'
import type { UserRole } from '../../services/authService'
import type { Messages } from '../../i18n/messages/en'


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

    roles?: UserRole[]
    action?: MenuItemAction
}
// =========================================================
// MENU
// =========================================================

export const menuGroups:
    MenuGroupConfig[] = [

        // =====================================================
        // PRODUCTION
        // =====================================================

        {
            id: 'production',

            items: [
                {
                    labelKey: 'pcTraining',
                    path: '/pc-training',
                    status: 'ready',
                    disabled: true,
                    icon: (
                        <SchoolOutlined />
                    ),
                },

                {
                    labelKey: 'sph',
                    path: '/sph',
                    status: 'todo',
                    icon: (
                        <PrecisionManufacturingOutlined />
                    ),
                },

                {
                    labelKey: 'asakai',
                    path: '/asakai',
                    status: 'todo',
                    icon: (
                        <SettingsSuggestOutlined />
                    ),
                },

                {
                    labelKey: 'costMonitoring',
                    path: '/cost-monitoring',
                    status: 'ready',
                    action: 'view',
                    icon: (
                        <TrendingUpOutlined />
                    ),
                },
            ],
        },


        // =====================================================
        // PLANNING
        // =====================================================
        {
            id: 'planning',

            items: [
                {
                    labelKey: 'userHome',
                    path: '/user-home',
                    status: 'ready',
                    roles: ['USER'],
                    icon: (
                        <HomeOutlined />
                    ),
                },

                {
                    labelKey: 'backlogDetails',
                    path: '/backlog',
                    status: 'ready',
                    roles: ['PC'],
                    action: 'view',
                    icon: (
                        <FormatListBulletedRounded />
                    ),
                },

                {
                    labelKey: 'backlogSummary',
                    path: '/backlog-summary',
                    status: 'todo',
                    roles: ['PC'],
                    action: 'view',
                    icon: (
                        <SummarizeOutlined />
                    ),
                },

                {
                    labelKey: 'remainPoControl',
                    path: '/remain-po-control',
                    status: 'ready',
                    roles: ['PC'],
                    action: 'view',
                    icon: (
                        <PendingActionsOutlined />
                    ),
                },

                {
                    labelKey: 'saleFollow',
                    path: '/sale-follow',
                    status: 'ready',
                    roles: ['PC'],
                    action: 'view',
                    icon: (
                        <TrackChangesOutlined />
                    ),
                },

                {
                    labelKey: 'deliveryConfirm',
                    path: '/fac-confirm',
                    status: 'ready',
                    roles: ['PC', 'PRO'],
                    action: 'input',
                    icon: (
                        <FactCheckOutlined />
                    ),
                },

                {
                    labelKey: 'odbfSimulation',
                    path: '/odbf',
                    status: 'ready',
                    roles: ['PC', 'PRO'],
                    action: 'view',
                    icon: (
                        <Inventory2Outlined />
                    ),
                },

                {
                    labelKey: 'exportList',
                    path: '/export-list',
                    status: 'todo',
                    roles: ['PC'],
                    action: 'view',
                    icon: (
                        <ReceiptLongOutlined />
                    ),
                },

                {
                    labelKey: 'packingList',
                    path: '/packing-list',
                    status: 'todo',
                    roles: ['PRO'],
                    action: 'input',
                    icon: (
                        <InventoryOutlined />
                    ),
                },

                {
                    labelKey: 'shippingSchedule',
                    path: '/shipping-schedule',
                    status: 'todo',
                    roles: ['PC', 'PRO'],
                    action: 'view',
                    icon: (
                        <EventNoteOutlined />
                    ),
                },
            ],
        },

        // =====================================================
        // MANAGEMENT
        // =====================================================

        {
            id: 'management',

            items: [
                {
                    labelKey: 'bosb',
                    path: '/bosb',
                    status: 'todo',
                    icon: (
                        <AccountBalanceOutlined />
                    ),
                },

                {
                    labelKey: 'deadstock',
                    path: '/deadstock',
                    status: 'todo',
                    icon: (
                        <DeleteSweepOutlined />
                    ),
                },

                {
                    labelKey: 'pl',
                    path: '/pl',
                    status: 'todo',
                    icon: (
                        <AssessmentOutlined />
                    ),
                },

                {
                    labelKey: 'kpi',
                    path: '/kpi',
                    status: 'todo',
                    icon: (
                        <SpeedOutlined />
                    ),
                },

                {
                    labelKey: 'ot',
                    path: '/ot',
                    status: 'todo',
                    icon: (
                        <AccessTimeOutlined />
                    ),
                },
            ],
        },

        // =====================================================
        // MONITORING
        // =====================================================

        {
            id: 'monitoring',

            items: [
                {
                    labelKey: 'machine',
                    path: '/monitoring/machine',
                    status: 'ready',
                    action: 'view',
                    icon: (
                        <MonitorHeartOutlined />
                    ),
                },
            ],
        },

        // =====================================================
        // SETTING
        // =====================================================

        {
            id: 'setting',

            items: [
                {
                    labelKey: 'machineLocator',
                    path: '/settings/machine-locator',
                    status: 'ready',
                    action: 'view',
                    roles: ['ADMIN'],
                    icon: (
                        <MapOutlined />
                    ),
                },

                {
                    labelKey: 'aiLogs',
                    path: '/settings/ai-logs',
                    status: 'ready',
                    action: 'view',
                    roles: ['ADMIN'],
                    icon: (
                        <SmartToyOutlined />
                    ),
                },
            ],
        },
    ]


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
