import { Box, Typography } from '@mui/material'

export function SalesStatusPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
        Sales Status
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Coming soon
      </Typography>
    </Box>
  )
}
