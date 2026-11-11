import CheckroomRoundedIcon from '@mui/icons-material/CheckroomRounded'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Tab,
  Tabs,
} from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { Suspense, lazy, startTransition, useState } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { AiLogDetailDrawer } from '../components/aiLogs/AiLogDetailDrawer'
import { AiLogsDailyChart } from '../components/aiLogs/AiLogsDailyChart'
import { AiLogsFilterBar } from '../components/aiLogs/AiLogsFilterBar'
import { AiLogsKpi } from '../components/aiLogs/AiLogsKpi'
import { AiLogsTable } from '../components/aiLogs/AiLogsTable'
import {
  AI_LOGS_PAGE_SIZES,
  TABULAR_NUMS,
  defaultFilters,
  isValidScreenKey,
} from '../components/aiLogs/aiLogsUtils'
import { ASSISTANT_SCREENS, getScreenNameByKey } from '../components/mascot/mascotMessages'
import { useAiLogDetail, useAiLogList, useAiLogStats } from '../hooks/useAssistantLogs'
import { exportAiLogsExcel } from '../services/assistantLogService'
import type { AiLogFilters, AiLogListQuery, AiLogScreenStat } from '../types/assistantLogs'
import { uiTokens } from '../theme/uiTokens'
import { useI18n } from '../i18n/useI18n'
import { loadPreference, savePreference } from '../utils/uiPreferences'

// Tab Bộ test (kèm các file JSON bộ test) và Phòng thay đồ tách chunk riêng:
// vào trang AI Logs chỉ tải tab Logs, bấm tab nào mới tải tab đó
const AiTestSuitePanel = lazy(() => import('../components/aiLogs/AiTestSuitePanel').then((m) => ({ default: m.AiTestSuitePanel })))
const AiWardrobePanel = lazy(() => import('../components/aiLogs/AiWardrobePanel').then((m) => ({ default: m.AiWardrobePanel })))

function TabLoading() {
  return (
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6 }}>
      <CircularProgress size={28} />
    </Box>
  )
}

interface AiLogsPageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

const DEFAULT_QUERY: AiLogListQuery = {
  page: 0,
  // 50 = mặc định BE
  size: AI_LOGS_PAGE_SIZES[1],
  sort: 'timestamp',
  order: 'desc',
}

type AiLogsTab = 'logs' | 'tests' | 'wardrobe'

// localStorage: tab con màn hình của tab Logs
const SCREEN_PREF_KEY = 'ai-logs:logs-screen'

function loadScreenKey(): string {
  const stored = loadPreference(SCREEN_PREF_KEY)
  return isValidScreenKey(stored) ? stored : ''
}

interface ScreenTabsProps {
  // '' = Tất cả
  value: string
  // BE có thể chưa trả byScreen → chỉ dùng để hiện số đếm / screenKey lạ
  byScreen: AiLogScreenStat[] | undefined
  onChange: (screenKey: string) => void
}

// Gộp các screenKey chưa khai báo trong ASSISTANT_SCREENS vào danh sách đã biết (giữ thứ tự xuất hiện)
function extraKeysOf(byScreen: AiLogScreenStat[] | undefined, known: string[]): string[] {
  if (!Array.isArray(byScreen)) return known
  const registered = new Set(ASSISTANT_SCREENS.map((s) => s.screenKey))
  const next = [...known]
  for (const s of byScreen) {
    if (s.screenKey && !registered.has(s.screenKey) && !next.includes(s.screenKey)) next.push(s.screenKey)
  }
  return next
}

