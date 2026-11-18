import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import {
  Alert,
  Box,
  Button,
  Collapse,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useI18n } from '../../i18n/useI18n'
import type { EvnImportResult } from '../../types/utilityEvn'
import { EVN_DASH, evnScopeLabel } from '../../utils/utilityEvnCompare'
import { EvnSection } from './EvnSection'
import { TABULAR_NUMS } from './evnCompareUi'

const cellSx = { ...TABULAR_NUMS, fontSize: 12.5, py: 0.5, px: 1 } as const
const headSx = { ...cellSx, fontWeight: 700, whiteSpace: 'nowrap', bgcolor: 'background.paper' } as const
const tableBoxSx = { border: 1, borderColor: 'divider', borderRadius: 1.5, maxHeight: 360 } as const

const ALL_SHEETS = '__all__'

function formatImportCount(value: number) {
  return value.toLocaleString('en-US')
}

function formatDay(value: string | null) {
  if (!value) return EVN_DASH
  const d = dayjs(value)
  return d.isValid() ? d.format('DD/MM/YYYY') : value
}

// BE trả `to` exclusive → hiện ngày cuối = to - 1 ngày
function formatLastDay(to: string) {
  const d = dayjs(to)
  return d.isValid() ? d.subtract(1, 'day').format('DD/MM/YYYY') : to || EVN_DASH
}

type Tone = 'success' | 'info' | 'error' | 'neutral'

function CountTile({ label, value, tone }: { label: string; value: number; tone: Tone }) {
  const color = tone === 'neutral' || value === 0 ? 'text.primary' : `${tone}.main`

  return (
    <Box sx={{ px: 1.5, py: 1, border: 1, borderColor: 'divider', borderRadius: 1.5, minWidth: 0 }}>
      <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>
        {label}
      </Typography>
      <Typography sx={{ ...TABULAR_NUMS, fontSize: 22, fontWeight: 800, color, lineHeight: 1.3 }}>
        {formatImportCount(value)}
      </Typography>
    </Box>
  )
}

interface EvnImportResultViewProps {
  result: EvnImportResult
}

