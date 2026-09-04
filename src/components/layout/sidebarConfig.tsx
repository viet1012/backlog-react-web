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
    SpaceDashboardOutlined,
} from '@mui/icons-material'


// =========================================================
// TYPES
// =========================================================

export type MenuItemStatus =
    | 'ready'
    | 'developing'
    | 'todo'

export interface MenuItemConfig {
    label: string
    path: string
    icon: ReactNode
    status?: MenuItemStatus
    disabled?: boolean
}

export interface MenuGroupConfig {
    id: string
    label: string
    items: MenuItemConfig[]
}

export interface GroupAccent {
    light: string
    dark: string
    glow: string
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
            label: 'PRODUCTION',

            items: [
                {
                    label: 'PC Training',
                    path: '/pc-training',
                    status: 'ready',
                    disabled: true,
                    icon: (
                        <SchoolOutlined />
                    ),
                },

                {
                    label: 'SPH',
                    path: '/sph',
                    status: 'todo',
                    icon: (
                        <PrecisionManufacturingOutlined />
                    ),
                },

                {
                    label: 'Asakai',
                    path: '/asakai',
                    status: 'todo',
                    icon: (
                        <SettingsSuggestOutlined />
                    ),
                },

                {
                    label: 'Cost Monitoring',
                    path: '/cost-monitoring',
                    status: 'todo',
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
            label: 'PLANNING',

            items: [
                {
                    label: 'Backlog',
                    path: '/backlog',
                    status: 'ready',
                    icon: (
                        <SpaceDashboardOutlined />
                    ),
                },

                {
                    label: 'Fac Confirm',
                    path: '/fac-confirm',
                    status: 'ready',
                    icon: (
                        <FactCheckOutlined />
                    ),
                },

                {
                    label: 'ODBF',
                    path: '/odbf',
                    status: 'todo',
                    icon: (
                        <Inventory2Outlined />
                    ),
                },

                {
                    label: 'Export List',
                    path: '/export-list',
                    status: 'todo',
                    icon: (
                        <ReceiptLongOutlined />
                    ),
                },

                {
                    label: 'Packing List',
                    path: '/packing-list',
                    status: 'todo',
                    icon: (
                        <InventoryOutlined />
                    ),
                },

                {
                    label: 'Shipping Schedule',
                    path: '/shipping-schedule',
                    status: 'ready',
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
            label: 'MANAGEMENT',

            items: [
                {
                    label: 'BOSB',
                    path: '/bosb',
                    status: 'todo',
                    icon: (
                        <AccountBalanceOutlined />
                    ),
                },

                {
                    label: 'Deadstock',
                    path: '/deadstock',
                    status: 'todo',
                    icon: (
                        <DeleteSweepOutlined />
                    ),
                },

                {
                    label: 'PL',
                    path: '/pl',
                    status: 'todo',
                    icon: (
                        <AssessmentOutlined />
                    ),
                },

                {
                    label: 'KPI',
                    path: '/kpi',
                    status: 'todo',
                    icon: (
                        <SpeedOutlined />
                    ),
                },

                {
                    label: 'OT',
                    path: '/ot',
                    status: 'todo',
                    icon: (
                        <AccessTimeOutlined />
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
}
