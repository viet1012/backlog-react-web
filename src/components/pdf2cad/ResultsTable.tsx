import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import {
  Box,
  Button,
  Chip,
  Link,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { Pdf2cadJob, Pdf2cadReport } from '../../types/pdf2cad'
import { uiTokens } from '../../theme/uiTokens'
import { Pdf2cadCard } from './Pdf2cadCard'
import { reportKey, translateServer, usePdf2cadText } from './pdf2cadText'

export type LearnState = { kind: 'busy' } | { kind: 'done'; count: number }

const cellSx = { fontSize: uiTokens.table.cellFontSize, py: 0.5, px: 1, whiteSpace: 'nowrap' } as const

export function ResultsTable({
  job,
  selectedKey,
  learnStates,
  onSelect,
  onDownload,
  onLearn,
}: {
  job: Pdf2cadJob | null
  selectedKey: string | null
  learnStates: Record<string, LearnState>
  onSelect: (report: Pdf2cadReport) => void
  onDownload: (output: string) => void
  onLearn: (output: string) => void
}) {
  const { tx, language } = usePdf2cadText()
  const rows = job
    ? [...job.reports].sort((a, b) => a.file.localeCompare(b.file) || a.page - b.page)
    : []
  const okCount = rows.filter((r) => r.output).length

  const emptyText = !job ? tx.noResults : job.status === 'queued' ? tx.waiting : tx.processingRow

  return (
    <Pdf2cadCard
      title={tx.results}
      extra={okCount > 0 && <Chip size="small" color="success" variant="outlined" label={`${okCount} DXF`} sx={{ height: 20, fontSize: 11 }} />}
      sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: { lg: '36vh' } }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', mx: -1.5, mb: -1.25 }}>
        <Table size="small" stickyHeader aria-label={tx.results}>
          <TableHead>
            <TableRow>
              {[tx.thFile, tx.thPage, tx.thKind, tx.thScale, tx.thObj, tx.thTime, tx.thDxf].map((h) => (
                <TableCell
                  key={h}
                  sx={{ ...cellSx, fontSize: uiTokens.table.headerFontSize, fontWeight: 700, bgcolor: 'background.paper' }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ ...cellSx, color: 'text.secondary', py: 1.5 }}>
                  {emptyText}
                </TableCell>
              </TableRow>
            )}

            {rows.map((r) => {
              const key = reportKey(r)
              const selected = key === selectedKey
              const learn = r.output ? learnStates[r.output] : undefined
              const counts = Object.entries(r.counts ?? {})
                .filter(([, v]) => v)
                .map(([k, v]) => `${k}:${v}`)
                .join(', ')

              return (
                <TableRow
                  key={key}
                  hover
                  selected={selected}
                  onClick={() => onSelect(r)}
                  sx={(theme) => ({
                    cursor: 'pointer',
                    '&.Mui-selected, &.Mui-selected:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                  })}
                >
                  <TableCell sx={{ ...cellSx, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.file}>
                    {r.file}
                  </TableCell>
                  <TableCell sx={cellSx}>{r.page}</TableCell>
                  <TableCell sx={cellSx}>
                    <Chip
                      size="small"
                      label={tx.kinds[r.kind] ?? r.kind}
                      color={r.kind === 'error' ? 'error' : r.kind === 'raster' ? 'warning' : 'default'}
                      variant="outlined"
                      sx={{ height: 20, fontSize: 11 }}
                    />
                  </TableCell>
                  <TableCell sx={cellSx}>
                    {r.kind === 'error' ? '–' : `1:${+r.scale.toFixed(4)}`}{' '}
                    <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary' }}>
                      {translateServer(language, r.scale_source)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ ...cellSx, whiteSpace: 'normal', minWidth: 160, fontSize: 11.5, color: 'text.secondary' }}>
                    {counts}
                  </TableCell>
                  <TableCell sx={{ ...cellSx, fontVariantNumeric: 'tabular-nums' }}>{r.seconds.toFixed(2)}s</TableCell>
                  <TableCell sx={{ ...cellSx, whiteSpace: 'normal', minWidth: 240 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
                      {r.error ? (
                        <Typography sx={{ fontSize: 12, color: 'error.main' }}>{translateServer(language, r.error)}</Typography>
                      ) : r.output ? (
                        <Link
                          component="button"
                          type="button"
                          underline="hover"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDownload(r.output!)
                          }}
                          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, fontSize: 12.5 }}
                        >
                          <DownloadRoundedIcon sx={{ fontSize: 15 }} />
                          {r.output}
                        </Link>
                      ) : (
                        <Typography sx={{ fontSize: 12, color: 'warning.main' }}>{tx.skippedRow}</Typography>
                      )}

                      {r.rotated ? (
                        <Typography component="span" sx={{ fontSize: 11, color: 'text.secondary' }}>
                          [{tx.rotated(r.rotated)}]
                        </Typography>
                      ) : null}

                      {r.output && r.kind !== 'template' && (
                        <Button
                          size="small"
                          variant={learn?.kind === 'done' ? 'text' : 'outlined'}
                          color={learn?.kind === 'done' ? 'success' : 'primary'}
                          disabled={learn?.kind === 'busy'}
                          title={tx.learnTitle}
                          startIcon={learn?.kind === 'done' ? <CheckCircleOutlineRoundedIcon /> : <SmartToyOutlinedIcon />}
                          onClick={(e) => {
                            e.stopPropagation()
                            onLearn(r.output!)
                          }}
                          sx={{ textTransform: 'none', fontSize: 11.5, py: 0, minHeight: 24, '& .MuiButton-startIcon svg': { fontSize: 15 } }}
                        >
                          {learn?.kind === 'busy' ? tx.learning : learn?.kind === 'done' ? tx.learned(learn.count) : tx.learnBtn}
                        </Button>
                      )}

                      {r.warning && (
                        <Typography sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, fontSize: 11.5, color: 'warning.main' }}>
                          <WarningAmberRoundedIcon sx={{ fontSize: 14 }} />
                          {translateServer(language, r.warning)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Box>
    </Pdf2cadCard>
  )
}