// Mỗi lượt gọi API mới, parent đổi `key` → bộ lọc / thu gọn về mặc định
export function EvnImportResultView({ result }: EvnImportResultViewProps) {
  const { t } = useI18n()
  const labels = t.utilityEvnImport

  const [sheetFilter, setSheetFilter] = useState(ALL_SHEETS)
  const [warningsOpen, setWarningsOpen] = useState(result.warnings.length <= 5)

  // sheet có lỗi, theo thứ tự xuất hiện
  const errorSheets = useMemo(() => [...new Set(result.errors.map((e) => e.sheet))], [result.errors])
  const errors = sheetFilter === ALL_SHEETS
    ? result.errors
    : result.errors.filter((e) => e.sheet === sheetFilter)

  return (
    <Stack sx={{ gap: 1.5 }}>
      <EvnSection
        title={result.dryRun ? labels.result.dryRunTitle : labels.result.importTitle}
        extra={
          <Typography sx={{ fontSize: 12, color: 'text.secondary', minWidth: 0 }} noWrap>
            {labels.result.source(result.sourceFile)}
          </Typography>
        }
      >
        {!result.dryRun && (
          <Alert severity="success" sx={{ mb: 1 }}>
            {labels.result.done(formatImportCount(result.inserted), formatImportCount(result.updated))}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 1,
          }}
        >
          <CountTile label={labels.result.sheets} value={result.sheets.length} tone="neutral" />
          <CountTile label={labels.result.inserted} value={result.inserted} tone="success" />
          <CountTile label={labels.result.updated} value={result.updated} tone="info" />
          <CountTile label={labels.result.unchanged} value={result.unchanged} tone="neutral" />
          <CountTile label={labels.result.skipped} value={result.skipped} tone="neutral" />
          <CountTile label={labels.result.rejected} value={result.rejected} tone="error" />
        </Box>

        {result.warnings.length > 0 && (
          <Alert
            severity="info"
            sx={{ mt: 1, '& .MuiAlert-message': { width: '100%' } }}
            action={
              <Button
                size="small"
                color="inherit"
                onClick={() => setWarningsOpen((v) => !v)}
                endIcon={warningsOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                sx={{ textTransform: 'none' }}
              >
                {warningsOpen ? labels.warningsHide : labels.warningsShow}
              </Button>
            }
          >
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
              {labels.warnings(result.warnings.length)}
            </Typography>
            <Collapse in={warningsOpen}>
              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5, fontSize: 12.5, maxHeight: 200, overflowY: 'auto' }}>
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </Box>
            </Collapse>
          </Alert>
        )}
      </EvnSection>

      <EvnSection
        title={labels.errorsTable.title(result.errors.length)}
        extra={errorSheets.length > 1 && (
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <TextField
              select
              size="small"
              label={labels.errorsTable.filter}
              value={sheetFilter}
              onChange={(event) => setSheetFilter(event.target.value)}
              sx={{ minWidth: 180, '& .MuiInputBase-input': { fontSize: 13, py: 0.5 } }}
            >
              <MenuItem value={ALL_SHEETS}>{labels.errorsTable.allSheets}</MenuItem>
              {errorSheets.map((sheet) => (
                <MenuItem key={sheet} value={sheet}>{sheet}</MenuItem>
              ))}
            </TextField>
            {sheetFilter !== ALL_SHEETS && (
              <Typography sx={{ ...TABULAR_NUMS, fontSize: 12, color: 'text.secondary' }}>
                {labels.errorsTable.shown(errors.length, result.errors.length)}
              </Typography>
            )}
          </Stack>
        )}
      >
        {result.errors.length === 0 ? (
          <Alert severity="success">{labels.errorsTable.none}</Alert>
        ) : (
          <TableContainer sx={tableBoxSx}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>{labels.errorsTable.sheet}</TableCell>
                  <TableCell sx={headSx}>{labels.errorsTable.day}</TableCell>
                  <TableCell sx={headSx}>{labels.errorsTable.scope}</TableCell>
                  <TableCell sx={headSx}>{labels.errorsTable.cell}</TableCell>
                  <TableCell sx={headSx}>{labels.errorsTable.message}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {errors.map((error, i) => (
                  <TableRow key={`${error.sheet}|${error.day}|${error.scope}|${error.cell}|${i}`}>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>{error.sheet || EVN_DASH}</TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                      {error.day ? formatDay(error.day) : (
                        <Box component="span" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          {labels.errorsTable.wholeBlock}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>{evnScopeLabel(error.scope)}</TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
                      {error.cell ?? EVN_DASH}
                    </TableCell>
                    <TableCell sx={{ ...cellSx, color: 'error.main', minWidth: 260 }}>{error.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </EvnSection>

      <EvnSection title={labels.sheetsTable.title(result.sheets.length)}>
        {result.sheets.length === 0 ? (
          <Alert severity="info">{labels.sheetsTable.empty}</Alert>
        ) : (
          <TableContainer sx={tableBoxSx}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>{labels.sheetsTable.sheet}</TableCell>
                  <TableCell sx={headSx}>{labels.sheetsTable.billMonth}</TableCell>
                  <TableCell sx={headSx}>{labels.sheetsTable.range}</TableCell>
                  <TableCell sx={headSx} align="right">{labels.sheetsTable.rows}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.sheets.map((sheet) => (
                  <TableRow key={`${sheet.sheet}|${sheet.billMonth}`}>
                    <TableCell sx={{ ...cellSx, fontWeight: 700 }}>{sheet.sheet}</TableCell>
                    <TableCell sx={cellSx}>{sheet.billMonth || EVN_DASH}</TableCell>
                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap' }}>
                      {`${formatDay(sheet.from)} → ${formatLastDay(sheet.to)}`}
                    </TableCell>
                    <TableCell sx={cellSx} align="right">{formatImportCount(sheet.rows)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </EvnSection>
    </Stack>
  )
}
