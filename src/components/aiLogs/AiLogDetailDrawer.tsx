import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import {
  Alert,
  Box,
  Chip,
  Drawer,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState, type ReactNode } from 'react'
import type { AiLogDetail, AiLogToolRun } from '../../types/assistantLogs'
import { useI18n } from '../../i18n/useI18n'
import { MascotMarkdown } from '../mascot/MascotMarkdown'
import { AiLogTimeline } from './AiLogTimeline'
import {
  TABULAR_NUMS,
  durationLevel,
  formatDateTime,
  formatInt,
  formatSec,
} from './aiLogsUtils'

interface AiLogDetailDrawerProps {
  open: boolean
  rid: string | null
  data: AiLogDetail | null
  loading: boolean
  error: string | null
  onClose: () => void
}

const cellSx = { ...TABULAR_NUMS, fontSize: 12.5, py: 0.5, px: 1 } as const
const headSx = { ...cellSx, fontWeight: 700, whiteSpace: 'nowrap' } as const
const monoSx = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 12 } as const

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <Typography sx={{ fontSize: 14, fontWeight: 800, mt: 1.5, mb: 0.5 }}>{children}</Typography>
  )
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ px: 1.5, py: 1, border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
      {children}
    </Box>
  )
}

function Empty() {
  const { t } = useI18n()
  return <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{t.aiLogs.detail.none}</Typography>
}

