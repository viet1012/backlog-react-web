import type { Theme } from '@mui/material/styles'
import type { FacConfirmProcessGroup, FacConfirmRow } from '../types/facConfirm'

interface ProcessGroupConfig {
    columns: (keyof FacConfirmRow)[]
    getColor: (theme: Theme) => string
}

export const FAC_CONFIRM_PROCESS_CONFIG: Record<
    FacConfirmProcessGroup,
    ProcessGroupConfig
> = {
    Rough: {
        columns: ['toDrill', 'toHeat'],
        getColor: (theme) => theme.palette.info.main,
    },

    Heat: {
        columns: ['heatStart', 'heatFinish'],
        getColor: (theme) => theme.palette.warning.main,
    },

    Fine: {
        columns: ['toPk'],
        getColor: (theme) => theme.palette.success.main,
    },
}
