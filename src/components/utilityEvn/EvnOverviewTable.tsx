import { Box, Skeleton, Stack, useTheme } from '@mui/material'
import { alpha, type Theme } from '@mui/material/styles'
import { Fragment, type ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { appScrollbarSx } from '../../theme/scrollbarStyle'
import { uiTokens } from '../../theme/uiTokens'
import {
  EVN_DASH,
  EVN_SCOPE_LABEL,
  evnNoteText,
  evnPctTone,
  evnWeekdayLabel,
  formatAmount,
  formatAmountDiff,
  formatDayMonth,
  formatPct,
  type EvnCell,
  type EvnOverviewRow,
  type EvnPctTone,
  type EvnScopeOverview,
  type EvnUnit,
} from '../../utils/utilityEvnCompare'
import { FactoryNoRowsOverlay } from '../common/FactoryNoRowsOverlay'
import { EvnSection } from './EvnSection'
import { EVN_PARTIAL_COLOR, TABULAR_NUMS, evnScopeColors, evnToneColor, evnToneTint } from './evnCompareUi'

interface EvnOverviewTableProps {
  rows: EvnOverviewRow[]
  overview: EvnScopeOverview[]
  unit: EvnUnit
  loading: boolean
}

const DATE_W = 64
const WEEKDAY_W = 46
const VALUE_W = 88
const PCT_W = 66
const ROW_H = uiTokens.table.rowHeight
const HEAD_H = uiTokens.table.headerHeight

type Align = 'left' | 'center' | 'right'

const EMPTY_CELL: EvnCell = { excel: null, actual: null, diff: null, pct: null, notApplicable: false }

function groupBorder(theme: Theme) {
  return `1px solid ${alpha(theme.palette.text.primary, 0.18)}`
}

function tintLayers(layers: (string | null | false)[]) {
  const shadows = layers.filter((layer): layer is string => Boolean(layer)).map((c) => `inset 0 0 0 9999px ${c}`)
  return shadows.length > 0 ? shadows.join(', ') : undefined
}

function Head({
  children,
  width,
  top = 0,
  left,
  rowSpan,
  colSpan,
  align = 'center',
  groupStart = false,
  accent,
}: {
  children: ReactNode
  width?: number
  top?: number
  left?: number
  rowSpan?: number
  colSpan?: number
  align?: Align
  groupStart?: boolean
  // màu nhận diện phạm vi (gạch dưới tiêu đề nhóm)
  accent?: string
}) {
  return (
    <Box
      component="th"
      scope="col"
      rowSpan={rowSpan}
      colSpan={colSpan}
      sx={(theme) => ({
        position: 'sticky',
        top,
        left,
        zIndex: left !== undefined ? 6 : 5,
        width,
        minWidth: width,
        maxWidth: width,
        height: rowSpan === 2 ? HEAD_H * 2 : HEAD_H,
        boxSizing: 'border-box',
        px: 0.75,
        textAlign: align,
        whiteSpace: 'nowrap',
        fontWeight: accent ? 800 : 700,
        color: accent ? 'text.primary' : 'text.secondary',
        bgcolor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        borderBottom: accent ? `3px solid ${accent}` : `1px solid ${theme.palette.divider}`,
        borderLeft: groupStart ? groupBorder(theme) : undefined,
      })}
    >
      {children}
    </Box>
  )
}

function Cell({
  children,
  width,
  left,
  align = 'right',
  sunday = false,
  footer = false,
  tone = null,
  color,
  strong = false,
  groupStart = false,
  title,
}: {
  children: ReactNode
  width: number
  left?: number
  align?: Align
  sunday?: boolean
  footer?: boolean
  tone?: EvnPctTone | null
  color?: string
  strong?: boolean
  groupStart?: boolean
  title?: string
}) {
  const empty = children === EVN_DASH || children === ''

  return (
    <Box
      component={left !== undefined ? 'th' : 'td'}
      scope={left !== undefined ? 'row' : undefined}
      title={title}
      sx={(theme) => ({
        position: left !== undefined || footer ? 'sticky' : undefined,
        left,
        bottom: footer ? 0 : undefined,
        zIndex: left !== undefined ? (footer ? 4 : 2) : footer ? 3 : undefined,
        width,
        minWidth: width,
        maxWidth: width,
        height: ROW_H,
        boxSizing: 'border-box',
        px: 0.75,
        textAlign: align,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        fontWeight: strong || tone ? 700 : 500,
        ...TABULAR_NUMS,
        color: empty ? 'text.disabled' : tone ? evnToneColor(theme, tone) : color ?? 'text.primary',
        bgcolor: theme.palette.background.paper,
        boxShadow: tintLayers([
          footer && alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.06),
          sunday && alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.07 : 0.05),
          evnToneTint(theme, tone),
        ]),
        borderRight: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
        borderTop: footer ? groupBorder(theme) : undefined,
        borderLeft: groupStart ? groupBorder(theme) : undefined,
      })}
    >
      {children}
    </Box>
  )
}

