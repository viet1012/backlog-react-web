import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import dayjs from 'dayjs'

import {
  Box,
  Button,
  ButtonBase,
  Collapse,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'

import ExpandMoreRoundedIcon
  from '@mui/icons-material/ExpandMoreRounded'

import TableRowsRoundedIcon
  from '@mui/icons-material/TableRowsRounded'

import ErrorOutlineRoundedIcon
  from '@mui/icons-material/ErrorOutlineRounded'

import InfoOutlinedIcon
  from '@mui/icons-material/InfoOutlined'

import { GlassPanel } from '../common/GlassPanel'

import {
  useFacConfirmDailySummary,
} from '../../hooks/useFacConfirmDailySummary'

import type {
  FacConfirmClassify,
  FacConfirmDailyCount,
  FacConfirmDailyDateBy,
  FacConfirmDailySaleType,
  FacConfirmDailyStageCounts,
  FacConfirmHeatType,
  FacConfirmProcessGroup,
} from '../../types/facConfirm'

import {
  loadFacConfirmDailyStatsPreferences,
  saveFacConfirmDailyStatsPreferences,
  type FacConfirmDailyStatsRange,
  type FacConfirmDailyStatsUnit,
} from '../../utils/uiPreferences'


interface FacConfirmDailyStatsProps {
  div: string
  expD: string
  classify?: FacConfirmClassify
  heatType: FacConfirmHeatType

  // Thẻ công đoạn đang chọn ở trên => công đoạn mặc định của panel
  procGrp: FacConfirmProcessGroup

  // Trang làm mới / lưu xong => tăng lên
  refreshToken: number

  // Bấm ô ngày (dateBy = EXPORT) => đặt Export Date của trang
  onSelectExportDate: (date: string) => void
}


const STAGES: readonly FacConfirmProcessGroup[] = [
  'Rough',
  'Heat',
  'Fine',
]

const STAGE_KEY: Record<
  FacConfirmProcessGroup,
  keyof FacConfirmDailyStageCounts
> = {
  Rough: 'rough',
  Heat: 'heat',
  Fine: 'fine',
}

const RANGES: readonly FacConfirmDailyStatsRange[] = [7, 14, 30]

const UNIT_LABEL: Record<FacConfirmDailyStatsUnit, string> = {
  PO: 'PO',
  PCS: 'Pcs',
}

// dayjs().day(): 0 = Chủ nhật
const WEEKDAY_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

const TILE_HEIGHT = 64
const TILE_MIN_WIDTH = 72
const TILE_GAP = 6

// Bảng chi tiết cuộn trong khung cao cố định
const TABLE_HEIGHT = 112

const NOTE =
  'Thẻ phía trên tính lũy kế đến Export Date; thống kê này tính đúng từng ngày.'


interface DailyPoint {
  date: string

  // Cần xác nhận (đã gồm phần đã xác nhận)
  need: number
  done: number

  // Còn phải xác nhận = max(0, need - done)
  pending: number

  // null khi dateBy = CONFIRM hoặc need = 0
  pct: number | null
}


function toPoint(
  date: string,
  count: FacConfirmDailyCount | undefined,
  unit: FacConfirmDailyStatsUnit,
  dateBy: FacConfirmDailyDateBy,
): DailyPoint {
  const need = (unit === 'PO' ? count?.needPo : count?.needPcs) ?? 0
  const done = (unit === 'PO' ? count?.donePo : count?.donePcs) ?? 0

  return {
    date,
    need,
    done,
    pending: Math.max(0, need - done),

    pct: dateBy === 'EXPORT' && need > 0
      ? Math.round((Math.min(done, need) / need) * 100)
      : null,
  }
}


// Chiều cao cột sparkline: ở CONFIRM done có thể > need
function stackOf(point: DailyPoint): number {
  return point.done + point.pending
}


function toSaleType(
  classify: FacConfirmClassify | undefined,
): FacConfirmDailySaleType {
  if (classify === 'Sale') {
    return 'SALE'
  }

  if (classify === 'Stock') {
    return 'STOCK'
  }

  return 'ALL'
}


// yyyy-MM-dd => dd/MM
function formatDay(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`
}


function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}


// Màu theo theme (dark mode dùng tông sáng hơn để đọc được trên nền tối)
interface StatsColors {
  done: string
  pendingText: string
  track: string
  finished: string
  emptyTile: string
}


export function FacConfirmDailyStats({
  div,
  expD,
  classify,
  heatType,
  procGrp,
  refreshToken,
  onSelectExportDate,
}: FacConfirmDailyStatsProps) {
  const theme = useTheme()
  const contentId = useId()

  const dark = theme.palette.mode === 'dark'

  const colors: StatsColors = {
    done: dark ? '#42a5f5' : '#1565c0',
    pendingText: dark ? '#fbbf24' : '#b45309',
    track: dark ? 'rgba(245, 158, 11, 0.28)' : '#fde7c2',
    finished: dark ? '#66bb6a' : '#2e7d32',
    emptyTile: dark ? theme.palette.action.hover : '#fafbfc',
  }

  const [prefs, setPrefs] = useState(
    loadFacConfirmDailyStatsPreferences,
  )

  useEffect(() => {
    saveFacConfirmDailyStatsPreferences(prefs)
  }, [prefs])

  const updatePrefs = (
    patch: Partial<typeof prefs>,
  ) => {
    setPrefs((current) => ({
      ...current,
      ...patch,
    }))
  }


  // Công đoạn của panel: theo thẻ ở trên, đổi riêng được trong panel
  const [stage, setStage] = useState(procGrp)
  const [syncedProcGrp, setSyncedProcGrp] = useState(procGrp)

  if (procGrp !== syncedProcGrp) {
    setSyncedProcGrp(procGrp)
    setStage(procGrp)
  }


  // Ô ngày có thể bị xóa trống => không gọi API
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(expD)
    && dayjs(expD).isValid()

  const to = expD

  const from = validDate
    ? dayjs(expD)
      .subtract(prefs.range - 1, 'day')
      .format('YYYY-MM-DD')
    : expD

  const summary = useFacConfirmDailySummary({
    division: div,
    from,
    to,
    saleType: toSaleType(classify),
    heatType,
    dateBy: prefs.dateBy,
    enabled: prefs.open && validDate,
    refreshToken,
  })

  const data = summary.data

  // Tính theo dateBy của dữ liệu đang hiện (có thể là dữ liệu cũ)
  const dataDateBy = data?.dateBy ?? prefs.dateBy
  const unitLabel = UNIT_LABEL[prefs.unit]

  const pointsByStage = useMemo(() => {
    const days = [...(data?.days ?? [])].sort(
      (left, right) => left.date.localeCompare(right.date),
    )

    return Object.fromEntries(
      STAGES.map((item) => [
        item,
        days.map((day) => toPoint(
          day.date,
          day[STAGE_KEY[item]],
          prefs.unit,
          dataDateBy,
        )),
      ]),
    ) as Record<FacConfirmProcessGroup, DailyPoint[]>
  }, [data, dataDateBy, prefs.unit])

  const totalsByStage = useMemo(
    () => Object.fromEntries(
      STAGES.map((item) => [
        item,
        toPoint(
          '',
          data?.total?.[STAGE_KEY[item]],
          prefs.unit,
          dataDateBy,
        ),
      ]),
    ) as Record<FacConfirmProcessGroup, DailyPoint>,
    [data, dataDateBy, prefs.unit],
  )

  const points = pointsByStage[stage]
  const total = totalsByStage[stage]

  // Ngày còn nhiều phần chưa xác nhận nhất
  const peakPoint = points.reduce<DailyPoint | null>(
    (peak, point) =>
      point.pending > 0
        && (!peak || point.pending > peak.pending)
        ? point
        : peak,
    null,
  )

  // Chỉ chọn ngày được khi dữ liệu theo Export Date
  const selectable = dataDateBy === 'EXPORT'

  const handleSelect = (date: string) => {
    if (selectable && date !== expD) {
      onSelectExportDate(date)
    }
  }


  let body: ReactNode

  if (summary.error) {
    body = (
      <Box
        role="alert"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minWidth: 0,
          color: 'error.main',
        }}
      >
        <ErrorOutlineRoundedIcon sx={{ fontSize: 18, flexShrink: 0 }} />

        <Typography
          variant="body2"
          noWrap
          title={summary.error}
          sx={{ flex: 1, minWidth: 0 }}
        >
          {summary.error}
        </Typography>

        <Button
          size="small"
          color="inherit"
          onClick={summary.retry}
          sx={{ flexShrink: 0 }}
        >
          Thử lại
        </Button>
      </Box>
    )
  } else if (!data) {
    body = (
      <Skeleton
        variant="rounded"
        height={TILE_HEIGHT}
      />
    )
  } else if (points.length === 0) {
    body = (
      <Box
        sx={{
          height: TILE_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Không có dữ liệu trong khoảng ngày này.
        </Typography>
      </Box>
    )
  } else if (prefs.showTable) {
    body = (
      <Box sx={{ opacity: summary.stale ? 0.55 : 1 }}>
        <DailyTable
          points={points}
          unitLabel={unitLabel}
          selectedDate={selectable ? expD : null}
          onSelect={selectable ? handleSelect : undefined}
        />
      </Box>
    )
  } else {
    body = (
      <Box
        sx={{
          opacity: summary.stale ? 0.55 : 1,
          transition: 'opacity 150ms',
        }}
      >
        <DailyTiles
          points={points}
          dateBy={dataDateBy}
          colors={colors}
          selectedDate={selectable ? expD : null}
          onSelect={selectable ? handleSelect : undefined}
        />

        <Typography
          sx={{
            mt: 0.5,
            fontSize: 11.5,
            lineHeight: '16px',
            color: 'text.secondary',
          }}
        >
          {selectable
            ? 'xanh = đã xác nhận / tổng cần xác nhận · cam = còn phải xác nhận · bấm ô để lọc theo Export Date'
            : 'Số đã xác nhận trong từng ngày (theo ngày xác nhận)'}
        </Typography>
      </Box>
    )
  }


  return (
    <GlassPanel
      sx={{
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Hàng đầu: tiêu đề + điều khiển + số tổng. Thu gọn => bấm cả dòng để mở. */}
      <Box
        onClick={
          prefs.open
            ? undefined
            : () => updatePrefs({ open: true })
        }
        sx={{
          minHeight: 32,
          px: 0.75,
          py: 0.25,
          display: 'flex',
          flexWrap: prefs.open ? 'wrap' : 'nowrap',
          alignItems: 'center',
          columnGap: 1.25,
          rowGap: 0.5,
          cursor: prefs.open ? 'default' : 'pointer',
          '&:hover': prefs.open
            ? undefined
            : { bgcolor: 'action.hover' },
          '& .MuiToggleButton-root': {
            height: 28,
            py: 0,
            px: 1,
            fontSize: 12,
            textTransform: 'none',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <ButtonBase
            aria-expanded={prefs.open}
            aria-controls={contentId}
            onClick={() => updatePrefs({ open: !prefs.open })}
            sx={{
              height: 28,
              pl: 0.25,
              pr: 0.75,
              gap: 0.5,
              borderRadius: 1,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <ExpandMoreRoundedIcon
              fontSize="small"
              sx={{
                color: 'text.secondary',
                transform: prefs.open ? 'none' : 'rotate(-90deg)',
                transition: 'transform 150ms',
              }}
            />

            <Typography
              variant="body2"
              sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              Thống kê {prefs.range} ngày
            </Typography>
          </ButtonBase>

          <Tooltip title={NOTE}>
            <InfoOutlinedIcon
              tabIndex={0}
              aria-label={NOTE}
              sx={{
                fontSize: 16,
                color: 'text.secondary',
                cursor: 'help',
              }}
            />
          </Tooltip>
        </Box>

        {prefs.open ? (
          <>
            <ToggleButtonGroup
              size="small"
              exclusive
              aria-label="Công đoạn"
              value={stage}
              onChange={(_, value: FacConfirmProcessGroup | null) => {
                if (value) {
                  setStage(value)
                }
              }}
            >
              {STAGES.map((item) => (
                <ToggleButton key={item} value={item}>
                  {item}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              exclusive
              aria-label="Đơn vị"
              value={prefs.unit}
              onChange={(_, value: FacConfirmDailyStatsUnit | null) => {
                if (value) {
                  updatePrefs({ unit: value })
                }
              }}
            >
              <ToggleButton value="PO">PO</ToggleButton>
              <ToggleButton value="PCS">Pcs</ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              exclusive
              aria-label="Số ngày"
              value={prefs.range}
              onChange={(_, value: FacConfirmDailyStatsRange | null) => {
                if (value) {
                  updatePrefs({ range: value })
                }
              }}
            >
              {RANGES.map((item) => (
                <ToggleButton key={item} value={item}>
                  {item}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              exclusive
              aria-label="Tính theo ngày"
              value={prefs.dateBy}
              onChange={(_, value: FacConfirmDailyDateBy | null) => {
                if (value) {
                  updatePrefs({ dateBy: value })
                }
              }}
            >
              <ToggleButton value="EXPORT">Export Date</ToggleButton>
              <ToggleButton value="CONFIRM">Ngày xác nhận</ToggleButton>
            </ToggleButtonGroup>

            {data && !summary.error ? (
              <>
                <TotalSummary
                  total={total}
                  unitLabel={unitLabel}
                  colors={colors}
                  stale={summary.stale}
                />

                {peakPoint && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      // Hết chỗ thì bỏ
                      display: { xs: 'none', xl: 'block' },
                      whiteSpace: 'nowrap',
                      opacity: summary.stale ? 0.55 : 1,
                    }}
                  >
                    Tồn nhiều nhất{' '}
                    <Box
                      component="strong"
                      sx={{ color: 'text.primary' }}
                    >
                      {formatDay(peakPoint.date)}
                    </Box>
                  </Typography>
                )}
              </>
            ) : !summary.error && (
              <Skeleton
                variant="rounded"
                width={320}
                height={20}
              />
            )}

            <ToggleButton
              size="small"
              value="table"
              selected={prefs.showTable}
              onChange={() => updatePrefs({ showTable: !prefs.showTable })}
              sx={{ ml: 'auto', gap: 0.5 }}
            >
              <TableRowsRoundedIcon sx={{ fontSize: 16 }} />
              Bảng
            </ToggleButton>
          </>
        ) : data ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              minWidth: 0,
              overflow: 'hidden',
              opacity: summary.stale ? 0.55 : 1,
            }}
          >
            {STAGES.map((item) => {
              const stageTotal = totalsByStage[item]

              return (
                <Box
                  key={item}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {item}
                  </Typography>

                  <Sparkline
                    points={pointsByStage[item]}
                    doneColor={colors.done}
                  />

                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, minWidth: 30 }}
                  >
                    {stageTotal.pct == null
                      ? `đã ${formatNumber(stageTotal.done)}`
                      : `${stageTotal.pct}%`}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        ) : (
          <Typography variant="caption" color="text.secondary" noWrap>
            Bấm để xem số liệu xác nhận theo từng ngày
          </Typography>
        )}
      </Box>

      <Collapse
        in={prefs.open}
        unmountOnExit
      >
        <Box
          id={contentId}
          sx={{
            px: 1.25,
            pt: 0.25,
            pb: 0.75,
          }}
        >
          {body}
        </Box>
      </Collapse>
    </GlassPanel>
  )
}


// =========================================================
// THANH TIẾN ĐỘ (nền cam nhạt, phần xanh = done/need)
// =========================================================

function ProgressBar({
  pct,
  width,
  height,
  colors,
}: {
  pct: number
  width: number | string
  height: number
  colors: StatsColors
}) {
  return (
    <Box
      aria-hidden
      sx={{
        width,
        height,
        flexShrink: 0,
        borderRadius: 999,
        overflow: 'hidden',
        bgcolor: colors.track,
      }}
    >
      <Box
        sx={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 999,
          bgcolor: colors.done,
        }}
      />
    </Box>
  )
}


// =========================================================
// SỐ TỔNG (hàng đầu)
// =========================================================

function TotalSummary({
  total,
  unitLabel,
  colors,
  stale,
}: {
  total: DailyPoint
  unitLabel: string
  colors: StatsColors
  stale: boolean
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        columnGap: 1,
        rowGap: 0.25,
        fontSize: 12.5,
        color: 'text.secondary',
        opacity: stale ? 0.55 : 1,
        '& strong': { fontWeight: 700 },
      }}
    >
      <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
        Đã xác nhận{' '}
        <Box component="strong" sx={{ color: colors.done }}>
          {formatNumber(total.done)}
        </Box>

        {/* CONFIRM: done có thể > need => không hiện phân số / % */}
        {total.pct != null && (
          <> / {formatNumber(total.need)}</>
        )}

        {' '}{unitLabel}
      </Box>

      {total.pct != null && (
        <>
          <ProgressBar
            pct={total.pct}
            width={120}
            height={8}
            colors={colors}
          />

          <Box
            component="strong"
            sx={{ color: 'text.primary' }}
          >
            {total.pct}%
          </Box>

          <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
            · Còn{' '}
            <Box component="strong" sx={{ color: colors.pendingText }}>
              {formatNumber(total.pending)}
            </Box>
            {' '}{unitLabel} cần xác nhận
          </Box>
        </>
      )}
    </Box>
  )
}


// =========================================================
// HÀNG Ô THEO NGÀY
// =========================================================

function DailyTiles({
  points,
  dateBy,
  colors,
  selectedDate,
  onSelect,
}: {
  points: DailyPoint[]
  dateBy: FacConfirmDailyDateBy
  colors: StatsColors
  selectedDate: string | null
  onSelect?: (date: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 30 ngày cuộn ngang => mặc định hiện các ngày gần nhất (bên phải)
  useEffect(() => {
    const element = scrollRef.current

    if (element) {
      element.scrollLeft = element.scrollWidth
    }
  }, [points.length])

  return (
    <Box
      ref={scrollRef}
      sx={{
        display: 'grid',
        gridTemplateColumns:
          `repeat(${points.length}, minmax(${TILE_MIN_WIDTH}px, 1fr))`,
        gap: `${TILE_GAP}px`,
        overflowX: 'auto',

        // Chừa chỗ cho viền ô đang chọn
        p: '2px',
        m: '-2px',
      }}
    >
      {points.map((point) => (
        <DayTile
          key={point.date}
          point={point}
          dateBy={dateBy}
          colors={colors}
          selected={point.date === selectedDate}
          onSelect={onSelect}
        />
      ))}
    </Box>
  )
}


function DayTile({
  point,
  dateBy,
  colors,
  selected,
  onSelect,
}: {
  point: DailyPoint
  dateBy: FacConfirmDailyDateBy
  colors: StatsColors
  selected: boolean
  onSelect?: (date: string) => void
}) {
  const day = dayjs(point.date)
  const dayLabel = formatDay(point.date)

  const confirmMode = dateBy === 'CONFIRM'
  const empty = !confirmMode && point.need === 0

  const ariaLabel = confirmMode
    ? `${dayLabel}: đã xác nhận ${point.done}`
    : empty
      ? `${dayLabel}: không có đơn`
      : `${dayLabel}: đã xác nhận ${point.done} trên ${point.need}, còn ${point.pending}`

  let content: ReactNode

  if (confirmMode) {
    content = (
      <Typography
        component="span"
        sx={{ fontSize: 13, color: 'text.secondary' }}
      >
        Đã XN{' '}
        <Box
          component="strong"
          sx={{ fontSize: 15, fontWeight: 700, color: colors.done }}
        >
          {formatNumber(point.done)}
        </Box>
      </Typography>
    )
  } else if (empty) {
    content = (
      <Typography
        component="span"
        sx={{ fontSize: 12, color: 'text.disabled' }}
      >
        Không có đơn
      </Typography>
    )
  } else {
    content = (
      <>
        <Typography
          component="span"
          sx={{
            fontSize: 12,
            lineHeight: '18px',
            color: 'text.secondary',
            whiteSpace: 'nowrap',
          }}
        >
          <Box
            component="strong"
            sx={{ fontSize: 15, fontWeight: 700, color: colors.done }}
          >
            {formatNumber(point.done)}
          </Box>
          /{formatNumber(point.need)}
        </Typography>

        <ProgressBar
          pct={point.pct ?? 0}
          width="100%"
          height={5}
          colors={colors}
        />

        <Typography
          component="span"
          sx={{
            fontSize: 11,
            lineHeight: '14px',
            whiteSpace: 'nowrap',
            color: point.pending > 0
              ? colors.pendingText
              : colors.finished,
          }}
        >
          {point.pending > 0
            ? `còn ${formatNumber(point.pending)}`
            : 'đã xong'}
        </Typography>
      </>
    )
  }

  const tileSx = {
    height: TILE_HEIGHT,
    minWidth: 0,
    px: 0.75,
    py: 0.5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    textAlign: 'left',
    border: 1,
    borderColor: 'divider',
    borderRadius: 1.5,
    bgcolor: empty ? colors.emptyTile : 'background.paper',

    // Viền 2px bằng box-shadow => không xô lệch kích thước ô
    boxShadow: selected
      ? `0 0 0 2px ${colors.done}`
      : 'none',
  } as const

  const children = (
    <>
      <Typography
        component="span"
        sx={{
          fontSize: 11,
          lineHeight: '14px',
          color: 'text.secondary',
          fontWeight: selected ? 600 : 400,
          whiteSpace: 'nowrap',
        }}
      >
        {WEEKDAY_LABEL[day.day()]} {dayLabel}
      </Typography>

      {content}
    </>
  )

  if (!onSelect) {
    return (
      <Box
        role="group"
        aria-label={ariaLabel}
        sx={tileSx}
      >
        {children}
      </Box>
    )
  }

  return (
    <ButtonBase
      aria-label={ariaLabel}
      aria-pressed={selected}
      onClick={() => onSelect(point.date)}
      sx={{
        ...tileSx,
        '&:hover': { borderColor: colors.done },
        '&.Mui-focusVisible': { boxShadow: `0 0 0 2px ${colors.done}` },
      }}
    >
      {children}
    </ButtonBase>
  )
}


// =========================================================
// SPARKLINE (thu gọn)
// =========================================================

function Sparkline({
  points,
  doneColor,
}: {
  points: DailyPoint[]
  doneColor: string
}) {
  const max = Math.max(0, ...points.map(stackOf))

  return (
    <Box
      aria-hidden
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '1px',
        width: Math.min(90, Math.max(points.length, 1) * 8),
        height: 16,
      }}
    >
      {points.map((point) => (
        <Box
          key={point.date}
          sx={{
            flex: '1 1 0',
            minHeight: 1,
            height: max > 0
              ? `${(stackOf(point) / max) * 100}%`
              : 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '1px',
            overflow: 'hidden',
            bgcolor: 'action.hover',
          }}
        >
          <Box sx={{ flexGrow: point.pending, bgcolor: '#f59e0b' }} />
          <Box sx={{ flexGrow: point.done, bgcolor: doneColor }} />
        </Box>
      ))}
    </Box>
  )
}


// =========================================================
// BẢNG CHI TIẾT (mới nhất lên đầu)
// =========================================================

function DailyTable({
  points,
  unitLabel,
  selectedDate,
  onSelect,
}: {
  points: DailyPoint[]
  unitLabel: string
  selectedDate: string | null
  onSelect?: (date: string) => void
}) {
  return (
    <Box
      sx={{
        height: TABLE_HEIGHT,
        overflow: 'auto',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Table
        size="small"
        stickyHeader
        sx={{
          '& .MuiTableCell-root': {
            py: 0.25,
            fontSize: 12,
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Ngày</TableCell>
            <TableCell align="right">Cần XN ({unitLabel})</TableCell>
            <TableCell align="right">Đã XN</TableCell>
            <TableCell align="right">Chưa XN</TableCell>
            <TableCell align="right">%</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {[...points].reverse().map((point) => (
            <TableRow
              key={point.date}
              hover={Boolean(onSelect)}
              selected={point.date === selectedDate}
              onClick={onSelect ? () => onSelect(point.date) : undefined}
              sx={{ cursor: onSelect ? 'pointer' : 'default' }}
            >
              <TableCell>{formatDay(point.date)}</TableCell>
              <TableCell align="right">{formatNumber(point.need)}</TableCell>
              <TableCell align="right">{formatNumber(point.done)}</TableCell>
              <TableCell align="right">{formatNumber(point.pending)}</TableCell>
              <TableCell align="right">
                {point.pct == null ? '—' : `${point.pct}%`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
