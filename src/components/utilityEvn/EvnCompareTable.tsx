import { Box, Skeleton, Stack } from '@mui/material'
import { alpha, type Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { appScrollbarSx } from '../../theme/scrollbarStyle'
import { uiTokens } from '../../theme/uiTokens'
import {
  EVN_DASH,
  EVN_GROUPS,
  evnCoverageText,
  evnNoteText,
  evnPctTone,
  evnWeekdayLabel,
  formatDayMonth,
  formatAmount,
  formatAmountDiff,
  formatPct,
  type EvnCell,
  type EvnCompareRow,
  type EvnCompareSummary,
  type EvnPctTone,
  type EvnUnit,
} from '../../utils/utilityEvnCompare'
import { FactoryNoRowsOverlay } from '../common/FactoryNoRowsOverlay'
import { EvnSection } from './EvnSection'
import { EVN_PARTIAL_COLOR, TABULAR_NUMS, evnToneColor, evnToneTint } from './evnCompareUi'

interface EvnCompareTableProps {
  rows: EvnCompareRow[]
  summary: EvnCompareSummary
  unit: EvnUnit
  loading: boolean
}

const DATE_W = 64
const WEEKDAY_W = 46
const VALUE_W = 84
const PCT_W = 64
const SOURCE_W = 108
const COVERAGE_W = 116
const NOTE_W = 300

const ROW_H = uiTokens.table.rowHeight
const HEAD_H = uiTokens.table.headerHeight

const WEEKDAY_LEFT = DATE_W

const COLUMN_WIDTHS = [
  DATE_W,
  WEEKDAY_W,
  ...EVN_GROUPS.flatMap(() => [VALUE_W, VALUE_W, VALUE_W, PCT_W]),
  SOURCE_W,
  COVERAGE_W,
  NOTE_W,
]

type Align = 'left' | 'center' | 'right'

function groupBorder(theme: Theme) {
  return `1px solid ${alpha(theme.palette.text.primary, 0.18)}`
}

// Nền ô luôn đặc (cột sticky đè lên khi cuộn ngang); tô màu bằng inset shadow như ODBF
function tintLayers(layers: (string | null | false)[]) {
  const shadows = layers
    .filter((layer): layer is string => Boolean(layer))
    .map((color) => `inset 0 0 0 9999px ${color}`)

  return shadows.length > 0 ? shadows.join(', ') : undefined
}

function sundayTint(theme: Theme) {
  return alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.07 : 0.05)
}

function HeadCell({
  children,
  width,
  top = 0,
  left,
  rowSpan,
  colSpan,
  align = 'center',
  groupStart = false,
}: {
  children: ReactNode
  width?: number
  top?: number
  left?: number
  rowSpan?: number
  colSpan?: number
  align?: Align
  groupStart?: boolean
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
        fontWeight: 700,
        color: 'text.secondary',
        bgcolor: theme.palette.background.paper,
        borderRight: `1px solid ${theme.palette.divider}`,
        borderBottom: `1px solid ${theme.palette.divider}`,
        borderLeft: groupStart ? groupBorder(theme) : undefined,
      })}
    >
      {children}
    </Box>
  )
}

