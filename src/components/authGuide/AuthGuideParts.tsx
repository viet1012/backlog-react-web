import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
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
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useState, type ReactNode } from 'react'

import { codeFontFamily } from '../machineLocator/machineLocatorColors'
import { uiTokens } from '../../theme/uiTokens'

// =========================================================
// SECTION
// =========================================================

interface DocSectionProps {
  id: string
  index: number
  title: string
  children: ReactNode
}

export function DocSection({ id, index, title, children }: DocSectionProps) {
  return (
    <Box
      component="section"
      id={id}
      sx={{
        scrollMarginTop: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.25,
        py: 2,
        '& + &': { borderTop: 1, borderColor: 'divider' },
      }}
    >
      <Typography
        component="h2"
        sx={{ fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.01em', display: 'flex', gap: 1, alignItems: 'baseline' }}
      >
        <Box component="span" sx={{ color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}>
          {index}.
        </Box>
        {title}
      </Typography>
      {children}
    </Box>
  )
}

export function DocText({ children }: { children: ReactNode }) {
  return (
    <Typography sx={{ fontSize: uiTokens.typography.body, lineHeight: 1.65, color: 'text.secondary' }}>
      {children}
    </Typography>
  )
}

export function DocList({ items }: { items: ReactNode[] }) {
  return (
    <Box
      component="ul"
      sx={{
        m: 0,
        pl: 2.5,
        fontSize: uiTokens.typography.body,
        lineHeight: 1.7,
        color: 'text.secondary',
        '& li::marker': { color: 'text.disabled' },
      }}
    >
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
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
        whiteSpace: 'nowrap',
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
  /** Column widths (CSS), same order as head */
  widths?: (string | undefined)[]
  align?: ('left' | 'center')[]
}

export function DocTable({ head, rows, widths, align }: DocTableProps) {
  const theme = useTheme()

  return (
    <TableContainer
      sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, overflowX: 'auto' }}
    >
      <Table size="small" sx={{ minWidth: 520 }}>
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
                  sx={{ fontSize: uiTokens.table.cellFontSize, lineHeight: 1.55, verticalAlign: 'top' }}
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
// FLOW DIAGRAM
// =========================================================

export interface FlowStep {
  title: ReactNode
  detail?: ReactNode
  /** Nhánh lỗi dưới bước, ví dụ { code: '401', text: 'sai hoặc hết hạn' } */
  fail?: { code: string; text: ReactNode }
}

export function FlowDiagram({ steps }: { steps: FlowStep[] }) {
  const theme = useTheme()
  const accent = theme.palette.primary.main
  const dark = theme.palette.mode === 'dark'

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'stretch' },
        gap: 0.5,
        overflowX: { md: 'auto' },
        pb: 0.5,
      }}
    >
      {steps.map((step, i) => (
        <Box key={i} sx={{ display: 'contents' }}>
          {i > 0 && (
            <Box
              aria-hidden
              sx={{
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                color: alpha(accent, 0.7),
                '& svg': { fontSize: 20, transform: { xs: 'rotate(90deg)', md: 'none' } },
              }}
            >
              <ArrowForwardRoundedIcon />
            </Box>
          )}

          <Box
            sx={{
              flex: { md: '1 1 0' },
              minWidth: { md: 132 },
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              p: 1.25,
              borderRadius: 1.5,
              border: `1px solid ${alpha(accent, dark ? 0.35 : 0.25)}`,
              bgcolor: alpha(accent, dark ? 0.1 : 0.05),
            }}
          >
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
              <Box
                sx={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: theme.palette.getContrastText(accent),
                  bgcolor: accent,
                }}
              >
                {i + 1}
              </Box>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.45 }}>
                {step.title}
              </Typography>
            </Box>

            {step.detail && (
              <Typography sx={{ fontSize: 12, lineHeight: 1.5, color: 'text.secondary', pl: 3.5 }}>
                {step.detail}
              </Typography>
            )}

            {step.fail && (
              <Box
                sx={{
                  mt: 'auto',
                  pt: 0.75,
                  borderTop: `1px dashed ${alpha(theme.palette.error.main, 0.4)}`,
                  display: 'flex',
                  gap: 0.75,
                  alignItems: 'baseline',
                  fontSize: 12,
                  color: 'error.main',
                }}
              >
                <Box component="span" sx={{ fontWeight: 700, fontFamily: codeFontFamily }}>
                  ↳ {step.fail.code}
                </Box>
                <span>{step.fail.text}</span>
              </Box>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

// =========================================================
// CODE BLOCK (with copy)
// =========================================================

interface CodeBlockProps {
  title: string
  code: string
}

export function CodeBlock({ title, code }: CodeBlockProps) {
  const theme = useTheme()
  const dark = theme.palette.mode === 'dark'
  const [copied, setCopied] = useState(false)

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
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
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
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', fontFamily: codeFontFamily }}>
          {title}
        </Typography>
        <Tooltip title={copied ? 'Đã sao chép' : 'Sao chép'}>
          <IconButton size="small" onClick={copy} aria-label="Sao chép">
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
