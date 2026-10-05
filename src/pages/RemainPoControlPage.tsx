// src/pages/RemainPoControlPage.tsx

import { useMemo } from 'react'

import { Box } from '@mui/material'

import type { ThemeMode } from '../utils/uiPreferences'

const REMAIN_PO_CONTROL_URL = 'http://192.168.122.16:5004/'

interface RemainPoControlPageProps {
    mode: ThemeMode
}

export function RemainPoControlPage({
    mode,
}: RemainPoControlPageProps) {
    // Truyền theme hiện tại của app vào iframe: ?theme=light | dark
    const src = useMemo(() => {
        const url = new URL(REMAIN_PO_CONTROL_URL)

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
                title="Remain PO Control"
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
