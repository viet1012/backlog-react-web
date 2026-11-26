import {
  Alert,
  Box,
  Chip,
  Divider,
  FormControl,
  GlobalStyles,
  InputLabel,
  ListItemText,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { CostOtImportDialog } from '../../components/costMonitoring/CostOtImportDialog'
import { usePerm } from '../../components/auth/useAuth'
import { ACTION, PERM } from '../../routes/appPages'
import { FactoryNoRowsOverlay } from '../../components/common/FactoryNoRowsOverlay'
import { HeaderAction, HeaderActionBar, HeaderActionDivider } from '../../components/common/headerActions'
import { notify } from '../../components/common/notify'
import { PageHeader } from '../../components/common/PageHeader'
import { PageShell } from '../../components/common/PageShell'
import { UpdatedStatus } from '../../components/common/UpdatedStatus'
import { CostChartLegend } from '../../components/costMonitoring/CostChartLegend'
import { CostMonitoringGrid } from '../../components/costMonitoring/CostMonitoringGrid'
import { CostMonitoringGuideDrawer } from '../../components/costMonitoring/CostMonitoringGuideDrawer'
import { CostDetailFocusView } from '../../components/costMonitoring/CostDetailFocusView'
import { COST_ROWS, SIMU_WEEK_OPTIONS } from '../../components/costMonitoring/costChartConfig'
import type { GuideTabId } from '../../components/costMonitoring/costMonitoringGuide'
import { useMascotMonthControl, useMascotParams } from '../../components/mascot'
import { prefetchCostDetail, useCostMonitoring, useCostMonitoringDetail } from '../../hooks/useCostMonitoring'
import { usePageReadyMetric } from '../../hooks/usePageReadyMetric'
import { readUrlParams, useUrlFilters } from '../../hooks/useUrlFilters'
import {
  COST_PATH,
  COST_URL_PARAMS,
  frameFromSlug,
  frameSlug,
  type CostUrlState,
} from '../../components/costMonitoring/costUrlParams'
import { toApiMonth } from '../../services/costMonitoringService'
import type { CostDetailTarget, CostSimuWeek } from '../../types/costMonitoring'
import { uiTokens } from '../../theme/uiTokens'
import { loadPreference, savePreference } from '../../utils/uiPreferences'
import { useI18n } from '../../i18n/useI18n'

// Cờ đã xem hướng dẫn – lần đầu vào trang tự mở tab "Bắt đầu nhanh"
const GUIDE_SEEN_KEY = 'costMonitoringGuideSeen'

// In / xuất báo cáo: chỉ in vùng .cost-print-root (ẩn sidebar, drawer…), A4 ngang,
// ẩn controls (.cost-no-print + các nút trong header), giữ nguyên màu các đường
const printStyles = (
  <GlobalStyles
    styles={{
      '@page': { size: 'A4 landscape', margin: '8mm' },
      '.cost-print-only': { display: 'none' },
      '@media print': {
        'html, body': { height: 'auto !important', overflow: 'visible !important' },
        'body *': { visibility: 'hidden' },
        '.cost-print-root, .cost-print-root *': {
          visibility: 'visible',
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
        },
        '.cost-print-root': {
          position: 'absolute',
          inset: '0 0 auto 0',
          height: 'auto !important',
          overflow: 'visible !important',
        },
        '.cost-no-print, .cost-print-root header .MuiButtonBase-root': { display: 'none !important' },
        '.cost-print-only': { display: 'block' },
      },
    }}
  />
)

// "Simu_W2" -> 2
function weekNumber(simuWeek: string) {
  return Number(simuWeek.slice(-1))
}

interface CostMonitoringPageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

export function CostMonitoringPage({
  mode,
  onToggleMode,
}: CostMonitoringPageProps) {
  const { t } = useI18n()

  // Link / F5: ?month=&week=&frame= (costUrlParams.ts)
  const [fromUrl] = useState(() => readUrlParams(COST_PATH, COST_URL_PARAMS))

  const {
    months,
    month,
    requestedMonth,
    setMonth,
    simuWeek,
    setSimuWeek,
    plWeeks,
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    refreshKey,
    reloadData,
    dataVersion,
  } = useCostMonitoring({ month: fromUrl.month || null, simuWeek: fromUrl.week })

  // đo hiệu năng (chỉ khi bật): mở trang → chart tháng đang chọn hiện ra
  usePageReadyMetric('cost', !loading && data != null)

  // Chế độ focus (chi tiết 1 khung); giữ target khi đóng để mở lại nhanh
  const [detailOpen, setDetailOpen] = useState(() => frameFromSlug(fromUrl.frame) !== null)
  const [detailTarget, setDetailTarget] = useState<CostDetailTarget | null>(() => frameFromSlug(fromUrl.frame))

  // Trạng thái trang ⇄ URL: gửi link là mở đúng tháng / tuần / khung đang xem, F5 không mất
  useUrlFilters<CostUrlState>({
    path: COST_PATH,
    params: COST_URL_PARAMS,
    values: {
      // tháng thật sự đang hiện; lúc danh sách tháng chưa về thì giữ tháng của link
      month: month ?? requestedMonth ?? '',
      week: simuWeek,
      frame: detailOpen && detailTarget ? frameSlug(detailTarget) : '',
    },
    onUrlChange: (next) => {
      setMonth(next.month || null)
      setSimuWeek(next.week)

      const target = frameFromSlug(next.frame)
      if (target) setDetailTarget(target)
      setDetailOpen(target !== null)
    },
  })

  // Link cũ: tháng trong link không còn dữ liệu → báo 1 lần, xem tháng mới nhất
  useEffect(() => {
    if (!requestedMonth || months.length === 0 || months.includes(requestedMonth)) return

    notify.warning(t.cost.linkMonthMissing(requestedMonth, months[0]), { key: 'cost-link-month' })
    // oxlint-disable-next-line react/set-state-in-effect
    setMonth(null)
  }, [requestedMonth, months, setMonth, t])

  const detail = useCostMonitoringDetail(month, detailTarget, simuWeek, refreshKey, detailOpen, dataVersion)

  // Nạp Actual OT – nút chỉ hiện khi có COST_MONITORING X (BE vẫn kiểm quyền, 403 hiện trong dialog)
  const canImportOt = usePerm(PERM.COST_MONITORING, ACTION.EXPORT)
  const [otImportOpen, setOtImportOpen] = useState(false)

  const detailLabel = detailTarget
    ? `${COST_ROWS.find((r) => r.div === detailTarget.div)?.label ?? detailTarget.div} · ${detailTarget.chart}`
    : ''

  // ưu tiên tháng của data đang hiển thị để trục X khớp số liệu khi đang tải tháng mới
  const chartMonth = data ? toApiMonth(data.month) : month && toApiMonth(month)

  const closeDetail = useCallback(() => setDetailOpen(false), [])

  // rê chuột lên khung → tải sẵn detail; bấm vào thì thường đã có trong cache
  const prefetchDetail = (target: CostDetailTarget) =>
    prefetchCostDetail(month, target, simuWeek, dataVersion)

  // context cho chat của mascot: tháng + tuần PL TGT đang chọn
  // + khung đang mở drawer (factory = xưởng, category = hạng mục) để hỏi đúng khung
  useMascotParams({
    month: month ? toApiMonth(month) : null,
    // "Mới nhất" ('') → không gửi key simuWeek
    ...(simuWeek ? { simuWeek } : {}),
    ...(detailOpen && detailTarget ? { factory: detailTarget.div, category: detailTarget.chart } : {}),
  })

  // nút "Xem tháng … trên màn hình" của mascot; tháng dạng "YYYY.MM" như danh sách months
  useMascotMonthControl({
    months,
    select: (m) => {
      if (months.includes(m)) setMonth(m)
    },
  })

  // bật/tắt đường Estimate (MTD) trên cả 9 chart từ legend
  const [estVisible, setEstVisible] = useState(true)

  const [guideOpen, setGuideOpen] =
    useState(() => loadPreference(GUIDE_SEEN_KEY) !== true)

  const [guideTab, setGuideTab] =
    useState<GuideTabId>('quick')

  function closeGuide() {
    setGuideOpen(false)
    savePreference(GUIDE_SEEN_KEY, true)
  }

  // Tooltip "PL TGT theo" ẩn khi menu đang mở (không đè lên danh sách tuần)
  const [simuTipHover, setSimuTipHover] = useState(false)
  const [simuMenuOpen, setSimuMenuOpen] = useState(false)

  // null khi chưa tải / lỗi danh sách tuần
  const latestWeek = plWeeks?.latestWeek ?? null
  const noPlWeeks = plWeeks !== null && plWeeks.weeks.length === 0

  const noMonths = !loading && !error && months.length === 0
  const apiFailed = !loading && Boolean(error) && !data

  return (
    <PageShell>
      {printStyles}

      <Box
        className="cost-print-root"
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: uiTokens.page.gap,
        }}
      >
        <PageHeader
          title={t.cost.title}
          subtitle={t.cost.subtitle}
          status={
            <UpdatedStatus
              updatedAt={lastUpdated}
              error={Boolean(error)}
            />
          }
          actions={
            // cost-no-print: ẩn cả thanh khi in
            <HeaderActionBar className="cost-no-print">
              {/* Vùng actions của PageHeader có overflowX:auto nên nhãn nổi của
                  FormControl outlined (nằm trên viền ~9px) bị cắt → chừa padding trên/dưới */}
              <Stack
                direction="row"
                sx={{ alignItems: 'center', gap: { xs: 0.5, sm: 1 }, py: '8px', flexShrink: 0 }}
              >
                <FormControl size="small" sx={{ width: 110, flexShrink: 0 }}>
                  <InputLabel>{t.cost.month}</InputLabel>

                  <Select
                    label={t.cost.month}
                    value={month ?? ''}
                    disabled={months.length === 0}
                    onChange={(event) => setMonth(event.target.value)}
                  >
                    {months.map((m) => (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Tooltip
                  title={t.costGuide.hints.simuWeek}
                  arrow
                  placement="top"
                  enterTouchDelay={0}
                  open={simuTipHover && !simuMenuOpen}
                  onOpen={() => setSimuTipHover(true)}
                  onClose={() => setSimuTipHover(false)}
                >
                  <FormControl size="small" sx={{ width: 175, flexShrink: 0 }}>
                    {/* Mới nhất = '' → cần shrink/notched để nhãn không đè lên chữ của option */}
                    <InputLabel shrink>{t.cost.plTgtBy}</InputLabel>

                    <Select<CostSimuWeek>
                      label={t.cost.plTgtBy}
                      value={simuWeek}
                      displayEmpty
                      notched
                      onChange={(event) => setSimuWeek(event.target.value)}
                      onOpen={() => setSimuMenuOpen(true)}
                      onClose={() => setSimuMenuOpen(false)}
                      // ô đóng: gọn 1 dòng "Mới nhất (Tuần 4)" / "Tuần 2"
                      renderValue={(value) => {
                        if (value) return t.cost.week(weekNumber(value))
                        return latestWeek
                          ? t.cost.latestWeek(weekNumber(latestWeek))
                          : t.cost.latestAuto
                      }}
                      MenuProps={{ slotProps: { paper: { sx: { minWidth: 210 } } } }}
                    >
                      {/* tháng không có tuần nào → chỉ báo, không chọn được */}
                      {noPlWeeks && (
                        <ListSubheader
                          sx={{ fontSize: 12, lineHeight: '28px', color: 'text.secondary' }}
                        >
                          {t.cost.noPlSimulation}
                        </ListSubheader>
                      )}

                      <MenuItem value="" disabled={noPlWeeks}>
                        <ListItemText
                          primary={t.cost.latestAuto}
                          secondary={latestWeek ? t.cost.usingWeek(weekNumber(latestWeek)) : undefined}
                          slotProps={{
                            primary: { sx: { fontSize: 14 } },
                            secondary: { sx: { fontSize: 11.5 } },
                          }}
                          sx={{ my: 0 }}
                        />
                      </MenuItem>

                      <Divider />

                      {SIMU_WEEK_OPTIONS.filter((option) => option.value).map((option) => {
                        const week = option.value
                        // chưa tải được danh sách tuần → không khóa tuần nào
                        const unavailable = plWeeks !== null && !(plWeeks.weeks as string[]).includes(week)
                        const isLatest = week === latestWeek

                        return (
                          <MenuItem
                            key={week}
                            value={week}
                            disabled={unavailable}
                            sx={{ display: 'flex', gap: 1 }}
                          >
                            <Box sx={{ flex: 1 }}>{t.cost.week(weekNumber(week))}</Box>

                            {isLatest && (
                              <Chip
                                label={t.cost.latestChip}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 18, fontSize: 10.5, '& .MuiChip-label': { px: 0.75 } }}
                              />
                            )}

                            {unavailable && (
                              <Typography component="span" sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                                {t.cost.weekUnavailable}
                              </Typography>
                            )}
                          </MenuItem>
                        )
                      })}
                    </Select>
                  </FormControl>
                </Tooltip>
              </Stack>

              <HeaderActionDivider />

              {canImportOt && (
                <HeaderAction
                  kind="import"
                  label={t.costOt.button}
                  description={t.costOt.buttonTip}
                  disabled={!month}
                  onClick={() => setOtImportOpen(true)}
                />
              )}

              {canImportOt && <HeaderActionDivider />}

              <HeaderAction kind="refresh" loading={loading} onClick={refresh} />
              <HeaderAction kind="guide" onClick={() => setGuideOpen(true)} />
            </HeaderActionBar>
          }
          mode={mode}
          onToggleMode={onToggleMode}
        />

        {/* Còn chart cũ thì chỉ báo trên thanh; không có gì để hiện thì 1 cảnh lỗi (không phải 9 ô "Chưa có dữ liệu") */}
        {error && data && (
          <Alert severity="error" className="cost-no-print" sx={{ flexShrink: 0 }}>
            {error}
          </Alert>
        )}

        {/* Chú thích chung của 9 chart: ngay trên lưới chart (gần nơi đọc),
            không nằm trong header. Trạng thái vượt/OK đã có badge trên từng ô. */}
        {!apiFailed && !noMonths && (
          <Box
            sx={(theme) => ({
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              columnGap: 2,
              rowGap: 0.5,
              px: 1.25,
              py: 0.6,
              borderRadius: '10px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.4 : 0.7),
            })}
          >
            {/* chỉ hiện khi in: dropdown tháng bị ẩn nên ghi rõ tháng + thời điểm cập nhật */}
            <Typography className="cost-print-only" sx={{ fontSize: 12, width: '100%' }}>
              {t.cost.printLine(month ?? '–', lastUpdated ? dayjs(lastUpdated).format('DD/MM/YYYY HH:mm') : '–')}
            </Typography>

            <CostChartLegend
              plUnavailable={noPlWeeks}
              estVisible={estVisible}
              onToggleEst={() => setEstVisible((v) => !v)}
            />
          </Box>
        )}

        {apiFailed ? (
          <Box
            sx={(theme) => ({
              flex: 1,
              minHeight: 0,
              display: 'grid',
              placeItems: 'center',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1.5,
              bgcolor: theme.palette.background.paper,
            })}
          >
            <FactoryNoRowsOverlay tone="error" detail={error} onRetry={refresh} />
          </Box>
        ) : noMonths ? (
          <Box
            sx={(theme) => ({
              minHeight: 120,
              display: 'grid',
              placeItems: 'center',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1.5,
              bgcolor: theme.palette.background.paper,
            })}
          >
            <FactoryNoRowsOverlay title={t.cost.noData} />
          </Box>
        ) : detailOpen && detailTarget ? (
          // Chế độ focus: thay lưới 9 chart bằng khung cha (trái) + chi tiết con (phải)
          <CostDetailFocusView
            frameLabel={detailLabel}
            month={month}
            chartMonth={chartMonth}
            target={detailTarget}
            charts={data?.charts ?? []}
            chartsLoading={loading}
            estVisible={estVisible}
            data={detail.data}
            // dự báo chính / trạng thái lấy từ /chart (detail không có)
            forecast={
              data?.charts.find((c) => c.div === detailTarget.div && c.chart === detailTarget.chart)?.forecast ?? null
            }
            loading={detail.loading}
            error={detail.error}
            onSelectTarget={setDetailTarget}
            onPrefetchTarget={prefetchDetail}
            // lỗi tải chi tiết: "Thử lại" = nút ↻ (tải lại chart + chi tiết khung đang xem)
            onRetry={refresh}
            onClose={closeDetail}
          />
        ) : (
          <CostMonitoringGrid
            month={chartMonth}
            data={data}
            loading={loading}
            estVisible={estVisible}
            onOpenDetail={(target) => {
              setDetailTarget(target)
              setDetailOpen(true)
            }}
            onPrefetchDetail={prefetchDetail}
          />
        )}
      </Box>

      <CostMonitoringGuideDrawer
        open={guideOpen}
        tab={guideTab}
        onTabChange={setGuideTab}
        onClose={closeGuide}
      />

      {canImportOt && (
        <CostOtImportDialog
          open={otImportOpen}
          month={month}
          onClose={() => setOtImportOpen(false)}
          onImported={(result) => {
            setOtImportOpen(false)
            notify.success(t.costOt.success(result.rowsWritten))
            // BE đã xóa cache → gọi /chart như bình thường (không refresh=true);
            // trạng thái OT tải lại ở lần mở dialog sau
            reloadData()
          }}
        />
      )}
    </PageShell>
  )
}
