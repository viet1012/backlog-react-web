import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from '@mui/material'

import {
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material'

import type { FormEvent } from 'react'

import {
  authModeActionSx,
  authModeFooterSx,
  loginAlertSx,
  loginButtonSx,
  loginFieldSx,
  passwordToggleFieldSx,
} from './loginStyles'

interface LoginFormProps {
  employeeId: string
  password: string
  remember: boolean
  showPassword: boolean
  loading: boolean
  error: string

  onEmployeeIdChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRememberChange: (value: boolean) => void
  onTogglePassword: () => void
  onCreateAccount: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function LoginForm({
  employeeId,
  password,
  remember,
  showPassword,
  loading,
  error,
  onEmployeeIdChange,
  onPasswordChange,
  onRememberChange,
  onTogglePassword,
  onCreateAccount,
  onSubmit,
}: LoginFormProps) {
  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {error && (
        <Alert
          severity="error"
          sx={loginAlertSx}
        >
          {error}
        </Alert>
      )}

      {/* MSNV */}
      <TextField
        label="Employee ID (MSNV)"
        value={employeeId}
        onChange={(event) =>
          onEmployeeIdChange(event.target.value)
        }
        autoComplete="username"
        autoFocus
        fullWidth
        required
        disabled={loading}
        sx={loginFieldSx}
      />

      {/* PASSWORD */}
      <TextField
        label="Password"
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(event) =>
          onPasswordChange(event.target.value)
        }
        autoComplete="current-password"
        fullWidth
        required
        disabled={loading}
        sx={passwordToggleFieldSx}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  title={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  aria-pressed={showPassword}
                  edge="end"
                  disabled={loading}
                  onClick={onTogglePassword}
                >
                  <Box
                    component="span"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {showPassword
                      ? <VisibilityOffOutlined />
                      : <VisibilityOutlined />}
                  </Box>
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      {/* OPTIONS */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <FormControlLabel
          control={
            <Checkbox
              checked={remember}
              disabled={loading}
              onChange={(event) =>
                onRememberChange(
                  event.target.checked,
                )
              }
              size="small"
              sx={{
                color:
                  'rgba(175, 210, 236, 0.55)',

                '&.Mui-checked': {
                  color: '#43a9ff',
                },
              }}
            />
          }
          label="Remember me"
          sx={{
            m: 0,

            '& .MuiFormControlLabel-label': {
              fontSize: 12.5,
              color:
                'rgba(225, 237, 248, 0.72)',
            },
          }}
        />
      </Box>

      {/* SIGN IN */}
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={loading}
        sx={loginButtonSx}
      >
        {loading ? (
          <CircularProgress
            size={22}
            color="inherit"
          />
        ) : (
          'Sign In'
        )}
      </Button>

      <Typography
        sx={authModeFooterSx}
      >
        Don&apos;t have an account?{' '}

        <Typography
          component="button"
          type="button"
          onClick={onCreateAccount}
          disabled={loading}
          sx={authModeActionSx}
        >
          Create account
        </Typography>
      </Typography>
    </Box>
  )
}
