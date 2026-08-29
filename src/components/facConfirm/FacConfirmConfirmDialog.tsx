import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import SaveRoundedIcon from '@mui/icons-material/SaveRounded'
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded'

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
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
              'rgba(15, 23, 42, 0.30)',

            backdropFilter:
              'blur(4px)',

            WebkitBackdropFilter:
              'blur(4px)',
          },
        },

        paper: {
          sx: (theme) => ({
            width:
              560,

            maxWidth:
              'calc(100vw - 32px)',

            borderRadius:
              '28px',

            overflow:
              'hidden',

            position:
              'relative',

            background:
              theme.palette.mode === 'dark'
                ? 'rgba(18, 24, 34, 0.88)'
                : 'rgba(255, 255, 255, 0.88)',

            backdropFilter:
              'blur(24px) saturate(170%)',

            WebkitBackdropFilter:
              'blur(24px) saturate(170%)',

            border:
              theme.palette.mode === 'dark'
                ? '1px solid rgba(255,255,255,0.10)'
                : '1px solid rgba(255,255,255,0.80)',

            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 28px 80px rgba(0,0,0,0.55)'
                : '0 28px 80px rgba(15,23,42,0.25)',

            '&::before': {
              content:
                '""',

              position:
                'absolute',

              inset:
                0,

              pointerEvents:
                'none',

              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.06), transparent 45%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(255,255,255,0.20) 50%, transparent)',

              zIndex:
                0,
            },

            '& > *': {
              position:
                'relative',

              zIndex:
                1,
            },
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
            4,

          pt:
            3.5,

          pb:
            2,
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
                2,
            }}
          >

            {/* ICON */}

            <Box
              sx={(theme) => ({
                width:
                  64,

                height:
                  64,

                display:
                  'grid',

                placeItems:
                  'center',

                flexShrink:
                  0,

                borderRadius:
                  '50%',

                color:
                  'primary.main',

                background:
                  `linear-gradient(
                    145deg,
                    ${alpha(theme.palette.primary.main, 0.16)},
                    ${alpha(theme.palette.primary.main, 0.04)}
                  )`,

                border:
                  `1px solid ${alpha(
                    theme.palette.primary.main,
                    0.18,
                  )}`,

                boxShadow:
                  `0 10px 30px ${alpha(
                    theme.palette.primary.main,
                    0.18,
                  )}`,
              })}
            >
              <SaveRoundedIcon
                sx={{
                  fontSize:
                    30,
                }}
              />
            </Box>


            {/* TITLE */}

            <Box>
              <Typography
                sx={{
                  fontSize:
                    25,

                  fontWeight:
                    900,

                  lineHeight:
                    1.15,

                  letterSpacing:
                    '-0.4px',

                  color:
                    'text.primary',
                }}
              >
                Confirm Changes
              </Typography>

              <Typography
                sx={{
                  mt:
                    0.7,

                  fontSize:
                    14,

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

          <IconButton
            disabled={
              saving
            }

            onClick={
              handleClose
            }

            sx={(theme) => ({
              width:
                42,

              height:
                42,

              mt:
                0.2,

              bgcolor:
                alpha(
                  theme.palette.text.primary,
                  0.05,
                ),

              color:
                'text.secondary',

              '&:hover': {
                bgcolor:
                  alpha(
                    theme.palette.text.primary,
                    0.10,
                  ),

                color:
                  'text.primary',
              },
            })}
          >
            <CloseRoundedIcon />
          </IconButton>

        </Box>
      </Box>


      {/* =====================================================
          CONTENT
      ===================================================== */}

      <DialogContent
        sx={{
          px:
            4,

          pt:
            '18px !important',

          pb:
            4,
        }}
      >

        <Typography
          sx={{
            mb:
              1,

            ml:
              0.5,

            fontSize:
              13,

            fontWeight:
              700,

            color:
              'primary.main',
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
                        34,

                      height:
                        34,

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
                          19,
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
                58,

              borderRadius:
                '18px',

              px:
                1.5,

              backgroundColor:
                theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.05)'
                  : 'rgba(255,255,255,0.72)',

              backdropFilter:
                'blur(12px)',

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
                    0.10,
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
                16,

              fontWeight:
                600,
            },

            '& .MuiFormHelperText-root': {
              mt:
                1,

              ml:
                1,

              fontSize:
                12,
            },
          })}
        />
      </DialogContent>


      {/* =====================================================
          ACTION BAR
      ===================================================== */}

      <DialogActions
        sx={(theme) => ({
          px: 4,
          py: 2.5,
          gap: 1.25,

          justifyContent: 'flex-end',

          borderTop: `1px solid ${alpha(
            theme.palette.divider,
            0.55,
          )}`,

          background:
            theme.palette.mode === 'dark'
              ? 'rgba(255,255,255,0.025)'
              : 'rgba(255,255,255,0.32)',

          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        })}
      >
        {/* CANCEL */}
        <AppButton
          variant="outlined"
          disabled={saving}
          onClick={handleClose}
          sx={(theme) => ({
            height: 42,
            minWidth: 104,
            px: 2.5,

            borderRadius: '13px',

            fontSize: 13,
            fontWeight: 700,

            color: 'text.secondary',

            borderColor: alpha(
              theme.palette.text.primary,
              0.12,
            ),

            backgroundColor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.04)
                : alpha(theme.palette.common.white, 0.55),

            boxShadow: 'none',

            '&:hover': {
              color: 'text.primary',

              borderColor: alpha(
                theme.palette.text.primary,
                0.20,
              ),

              backgroundColor:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.common.white, 0.08)
                  : alpha(theme.palette.common.white, 0.90),

              boxShadow: 'none',
            },
          })}
        >
          Cancel
        </AppButton>

        {/* CONFIRM */}
        <AppButton
          variant="outlined"
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
          sx={(theme) => ({
            height: 42,
            minWidth: 132,
            px: 2.75,

            borderRadius: '13px',

            fontSize: 13,
            fontWeight: 800,

            // giống nút Rough
            color: theme.palette.primary.main,

            borderColor: alpha(
              theme.palette.primary.main,
              0.75,
            ),

            backgroundColor: alpha(
              theme.palette.primary.main,
              theme.palette.mode === 'dark'
                ? 0.14
                : 0.07,
            ),

            boxShadow: 'none',

            '& .MuiButton-startIcon': {
              color: theme.palette.primary.main,
            },

            '&:hover': {
              color: theme.palette.primary.main,

              borderColor:
                theme.palette.primary.main,

              backgroundColor: alpha(
                theme.palette.primary.main,
                theme.palette.mode === 'dark'
                  ? 0.20
                  : 0.12,
              ),

              boxShadow: `0 4px 12px ${alpha(
                theme.palette.primary.main,
                0.10,
              )}`,
            },

            '&:active': {
              backgroundColor: alpha(
                theme.palette.primary.main,
                0.17,
              ),
            },

            '&.Mui-disabled': {
              color: alpha(
                theme.palette.text.primary,
                0.28,
              ),

              borderColor: alpha(
                theme.palette.text.primary,
                0.08,
              ),

              backgroundColor: alpha(
                theme.palette.text.primary,
                0.035,
              ),

              boxShadow: 'none',
            },
          })}
        >
          {saving
            ? 'Saving...'
            : 'Confirm'}
        </AppButton>
      </DialogActions>
    </Dialog>
  )
}