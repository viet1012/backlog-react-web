import {
  Box,
  Button,
  Typography,
} from '@mui/material'

import {
  alpha,
} from '@mui/material/styles'

import type {
  FacConfirmProcessGroupSummary,
} from '../../types/facConfirm'

import {
  uiTokens,
} from '../../theme/uiTokens'

import {
  FAC_CONFIRM_PROCESS_CONFIG,
} from '../../config/facConfirmProcessConfig'

import {
  FacConfirmAnimatedProcessIcon,
} from './facConfirmProcessAnimations'


interface Props {
  item: FacConfirmProcessGroupSummary
  selected: boolean
  disabled: boolean
  onClick: () => void
}


export function FacConfirmProcessGroupButton({
  item,
  selected,
  disabled,
  onClick,
}: Props) {

  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      sx={(theme) => {

        const color =
          FAC_CONFIRM_PROCESS_CONFIG[
            item.processGroup
          ].getColor(theme)

        return {
          minWidth: 220,
          minHeight: 58,

          px: 1.25,
          py: 0.65,

          flexShrink: 0,

          justifyContent:
            'flex-start',

          textTransform:
            'none',

          borderRadius:
            uiTokens.control.borderRadius,

          border:
            `1px solid ${selected
              ? alpha(
                color,
                0.7,
              )
              : theme.palette.divider
            }`,

          bgcolor:
            selected
              ? alpha(
                color,
                theme.palette.mode === 'dark'
                  ? 0.28
                  : 0.14,
              )
              : alpha(
                theme.palette.background.paper,
                0.50,
              ),

          color:
            selected
              ? color
              : 'text.primary',

          boxShadow:
            selected
              ? `0 3px 10px ${alpha(
                color,
                0.14,
              )}`
              : 'none',

          transition:
            'all 160ms ease',

          '&:hover': {
            bgcolor:
              selected
                ? alpha(
                  color,
                  theme.palette.mode === 'dark'
                    ? 0.34
                    : 0.18,
                )
                : theme.palette.action.hover,

            transform:
              'translateY(-1px)',
          },

          '@media (prefers-reduced-motion: reduce)': {
            transform: 'none',

            '&:hover': {
              transform: 'none',
            },
          },
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',

          gap: 1,

          minWidth: 0,
        }}
      >
        {/* ICON */}
        <Box
          sx={(theme) => {

            const color =
              FAC_CONFIRM_PROCESS_CONFIG[
                item.processGroup
              ].getColor(theme)

            return {
              width: 32,
              height: 32,

              flexShrink: 0,

              display: 'grid',
              placeItems: 'center',

              borderRadius: 1.5,

              bgcolor:
                selected
                  ? alpha(
                    color,
                    theme.palette.mode === 'dark'
                      ? 0.30
                      : 0.20,
                  )
                  : alpha(
                    theme.palette.text.primary,
                    0.04,
                  ),
            }
          }}
        >
          <Box
            sx={(theme) => {

              const color =
                FAC_CONFIRM_PROCESS_CONFIG[
                  item.processGroup
                ].getColor(theme)

              return {
                display: 'grid',
                placeItems: 'center',
                color,
              }
            }}
          >
            <FacConfirmAnimatedProcessIcon
              processGroup={
                item.processGroup
              }
              selected={
                selected
              }
            />
          </Box>
        </Box>


        {/* TEXT */}
        <Box
          sx={{
            minWidth: 0,
            textAlign: 'left',
          }}
        >
          <Typography
            sx={{
              fontSize: 12.5,
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            {item.processGroup}
          </Typography>


          {/* CẦN XÁC NHẬN */}
          <Typography
            sx={{
              mt: 0.45,

              fontSize: 12,
              fontWeight: 600,

              color:
                selected
                  ? 'inherit'
                  : 'text.secondary',

              whiteSpace: 'nowrap',
            }}
          >
            Cần xác nhận:{' '}
            {item.requiredOrderCount.toLocaleString()} PO
            {', '}
            {item.requiredTotalQty.toLocaleString()} Pcs
          </Typography>


          {/* ĐÃ XÁC NHẬN */}
          <Typography
            sx={{
              mt: 0.15,

              fontSize: 12,
              fontWeight: 600,

              color:
                selected
                  ? 'inherit'
                  : 'text.secondary',

              whiteSpace: 'nowrap',
            }}
          >
            Đã xác nhận:{' '}
            {item.confirmedOrderCount.toLocaleString()} PO
            {', '}
            {item.confirmedTotalQty.toLocaleString()} Pcs
          </Typography>
        </Box>
      </Box>
    </Button>
  )
}