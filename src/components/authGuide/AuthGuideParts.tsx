import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import {
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  type SxProps,
  type Theme,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useState, type ReactNode } from 'react'

import { useI18n } from '../../i18n/useI18n'
import { codeFontFamily } from '../machineLocator/machineLocatorColors'
import { uiTokens } from '../../theme/uiTokens'

// =========================================================
// BLOCK: tiêu đề nhỏ + mô tả 1 dòng + nội dung
// =========================================================

interface BlockProps {
  title: string
  hint?: ReactNode
  children: ReactNode
}

export function Block({ title, hint, children }: BlockProps) {
  return (
    <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box>
        <Typography component="h2" sx={{ fontSize: 14.5, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {title}
        </Typography>
        {hint && (
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25, lineHeight: 1.5 }}>
            {hint}
          </Typography>
        )}
      </Box>
      {children}
    </Box>
  )
}

// =========================================================
// CARD: khung viền nhẹ, có thể tô màu nhấn
// =========================================================

interface CardProps {
  children: ReactNode
  /** Màu nhấn: viền trái + nền rất nhạt */
  accent?: string
  sx?: SxProps<Theme>
}

export function Card({ children, accent, sx }: CardProps) {
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const extra = Array.isArray(sx) ? sx : sx ? [sx] : []

  return (
    <Box
      sx={[
        {
          p: 1.25,
          minWidth: 0,
          borderRadius: 1.5,
          border: 1,
          borderColor: 'divider',
          ...(accent && {
            borderLeft: `3px solid ${accent}`,
            bgcolor: alpha(accent, dark ? 0.08 : 0.04),
          }),
        },
        ...extra,
      ]}
    >
      {children}
    </Box>
  )
}

// =========================================================
// INLINE CODE
// =========================================================

export function Code({ children }: { children: ReactNode }) {
  const theme = useTheme()

  return (
    <Box
      component="code"
      sx={{
        fontFamily: codeFontFamily,
        fontSize: '0.92em',
        px: 0.5,
        py: '1px',
        borderRadius: 0.75,
        color: 'text.primary',
        bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.1 : 0.06),
        overflowWrap: 'anywhere',
      }}
    >
      {children}
    </Box>
  )
}

// =========================================================
// TABLE
// =========================================================

interface DocTableProps {
  head: ReactNode[]
  rows: ReactNode[][]
  widths?: (string | undefined)[]
  align?: ('left' | 'center')[]
}

export function DocTable({ head, rows, widths, align }: DocTableProps) {
  const theme = useTheme()

  return (
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {head.map((cell, i) => (
              <TableCell
                key={i}
                align={align?.[i] ?? 'left'}
                sx={{
                  width: widths?.[i],
                  fontSize: uiTokens.table.headerFontSize,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.06 : 0.035),
                }}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, r) => (
            <TableRow key={r} sx={{ '&:last-child td': { borderBottom: 0 } }}>
              {row.map((cell, c) => (
                <TableCell
                  key={c}
                  align={align?.[c] ?? 'left'}
                  sx={{ fontSize: uiTokens.table.cellFontSize, lineHeight: 1.55 }}
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// =========================================================
// CODE BLOCK (nút copy)
// =========================================================

interface CodeBlockProps {
  title: string
  code: string
}

export function CodeBlock({ title, code }: CodeBlockProps) {
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const { language } = useI18n()
  const [copied, setCopied] = useState(false)
  const copyLabel = language === 'en' ? 'Copy' : 'Sao chép'
  const copiedLabel = language === 'en' ? 'Copied' : 'Đã sao chép'

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard bị chặn → bỏ qua
    }
  }

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden', minWidth: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pl: 1.25,
          pr: 0.5,
          py: 0.25,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.text.primary, dark ? 0.06 : 0.035),
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary' }}>
          {title}
        </Typography>
        <Tooltip title={copied ? copiedLabel : copyLabel}>
          <IconButton size="small" onClick={copy} aria-label={copyLabel}>
            {copied
              ? <CheckRoundedIcon sx={{ fontSize: 16, color: 'success.main' }} />
              : <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.25,
          overflowX: 'auto',
          fontFamily: codeFontFamily,
          fontSize: 12.5,
          lineHeight: 1.6,
          color: 'text.primary',
          bgcolor: dark ? alpha('#000000', 0.25) : alpha('#f6f8fa', 0.9),
        }}
      >
        {code}
      </Box>
    </Box>
  )
}
