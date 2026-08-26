import {
    Button,
    CircularProgress,
    type ButtonProps,
} from '@mui/material'

import type { ReactNode } from 'react'

interface AppButtonProps
    extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {

    icon?: ReactNode

    endIcon?: ReactNode

    loading?: boolean

    compact?: boolean
}

export function AppButton({
    children,
    icon,
    endIcon,
    loading = false,
    compact = false,
    disabled,
    variant = 'outlined', // <-- mặc định tất cả có border
    sx,
    ...props
}: AppButtonProps) {
    return (
        <Button
            {...props}
            variant={variant}
            disabled={disabled || loading}
            startIcon={
                loading
                    ? <CircularProgress size={14} color="inherit" />
                    : icon
            }
            endIcon={endIcon}
            sx={[
                {
                    height: 36,
                    minWidth: compact ? 36 : 76,
                    px: compact ? 1 : 1.5,

                    borderRadius: '10px',

                    fontSize: 12,
                    fontWeight: 600,
                    lineHeight: 1,

                    whiteSpace: 'nowrap',
                    textTransform: 'none',

                    boxShadow: 'none',

                    transition:
                        'background-color 150ms ease, border-color 150ms ease, transform 100ms ease',

                    '&:active': {
                        transform: 'scale(0.97)',
                    },

                    '&:hover': {
                        boxShadow: 'none',
                    },
                },

                ...(Array.isArray(sx)
                    ? sx
                    : sx
                        ? [sx]
                        : []),
            ]}
        >
            {children}
        </Button>
    )
}