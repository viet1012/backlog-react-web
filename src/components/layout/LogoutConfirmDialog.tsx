import {
    Avatar,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    Typography,
} from '@mui/material'

import { LogoutRounded } from '@mui/icons-material'

interface LogoutConfirmDialogProps {
    open: boolean
    username: string
    role?: string
    onCancel: () => void
    onConfirm: () => void
}

export function LogoutConfirmDialog({
    open,
    username,
    role,
    onCancel,
    onConfirm,
}: LogoutConfirmDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-desc"
            slotProps={{
                paper: {
                    sx: (theme) => ({
                        borderRadius: '18px',
                        border: '1px solid',
                        borderColor: theme.palette.mode === 'dark'
                            ? 'rgba(110,195,245,0.16)'
                            : 'rgba(92,146,190,0.16)',
                        backgroundImage: 'none',
                        boxShadow: theme.palette.mode === 'dark'
                            ? '0 24px 60px rgba(0,0,0,0.45)'
                            : '0 24px 60px rgba(30,60,100,0.18)',
                    }),
                },
                backdrop: {
                    sx: {
                        backdropFilter: 'blur(4px)',
                        backgroundColor: 'rgba(8,18,32,0.45)',
                    },
                },
            }}
        >
            <DialogContent sx={{ pt: 3, pb: 1.5, textAlign: 'center' }}>
                {/* ICON */}
                <Box
                    sx={{
                        mx: 'auto',
                        mb: 1.75,
                        width: 52,
                        height: 52,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '16px',
                        color: 'error.main',
                        bgcolor: 'rgba(220,60,60,0.10)',
                        border: '1px solid rgba(220,60,60,0.18)',
                    }}
                >
                    <LogoutRounded sx={{ fontSize: 26 }} />
                </Box>

                <Typography
                    id="logout-dialog-title"
                    sx={{ fontSize: 18, fontWeight: 800, mb: 0.75 }}
                >
                    Sign out?
                </Typography>

                <Typography
                    id="logout-dialog-desc"
                    sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}
                >
                    You will need to sign in again to continue.
                </Typography>

                {/* CURRENT USER */}
                <Box
                    sx={(theme) => ({
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        px: 1.5,
                        py: 1.1,
                        borderRadius: '12px',
                        textAlign: 'left',
                        bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(37,99,235,0.05)',
                        border: '1px solid',
                        borderColor: 'divider',
                    })}
                >
                    <Avatar
                        sx={{
                            width: 34,
                            height: 34,
                            fontSize: 14,
                            fontWeight: 800,
                            bgcolor: 'primary.main',
                        }}
                    >
                        {username.charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontSize: 13, fontWeight: 700 }}>
                            {username}
                        </Typography>
                        {role && (
                            <Typography
                                noWrap
                                sx={{
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    letterSpacing: '0.08em',
                                    color: 'primary.main',
                                }}
                            >
                                {role}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    color="inherit"
                    onClick={onCancel}
                    autoFocus
                    sx={{
                        borderRadius: '10px',
                        py: 1,
                        fontWeight: 700,
                        textTransform: 'none',
                        borderColor: 'divider',
                    }}
                >
                    Cancel
                </Button>

                <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    onClick={onConfirm}
                    startIcon={<LogoutRounded />}
                    sx={{
                        borderRadius: '10px',
                        py: 1,
                        fontWeight: 700,
                        textTransform: 'none',
                        boxShadow: 'none',
                        '&:hover': { boxShadow: '0 6px 16px rgba(200,40,40,0.25)' },
                    }}
                >
                    Sign out
                </Button>
            </DialogActions>
        </Dialog>
    )
}