// Hàng tab con theo màn hình – dạng "viên thuốc" nhỏ, nhạt hơn hàng tab chính
function ScreenTabs({ value, byScreen, onChange }: ScreenTabsProps) {
  const { t } = useI18n()

  const stats = Array.isArray(byScreen) ? byScreen : []
  const counts = new Map<string, number>()
  for (const s of stats) {
    if (s.screenKey) counts.set(s.screenKey, (counts.get(s.screenKey) ?? 0) + s.count)
  }

  // Nhớ các screenKey lạ đã từng thấy: khi BE lọc theo 1 màn hình, byScreen chỉ còn màn hình đó
  // → không để các tab lạ khác biến mất / hàng tab nhảy. So sánh với giá trị trước ngay trong render.
  const [prevByScreen, setPrevByScreen] = useState(byScreen)
  const [knownExtraKeys, setKnownExtraKeys] = useState<string[]>(() => extraKeysOf(byScreen, []))
  if (byScreen !== prevByScreen) {
    setPrevByScreen(byScreen)
    const merged = extraKeysOf(byScreen, knownExtraKeys)
    if (merged.length !== knownExtraKeys.length) setKnownExtraKeys(merged)
  }

  // màn hình đã khai báo + screenKey lạ đã thấy + tab đang chọn (giữ value của Tabs luôn hợp lệ)
  const keys = ASSISTANT_SCREENS.map((s) => s.screenKey)
  for (const key of [...knownExtraKeys, ...counts.keys(), value]) {
    if (key && !keys.includes(key)) keys.push(key)
  }

  // tổng chỉ đúng khi đang xem "Tất cả" (BE lọc theo screenKey thì byScreen chỉ còn 1 màn hình)
  const allCount = value === '' && stats.length > 0
    ? stats.reduce((sum, s) => sum + s.count, 0)
    : undefined

  function label(text: string, count: number | undefined) {
    return (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
        {text}
        {count !== undefined && (
          <Box
            component="span"
            sx={{
              ...TABULAR_NUMS,
              px: 0.625,
              minWidth: 18,
              borderRadius: 999,
              fontSize: 10.5,
              fontWeight: 700,
              lineHeight: '16px',
              textAlign: 'center',
              bgcolor: 'action.selected',
            }}
          >
            {count.toLocaleString('en-US')}
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Tabs
      value={value}
      onChange={(_, next: string) => onChange(next)}
      variant="scrollable"
      scrollButtons="auto"
      aria-label={t.aiLogs.screenTabs.ariaLabel}
      sx={(theme) => ({
        mt: 0.75,
        minHeight: 32,
        '& .MuiTabs-indicator': { display: 'none' },
        '& .MuiTabs-list': { gap: 0.75, alignItems: 'center', height: 32 },
        '& .MuiTabs-scrollButtons': { width: 28 },
        '& .MuiTab-root': {
          minHeight: 26,
          minWidth: 0,
          px: 1.25,
          py: 0.25,
          borderRadius: 999,
          border: 1,
          borderColor: 'divider',
          textTransform: 'none',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'text.secondary',
          transition: 'background-color 120ms, border-color 120ms',
          '&:hover': { bgcolor: 'action.hover' },
        },
        '& .MuiTab-root.Mui-selected': {
          color: 'primary.main',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          borderColor: alpha(theme.palette.primary.main, 0.45),
        },
      })}
    >
      <Tab value="" label={label(t.aiLogs.screenTabs.all, allCount)} />
      {keys.map((key) => (
        <Tab
          key={key}
          value={key}
          title={key}
          label={label(getScreenNameByKey(key, t), counts.get(key))}
        />
      ))}
    </Tabs>
  )
}

export function AiLogsPage({ mode, onToggleMode }: AiLogsPageProps) {
  const { t } = useI18n()

  const [tab, setTab] = useState<AiLogsTab>('logs')
  // Tab nặng chỉ dựng khi mở lần đầu (vào trang nhanh hơn), mở rồi thì giữ mounted
  const [visited, setVisited] = useState<ReadonlySet<AiLogsTab>>(() => new Set(['logs']))

  function changeTab(next: AiLogsTab) {
    setTab(next)
    // dựng tab nặng ở chế độ transition → tab được chọn đổi màu ngay, nội dung vẽ sau
    startTransition(() => {
      setVisited((prev) => (prev.has(next) ? prev : new Set(prev).add(next)))
    })
  }

  // tab con màn hình được nhớ qua lần tải lại → khởi tạo cùng bộ lọc
  const [filters, setFilters] = useState<AiLogFilters>(() => ({
    ...defaultFilters(),
    screenKey: loadScreenKey(),
  }))
  const [query, setQuery] = useState<AiLogListQuery>(DEFAULT_QUERY)
  const [refreshKey, setRefreshKey] = useState(0)

  const list = useAiLogList(filters, query, refreshKey)
  const stats = useAiLogStats(filters, refreshKey)

  // giữ rid khi đóng để nội dung không mất trong lúc drawer trượt ra
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRid, setDetailRid] = useState<string | null>(null)
  const detail = useAiLogDetail(detailRid)

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // đổi bộ lọc → về trang đầu
  function changeFilters(next: AiLogFilters) {
    setFilters(next)
    setQuery((prev) => ({ ...prev, page: 0 }))
  }

  function changeScreen(screenKey: string) {
    savePreference(SCREEN_PREF_KEY, screenKey)
    changeFilters({ ...filters, screenKey })
  }

  async function handleExport() {
    setExporting(true)
    setExportError(null)

    try {
      await exportAiLogsExcel(filters, query)
    } catch (err) {
      setExportError(`${t.aiLogs.exportFailed}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setExporting(false)
    }
  }

  const loading = list.loading || stats.loading
  const error = list.error ?? stats.error
  const total = list.data?.totalElements ?? 0
  const rows = list.data?.content ?? []

  // BE chưa hỗ trợ tham số screenKey → trả cả log màn hình khác.
  // Chỉ xét khi đã tải xong và không lỗi (lúc đó data khớp bộ lọc hiện tại).
  const screenFilterIgnored =
    filters.screenKey !== ''
    && !list.loading
    && !list.error
    && rows.some((row) => row.screenKey !== filters.screenKey)

  return (
    <PageShell>
      <PageHeader
        title={t.aiLogs.title}
        status={
          <UpdatedStatus
            updatedAt={list.updatedAt == null ? null : new Date(list.updatedAt)}
            error={Boolean(error)}
          />
        }
        actions={tab === 'logs' && (
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={14} /> : <FileDownloadOutlinedIcon />}
              disabled={exporting || total === 0}
              onClick={() => void handleExport()}
              sx={{ textTransform: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              {t.aiLogs.exportExcel}
            </Button>

            <RefreshButton
              loading={loading}
              onClick={() => setRefreshKey((k) => k + 1)}
            />
          </>
        )}
        bottom={
          <>
            <Tabs
              value={tab}
              onChange={(_, next: AiLogsTab) => changeTab(next)}
              sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontWeight: 700 } }}
            >
              <Tab value="logs" label={t.aiLogs.tabs.logs} />
              <Tab value="tests" label={t.aiLogs.tabs.tests} />
              <Tab
                value="wardrobe"
                icon={<CheckroomRoundedIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={t.aiLogs.tabs.wardrobe}
              />
            </Tabs>

            {tab === 'logs' && (
              <>
                <ScreenTabs
                  value={filters.screenKey}
                  byScreen={stats.data?.byScreen}
                  onChange={changeScreen}
                />

                {/* "Đặt lại" giữ nguyên tab màn hình đang chọn */}
                <AiLogsFilterBar
                  value={filters}
                  onChange={changeFilters}
                  onReset={() => changeFilters({ ...defaultFilters(), screenKey: filters.screenKey })}
                />
              </>
            )}
          </>
        }
        mode={mode}
        onToggleMode={onToggleMode}
      />

      {tab === 'logs' && error && (
        <Alert severity="error" sx={{ flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {/* tab Bộ test: mở rồi thì luôn mounted để lượt chạy không bị hủy khi chuyển tab */}
      {visited.has('tests') && (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: tab === 'tests' ? 'flex' : 'none',
            flexDirection: 'column',
          }}
        >
          <Suspense fallback={<TabLoading />}>
            <AiTestSuitePanel />
          </Suspense>
        </Box>
      )}

      {/* Phòng thay đồ: mở rồi thì luôn mounted để giữ bản nháp khi chuyển tab */}
      {visited.has('wardrobe') && (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: tab === 'wardrobe' ? 'block' : 'none',
          }}
        >
          <Suspense fallback={<TabLoading />}>
            <AiWardrobePanel />
          </Suspense>
        </Box>
      )}

      {/* trang cuộn dọc; bảng giữ chiều cao tối thiểu để đọc được */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: tab === 'logs' ? 'flex' : 'none',
          flexDirection: 'column',
          gap: uiTokens.page.gap,
        }}
      >
        {screenFilterIgnored && (
          <Alert severity="warning" sx={{ flexShrink: 0 }}>
            {t.aiLogs.screenTabs.filterUnsupported}
          </Alert>
        )}

        <AiLogsKpi stats={stats.data} loading={stats.loading} />

        <AiLogsDailyChart rows={stats.data?.byDay ?? []} />

        <AiLogsTable
          rows={rows}
          total={total}
          // BE bỏ qua lọc màn hình → vẫn hiện chip để người xem phân biệt
          showScreen={filters.screenKey === '' || screenFilterIgnored}
          loading={list.loading}
          query={query}
          onQueryChange={setQuery}
          selectedRid={detailOpen ? detailRid : null}
          onSelect={(rid) => {
            setDetailRid(rid)
            setDetailOpen(true)
          }}
        />
      </Box>

      <AiLogDetailDrawer
        open={detailOpen}
        rid={detailRid}
        data={detail.data}
        loading={detail.loading}
        error={detail.error}
        onClose={() => setDetailOpen(false)}
      />

      <Snackbar
        open={exportError !== null}
        autoHideDuration={6000}
        onClose={() => setExportError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setExportError(null)}>
          {exportError ?? ''}
        </Alert>
      </Snackbar>
    </PageShell>
  )
}
