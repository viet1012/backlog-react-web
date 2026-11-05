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
    glow: string
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
            ],
        },
    ]


// =========================================================
// GROUP ACCENT
// =========================================================

export const groupAccent:
    Record<string, GroupAccent> = {

    production: {
        light:
            'rgba(59,130,246,0.10)',

        dark:
            'rgba(96,165,250,0.10)',

        glow:
            'rgba(59,130,246,0.22)',
    },

    planning: {
        light:
            'rgba(14,165,233,0.10)',

        dark:
            'rgba(56,189,248,0.10)',

        glow:
            'rgba(14,165,233,0.22)',
    },

    management: {
        light:
            'rgba(139,92,246,0.09)',

        dark:
            'rgba(167,139,250,0.10)',

        glow:
            'rgba(139,92,246,0.20)',
    },

    monitoring: {
        light:
            'rgba(245,158,11,0.10)',

        dark:
            'rgba(251,191,36,0.10)',

        glow:
            'rgba(245,158,11,0.22)',
    },

    setting: {
        light:
            'rgba(16,185,129,0.09)',

        dark:
            'rgba(52,211,153,0.10)',

        glow:
            'rgba(16,185,129,0.20)',
    },
}
