import HelpOutlineRoundedIcon
    from '@mui/icons-material/HelpOutlineRounded'

import { useI18n } from '../../i18n/useI18n'
import { AppButton } from './AppButton'

interface GuideButtonProps {
    onClick: () => void
}

// Nút mở hướng dẫn trên PageHeader – dùng chung cho mọi trang có hướng dẫn
export function GuideButton({ onClick }: GuideButtonProps) {
    const { t } = useI18n()

    return (
        <AppButton
            variant="outlined"
            compact
            icon={<HelpOutlineRoundedIcon fontSize="small" />}
            onClick={onClick}
            sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
        >
            {t.common.guide}
        </AppButton>
    )
}
