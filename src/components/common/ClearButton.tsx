import ClearAllRoundedIcon
    from '@mui/icons-material/ClearAllRounded'

import FilterAltOffRoundedIcon
    from '@mui/icons-material/FilterAltOffRounded'

import {
    alpha,
} from '@mui/material/styles'

import {
    AppButton,
} from './AppButton'


interface ClearButtonProps {
    mode?: 'clear' | 'clearAll'

    disabled?: boolean

    onClick: () => void
}


export function ClearButton({
    mode = 'clear',
    disabled = false,
    onClick,
}: ClearButtonProps) {

    const clearAll =
        mode === 'clearAll'

    return (
        <AppButton
            variant="outlined"

            disabled={
                disabled
            }

            icon={
                clearAll
                    ? (
                        <ClearAllRoundedIcon
                            fontSize="small"
                        />
                    )
                    : (
                        <FilterAltOffRoundedIcon
                            fontSize="small"
                        />
                    )
            }

            onClick={
                onClick
            }

            sx={(theme) => {

                const color =
                    '#1976d2'

                return {
                    height:
                        clearAll
                            ? 30
                            : 36,

                    minWidth:
                        clearAll
                            ? 92
                            : 118,

                    px:
                        clearAll
                            ? 1.25
                            : 1.5,

                    color,

                    border:
                        `1px solid ${alpha(
                            color,
                            clearAll
                                ? 0.55
                                : 0.70,
                        )}`,

                    bgcolor:
                        alpha(
                            color,
                            theme.palette.mode === 'dark'
                                ? clearAll
                                    ? 0.14
                                    : 0.16
                                : clearAll
                                    ? 0.055
                                    : 0.07,
                        ),

                    boxShadow:
                        clearAll
                            ? 'none'
                            : `0 3px 10px ${alpha(
                                color,
                                0.10,
                            )}`,

                    '& .MuiButton-startIcon': {
                        color,
                    },

                    '&:hover': {
                        color,

                        borderColor:
                            color,

                        bgcolor:
                            alpha(
                                color,
                                theme.palette.mode === 'dark'
                                    ? 0.20
                                    : 0.10,
                            ),

                        boxShadow:
                            clearAll
                                ? 'none'
                                : `0 4px 12px ${alpha(
                                    color,
                                    0.14,
                                )}`,
                    },

                    '&.Mui-disabled': {
                        color:
                            alpha(
                                theme.palette.text.primary,
                                0.28,
                            ),

                        borderColor:
                            alpha(
                                theme.palette.text.primary,
                                0.10,
                            ),

                        bgcolor:
                            alpha(
                                theme.palette.text.primary,
                                0.035,
                            ),

                        boxShadow:
                            'none',
                    },
                }
            }}
        >
            {
                clearAll
                    ? 'Clear All'
                    : 'Clear Filters'
            }
        </AppButton>
    )
}