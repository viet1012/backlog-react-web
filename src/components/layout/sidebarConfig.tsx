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
    SpaceDashboardOutlined,
} from '@mui/icons-material'


// =========================================================
// TYPES
// =========================================================

export interface MenuItemConfig {
    label: string
    path: string
    icon: ReactNode
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
                    label: 'SPH',
                    path: '/sph',
                    icon: (
                        <PrecisionManufacturingOutlined />
                    ),
                },

                {
                    label: 'Asakai',
                    path: '/asakai',
                    icon: (
                        <SettingsSuggestOutlined />
                    ),
                },

                {
                    label: 'Cost Monitoring',
                    path: '/cost-monitoring',
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
                    icon: (
                        <SpaceDashboardOutlined />
                    ),
                },

                {
                    label: 'Fac Confirm',
                    path: '/fac-confirm',
                    icon: (
                        <FactCheckOutlined />
                    ),
                },

                {
                    label: 'ODBF',
                    path: '/odbf',
                    icon: (
                        <Inventory2Outlined />
                    ),
                },

                {
                    label: 'Export List',
                    path: '/export-list',
                    icon: (
                        <ReceiptLongOutlined />
                    ),
                },

                {
                    label: 'Packing List',
                    path: '/packing-list',
                    icon: (
                        <InventoryOutlined />
                    ),
                },

                {
                    label: 'Shipping Schedule',
                    path: '/shipping-schedule',
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
                    icon: (
                        <AccountBalanceOutlined />
                    ),
                },

                {
                    label: 'Deadstock',
                    path: '/deadstock',
                    icon: (
                        <DeleteSweepOutlined />
                    ),
                },

                {
                    label: 'PL',
                    path: '/pl',
                    icon: (
                        <AssessmentOutlined />
                    ),
                },

                {
                    label: 'KPI',
                    path: '/kpi',
                    icon: (
                        <SpeedOutlined />
                    ),
                },

                {
                    label: 'OT',
                    path: '/ot',
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