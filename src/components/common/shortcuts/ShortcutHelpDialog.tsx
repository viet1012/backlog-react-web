import { Fragment } from 'react'

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import KeyboardRoundedIcon from '@mui/icons-material/KeyboardRounded'

import { useI18n } from '../../../i18n/useI18n'

interface ShortcutRow {
  keys: string[][]
  label: string
}

interface KbdProps {
  children: string
  /** small: nằm trong dòng chữ (toast, tooltip) */
  size?: 'medium' | 'small'
  /** Trên nền tối của tooltip: chữ / viền theo màu chữ của tooltip */
  inverse?: boolean
}

/** Một phím (ô viền giống phím thật) */
export function Kbd({ children, size = 'medium', inverse = false }: KbdProps) {
  const small = size === 'small'

  return (
    <Box
      component="kbd"
      sx={(theme) => ({
        minWidth: small ? 18 : 22,
        height: small ? 18 : 22,
        px: small ? 0.5 : 0.75,
        mx: small ? 0.25 : 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        borderRadius: small ? '5px' : '6px',
        border: `1px solid ${inverse ? 'rgba(255,255,255,0.45)' : theme.palette.divider}`,
        borderBottomWidth: 2,
        bgcolor: inverse ? 'rgba(255,255,255,0.12)' : 'action.hover',
        color: inverse ? 'inherit' : 'text.primary',
        fontFamily: 'inherit',
        fontSize: small ? 10.5 : 11.5,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      })}
    >
      {children}
    </Box>
  )
}

/** keys: mỗi phần tử là 1 tổ hợp (Ctrl + K); nhiều tổ hợp cách nhau "/" */
function Keys({ keys }: { keys: string[][] }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
      {keys.map((combo, i) => (
        <Fragment key={combo.join('+')}>
          {i > 0 && <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary' }}>/</Typography>}
          {combo.map((key, j) => (
            <Fragment key={key}>
              {j > 0 && <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary' }}>+</Typography>}
              <Kbd>{key}</Kbd>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </Box>
  )
}

function Section({ title, rows }: { title: string, rows: ShortcutRow[] }) {
  return (
    <Box component="section" sx={{ mb: 2, '&:last-of-type': { mb: 0 } }}>
      <Typography
        component="h3"
        sx={{ mb: 0.75, fontSize: 10.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}
      >
        {title}
      </Typography>

      <Box
        component="dl"
        sx={{
          m: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(96px, auto) minmax(0, 1fr)',
          columnGap: 2,
          rowGap: 1,
          alignItems: 'center',
        }}
      >
        {rows.map((row) => (
          <Fragment key={row.label}>
            <Box component="dt" sx={{ m: 0 }}>
              <Keys keys={row.keys} />
            </Box>
            <Box component="dd" sx={{ m: 0, fontSize: 13, lineHeight: 1.4 }}>
              {row.label}
            </Box>
          </Fragment>
        ))}
      </Box>
    </Box>
  )
}

interface ShortcutHelpDialogProps {
  open: boolean
  onClose: () => void
}

export function ShortcutHelpDialog({ open, onClose }: ShortcutHelpDialogProps) {
  const { t } = useI18n()
  const s = t.shortcuts

  const general: ShortcutRow[] = [
    { keys: [['?']], label: s.openHelp },
    { keys: [['/']], label: s.focusSearch },
    { keys: [['R']], label: s.refresh },
    { keys: [['Ctrl', 'K']], label: s.quickJump },
    { keys: [['Ctrl', 'B']], label: s.toggleSidebar },
    { keys: [['Esc']], label: s.escape },
  ]

  const onPage: ShortcutRow[] = [
    { keys: [['←'], ['→'], ['↑'], ['↓'], ['Esc']], label: s.costDetail },
    { keys: [['Enter']], label: s.monitorSearch },
    { keys: [['Esc']], label: s.monitorEscape },
    { keys: [['?']], label: s.locatorHelp },
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="shortcut-help-title">
      <DialogTitle id="shortcut-help-title" sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1.5, fontSize: 16, fontWeight: 800 }}>
        <KeyboardRoundedIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        <Box component="span" sx={{ flex: 1 }}>{s.title}</Box>
        <IconButton size="small" aria-label={t.common.close} onClick={onClose}>
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0.5 }}>
        <Typography sx={{ mb: 2, fontSize: 12.5, color: 'text.secondary' }}>
          {s.hint}
        </Typography>

        <Section title={s.general} rows={general} />
        <Section title={s.onPage} rows={onPage} />
      </DialogContent>
    </Dialog>
  )
}