function BodyCell({
  children,
  width,
  left,
  align = 'right',
  sunday = false,
  tone = null,
  color,
  strong = false,
  groupStart = false,
  wrap = false,
  title,
  footer = false,
}: {
  children: ReactNode
  width: number
  left?: number
  align?: Align
  sunday?: boolean
  tone?: EvnPctTone | null
  color?: string
  strong?: boolean
  groupStart?: boolean
  wrap?: boolean
  title?: string
  footer?: boolean
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
        py: wrap ? 0.5 : 0,
        textAlign: align,
        whiteSpace: wrap ? 'normal' : 'nowrap',
        lineHeight: wrap ? 1.35 : undefined,
        overflow: 'hidden',
        textOverflow: wrap ? undefined : 'ellipsis',
        fontWeight: strong || tone ? 700 : 500,
        ...TABULAR_NUMS,
        color: empty
          ? 'text.disabled'
          : tone
            ? evnToneColor(theme, tone)
            : color ?? 'text.primary',
        bgcolor: theme.palette.background.paper,
        boxShadow: tintLayers([
          footer && alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.06),
          sunday && sundayTint(theme),
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

// 4 ô của 1 nhóm: Excel | Thực tế | Chênh | %
function GroupCells({
  cell,
  unit,
  hasExcel,
  sunday = false,
  footer = false,
  notApplicableTitle,
}: {
  cell: EvnCell
  unit: EvnUnit
  hasExcel: boolean
  sunday?: boolean
  footer?: boolean
  notApplicableTitle: string
}) {
  if (cell.notApplicable) {
    return (
      <>
        {[0, 1, 2, 3].map((i) => (
          <BodyCell
            key={i}
            width={i === 3 ? PCT_W : VALUE_W}
            sunday={sunday}
            groupStart={i === 0}
            title={notApplicableTitle}
          >
            {EVN_DASH}
          </BodyCell>
        ))}
      </>
    )
  }

  return (
    <>
      <BodyCell width={VALUE_W} sunday={sunday} groupStart strong={footer} footer={footer}>
        {hasExcel ? formatAmount(cell.excel, unit) : EVN_DASH}
      </BodyCell>
      <BodyCell width={VALUE_W} sunday={sunday} strong={footer} footer={footer}>
        {formatAmount(cell.actual, unit)}
      </BodyCell>
      <BodyCell width={VALUE_W} sunday={sunday} strong={footer} footer={footer}>
        {formatAmountDiff(cell.diff, unit)}
      </BodyCell>
      <BodyCell width={PCT_W} sunday={sunday} tone={evnPctTone(cell.pct)} footer={footer}>
        {formatPct(cell.pct)}
      </BodyCell>
    </>
  )
}

export function EvnCompareTable({ rows, summary, unit, loading }: EvnCompareTableProps) {
  const { t } = useI18n()
  const labels = t.utilityEvn.table

  return (
    <EvnSection title={`${unit === 'kUSD' ? labels.titleMoney : labels.title} (${unit})`}>
      {loading && rows.length === 0 ? (
        <Stack spacing={0.5}>
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={ROW_H - 6} />
          ))}
        </Stack>
      ) : rows.length === 0 ? (
        <Box sx={{ minHeight: 120, display: 'grid', placeItems: 'center' }}>
          <FactoryNoRowsOverlay variant="compact" title={t.utilityEvn.noData} />
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
            {/* table-layout: fixed lấy độ rộng từ hàng đầu (có ô gộp) → khai báo cột ở colgroup */}
            <colgroup>
              {COLUMN_WIDTHS.map((width, i) => (
                <col key={i} style={{ width }} />
              ))}
            </colgroup>

            <Box component="thead">
              <Box component="tr">
                <HeadCell width={DATE_W} left={0} rowSpan={2} align="left">{labels.date}</HeadCell>
                <HeadCell width={WEEKDAY_W} left={WEEKDAY_LEFT} rowSpan={2}>{labels.weekday}</HeadCell>
                {EVN_GROUPS.map((key) => (
                  <HeadCell key={key} colSpan={4} groupStart>{labels.groups[key]}</HeadCell>
                ))}
                <HeadCell width={SOURCE_W} rowSpan={2} groupStart>{labels.source}</HeadCell>
                <HeadCell width={COVERAGE_W} rowSpan={2}>{labels.coverage}</HeadCell>
                <HeadCell width={NOTE_W} rowSpan={2} align="left">{labels.note}</HeadCell>
              </Box>

              <Box component="tr">
                {EVN_GROUPS.map((key) => (
                  [labels.excel, labels.actual, labels.diff, labels.pct].map((text, i) => (
                    <HeadCell
                      key={`${key}-${i}`}
                      width={i === 3 ? PCT_W : VALUE_W}
                      top={HEAD_H}
                      align={i === 3 ? 'center' : 'right'}
                      groupStart={i === 0}
                    >
                      {text}
                    </HeadCell>
                  ))
                ))}
              </Box>
            </Box>

            <Box component="tbody">
              {rows.map((row) => {
                const note = evnNoteText(row, labels)

                return (
                  <Box
                    component="tr"
                    key={row.date}
                    sx={(theme) => ({
                      '&:hover > *': {
                        backgroundImage: `linear-gradient(${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.primary.main, 0.06)})`,
                      },
                    })}
                  >
                    <BodyCell width={DATE_W} left={0} align="left" sunday={row.sunday} strong>
                      {formatDayMonth(row.date)}
                    </BodyCell>
                    <BodyCell
                      width={WEEKDAY_W}
                      left={WEEKDAY_LEFT}
                      align="center"
                      sunday={row.sunday}
                      color={row.sunday ? 'error.main' : 'text.secondary'}
                    >
                      {evnWeekdayLabel(row, labels.weekdays)}
                    </BodyCell>

                    {EVN_GROUPS.map((key) => (
                      <GroupCells
                        key={key}
                        cell={row.cells[key]}
                        unit={unit}
                        hasExcel={row.hasExcel}
                        sunday={row.sunday}
                        notApplicableTitle={labels.sundayPeak}
                      />
                    ))}

                    <BodyCell
                      width={SOURCE_W}
                      align="center"
                      sunday={row.sunday}
                      groupStart
                      strong={row.hasExcel}
                      color={row.hasExcel ? 'success.main' : 'text.secondary'}
                    >
                      {row.hasExcel ? labels.sourceEvn : labels.sourceNone}
                    </BodyCell>
                    <BodyCell
                      width={COVERAGE_W}
                      align="center"
                      sunday={row.sunday}
                      strong={row.partial}
                      color={row.partial ? EVN_PARTIAL_COLOR : undefined}
                    >
                      {evnCoverageText(row, labels.hoursOfDay)}
                    </BodyCell>
                    <BodyCell
                      width={NOTE_W}
                      align="left"
                      sunday={row.sunday}
                      wrap
                      color="text.secondary"
                    >
                      {note}
                    </BodyCell>
                  </Box>
                )
              })}
            </Box>

            {/* Dòng tổng: chỉ ngày có Excel; dính đáy khi cuộn */}
            <Box component="tfoot">
              <Box component="tr">
                <BodyCell width={DATE_W} left={0} align="left" strong footer>
                  {labels.total}
                </BodyCell>
                <BodyCell width={WEEKDAY_W} left={WEEKDAY_LEFT} footer>{''}</BodyCell>

                {EVN_GROUPS.map((key) => (
                  <GroupCells
                    key={key}
                    cell={summary.totals[key]}
                    unit={unit}
                    hasExcel
                    footer
                    notApplicableTitle={labels.sundayPeak}
                  />
                ))}

                <BodyCell width={SOURCE_W} align="center" groupStart footer color="text.secondary">
                  {labels.totalHint(summary.excelDays)}
                </BodyCell>
                <BodyCell width={COVERAGE_W} footer>{''}</BodyCell>
                <BodyCell width={NOTE_W} footer>{''}</BodyCell>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </EvnSection>
  )
}
