// src/pages/SaleFollowPage.tsx

import { useMemo } from 'react'

import { Box } from '@mui/material'

import type { ThemeMode } from '../utils/uiPreferences'
import { useI18n } from '../i18n/useI18n'

const SALE_FOLLOW_URL = 'http://192.168.122.15:5007/'

interface SaleFollowPageProps {
    mode: ThemeMode
}

export function SaleFollowPage({
    mode,
}: SaleFollowPageProps) {
    const { t } = useI18n()

    // Truyền theme hiện tại của app vào iframe: ?theme=light | dark
    const src = useMemo(() => {
        const url = new URL(SALE_FOLLOW_URL)

        url.searchParams.set('theme', mode)

        return url.toString()
    }, [mode])

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                minHeight: 0,
                flex: 1,
                display: 'flex',
                overflow: 'hidden',
            }}
        >
            <Box
                component="iframe"
                src={src}
                title={t.nav.saleFollow}
                sx={{
                    width: '100%',
                    height: '100%',
                    flex: 1,
                    minWidth: 0,
                    minHeight: 0,
                    border: 0,
                    display: 'block',
                }}
            />
        </Box>
    )
}