// Bảng gộp: mỗi ngày 1 dòng, điện lưới của KVH · Fac A&B · Fac C cạnh nhau
export function EvnOverviewTable({ rows, overview, unit, loading }: EvnOverviewTableProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn
  const table = labels.table

  const scopeCells = (cell: EvnCell, opts: { sunday?: boolean; footer?: boolean; partial?: boolean; hasExcel: boolean; note?: string }) => (
    <>
      <Cell width={VALUE_W} sunday={opts.sunday} footer={opts.footer} strong={opts.footer} groupStart>
        {opts.hasExcel ? formatAmount(cell.excel, unit) : EVN_DASH}
      </Cell>
      <Cell
        width={VALUE_W}
        sunday={opts.sunday}
        footer={opts.footer}
        strong={opts.footer || opts.partial}
        color={opts.partial ? EVN_PARTIAL_COLOR : undefined}
        title={opts.note || undefined}
      >
        {formatAmount(cell.actual, unit)}
      </Cell>
      <Cell width={VALUE_W} sunday={opts.sunday} footer={opts.footer} strong={opts.footer}>
        {formatAmountDiff(cell.diff, unit)}
      </Cell>
      <Cell width={PCT_W} sunday={opts.sunday} footer={opts.footer} tone={evnPctTone(cell.pct)}>
        {formatPct(cell.pct)}
      </Cell>
    </>
  )

  return (
    <EvnSection title={`${labels.overview.tableTitle} (${unit})`}>
      {loading && rows.length === 0 ? (
        <Stack spacing={0.5}>
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={ROW_H - 6} />
          ))}
        </Stack>
      ) : rows.length === 0 ? (
        <Box sx={{ minHeight: 120, display: 'grid', placeItems: 'center' }}>
          <FactoryNoRowsOverlay variant="compact" title={labels.noData} />
        </Box>
      ) : (
        <Box
          sx={(theme) => ({
            width: '100%',
            minWidth: 0,
            maxHeight: 'min(640px, calc(100vh - 180px))',
            overflow: 'auto',
            ...appScrollbarSx,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: uiTokens.card.borderRadius,
          })}
        >
          <Box
            component="table"
            sx={{
              width: 'max-content',
              minWidth: '100%',
              borderCollapse: 'separate',
              borderSpacing: 0,
              tableLayout: 'fixed',
              fontSize: uiTokens.table.auxiliaryFontSize,
            }}
          >
            <colgroup>
              {[DATE_W, WEEKDAY_W, ...overview.flatMap(() => [VALUE_W, VALUE_W, VALUE_W, PCT_W])].map((width, i) => (
                <col key={i} style={{ width }} />
              ))}
            </colgroup>

            <Box component="thead">
              <ScopeHeadRow overview={overview} dateLabel={table.date} weekdayLabel={table.weekday} />
              <Box component="tr">
                {overview.map((scope) =>
                  [table.excel, table.actual, table.diff, table.pct].map((text, i) => (
                    <Head
                      key={`${scope.code}-${i}`}
                      width={i === 3 ? PCT_W : VALUE_W}
                      top={HEAD_H}
                      align={i === 3 ? 'center' : 'right'}
                      groupStart={i === 0}
                    >
                      {text}
                    </Head>
                  )),
                )}
              </Box>
            </Box>

            <Box component="tbody">
              {rows.map((row) => (
                <Box
                  component="tr"
                  key={row.date}
                  sx={(theme) => ({
                    '&:hover > *': {
                      backgroundImage: `linear-gradient(${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.primary.main, 0.06)})`,
                    },
                  })}
                >
                  <Cell width={DATE_W} left={0} align="left" sunday={row.sunday} strong>
                    {formatDayMonth(row.date)}
                  </Cell>
                  <Cell
                    width={WEEKDAY_W}
                    left={DATE_W}
                    align="center"
                    sunday={row.sunday}
                    color={row.sunday ? 'error.main' : 'text.secondary'}
                  >
                    {evnWeekdayLabel(row, table.weekdays)}
                  </Cell>

                  {overview.map((scope) => {
                    const scopeRow = row.byScope[scope.code]
                    return (
                      <Fragment key={scope.code}>
                        {scopeCells(scopeRow?.cells.totalElectricity ?? EMPTY_CELL, {
                          sunday: row.sunday,
                          partial: scopeRow?.partial,
                          hasExcel: scopeRow?.hasExcel ?? false,
                          note: scopeRow ? evnNoteText(scopeRow, table) : undefined,
                        })}
                      </Fragment>
                    )
                  })}
                </Box>
              ))}
            </Box>

            {/* Dòng tổng: mỗi phạm vi cộng trên ngày có Excel của chính nó */}
            <Box component="tfoot">
              <Box component="tr">
                <Cell width={DATE_W} left={0} align="left" strong footer>{table.total}</Cell>
                <Cell width={WEEKDAY_W} left={DATE_W} footer>{''}</Cell>
                {overview.map((scope) => (
                  <Fragment key={scope.code}>
                    {scopeCells(scope.summary.totals.totalElectricity, { footer: true, hasExcel: true })}
                  </Fragment>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </EvnSection>
  )
}

// Dòng tiêu đề 1: Ngày | Thứ | mỗi phạm vi gộp 4 cột, gạch dưới bằng màu phạm vi
function ScopeHeadRow({
  overview,
  dateLabel,
  weekdayLabel,
}: {
  overview: EvnScopeOverview[]
  dateLabel: string
  weekdayLabel: string
}) {
  const theme = useTheme()
  const scopeColors = evnScopeColors(theme)

  return (
    <Box component="tr">
      <Head width={DATE_W} left={0} rowSpan={2} align="left">{dateLabel}</Head>
      <Head width={WEEKDAY_W} left={DATE_W} rowSpan={2}>{weekdayLabel}</Head>
      {overview.map((scope) => (
        <Head key={scope.code} colSpan={4} groupStart accent={scopeColors[scope.code]}>
          {EVN_SCOPE_LABEL[scope.code]}
        </Head>
      ))}
    </Box>
  )
}
