import { Tooltip } from '@mui/material'

import RefreshRoundedIcon
    from '@mui/icons-material/RefreshRounded'

import { AppButton } from './AppButton'

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
                <AppButton
                    aria-label="Refresh"
                    variant="outlined"
                    compact
                    loading={loading}
                    onClick={onClick}
                    icon={
                        !loading
                            ? <RefreshRoundedIcon fontSize="small" />
                            : undefined
                    }
                />
            </span>
        </Tooltip>
    )
}