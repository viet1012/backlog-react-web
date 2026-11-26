import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import CheckroomRoundedIcon from '@mui/icons-material/CheckroomRounded'
import {
  Alert,
  Box,
  Divider,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { alpha, type Theme } from '@mui/material/styles'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
import { segmentedSx } from '../../components/machineMonitor/segmentedSx'
import { GlassPanel } from '../../components/common/GlassPanel'
import {
  AUTH_GUIDE_SECTIONS,
  loadAuthGuideSection,
  saveAuthGuideSection,
  type AuthGuideSection,
} from '../../components/authGuide/authGuideSections'
import { Suspense, lazy, startTransition, useMemo, useState } from 'react'
import { HeaderAction, HeaderActionBar, HeaderActionDivider } from '../../components/common/headerActions'
import { PageSkeleton } from '../../components/common/loadState'
import { notifyExport } from '../../components/common/notify'
import { usePerm } from '../../components/auth/useAuth'
import { ACTION, PERM } from '../../routes/appPages'
import { PageHeader } from '../../components/common/PageHeader'
import { PageShell } from '../../components/common/PageShell'
import { UpdatedStatus } from '../../components/common/UpdatedStatus'
import { AiLogDetailDrawer } from '../../components/aiLogs/AiLogDetailDrawer'
import { AiLogsDailyChart } from '../../components/aiLogs/AiLogsDailyChart'
import { AiLogsFilterBar } from '../../components/aiLogs/AiLogsFilterBar'
import { AiLogsKpi } from '../../components/aiLogs/AiLogsKpi'
import { AiLogsTable } from '../../components/aiLogs/AiLogsTable'
import {
  AI_LOGS_PAGE_SIZES,
  AI_LOGS_PATH,
  AI_LOGS_URL_PARAMS,
  TABULAR_NUMS,
  countAiLogFilters,
  defaultFilters,
  isValidAiLogRange,
  isValidScreenKey,
} from '../../components/aiLogs/aiLogsUtils'
import { readUrlParams, urlParam, useUrlFilters, type UrlParam, type UrlParams } from '../../hooks/useUrlFilters'
import { ASSISTANT_SCREENS, getScreenNameByKey } from '../../components/mascot/mascotMessages'
import { useAiLogDetail, useAiLogList, useAiLogStats } from '../../hooks/useAssistantLogs'
import { exportAiLogsExcel } from '../../services/assistantLogService'
import type { AiLogDetail, AiLogFilters, AiLogListQuery, AiLogScreenStat } from '../../types/assistantLogs'
import { uiTokens } from '../../theme/uiTokens'
import { useI18n } from '../../i18n/useI18n'
import { loadPreference, savePreference } from '../../utils/uiPreferences'

// Tab Bộ test (kèm các file JSON bộ test) và Phòng thay đồ tách chunk riêng:
// vào trang AI Logs chỉ tải tab Logs, bấm tab nào mới tải tab đó
const AiTestSuitePanel = lazy(() => import('../../components/aiLogs/AiTestSuitePanel').then((m) => ({ default: m.AiTestSuitePanel })))
const AiWardrobePanel = lazy(() => import('../../components/aiLogs/AiWardrobePanel').then((m) => ({ default: m.AiWardrobePanel })))
const AiFlowPanel = lazy(() => import('../../components/aiLogs/AiFlowPanel').then((m) => ({ default: m.AiFlowPanel })))
const AuthGuidePanel = lazy(() => import('../../components/authGuide/AuthGuidePanel').then((m) => ({ default: m.AuthGuidePanel })))

function TabLoading() {
  return <PageSkeleton variant="block" minHeight={240} />
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

type AiLogsTab = 'logs' | 'tests' | 'wardrobe' | 'flow' | 'auth'

// Nhóm cấp 1 của trang: AI (4 tab AI) | Phân quyền (tab con của hướng dẫn)
type PageGroup = 'ai' | 'auth'

const mainTabsSx = {
  flex: 1,
  minWidth: 0,
  minHeight: 36,
  '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontWeight: 700 },
  '& .MuiTab-root svg': { fontSize: 18 },
}

// =====================================================
// URL: ?tab=flow | ?tab=auth&section=roles | (tab Logs) ?from=…&to=…
// Bộ lọc của Logs chỉ nằm trên URL khi đang ở tab Logs; tab con Phân quyền chỉ khi ở tab Phân quyền.
// =====================================================

const AI_LOGS_TABS: readonly AiLogsTab[] = ['flow', 'logs', 'tests', 'wardrobe', 'auth']

interface AdminUrlState extends AiLogFilters {
  tab: AiLogsTab
  section: AuthGuideSection
}

const TAB_URL_PARAM = urlParam.oneOf<AiLogsTab>('tab', AI_LOGS_TABS, 'logs')
const SECTION_URL_PARAM = urlParam.oneOf<AuthGuideSection>('section', AUTH_GUIDE_SECTIONS.map((s) => s.value), 'how')

// Tham số bị ẩn: không ghi lên URL, và URL đổi cũng không áp vào state
function hiddenParam<V>(param: UrlParam<V>): UrlParam<V> {
  return { ...param, format: () => '' }
}

function adminUrlParams(tab: AiLogsTab): UrlParams<AdminUrlState> {
  const filterParams = Object.fromEntries(
    Object.entries(AI_LOGS_URL_PARAMS).map(([name, param]) => [name, tab === 'logs' ? param : hiddenParam(param as UrlParam<unknown>)]),
  ) as UrlParams<AiLogFilters>

  return {
    ...filterParams,
    tab: TAB_URL_PARAM,
    section: tab === 'auth' ? SECTION_URL_PARAM : hiddenParam(SECTION_URL_PARAM),
  }
}

function readInitialTab(): { tab: AiLogsTab; section: AuthGuideSection } {
  const fromUrl = readUrlParams(AI_LOGS_PATH, { tab: TAB_URL_PARAM, section: SECTION_URL_PARAM })
  const tab = fromUrl.tab ?? 'logs'
  return { tab, section: tab === 'auth' && fromUrl.section ? fromUrl.section : loadAuthGuideSection() }
}

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

// Hàng tab con dạng "viên thuốc" nhỏ, nhạt hơn hàng tab chính
const pillTabsSx = (theme: Theme) => ({
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
})

// Hàng tab con theo màn hình
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
      sx={pillTabsSx}
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
  const { t, language } = useI18n()

  // tab + tab con Phân quyền: link chia sẻ / F5 lấy từ URL; không có thì Logs + tab con đã nhớ
  const [initial] = useState(readInitialTab)

  // tab con của tab Phân quyền, nhớ qua lần tải lại
  const [authSection, setAuthSection] = useState<AuthGuideSection>(initial.section)

  function changeAuthSection(next: AuthGuideSection) {
    setAuthSection(next)
    saveAuthGuideSection(next)
  }

  const [tab, setTab] = useState<AiLogsTab>(initial.tab)
  // Tab nặng chỉ dựng khi mở lần đầu (vào trang nhanh hơn), mở rồi thì giữ mounted
  const [visited, setVisited] = useState<ReadonlySet<AiLogsTab>>(() => new Set(['logs', initial.tab]))

  // tab AI đang mở gần nhất: đổi nhóm Phân quyền → AI thì quay lại đúng tab đó
  const [lastAiTab, setLastAiTab] = useState<AiLogsTab>(initial.tab === 'auth' ? 'logs' : initial.tab)
  const group: PageGroup = tab === 'auth' ? 'auth' : 'ai'

  function changeTab(next: AiLogsTab) {
    setTab(next)
    if (next !== 'auth') setLastAiTab(next)
    // dựng tab nặng ở chế độ transition → tab được chọn đổi màu ngay, nội dung vẽ sau
    startTransition(() => {
      setVisited((prev) => (prev.has(next) ? prev : new Set(prev).add(next)))
    })
  }

  function changeGroup(next: PageGroup | null) {
    if (!next || next === group) return
    changeTab(next === 'auth' ? 'auth' : lastAiTab)
  }

  // tab con màn hình được nhớ qua lần tải lại → khởi tạo cùng bộ lọc;
  // link chia sẻ / F5: bộ lọc trên URL thắng (khoảng ngày sai thì bỏ)
  const [filters, setFilters] = useState<AiLogFilters>(() => {
    const fromUrl = readUrlParams(AI_LOGS_PATH, AI_LOGS_URL_PARAMS)
    const next = { ...defaultFilters(), screenKey: loadScreenKey(), ...fromUrl }
    const defaults = defaultFilters()

    return isValidAiLogRange(next.from, next.to) ? next : { ...next, from: defaults.from, to: defaults.to }
  })
  const [query, setQuery] = useState<AiLogListQuery>(DEFAULT_QUERY)
  const [refreshKey, setRefreshKey] = useState(0)

  const list = useAiLogList(filters, query, refreshKey)
  const stats = useAiLogStats(filters, refreshKey)

  // giữ rid khi đóng để nội dung không mất trong lúc drawer trượt ra
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRid, setDetailRid] = useState<string | null>(null)
  const detail = useAiLogDetail(detailRid)
  // request đang phát lại trên tab Luồng AI (bấm "Xem trên sơ đồ" trong drawer)
  const [flowLog, setFlowLog] = useState<AiLogDetail | null>(null)

  const [exporting, setExporting] = useState(false)
  // Xuất Excel log cần ASSISTANT_LOG X
  const canExport = usePerm(PERM.ASSISTANT_LOG, ACTION.EXPORT)

  // đổi bộ lọc → về trang đầu
  function changeFilters(next: AiLogFilters) {
    setFilters(next)
    setQuery((prev) => ({ ...prev, page: 0 }))
  }

  // về mặc định, giữ tab màn hình đang chọn
  function resetFilters() {
    changeFilters({ ...defaultFilters(), screenKey: filters.screenKey })
  }

  function changeScreen(screenKey: string) {
    savePreference(SCREEN_PREF_KEY, screenKey)
    changeFilters({ ...filters, screenKey })
  }

  // URL ⇄ tab + bộ lọc: link từ ngoài => mở đúng tab, áp bộ lọc của link (khoảng ngày sai thì giữ khoảng cũ)
  const urlParams = useMemo(() => adminUrlParams(tab), [tab])

  useUrlFilters<AdminUrlState>({
    path: AI_LOGS_PATH,
    params: urlParams,
    values: { ...filters, tab, section: authSection },
    onUrlChange: ({ tab: nextTab, section: nextSection, ...next }) => {
      if (nextTab !== tab) changeTab(nextTab)
      if (nextTab === 'auth' && nextSection !== authSection) changeAuthSection(nextSection)
      if (nextTab !== 'logs') return

      // từ tab khác sang Logs: bộ lọc đang bị ẩn nên đọc thẳng từ URL
      const linked: AiLogFilters = tab === 'logs'
        ? next
        : { ...filters, ...readUrlParams(AI_LOGS_PATH, AI_LOGS_URL_PARAMS) }
      if (JSON.stringify(linked) === JSON.stringify(filters)) return

      const range = isValidAiLogRange(linked.from, linked.to) ? linked : filters
      savePreference(SCREEN_PREF_KEY, linked.screenKey)
      changeFilters({ ...linked, from: range.from, to: range.to })
    },
  })

  async function handleExport() {
    setExporting(true)

    try {
      // Progress / done / failed toast (notifyExport never throws)
      await notifyExport((onProgress) => exportAiLogsExcel(filters, query, onProgress))
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
        title={t.nav.aiLogs}
        subtitle={tab === 'auth' ? t.aiLogs.authSubtitle : t.aiLogs.subtitle}
        status={tab !== 'auth' && (
          <UpdatedStatus
            updatedAt={list.updatedAt == null ? null : new Date(list.updatedAt)}
            error={Boolean(error)}
          />
        )}
        actions={tab === 'logs' && (
          <HeaderActionBar>
            {canExport && (
              <>
                <HeaderAction
                  kind="exportExcel"
                  loading={exporting}
                  disabled={total === 0}
                  onClick={() => void handleExport()}
                />

                <HeaderActionDivider />
              </>
            )}

            <HeaderAction
              kind="refresh"
              loading={loading}
              onClick={() => setRefreshKey((k) => k + 1)}
            />
          </HeaderActionBar>
        )}
        bottom={
          <>
            {/* Nhóm (AI | Phân quyền) bên trái, tab của nhóm đó bên phải */}
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.5, minWidth: 0 }}>
              <ToggleButtonGroup
                exclusive
                value={group}
                onChange={(_, next: PageGroup | null) => changeGroup(next)}
                aria-label={t.aiLogs.groups.aria}
                sx={segmentedSx}
              >
                <ToggleButton value="ai" sx={{ gap: 0.5 }}>
                  <SmartToyOutlinedIcon sx={{ fontSize: 16 }} />
                  {t.aiLogs.groups.ai}
                </ToggleButton>
                <ToggleButton value="auth" sx={{ gap: 0.5 }}>
                  <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 16 }} />
                  {t.aiLogs.tabs.auth}
                </ToggleButton>
              </ToggleButtonGroup>

              <Divider orientation="vertical" flexItem sx={{ my: 0.75, display: { xs: 'none', sm: 'block' } }} />

              {group === 'ai' ? (
                <Tabs
                  value={tab}
                  onChange={(_, next: AiLogsTab) => changeTab(next)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={mainTabsSx}
                >
                  <Tab
                    value="flow"
                    icon={<AccountTreeOutlinedIcon />}
                    iconPosition="start"
                    label={t.aiLogs.tabs.flow}
                  />
                  <Tab value="logs" label={t.aiLogs.tabs.logs} />
                  <Tab value="tests" label={t.aiLogs.tabs.tests} />
                  <Tab
                    value="wardrobe"
                    icon={<CheckroomRoundedIcon />}
                    iconPosition="start"
                    label={t.aiLogs.tabs.wardrobe}
                  />
                </Tabs>
              ) : (
                <Tabs
                  value={authSection}
                  onChange={(_, next: AuthGuideSection) => changeAuthSection(next)}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label={t.aiLogs.tabs.auth}
                  sx={mainTabsSx}
                >
                  {AUTH_GUIDE_SECTIONS.map((s) => (
                    <Tab key={s.value} value={s.value} icon={s.icon} iconPosition="start" label={s.label[language]} />
                  ))}
                </Tabs>
              )}
            </Box>

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
                  onReset={resetFilters}
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

      {/* Luồng AI: trang giải thích tĩnh cho người không chuyên */}
      {visited.has('flow') && (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            // flex: panel lấp đầy chiều cao, gói gọn 1 màn hình (màn thấp thì vẫn cuộn được)
            display: tab === 'flow' ? 'flex' : 'none',
            flexDirection: 'column',
          }}
        >
          <Suspense fallback={<TabLoading />}>
            <AiFlowPanel log={flowLog} onClearLog={() => setFlowLog(null)} />
          </Suspense>
        </Box>
      )}

      {/* Phân quyền: tài liệu tĩnh, tab con chọn ở header */}
      {visited.has('auth') && (
        <GlassPanel
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            display: tab === 'auth' ? 'block' : 'none',
            px: { xs: 1.5, md: 2.5 },
            py: 2,
          }}
        >
          <Suspense fallback={<TabLoading />}>
            <AuthGuidePanel section={authSection} />
          </Suspense>
        </GlassPanel>
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
          // trống vì bộ lọc (vd link cũ): Xóa bộ lọc, giữ tab màn hình
          onClearFilters={countAiLogFilters(filters) > 0 ? resetFilters : undefined}
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
        onShowFlow={(log) => {
          setFlowLog(log)
          setDetailOpen(false)
          changeTab('flow')
        }}
      />
    </PageShell>
  )
}
