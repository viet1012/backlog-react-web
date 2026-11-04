import {
  Alert,
  Box,
  FormControl,
  GlobalStyles,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import type { PaletteMode } from '@mui/material'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import dayjs from 'dayjs'
import { useState } from 'react'
import { AppButton } from '../components/common/AppButton'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { CostChartLegend } from '../components/costMonitoring/CostChartLegend'
import { CostMonitoringGrid } from '../components/costMonitoring/CostMonitoringGrid'
import { CostMonitoringGuideDrawer } from '../components/costMonitoring/CostMonitoringGuideDrawer'
import { SIMU_WEEK_OPTIONS } from '../components/costMonitoring/costChartConfig'
import { SIMU_WEEK_HINT, type GuideTabId } from '../components/costMonitoring/costMonitoringGuide'
import { useCostMonitoring } from '../hooks/useCostMonitoring'
import { toApiMonth } from '../services/costMonitoringService'
import type { CostSimuWeek } from '../types/costMonitoring'
import { uiTokens } from '../theme/uiTokens'
import { loadPreference, savePreference } from '../utils/uiPreferences'

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

interface CostMonitoringPageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

export function CostMonitoringPage({
  mode,
  onToggleMode,
}: CostMonitoringPageProps) {
  const {
    months,
    month,
    setMonth,
    simuWeek,
    setSimuWeek,
    data,
    loading,
    error,
    lastUpdated,
    refresh,
  } = useCostMonitoring()

  const [guideOpen, setGuideOpen] =
    useState(() => loadPreference(GUIDE_SEEN_KEY) !== true)

  const [guideTab, setGuideTab] =
    useState<GuideTabId>('quick')

  function closeGuide() {
    setGuideOpen(false)
    savePreference(GUIDE_SEEN_KEY, true)
  }

  const noMonths = !loading && !error && months.length === 0

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
          title="COST MONITORING (Unit: K$)"
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
                  <InputLabel>Tháng</InputLabel>

                  <Select
                    label="Tháng"
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

                <Tooltip title={SIMU_WEEK_HINT} arrow placement="bottom" enterTouchDelay={0}>
                  <FormControl size="small" sx={{ width: 175, flexShrink: 0 }}>
                    {/* Mới nhất = '' → cần shrink/notched để nhãn không đè lên chữ của option */}
                    <InputLabel shrink>PL TGT theo</InputLabel>

                    <Select<CostSimuWeek>
                      label="PL TGT theo"
                      value={simuWeek}
                      displayEmpty
                      notched
                      onChange={(event) => setSimuWeek(event.target.value)}
                    >
                      {SIMU_WEEK_OPTIONS.map((option) => (
                        <MenuItem key={option.label} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Tooltip>
              </Stack>

              <RefreshButton
                loading={loading}
                onClick={refresh}
              />

              <AppButton
                variant="outlined"
                compact
                icon={<HelpOutlineRoundedIcon fontSize="small" />}
                onClick={() => setGuideOpen(true)}
                sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
              >
                Hướng dẫn
              </AppButton>
            </Box>
          }
          bottom={
            <>
              {/* chỉ hiện khi in: dropdown tháng bị ẩn nên ghi rõ tháng + thời điểm cập nhật */}
              <Typography className="cost-print-only" sx={{ fontSize: 12, mb: 0.5, pl: 1 }}>
                Tháng {month ?? '–'} · Cập nhật {lastUpdated ? dayjs(lastUpdated).format('DD/MM/YYYY HH:mm') : '–'}
              </Typography>

              <CostChartLegend />
            </>
          }
          mode={mode}
          onToggleMode={onToggleMode}
        />

        {error && (
          <Alert severity="error" className="cost-no-print" sx={{ flexShrink: 0 }}>
            {error}
          </Alert>
        )}

        {noMonths ? (
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
            <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
              No Cost Monitoring data
            </Typography>
          </Box>
        ) : (
          <CostMonitoringGrid
            // ưu tiên tháng của data đang hiển thị để trục X khớp số liệu khi đang tải tháng mới
            month={data ? toApiMonth(data.month) : month && toApiMonth(month)}
            data={data}
            loading={loading}
          />
        )}
      </Box>

      <CostMonitoringGuideDrawer
        open={guideOpen}
        tab={guideTab}
        onTabChange={setGuideTab}
        onClose={closeGuide}
      />
    </PageShell>
  )
}
