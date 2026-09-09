import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'

import {
  alpha,
} from '@mui/material/styles'
import { AppButton } from '../common/AppButton'


interface FacConfirmConfirmDialogProps {
  open: boolean
  employeeId: string
  employeeError: string
  saving: boolean
  changeCount: number

  onEmployeeIdChange:
  (value: string) => void

  onConfirm:
  () => void

  onCancel:
  () => void
}


export function FacConfirmConfirmDialog({
  open,
  employeeId,
  employeeError,
  saving,
  changeCount,
  onEmployeeIdChange,
  onConfirm,
  onCancel,
}: FacConfirmConfirmDialogProps) {

  // =========================================================
  // CLOSE
  // =========================================================

  const handleClose = () => {
    if (!saving) {
      onCancel()
    }
  }


  // =========================================================
  // EMPLOYEE ID
  // Chỉ cho nhập số
  // =========================================================

  const handleEmployeeIdChange = (
    value: string,
  ) => {

    const numericValue =
      value.replace(
        /\D/g,
        '',
      )

    onEmployeeIdChange(
      numericValue,
    )
  }


  // =========================================================
  // ENTER
  // =========================================================

  const handleEnter = () => {

    if (
      saving
      || !employeeId.trim()
    ) {
      return
    }

    onConfirm()
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth

      slotProps={{
        backdrop: {
          sx: {
            backgroundColor:
              'rgba(15, 23, 42, 0.26)',

            backdropFilter:
              'blur(2px)',

            WebkitBackdropFilter:
              'blur(2px)',
          },
        },

        paper: {
          sx: (theme) => ({
            width:
              456,

            maxWidth:
              'calc(100vw - 32px)',

            borderRadius:
              '15px',

            overflow:
              'hidden',

            backgroundColor:
              'background.paper',

            border:
              `1px solid ${alpha(
                theme.palette.divider,
                0.8,
              )}`,

            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 16px 40px rgba(0,0,0,0.38)'
                : '0 16px 40px rgba(15,23,42,0.16)',
          }),
        },
      }}
    >

      {/* =====================================================
          HEADER
      ===================================================== */}

      <Box
        sx={{
          px:
            2.5,

          pt:
            2.25,

          pb:
            1.5,
        }}
      >
        <Box
          sx={{
            display:
              'flex',

            alignItems:
              'flex-start',

            justifyContent:
              'space-between',

            gap:
              2,
          }}
        >

          <Box
            sx={{
              display:
                'flex',

              alignItems:
                'center',

              gap:
                1.5,
            }}
          >

            {/* ICON */}

            <Box
              sx={(theme) => ({
                width:
                  42,

                height:
                  42,

                display:
                  'grid',

                placeItems:
                  'center',

                flexShrink:
                  0,

                borderRadius:
                  '11px',

                color:
                  'primary.main',

                backgroundColor:
                  alpha(
                    theme.palette.primary.main,
                    0.1,
                  ),

                border:
                  `1px solid ${alpha(
                    theme.palette.primary.main,
                    0.18,
                  )}`,

              })}
            >
              <SaveRoundedIcon
                sx={{
                  fontSize:
                    22,
                }}
              />
            </Box>


            {/* TITLE */}

            <Box>
              <Typography
                sx={{
                  fontSize:
                    19,

                  fontWeight:
                    800,

                  lineHeight:
                    1.15,

                  letterSpacing:
                    '-0.2px',

                  color:
                    'text.primary',
                }}
              >
                Confirm Changes
              </Typography>

              <Typography
                sx={{
                  mt:
                    0.35,

                  fontSize:
                    12.5,

                  color:
                    'text.secondary',

                  fontWeight:
                    500,
                }}
              >
                {changeCount} change(s) ready to save
              </Typography>
            </Box>
          </Box>


          {/* CLOSE */}

          <AppButton
            compact
            aria-label="Close"
            disabled={
              saving
            }

            onClick={
              handleClose
            }

            sx={{
              width:
                34,

              height:
                34,

              mt:
                0,
            }}
            icon={<CloseRoundedIcon />}
          >
          </AppButton>

        </Box>
      </Box>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <DialogContent
        sx={{
          px:
            2.5,

          pt:
            '12px !important',

          pb:
            2.25,
        }}
      >

        <Typography
          sx={{
            mb:
              0.75,

            ml:
              0,

            fontSize:
              13,

            fontWeight:
              700,

            color:
              'text.primary',
          }}
        >
          Employee ID
        </Typography>


        <TextField
          autoFocus
          fullWidth

          placeholder="Enter MSNV"

          value={
            employeeId
          }

          disabled={
            saving
          }

          error={
            Boolean(
              employeeError,
            )
          }

          helperText={
            employeeError
            || 'Numbers only'
          }

          onChange={(event) =>
            handleEmployeeIdChange(
              event.target.value,
            )
          }

          onKeyDown={(event) => {

            if (
              event.key ===
              'Enter'
            ) {

              event.preventDefault()

              handleEnter()
            }
          }}

          slotProps={{
            htmlInput: {
              inputMode:
                'numeric',

              pattern:
                '[0-9]*',

              maxLength:
                20,
            },

            input: {
              startAdornment: (
                <InputAdornment
                  position="start"
                >
                  <Box
                    sx={(theme) => ({
                      width:
                        30,

                      height:
                        30,

                      display:
                        'grid',

                      placeItems:
                        'center',

                      borderRadius:
                        1.5,

                      bgcolor:
                        alpha(
                          theme.palette.primary.main,
                          0.08,
                        ),

                      color:
                        'primary.main',
                    })}
                  >
                    <BadgeRoundedIcon
                      sx={{
                        fontSize:
                          17,
                      }}
                    />
                  </Box>
                </InputAdornment>
              ),
            },
          }}

          sx={(theme) => ({
            '& .MuiOutlinedInput-root': {
              minHeight:
                46,

              borderRadius:
                '11px',

              px:
                1,

              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.white, 0.035)
                  : alpha(theme.palette.common.black, 0.018),

              transition:
                'all 160ms ease',

              '& fieldset': {
                borderColor:
                  alpha(
                    theme.palette.text.primary,
                    0.10,
                  ),
              },

              '&:hover fieldset': {
                borderColor:
                  alpha(
                    theme.palette.primary.main,
                    0.40,
                  ),
              },

              '&.Mui-focused': {
                boxShadow:
                  `0 0 0 4px ${alpha(
                    theme.palette.primary.main,
                    0.08,
                  )}`,
              },

              '&.Mui-focused fieldset': {
                borderWidth:
                  1.5,

                borderColor:
                  theme.palette.primary.main,
              },
            },

            '& input': {
              fontSize:
                14,

              fontWeight:
                600,
            },

            '& .MuiFormHelperText-root': {
              mt:
                0.5,

              ml:
                0.25,

              fontSize:
                11.5,
            },
          })}
        />
      </DialogContent>


      {/* =====================================================
          ACTION BAR
      ===================================================== */}

      <DialogActions
        sx={(theme) => ({
          px: 2.5,
          py: 1.25,
          gap: 0.75,

          justifyContent: 'flex-end',

          borderTop: `1px solid ${alpha(
            theme.palette.divider,
            0.55,
          )}`,

          background:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.02)
              : alpha(theme.palette.common.black, 0.015),
        })}
      >
        {/* CANCEL */}
        <AppButton
          disabled={saving}
          onClick={handleClose}
          sx={{
            minHeight: 36,
          }}
        >
          Cancel
        </AppButton>

        {/* CONFIRM */}
        <AppButton
          appearance="action"
          loading={saving}
          disabled={!employeeId.trim()}
          icon={
            !saving
              ? (
                <SaveRoundedIcon
                  sx={{
                    fontSize: '18px !important',
                  }}
                />
              )
              : undefined
          }
          onClick={onConfirm}
          sx={{
            minHeight: 36,
          }}
        >
          {saving
            ? 'Saving...'
            : 'Confirm'}
        </AppButton>
      </DialogActions>
    </Dialog>
  )
}
