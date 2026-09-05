import {
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { alpha } from '@mui/material/styles'

import type {
  FacConfirmClassify,
} from '../../types/facConfirm'

import {
  uiTokens,
} from '../../theme/uiTokens'


type ClassifyMode =
  | 'all'
  | FacConfirmClassify


interface FacConfirmClassifyControlProps {
  value: FacConfirmClassify[]
  disabled?: boolean

  onChange: (
    value: FacConfirmClassify[],
  ) => void
}


const CLASSIFY_OPTIONS:
  ReadonlyArray<{
    mode: ClassifyMode
    label: string
  }> = [
    {
      mode: 'all',
      label: 'Tất cả',
    },
    {
      mode: 'Sale',
      label: 'Sale',
    },
    {
      mode: 'Stock',
      label: 'Stock',
    },
  ]


function getClassifyMode(
  value: FacConfirmClassify[],
): ClassifyMode {
  return value.length === 1
    ? value[0]
    : 'all'
}


function classifyModeToValue(
  mode: ClassifyMode,
): FacConfirmClassify[] {
  return mode === 'all'
    ? ['Sale', 'Stock']
    : [mode]
}


export function FacConfirmClassifyControl({
  value,
  disabled = false,
  onChange,
}: FacConfirmClassifyControlProps) {

  const selectedMode =
    getClassifyMode(value)


  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={selectedMode}
      disabled={disabled}

      onChange={(
        _event,
        nextMode: ClassifyMode | null,
      ) => {
        if (!nextMode) {
          return
        }

        onChange(
          classifyModeToValue(
            nextMode,
          ),
        )
      }}

      sx={(theme) => {
        const isDark =
          theme.palette.mode === 'dark'

        return {
          height: 36,

          flexShrink: 0,

          p: '2px',

          boxSizing: 'border-box',

          borderRadius:
            uiTokens.control.borderRadius,

          border: `1px solid ${alpha(
            isDark
              ? theme.palette.common.white
              : theme.palette.text.primary,
            isDark
              ? 0.12
              : 0.08,
          )}`,

          bgcolor:
            isDark
              ? alpha(
                theme.palette.common.white,
                0.045,
              )
              : alpha(
                theme.palette.background.paper,
                0.62,
              ),

          boxShadow: `0 2px 8px ${alpha(
            theme.palette.common.black,
            isDark
              ? 0.14
              : 0.05,
          )}`,

          '& .MuiToggleButton-root': {
            width: 68,
            minWidth: 68,
            maxWidth: 68,

            height: 30,

            px: 1,

            boxSizing: 'border-box',

            border: 'none',

            borderRadius:
              '8px !important',

            color:
              theme.palette.text.secondary,

            bgcolor:
              'transparent',

            fontSize:
              uiTokens.typography.button,

            fontWeight: 700,

            lineHeight: 1,

            textTransform: 'none',

            transition:
              theme.transitions.create(
                [
                  'background-color',
                  'color',
                  'box-shadow',
                ],
                {
                  duration: 120,
                },
              ),

            '&:hover': {
              color:
                theme.palette.text.primary,

              bgcolor:
                alpha(
                  theme.palette.text.primary,
                  isDark
                    ? 0.07
                    : 0.045,
                ),
            },

            '&.Mui-selected': {
              color:
                theme.palette.primary.main,

              bgcolor:
                alpha(
                  theme.palette.primary.main,
                  isDark
                    ? 0.20
                    : 0.10,
                ),

              boxShadow:
                `0 1px 4px ${alpha(
                  theme.palette.primary.main,
                  isDark
                    ? 0.15
                    : 0.08,
                )}`,

              '&:hover': {
                color:
                  theme.palette.primary.main,

                bgcolor:
                  alpha(
                    theme.palette.primary.main,
                    isDark
                      ? 0.25
                      : 0.14,
                  ),
              },
            },

            '&.Mui-disabled': {
              color:
                theme.palette.action.disabled,

              bgcolor:
                'transparent',
            },
          },
        }
      }}
    >
      {CLASSIFY_OPTIONS.map(
        ({
          mode,
          label,
        }) => (
          <ToggleButton
            key={mode}
            value={mode}
          >
            {label}
          </ToggleButton>
        ),
      )}
    </ToggleButtonGroup>
  )
}