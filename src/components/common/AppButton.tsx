import type {
  ReactNode,
} from 'react'

import {
  Button,
  CircularProgress,
  type ButtonProps,
} from '@mui/material'

import {
  alpha,
} from '@mui/material/styles'

import {
  uiTokens,
} from '../../theme/uiTokens'


export type AppButtonAppearance =
  | 'default'
  | 'action'
  | 'success'
  | 'destructive'


export interface AppButtonProps
  extends Omit<
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

  const iconOnly =
    compact && !children


  return (
    <Button
      {...props}

      variant={
        variant
      }

      disabled={
        disabled || loading
      }

      startIcon={
        loading
          ? (
            <CircularProgress
              size={14}
              color="inherit"
            />
          )
          : icon
      }

      endIcon={
        endIcon
      }

      sx={[
        (theme) => {

          const isDark =
            theme.palette.mode === 'dark'


          const semanticColor =
            appearance === 'action'
              ? uiTokens.action.blue
              : appearance === 'success'
                ? uiTokens.action.success
                : appearance === 'destructive'
                  ? uiTokens.action.danger
                  : null


          const baseStyle = {

            height:
              uiTokens.control.height,

            minWidth:
              compact
                ? uiTokens.control.height
                : 76,

            px:
              compact
                ? 1
                : 1.6,

            borderRadius:
              uiTokens.control.borderRadius,

            fontSize:
              uiTokens.typography.button,

            fontWeight:
              700,

            letterSpacing:
              '0.01em',

            lineHeight:
              1,

            whiteSpace:
              'nowrap',

            textTransform:
              'none',

            // Không dùng backdrop-filter ở button
            // vì dễ gây repaint GPU.
            boxShadow:
              'none',

            transition:
              theme.transitions.create(
                [
                  'background-color',
                  'border-color',
                  'color',
                  'box-shadow',
                ],
                {
                  duration: 140,
                },
              ),

            ...(iconOnly && {

              '& .MuiButton-startIcon, & .MuiButton-endIcon': {
                margin: 0,
              },

            }),

            '&:focus-visible': {

              outline:
                'none',

              boxShadow:
                `0 0 0 3px ${alpha(
                  semanticColor
                  ?? theme.palette.primary.main,

                  isDark
                    ? 0.32
                    : 0.22,
                )}`,
            },
          }


          // =====================================================
          // DEFAULT
          // =====================================================

          if (!semanticColor) {

            return {
              ...baseStyle,

              color:
                theme.palette.text.primary,

              borderColor:
                alpha(
                  theme.palette.text.primary,
                  isDark
                    ? 0.18
                    : 0.14,
                ),

              bgcolor:
                isDark
                  ? alpha(
                    theme.palette.common.white,
                    0.045,
                  )
                  : alpha(
                    theme.palette.background.paper,
                    0.8,
                  ),


              '&:hover': {

                borderColor:
                  alpha(
                    theme.palette.text.primary,
                    isDark
                      ? 0.3
                      : 0.24,
                  ),

                bgcolor:
                  isDark
                    ? alpha(
                      theme.palette.common.white,
                      0.08,
                    )
                    : theme.palette.background.paper,

                boxShadow:
                  `0 2px 8px ${alpha(
                    theme.palette.common.black,
                    isDark
                      ? 0.16
                      : 0.06,
                  )}`,
              },


              '&:active': {

                bgcolor:
                  isDark
                    ? alpha(
                      theme.palette.common.white,
                      0.11,
                    )
                    : alpha(
                      theme.palette.text.primary,
                      0.04,
                    ),
              },


              '&.Mui-disabled': {

                color:
                  theme.palette.action.disabled,

                borderColor:
                  alpha(
                    theme.palette.text.primary,
                    0.08,
                  ),

                bgcolor:
                  alpha(
                    theme.palette.text.primary,
                    0.025,
                  ),

                boxShadow:
                  'none',
              },
            }
          }


          // =====================================================
          // SEMANTIC
          // =====================================================

          return {
            ...baseStyle,

            color:
              semanticColor,

            borderColor:
              alpha(
                semanticColor,
                isDark
                  ? 0.6
                  : 0.48,
              ),

            bgcolor:
              alpha(
                semanticColor,
                isDark
                  ? 0.12
                  : 0.07,
              ),


            '& .MuiButton-startIcon, & .MuiButton-endIcon': {

              color:
                semanticColor,

              ...(iconOnly && {
                margin: 0,
              }),
            },


            '&:hover': {

              color:
                semanticColor,

              borderColor:
                semanticColor,

              bgcolor:
                alpha(
                  semanticColor,
                  isDark
                    ? 0.19
                    : 0.11,
                ),

              boxShadow:
                `0 2px 8px ${alpha(
                  semanticColor,
                  isDark
                    ? 0.16
                    : 0.1,
                )}`,
            },


            '&:active': {

              bgcolor:
                alpha(
                  semanticColor,
                  isDark
                    ? 0.24
                    : 0.15,
                ),
            },


            '&.Mui-disabled': {

              color:
                theme.palette.action.disabled,

              borderColor:
                alpha(
                  theme.palette.text.primary,
                  0.08,
                ),

              bgcolor:
                alpha(
                  theme.palette.text.primary,
                  0.025,
                ),

              boxShadow:
                'none',


              '& .MuiButton-startIcon, & .MuiButton-endIcon': {

                color:
                  theme.palette.action.disabled,
              },
            },
          }
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