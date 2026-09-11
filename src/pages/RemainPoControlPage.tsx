// src/pages/RemainPoControlPage.tsx

import { Box } from '@mui/material'

export function RemainPoControlPage() {
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
                src="http://192.168.122.16:5004/"
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
