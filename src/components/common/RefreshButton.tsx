import { Tooltip } from '@mui/material'

import RefreshRoundedIcon
    from '@mui/icons-material/RefreshRounded'

import { useI18n } from '../../i18n/useI18n'
import { AppButton } from './AppButton'

interface RefreshButtonProps {
    loading?: boolean
    onClick: () => void
}

export function RefreshButton({
    loading = false,
    onClick,
}: RefreshButtonProps) {
    const { t } = useI18n()

    return (
        <Tooltip title={t.common.refresh}>
            <span>
                <AppButton
                    aria-label={t.common.refresh}
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