function Meta({ detail, rid }: { detail: AiLogDetail; rid: string }) {
  const { t } = useI18n()
  const labels = t.aiLogs.detail
  const [copied, setCopied] = useState(false)

  const level = durationLevel(detail.totalMs)
  const model = [detail.model, detail.reasoningEffort].filter(Boolean).join(' · ')

  const items: { label: string; value: ReactNode }[] = [
    { label: labels.time, value: formatDateTime(detail.timestamp) },
    { label: labels.user, value: detail.userId ?? '–' },
    { label: labels.screen, value: detail.screenKey ?? '–' },
    {
      label: labels.total,
      value: (
        <Box component="span" sx={{ color: level ? `${level}.main` : 'text.primary', fontWeight: 800 }}>
          {`${formatSec(detail.totalMs, 2)} s`}
        </Box>
      ),
    },
    { label: t.aiLogs.table.llmCalls, value: detail.llmCallCount },
    { label: labels.model, value: model || '–' },
    { label: labels.source, value: detail.source ?? '–' },
    { label: labels.lang, value: detail.lang ?? '–' },
  ]

  async function copyRid() {
    try {
      await navigator.clipboard.writeText(rid)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard bị chặn → bỏ qua
    }
  }

  return (
    <Stack sx={{ gap: 1 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
          gap: 1,
        }}
      >
        {items.map((item) => (
          <Box key={item.label} sx={{ px: 1, py: 0.75, border: 1, borderColor: 'divider', borderRadius: 1.5, minWidth: 0 }}>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{item.label}</Typography>
            <Typography sx={{ ...TABULAR_NUMS, fontSize: 13.5, fontWeight: 600, wordBreak: 'break-word' }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Box>

      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
        <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>{labels.rid}:</Typography>
        <Typography sx={{ ...monoSx, wordBreak: 'break-all' }}>{rid}</Typography>
        <Tooltip title={copied ? labels.copied : labels.copyRid}>
          <IconButton size="small" onClick={() => void copyRid()} aria-label={labels.copyRid}>
            <ContentCopyRoundedIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  )
}

function LlmCallsTable({ detail }: { detail: AiLogDetail }) {
  const { t } = useI18n()
  const labels = t.aiLogs.detail
  const calls = detail.llmCalls

  if (calls.length === 0) return <Empty />

  const sum = (pick: (c: (typeof calls)[number]) => number | null) => {
    const values = calls.map(pick).filter((v): v is number => v != null)
    return values.length ? values.reduce((a, b) => a + b, 0) : null
  }

  const total = (c: (typeof calls)[number]) =>
    c.promptTokens == null && c.completionTokens == null
      ? null
      : (c.promptTokens ?? 0) + (c.completionTokens ?? 0)

  return (
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headSx}>#</TableCell>
            <TableCell align="right" sx={headSx}>{labels.ms}</TableCell>
            <TableCell align="right" sx={headSx}>{labels.promptTokens}</TableCell>
            <TableCell align="right" sx={headSx}>{labels.completionTokens}</TableCell>
            <TableCell align="right" sx={headSx}>{labels.totalTokens}</TableCell>
            <TableCell sx={headSx}>{labels.finishReason}</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {calls.map((call, i) => (
            <TableRow key={i}>
              <TableCell sx={cellSx}>{i + 1}</TableCell>
              <TableCell align="right" sx={cellSx}>{formatInt(call.ms)}</TableCell>
              <TableCell align="right" sx={cellSx}>{formatInt(call.promptTokens)}</TableCell>
              <TableCell align="right" sx={cellSx}>{formatInt(call.completionTokens)}</TableCell>
              <TableCell align="right" sx={cellSx}>{formatInt(total(call))}</TableCell>
              <TableCell
                sx={{
                  ...cellSx,
                  ...monoSx,
                  color: call.finishReason === 'error' ? 'error.main' : 'text.primary',
                  fontWeight: call.finishReason === 'error' ? 700 : 400,
                }}
              >
                {call.finishReason ?? '–'}
              </TableCell>
            </TableRow>
          ))}

          {calls.length > 1 && (
            <TableRow>
              <TableCell sx={headSx}>{t.common.total}</TableCell>
              <TableCell align="right" sx={headSx}>{formatInt(sum((c) => c.ms))}</TableCell>
              <TableCell align="right" sx={headSx}>{formatInt(sum((c) => c.promptTokens))}</TableCell>
              <TableCell align="right" sx={headSx}>{formatInt(sum((c) => c.completionTokens))}</TableCell>
              <TableCell align="right" sx={headSx}>{formatInt(sum(total))}</TableCell>
              <TableCell sx={headSx} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function ToolsTable({ tools }: { tools: AiLogToolRun[] }) {
  const { t } = useI18n()
  const labels = t.aiLogs.detail

  if (tools.length === 0) return <Empty />

  return (
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headSx}>{labels.toolName}</TableCell>
            <TableCell sx={headSx}>{labels.round}</TableCell>
            <TableCell align="right" sx={headSx}>{labels.ms}</TableCell>
            <TableCell sx={headSx}>{labels.outcome}</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {tools.map((tool, i) => {
            const failed = tool.outcome != null && tool.outcome.toLowerCase() !== 'ok'

            return (
              <TableRow key={i}>
                <TableCell sx={{ ...cellSx, ...monoSx, wordBreak: 'break-all' }}>{tool.name}</TableCell>
                <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                  {tool.round === 0 ? labels.prefetch : tool.round}
                </TableCell>
                <TableCell align="right" sx={cellSx}>{formatInt(tool.ms)}</TableCell>
                <TableCell
                  sx={{
                    ...cellSx,
                    ...monoSx,
                    fontWeight: 700,
                    color: tool.outcome == null ? 'text.secondary' : failed ? 'error.main' : 'success.main',
                  }}
                >
                  {tool.outcome ?? '–'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

function ParamsTable({ params }: { params: Record<string, string> | null }) {
  const entries = Object.entries(params ?? {})

  if (entries.length === 0) return <Empty />

  return (
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
      <Table size="small">
        <TableBody>
          {entries.map(([key, value]) => (
            <TableRow key={key}>
              <TableCell sx={{ ...cellSx, ...monoSx, fontWeight: 700, width: 180, whiteSpace: 'nowrap' }}>
                {key}
              </TableCell>
              <TableCell sx={{ ...cellSx, ...monoSx, wordBreak: 'break-all' }}>{value ?? '–'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// Drawer chi tiết 1 request: câu hỏi, câu trả lời, lỗi, thời gian từng bước, LLM calls, tools, params
export function AiLogDetailDrawer({
  open,
  rid,
  data,
  loading,
  error,
  onClose,
}: AiLogDetailDrawerProps) {
  const { t } = useI18n()
  const labels = t.aiLogs.detail

  let body: ReactNode
  if (!data && loading) {
    body = (
      <Stack sx={{ gap: 1.5 }}>
        <Skeleton variant="rounded" height={130} />
        <Skeleton variant="rounded" height={60} />
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={140} />
      </Stack>
    )
  } else if (!data) {
    body = error ? <Alert severity="error">{error}</Alert> : null
  } else {
    const tools = [...data.prefetchTools, ...data.toolCalls]

    body = (
      <Stack sx={{ opacity: loading ? 0.6 : 1, transition: 'opacity 120ms' }}>
        <Meta detail={data} rid={data.rid ?? rid ?? '–'} />

        <SectionTitle>{labels.question}</SectionTitle>
        <Panel>
          <Typography sx={{ fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {data.question || '–'}
          </Typography>
        </Panel>

        {!data.ok && (
          <>
            <SectionTitle>{labels.error}</SectionTitle>
            <Alert severity="error" sx={{ '& .MuiAlert-message': { wordBreak: 'break-word', whiteSpace: 'pre-wrap' } }}>
              {data.errorCode && <Box component="strong" sx={{ mr: 1 }}>{data.errorCode}</Box>}
              {data.errorMessage ?? ''}
            </Alert>
          </>
        )}

        <SectionTitle>{labels.answer}</SectionTitle>
        <Panel>
          {data.answer ? (
            <MascotMarkdown>{data.answer}</MascotMarkdown>
          ) : (
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{labels.noAnswer}</Typography>
          )}
        </Panel>

        <SectionTitle>{labels.timeline}</SectionTitle>
        <Panel>
          <AiLogTimeline detail={data} />
        </Panel>

        <SectionTitle>{labels.llmCalls}</SectionTitle>
        <LlmCallsTable detail={data} />

        <SectionTitle>{labels.tools}</SectionTitle>
        <ToolsTable tools={tools} />

        <SectionTitle>{labels.params}</SectionTitle>
        <ParamsTable params={data.params} />
      </Stack>
    )
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { sx: { width: { xs: '100%', md: '55vw' }, maxWidth: 960, display: 'flex', flexDirection: 'column' } },
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 800 }} noWrap>
          {labels.title}
        </Typography>

        {data && (
          <Chip
            size="small"
            label={data.ok ? t.aiLogs.table.ok : t.aiLogs.table.error}
            sx={(theme) => {
              const color = data.ok ? theme.palette.success.main : theme.palette.error.main
              return {
                fontWeight: 700,
                color,
                bgcolor: alpha(color, 0.12),
                border: `1px solid ${alpha(color, 0.35)}`,
              }
            }}
          />
        )}

        <IconButton size="small" aria-label={labels.close} onClick={onClose}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2, py: 1.5 }}>
        {body}
      </Box>
    </Drawer>
  )
}
