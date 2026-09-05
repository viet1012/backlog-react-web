import {
  Box,
  Button,
  Typography,
} from '@mui/material'

import {
  CheckCircleRounded,
} from '@mui/icons-material'

import {
  alpha,
} from '@mui/material/styles'

import type {
  FacConfirmProcessGroup,
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
  processGroup: FacConfirmProcessGroup
  item?: FacConfirmProcessGroupSummary
  selected: boolean
  disabled: boolean
  onClick: () => void
}


export function FacConfirmProcessGroupButton({
  processGroup,
  item,
  selected,
  disabled,
  onClick,
}: Props) {

  const requiredOrderCount =
    item?.requiredOrderCount ?? 0

  const confirmedOrderCount =
    item?.confirmedOrderCount ?? 0

  const progress =
    Boolean(item)
      && requiredOrderCount > 0
      ? Math.min(
        100,
        Math.max(
          0,
          Math.round(
            (
              confirmedOrderCount
              / requiredOrderCount
            ) * 100,
          ),
        ),
      )
      : 0

  const completed =
    requiredOrderCount > 0
    && confirmedOrderCount >= requiredOrderCount

  const successColor = '#22c55e'

  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      sx={(theme) => {

        const color =
          FAC_CONFIRM_PROCESS_CONFIG[
            processGroup
          ].getColor(theme)

        return {
          width: 245,
          minWidth: 245,
          maxWidth: 245,

          height: 66,
          minHeight: 66,
          maxHeight: 66,
          boxSizing: 'border-box',

          px: 1,
          py: 0.7,

          flexShrink: 0,

          justifyContent:
            'flex-start',

          alignItems:
            'stretch',

          textTransform:
            'none',

          borderRadius:
            uiTokens.control.borderRadius,

          border: `1px solid ${selected
            ? alpha(color, 0.7)
            : theme.palette.divider
            }`,

          bgcolor:
            selected
              ? alpha(
                color,
                theme.palette.mode === 'dark'
                  ? 0.26
                  : 0.12,
              )
              : alpha(
                theme.palette.background.paper,
                0.5,
              ),

          color:
            selected
              ? color
              : 'text.primary',

          boxShadow:
            selected
              ? `0 2px 8px ${alpha(
                color,
                0.12,
              )}`
              : 'none',

          transition: theme.transitions.create(
            ['background-color', 'border-color', 'color', 'box-shadow'],
            { duration: 150 },
          ),
        }
      }}
    >

      <Box
        sx={{
          width: '100%',
          minWidth: 0,

          display: 'grid',

          gridTemplateColumns:
            '30px minmax(0, 1fr)',

          columnGap: 0.8,
          rowGap: 0.35,

          alignItems: 'center',
        }}
      >

        {/* ICON */}

        <Box
          sx={(theme) => {

            const processColor =
              FAC_CONFIRM_PROCESS_CONFIG[
                processGroup
              ].getColor(theme)

            const color =
              completed
                ? successColor
                : processColor

            return {
              gridColumn: 1,

              gridRow:
                '1 / span 2',

              alignSelf:
                'start',

              width: 30,
              height: 30,

              display: 'grid',
              placeItems: 'center',

              borderRadius: 1.5,

              color,

              bgcolor:
                selected || completed
                  ? alpha(
                    color,
                    theme.palette.mode === 'dark'
                      ? 0.30
                      : 0.16,
                  )
                  : alpha(
                    theme.palette.text.primary,
                    0.04,
                  ),
            }
          }}
        >
          <FacConfirmAnimatedProcessIcon
            processGroup={
              processGroup
            }
            selected={
              selected
            }
          />
        </Box>


        {/* HEADER */}

        <Box
          sx={{
            gridColumn: 2,

            display: 'flex',
            alignItems: 'center',

            minWidth: 0,
          }}
        >

          <Typography
            sx={{
              flex: 1,

              fontSize: 12.5,
              fontWeight: 800,
              lineHeight: 1.1,

              textAlign: 'left',
            }}
          >
            {processGroup}
          </Typography>


          {completed ? (

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',

                gap: 0.3,

                flexShrink: 0,
              }}
            >
              <CheckCircleRounded
                sx={{
                  fontSize: 14, color: successColor,
                }}
              />

              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: successColor,
                }}
              >
                DONE
              </Typography>
            </Box>

          ) : (

            <Typography
              sx={{
                flexShrink: 0,
                minWidth: 38,

                fontSize: 12,
                fontWeight: 800,
                lineHeight: 1,
                textAlign: 'right',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {item ? `${progress}%` : '—'}
            </Typography>

          )}

        </Box>


        {/* SUMMARY */}

        <Box
          sx={{
            gridColumn: 2,

            display: 'grid',

            // QUAN TRỌNG:
            // label và value luôn thẳng hàng
            gridTemplateColumns:
              '82px minmax(0, 1fr)',

            rowGap: 0.15,

            minWidth: 0,

            textAlign: 'left',
          }}
        >

          {/* REQUIRED LABEL */}

          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,

              lineHeight: 1.25,

              color:
                selected
                  ? 'inherit'
                  : 'text.secondary',

              whiteSpace: 'nowrap',
            }}
          >
            Cần xác nhận:
          </Typography>


          {/* REQUIRED VALUE */}

          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,

              lineHeight: 1.25,

              color:
                selected
                  ? 'inherit'
                  : 'text.secondary',

              whiteSpace: 'nowrap',

              textAlign: 'left',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <Box
              component="span"
              sx={{
                fontWeight: 800,
              }}
            >
              {item ? requiredOrderCount.toLocaleString() : '—'} PO
            </Box>

            {' · '}

            <Box
              component="span"
              sx={{
                fontWeight: 700,
              }}
            >
              {item ? item.requiredTotalQty.toLocaleString() : '—'} Pcs
            </Box>
          </Typography>


          {/* CONFIRMED LABEL */}

          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 600,

              lineHeight: 1.25,

              color:
                selected
                  ? 'inherit'
                  : 'text.secondary',

              whiteSpace: 'nowrap',
            }}
          >
            Đã xác nhận:
          </Typography>


          {/* CONFIRMED VALUE */}

          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,

              lineHeight: 1.25,

              color:
                selected
                  ? 'inherit'
                  : 'text.secondary',

              whiteSpace: 'nowrap',

              textAlign: 'left',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <Box
              component="span"
              sx={{
                fontWeight: 800,
              }}
            >
              {item ? confirmedOrderCount.toLocaleString() : '—'} PO
            </Box>

            {' · '}

            <Box
              component="span"
              sx={{
                fontWeight: 700,
              }}
            >
              {item ? item.confirmedTotalQty.toLocaleString() : '—'} Pcs
            </Box>
          </Typography>

        </Box>

      </Box>

    </Button>
  )
}
