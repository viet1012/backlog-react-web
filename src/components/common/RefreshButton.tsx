import {
    IconButton,
    Tooltip,
} from '@mui/material'

interface RefreshButtonProps {
    loading?: boolean
    onClick: () => void
}

export function RefreshButton({
    loading = false,
    onClick,
}: RefreshButtonProps) {
    return (
        <Tooltip title="Refresh">
            <span>
                <IconButton
                    aria-label="Refresh"
                    size="small"
                    disabled={loading}
                    onClick={onClick}
                    sx={{
                        border:
                            '1px solid rgba(148, 163, 184, 0.24)',

                        bgcolor:
                            'rgba(255,255,255,0.04)',

                        '&:hover': {
                            bgcolor:
                                'rgba(96,165,250,0.14)',
                        },
                    }}
                >
                    ↻
                </IconButton>
            </span>
        </Tooltip>
    )
}