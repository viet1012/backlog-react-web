import type { ReactNode } from 'react'

import {
  Button,
  CircularProgress,
  type ButtonProps,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import { uiTokens } from '../../theme/uiTokens'

export type AppButtonAppearance =
  | 'default'
  | 'action'
  | 'destructive'

export interface AppButtonProps extends Omit<
  ButtonProps,
  'startIcon' | 'endIcon'
> {
  appearance?: AppButtonAppearance
  loading?: boolean
  compact?: boolean
  icon?: ReactNode
  endIcon?: ReactNode
}

export function AppButton({
  appearance = 'default',
  loading = false,
  compact = false,
  icon,
  endIcon,
  children,
  disabled,
  variant = 'outlined',
  sx,
  ...props
}: AppButtonProps) {
  const iconOnly = compact && !children

  return (
    <Button
      {...props}
      variant={variant}
      disabled={disabled || loading}
      startIcon={loading
        ? <CircularProgress size={14} color="inherit" />
        : icon}
      endIcon={endIcon}
      sx={[
        (theme) => {
          const isDark = theme.palette.mode === 'dark'
          const semanticColor = appearance === 'action'
            ? uiTokens.action.blue
            : appearance === 'destructive'
              ? uiTokens.action.danger
              : null

          const baseStyle = {
            height: uiTokens.control.height,
            minWidth: compact ? uiTokens.control.height : 76,
            px: compact ? 1 : 1.5,
            borderRadius: uiTokens.control.borderRadius,
            fontSize: uiTokens.typography.button,
            fontWeight: 700,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            textTransform: 'none',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: 'none',
            transition:
              'background-color 160ms ease, border-color 160ms ease, '
              + 'color 160ms ease, box-shadow 160ms ease, transform 160ms ease',
            ...(iconOnly && {
              '& .MuiButton-startIcon, & .MuiButton-endIcon': {
                m: 0,
              },
            }),
            '&:active': {
              transform: 'scale(0.97)',
            },
          }

          if (!semanticColor) {
            return {
              ...baseStyle,
              color: 'text.primary',
              borderColor: alpha(
                isDark
                  ? theme.palette.common.white
                  : theme.palette.text.primary,
                isDark ? 0.16 : 0.15,
              ),
              bgcolor: isDark
                ? alpha(theme.palette.common.white, 0.045)
                : alpha(theme.palette.background.paper, 0.64),
              '&:hover': {
                borderColor: alpha(
                  isDark
                    ? theme.palette.common.white
                    : theme.palette.text.primary,
                  isDark ? 0.28 : 0.24,
                ),
                bgcolor: isDark
                  ? alpha(theme.palette.common.white, 0.085)
                  : alpha(theme.palette.background.paper, 0.94),
                boxShadow: `0 4px 12px ${alpha(
                  theme.palette.common.black,
                  isDark ? 0.16 : 0.07,
                )}`,
                transform: 'translateY(-1px)',
              },
              '&.Mui-disabled': {
                color: theme.palette.action.disabled,
                borderColor: alpha(theme.palette.text.primary, 0.08),
                bgcolor: alpha(theme.palette.text.primary, 0.03),
                boxShadow: 'none',
              },
            }
          }

          return {
            ...baseStyle,
            color: semanticColor,
            borderColor: alpha(semanticColor, isDark ? 0.78 : 0.66),
            bgcolor: alpha(semanticColor, isDark ? 0.14 : 0.07),
            boxShadow: `0 3px 10px ${alpha(
              semanticColor,
              isDark ? 0.17 : 0.10,
            )}`,
            '& .MuiButton-startIcon, & .MuiButton-endIcon': {
              color: semanticColor,
              ...(iconOnly && { margin: 0 }),
            },
            '&:hover': {
              color: semanticColor,
              borderColor: semanticColor,
              bgcolor: alpha(semanticColor, isDark ? 0.21 : 0.12),
              boxShadow: `0 5px 14px ${alpha(
                semanticColor,
                isDark ? 0.22 : 0.14,
              )}`,
              transform: 'translateY(-1px)',
            },
            '&:active': {
              bgcolor: alpha(semanticColor, isDark ? 0.25 : 0.16),
              transform: 'scale(0.97)',
            },
            '&.Mui-disabled': {
              color: theme.palette.action.disabled,
              borderColor: alpha(theme.palette.text.primary, 0.08),
              bgcolor: alpha(theme.palette.text.primary, 0.03),
              boxShadow: 'none',
              '& .MuiButton-startIcon, & .MuiButton-endIcon': {
                color: theme.palette.action.disabled,
              },
            },
          }
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Button>
  )
}
