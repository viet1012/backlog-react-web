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
import dayjs from 'dayjs'
import { useState } from 'react'
import { FactoryNoRowsOverlay } from '../components/common/FactoryNoRowsOverlay'
import { GuideButton } from '../components/common/GuideButton'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { CostChartLegend } from '../components/costMonitoring/CostChartLegend'
import { CostMonitoringGrid } from '../components/costMonitoring/CostMonitoringGrid'
import { CostMonitoringGuideDrawer } from '../components/costMonitoring/CostMonitoringGuideDrawer'
import { CostDetailDrawer } from '../components/costMonitoring/CostDetailDrawer'
import { CostForecastBanner } from '../components/costMonitoring/CostForecastBanner'
import { COST_ROWS, SIMU_WEEK_OPTIONS } from '../components/costMonitoring/costChartConfig'
import type { GuideTabId } from '../components/costMonitoring/costMonitoringGuide'
import { useMascotMonthControl, useMascotOpenChat, useMascotParams } from '../components/mascot'
import { useCostMonitoring, useCostMonitoringDetail } from '../hooks/useCostMonitoring'
import { toApiMonth } from '../services/costMonitoringService'
import type { CostDetailTarget, CostSimuWeek } from '../types/costMonitoring'
import { uiTokens } from '../theme/uiTokens'
import { loadPreference, savePreference } from '../utils/uiPreferences'
import { useI18n } from '../i18n/useI18n'

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

  const {
    months,
    month,
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
  } = useCostMonitoring()

  // Drawer chi tiết 1 khung; giữ target khi đóng để nội dung không mất trong lúc trượt ra
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState<CostDetailTarget | null>(null)

  const detail = useCostMonitoringDetail(month, detailTarget, simuWeek, refreshKey, detailOpen)

  const detailLabel = detailTarget
    ? `${COST_ROWS.find((r) => r.div === detailTarget.div)?.label ?? detailTarget.div} · ${detailTarget.chart}`
    : ''

  const openMascotChat = useMascotOpenChat()

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
          status={
            <UpdatedStatus
              updatedAt={lastUpdated}
              error={Boolean(error)}
            />
          }
          actions={
            // display: contents – không đổi bố cục của PageHeader, chỉ để ẩn khi in
            <Box className="cost-no-print" sx={{ display: 'contents' }}>
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

              <RefreshButton
                loading={loading}
                onClick={refresh}
              />

              <GuideButton onClick={() => setGuideOpen(true)} />
            </Box>
          }
          bottom={
            <>
              {/* chỉ hiện khi in: dropdown tháng bị ẩn nên ghi rõ tháng + thời điểm cập nhật */}
              <Typography className="cost-print-only" sx={{ fontSize: 12, mb: 0.5, pl: 1 }}>
                {t.cost.printLine(month ?? '–', lastUpdated ? dayjs(lastUpdated).format('DD/MM/YYYY HH:mm') : '–')}
              </Typography>

              <CostChartLegend
                plUnavailable={noPlWeeks}
                estVisible={estVisible}
                onToggleEst={() => setEstVisible((v) => !v)}
              />
            </>
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

        {data && (
          <CostForecastBanner
            month={toApiMonth(data.month)}
            charts={data.charts}
            onOpenDetail={(target) => {
              setDetailTarget(target)
              setDetailOpen(true)
            }}
          />
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
        ) : (
          <CostMonitoringGrid
            // ưu tiên tháng của data đang hiển thị để trục X khớp số liệu khi đang tải tháng mới
            month={data ? toApiMonth(data.month) : month && toApiMonth(month)}
            data={data}
            loading={loading}
            estVisible={estVisible}
            onOpenDetail={(target) => {
              setDetailTarget(target)
              setDetailOpen(true)
            }}
          />
        )}
      </Box>

      <CostDetailDrawer
        open={detailOpen}
        frameLabel={detailLabel}
        month={month}
        target={detailTarget}
        simuWeek={simuWeek}
        data={detail.data}
        // dự báo chính / trạng thái lấy từ /chart (detail không có)
        forecast={
          detailTarget
            ? data?.charts.find((c) => c.div === detailTarget.div && c.chart === detailTarget.chart)?.forecast ?? null
            : null
        }
        loading={detail.loading}
        error={detail.error}
        onClose={() => setDetailOpen(false)}
        onAskMascot={openMascotChat}
      />

      <CostMonitoringGuideDrawer
        open={guideOpen}
        tab={guideTab}
        onTabChange={setGuideTab}
        onClose={closeGuide}
      />
    </PageShell>
  )
}
