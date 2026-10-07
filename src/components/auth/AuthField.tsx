import { Box, TextField, Typography } from '@mui/material'
import type { TextFieldProps } from '@mui/material'

import { authLabelSx } from './loginStyles'

type AuthFieldProps = Omit<TextFieldProps, 'label' | 'id'> & {
  id: string
  label: string
}

// Label nằm phía trên ô input (không dùng floating label của MUI)
export function AuthField({ id, label, ...textFieldProps }: AuthFieldProps) {
  return (
    <Box>
      <Typography component="label" htmlFor={id} sx={authLabelSx}>
        {label}
      </Typography>
      <TextField id={id} fullWidth {...textFieldProps} />
    </Box>
  )
}
