import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import {
  Box,
  ButtonBase,
  Checkbox,
  Collapse,
  FormControlLabel,
  IconButton,
  Popover,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { alpha } from '@mui/material/styles'
import dayjs from 'dayjs'
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { AppButton } from '../components/common/AppButton'
import { GlassPanel } from '../components/common/GlassPanel'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { codeFontFamily } from '../components/machineLocator/machineLocatorColors'
import { MonitorMap } from '../components/machineMonitor/MonitorMap'
import { toneColor } from '../components/machineMonitor/monitorColors'
import { HistoryRangeButton } from '../components/machineMonitor/HistoryRangeButton'
import {
  parseRange,
  rangeLabel,
  type MonitorRange,
} from '../components/machineMonitor/monitorRange'
import { MONITOR_TABS } from '../components/machineMonitor/monitorTabs'
import type {
  MachineMark,
  MonitorChip,
  MonitorHistoryRow,
  MonitorPreviewItem,
  MonitorTabDef,
  MonitorTarget,
  MonitorTone,
} from '../components/machineMonitor/monitorTypes'
import { useMonitorData } from '../hooks/useMonitorData'
import { useStableCallback } from '../hooks/useStableCallback'
import { listFloors } from '../services/machineLocatorService'
import { appScrollbarSx } from '../theme/scrollbarStyle'
import { uiTokens } from '../theme/uiTokens'
import type { MachineLayoutConfig } from '../types/machineLocator'
import {
  compareCodes,
  matchesQuery,
} from '../utils/machineLocatorGeometry'
import {
  loadPreference,
  savePreference,
} from '../utils/uiPreferences'

interface MachineMonitorPageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

const PAGE_TITLE = 'Machine Monitoring'
const PREF_LAYOUT = 'machine-monitor:layout'
const PREF_ONLY_ACTIVE = 'machine-monitor:onlyActive'
const DEFAULT_LAYOUT_ID = 'factory-b-f1'

const tabsSx = {
  minHeight: 32,
  '& .MuiTab-root': {
    minHeight: 32,
    py: 0.5,
    px: 2,
    fontSize: 13,
    fontWeight: 700,
    textTransform: 'none',
  },
} as const

export function MachineMonitorPage({
  mode,
  onToggleMode,
}: MachineMonitorPageProps) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // tiêu đề tab trình duyệt; trả lại tiêu đề cũ khi rời page
  useEffect(() => {
    const prev = document.title

    document.title = PAGE_TITLE

    return () => {
      document.title = prev
    }
  }, [])

  // Floor dùng chung với Machine Locator (GET /floors); null = đang tải
  const [layouts, setLayouts] = useState<MachineLayoutConfig[] | null>(null)
  const [layoutsError, setLayoutsError] = useState('')
  const [layoutsSeq, setLayoutsSeq] = useState(0)

  useEffect(() => {
    let alive = true

    listFloors().then(
      (ls) => {
        if (!alive) return
        setLayouts(ls)
        setLayoutsError('')
      },
      (e: unknown) => {
        if (alive) setLayoutsError(e instanceof Error ? e.message : String(e))
      },
    )

    return () => {
      alive = false
    }
  }, [layoutsSeq])

  const findLayout = (id: unknown): MachineLayoutConfig | undefined =>
    layouts?.find((l) => l.id === id)

  // ?layout=… > tab mở gần nhất > Fac B
  const layout =
    findLayout(searchParams.get('layout'))
    ?? findLayout(loadPreference(PREF_LAYOUT))
    ?? findLayout(DEFAULT_LAYOUT_ID)
    ?? layouts?.[0]
  const layoutId = layout?.id

  useEffect(() => {
    if (layoutId) savePreference(PREF_LAYOUT, layoutId)
  }, [layoutId])

  // ?tab=… (chỉ tab đã có), mặc định tab đầu
  const entry = MONITOR_TABS.find((t) => t.def && t.id === searchParams.get('tab'))
    ?? MONITOR_TABS.find((t) => t.def)!
  const tab = entry.def!

  function go(next: { tab?: string, layout?: string }) {
    const p = new URLSearchParams()

    p.set('tab', next.tab ?? entry.id)
    if (next.layout ?? layoutId) p.set('layout', (next.layout ?? layoutId)!)

    navigate({ search: `?${p}` }, { replace: true })
  }

  const bottom = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
      <Tabs
        value={entry.id}
        onChange={(_, v: string) => go({ tab: v })}
        variant="scrollable"
        scrollButtons={false}
        aria-label="Monitoring function"
        sx={tabsSx}
      >
        {MONITOR_TABS.map((t) => (
          <Tab
            key={t.id}
            value={t.id}
            disabled={!t.def}
            label={t.def ? t.label : (
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                {t.label}
                <Box
                  component="span"
                  sx={{
                    px: 0.75,
                    borderRadius: '8px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    bgcolor: 'action.selected',
                  }}
                >
                  Coming soon
                </Box>
              </Box>
            )}
          />
        ))}
      </Tabs>

      {layouts && layout && (
        <Tabs
          value={layout.id}
          onChange={(_, v: string) => go({ layout: v })}
          variant="scrollable"
          scrollButtons={false}
          aria-label="Floor"
          sx={[tabsSx, { borderLeft: '1px solid', borderColor: 'divider', pl: 1 }]}
        >
          {layouts.map((l) => (
            <Tab key={l.id} value={l.id} label={l.name} />
          ))}
        </Tabs>
      )}
    </Box>
  )

  const header = (status?: ReactNode, actions?: ReactNode) => (
    <PageHeader
      title={PAGE_TITLE}
      // vd "Safety — Fac A"
      subtitle={layout ? `${entry.label} — ${layout.name}` : entry.label}
      status={status}
      actions={actions}
      bottom={bottom}
      mode={mode}
      onToggleMode={onToggleMode}
    />
  )

  if (!layout) {
    return (
      <PageShell>
        {header()}

        <LoadState
          text={layoutsError
            ? `Không tải được danh sách layout: ${layoutsError}`
            : layouts ? 'Chưa có layout nào trên server.' : 'Đang tải danh sách layout…'}
          error={!!layoutsError}
          onRetry={layoutsError ? () => setLayoutsSeq((s) => s + 1) : undefined}
        />
      </PageShell>
    )
  }

  return (
    <PageShell>
      {/* key: đổi tab / floor thì tải lại, bỏ chọn máy, xoá ô tìm */}
      <MonitorView key={`${entry.id}:${layout.id}`} layout={layout} tab={tab} header={header} />
    </PageShell>
  )
}

// Đang tải / lỗi tải dữ liệu từ server (thay cho bản đồ)
function LoadState({
  text,
  error,
  onRetry,
}: {
  text: string
  error: boolean
  onRetry?: () => void
}) {
  return (
    <GlassPanel
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        p: 3,
      }}
    >
      <Typography role="status" sx={{ fontSize: 13, color: error ? 'error.main' : 'text.secondary' }}>
        {text}
      </Typography>

      {onRetry && (
        <AppButton onClick={onRetry}>
          Thử lại
        </AppButton>
      )}
    </GlassPanel>
  )
}

// =========================================================
// VIEW 1 TAB × 1 FLOOR: bản đồ chung + danh sách máy + panel chi tiết của tab
// =========================================================

interface MonitorViewProps {
  layout: MachineLayoutConfig
  tab: MonitorTabDef<unknown>
  header: (status?: ReactNode, actions?: ReactNode) => ReactNode
}

interface ListSection {
  id: string
  label: string
  hint?: string
  codes: string[]
}

// id bộ lọc / nhóm "Lỗi không gắn máy"
const GROUPS_SECTION = '_groups'

// khoá dòng trong danh sách (accordion, cuộn tới dòng)
const rowKey = (t: MonitorTarget) => `${t.kind}:${t.id}`

function MonitorView({ layout, tab, header }: MonitorViewProps) {
  // khoảng lịch sử (tab có history), nhớ theo tab; giá trị cũ dạng chuỗi -> về mặc định
  const prefHistory = `machine-monitor:${tab.id}:history`
  const [history, setHistory] = useState<MonitorRange | undefined>(() =>
    (tab.history ? parseRange(loadPreference(prefHistory)) ?? tab.history.defaultRange : undefined))
  // mục "Đã an toàn trong khoảng": mặc định thu gọn
  const [showHistoryRows, setShowHistoryRows] = useState(false)

  useEffect(() => {
    if (history) savePreference(prefHistory, history)
  }, [prefHistory, history])

  const { floor, data, error, loading, loadedAt, refresh } = useMonitorData(layout, tab, history)

  const [query, setQuery] = useState('')
  const [onlyActive, setOnlyActive] = useState(() => loadPreference(PREF_ONLY_ACTIVE) === true)
  // máy đang chọn trên bản đồ; tăng locateKey mỗi lần cần định vị (zoom + hiệu ứng)
  const [cur, setCur] = useState<string | null>(null)
  const [locateKey, setLocateKey] = useState(0)
  // dòng đang mở rộng (chỉ 1) / panel chi tiết đang mở
  const [expanded, setExpanded] = useState<string | null>(null)
  const [detailTarget, setDetailTarget] = useState<MonitorTarget | null>(null)
  // ô số đang chọn = lọc theo nhóm; nhóm đang thu gọn
  const [sectionFilter, setSectionFilter] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  // rê chuột: dòng ở panel -> bản đồ (listHover); máy trên bản đồ -> dòng ở panel (mapHover)
  const [listHover, setListHover] = useState<string | null>(null)
  const [mapHover, setMapHover] = useState<string | null>(null)
  // nhóm không gắn máy chỉ còn lỗi an toàn: thu gọn
  const [showSafeGroups, setShowSafeGroups] = useState(false)
  const [helpAnchor, setHelpAnchor] = useState<HTMLElement | null>(null)

  useEffect(() => {
    savePreference(PREF_ONLY_ACTIVE, onlyActive)
  }, [onlyActive])

  function clearSelection() {
    setCur(null)
    setExpanded(null)
  }

  // Esc: đóng panel chi tiết, rồi bỏ chọn máy
  const onEscape = useEffectEvent(() => {
    if (detailTarget) setDetailTarget(null)
    else clearSelection()
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !document.querySelector('.MuiDialog-root, .MuiPopover-root')) onEscape()
    }

    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  // cuộn danh sách tới 1 dòng (sau khi render)
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [scrollReq, setScrollReq] = useState<{ key: string, seq: number } | null>(null)

  useEffect(() => {
    if (scrollReq) rowRefs.current[scrollReq.key]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [scrollReq])

  const marks = useMemo<Record<string, MachineMark>>(() => (data ? tab.marks(data) : {}), [data, tab])
  const legend = useMemo(() => (data ? tab.legend(data) : []), [data, tab])
  const groups = useMemo(() => (data && tab.groups ? tab.groups(data) : []), [data, tab])
  const groupsOpen = data && tab.groupsOpenCount ? tab.groupsOpenCount(data) : 0

  const mapCodes = useMemo(() => Object.keys(floor?.machines ?? {}), [floor])
  const allCodes = useMemo(
    () => [...new Set([...mapCodes, ...Object.keys(marks)])],
    [mapCodes, marks],
  )

  // máy còn sáng trên bản đồ; null = không lọc. Lọc theo ô số: chỉ máy thuộc nhóm đó
  const q = query.trim()
  const visible = useMemo(() => {
    if (!onlyActive && !q && !sectionFilter) return null

    return new Set(allCodes.filter((c) => matchesQuery(c, q)
      && (!onlyActive || marks[c]?.active)
      && (!sectionFilter || marks[c]?.section === sectionFilter)))
  }, [allCodes, marks, onlyActive, q, sectionFilter])

  // danh sách: máy có lỗi chưa đóng; đang tìm thì thêm máy khớp mã. Sắp theo mức độ
  const list = allCodes
    .filter((c) => (q ? matchesQuery(c, q) && (!onlyActive || marks[c]?.active) : marks[c]?.active))
    .sort((a, b) => (marks[b]?.rank ?? -1) - (marks[a]?.rank ?? -1) || compareCodes(a, b))

  // gom theo nhóm status của tab; không thuộc nhóm nào (vd máy an toàn khi tìm) -> "Khác"
  const sectionDefs = tab.sections ?? []
  const allSections: ListSection[] = sectionDefs
    .map((s) => ({ ...s, codes: list.filter((c) => marks[c]?.section === s.id) }))
    .filter((s) => s.codes.length)
  const others = list.filter((c) => !sectionDefs.some((s) => s.id === marks[c]?.section))

  if (others.length) allSections.push({ id: '_other', label: sectionDefs.length ? 'Khác' : tab.listTitle, codes: others })

  const sections = sectionFilter ? allSections.filter((s) => s.id === sectionFilter) : allSections
  const showGroups = !!tab.groups && (!sectionFilter || sectionFilter === GROUPS_SECTION)

  // nhóm không gắn máy: ô tìm lọc theo nhãn; nhóm chỉ còn lỗi an toàn gom vào "Đã an toàn"
  const qLower = q.toLowerCase()
  const groupMatches = groups
    .filter((g) => !q || g.label.toLowerCase().includes(qLower))
    .sort((a, b) => b.mark.rank - a.mark.rank || a.label.localeCompare(b.label))
  const openGroups = groupMatches.filter((g) => g.mark.active)
  const safeGroups = onlyActive ? [] : groupMatches.filter((g) => !g.mark.active)

  function toggleCollapsed(id: string) {
    setCollapsed((s) => {
      const n = new Set(s)

      if (!n.delete(id)) n.add(id)

      return n
    })
  }

  // bấm dòng: định vị máy + mở rộng tại chỗ; bấm lại dòng đang mở thì thu gọn
  function onRowClick(t: MonitorTarget) {
    const key = rowKey(t)

    if (expanded === key) {
      setExpanded(null)
      return
    }

    setExpanded(key)

    if (t.kind === 'machine') {
      setCur(t.id)
      if (floor?.machines[t.id]) setLocateKey((k) => k + 1)
    } else {
      setCur(null)
    }
  }

  // bấm máy trên bản đồ: định vị + panel cuộn tới dòng đó và mở nó.
  // Máy không có dòng (an toàn / không dữ liệu): chỉ định vị; an toàn thì mở panel chi tiết
  const onSelect = useStableCallback((c: string | null) => {
    if (!c) {
      clearSelection()
      return
    }

    const m = marks[c]

    setCur(c)
    setLocateKey((k) => k + 1)
    setDetailTarget(null)

    if (!m?.active) {
      setExpanded(null)
      if (m) setDetailTarget({ kind: 'machine', id: c })
      return
    }

    // bỏ lọc / tìm / thu gọn đang che dòng này
    if (sectionFilter && m.section !== sectionFilter) setSectionFilter(null)
    if (q && !matchesQuery(c, q)) setQuery('')
    if (m.section && collapsed.has(m.section)) toggleCollapsed(m.section)

    const key = rowKey({ kind: 'machine', id: c })

    setExpanded(key)
    setScrollReq((r) => ({ key, seq: (r?.seq ?? 0) + 1 }))
  })
  const onMapHover = useStableCallback(setMapHover)

  // mục "Đã an toàn trong khoảng": ô tìm lọc theo mã / nhãn; ẩn khi đang lọc chưa đóng / lọc theo ô số
  const historyRows = data && tab.historyRows && !onlyActive && !sectionFilter
    ? tab.historyRows(data).filter((r) => !q
      || (r.target.kind === 'machine' ? matchesQuery(r.title, q) : r.title.toLowerCase().includes(qLower)))
    : []

  // bấm dòng lịch sử: định vị máy + mở panel chi tiết
  function onHistoryRowClick(t: MonitorTarget) {
    setExpanded(null)
    setDetailTarget(t)

    if (t.kind === 'machine') {
      setCur(t.id)
      if (floor?.machines[t.id]) setLocateKey((k) => k + 1)
    } else {
      setCur(null)
    }
  }

  // ô số: các mục của tab + "Không gắn máy"; bấm = lọc nhóm, bấm lại = bỏ lọc
  const tiles = [
    ...legend,
    ...(tab.groups ? [{ tone: 'bad' as const, label: 'Không gắn máy', count: groupsOpen, section: GROUPS_SECTION }] : []),
  ]

  const summary = data && tab.panelSummary
    ? tab.panelSummary(data, { mapCodes, historyLabel: history && rangeLabel(history) })
    : `${mapCodes.length} máy trên bản đồ`

  const gen = data ? tab.generatedAt(data) : null
  const updatedAt = gen && dayjs(gen).isValid() ? dayjs(gen).toDate() : loadedAt

  const page = header(
    <UpdatedStatus updatedAt={updatedAt} error={!!error} />,
    <RefreshButton loading={loading} onClick={refresh} />,
  )

  if (!floor || !data) {
    return (
      <>
        {page}
        <LoadState
          text={error ? `Không tải được dữ liệu: ${error}` : 'Đang tải dữ liệu từ server…'}
          error={!!error}
          onRetry={error ? refresh : undefined}
        />
      </>
    )
  }

  const group = detailTarget?.kind === 'group' ? groups.find((g) => g.key === detailTarget.id) : undefined
  // tiêu đề / dòng phụ của panel chi tiết
  const detail = detailTarget && (detailTarget.kind === 'machine'
    ? {
      title: detailTarget.id,
      mono: true,
      sub: (marks[detailTarget.id]?.sub ?? 'Không có dữ liệu')
        + (!floor.machines[detailTarget.id] ? ' · không có trên bản đồ' : ''),
    }
    : {
      title: group?.label ?? detailTarget.id,
      mono: false,
      // description đã gồm số lỗi + risk -> không ghép thêm mark.sub cho khỏi lặp
      sub: ['Lỗi không gắn máy', group?.description || group?.mark.sub].filter(Boolean).join(' · '),
    })

  const renderRow = (t: MonitorTarget, title: string, mark: MachineMark | undefined, extra?: string) => {
    const key = rowKey(t)
    const open = expanded === key

    return (
      <MonitorRow
        key={key}
        rowRef={(el) => { rowRefs.current[key] = el }}
        title={title}
        mono={t.kind === 'machine'}
        mark={mark}
        detail={[mark?.detail ?? (mark ? null : 'Không có dữ liệu'), extra].filter(Boolean).join(' · ')}
        selected={open || (t.kind === 'machine' && t.id === cur)}
        hovered={t.kind === 'machine' && t.id === mapHover}
        expanded={open}
        preview={open && tab.preview ? tab.preview(data, t) : []}
        onClick={() => onRowClick(t)}
        onOpenDetail={() => setDetailTarget(t)}
        onPointerEnter={() => setListHover(t.kind === 'machine' && floor.machines[t.id] ? t.id : null)}
      />
    )
  }

  return (
    <>
      {page}

      <GlassPanel
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'grid',
          // bản đồ co lại được; panel phải tối thiểu 380px
          gridTemplateColumns: 'minmax(0, 1fr) minmax(380px, 400px)',

          '@media (max-width: 760px)': {
            gridTemplateColumns: 'minmax(0, 1fr)',
            gridTemplateRows: '60vh 1fr',
            overflowY: 'auto',
          },
        }}
      >
        <MonitorMap
          layout={layout}
          data={floor.data}
          machines={floor.machines}
          marks={marks}
          visible={visible}
          cur={cur}
          locateKey={locateKey}
          listHover={listHover}
          onSelect={onSelect}
          onHover={onMapHover}
        />

        <Box
          component="aside"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            // không phần tử nào tràn ngang ra ngoài panel
            minWidth: 380,
            overflowX: 'hidden',
            borderLeft: '1px solid',
            borderColor: 'divider',

            '@media (max-width: 760px)': {
              minWidth: 0,
              borderLeft: 0,
              borderTop: '1px solid',
              borderTopColor: 'divider',
            },
          }}
        >
          {error && (
            <Typography role="status" sx={{ px: 1.75, pt: 1, fontSize: 12, color: 'error.main' }}>
              Không làm mới được: {error}
            </Typography>
          )}

          {detailTarget && detail ? (
            <>
              <Box sx={{ px: 1.75, pt: 1.5, pb: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AppButton
                    compact
                    aria-label="Quay lại danh sách"
                    icon={<ArrowBackRoundedIcon sx={{ fontSize: 18 }} />}
                    onClick={() => setDetailTarget(null)}
                    sx={{ height: 30, minWidth: 30 }}
                  />
                  <Typography
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      font: detail.mono ? `700 20px ${codeFontFamily}` : undefined,
                      fontSize: detail.mono ? undefined : 18,
                      fontWeight: 700,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {detail.title}
                  </Typography>
                </Box>
                <Typography sx={{ mt: 0.5, fontSize: 12, color: 'text.secondary', whiteSpace: 'pre-line' }}>
                  {detail.sub}
                </Typography>
              </Box>

              {/* key: đổi máy / nhóm thì reset trạng thái panel (mục thu gọn, ảnh đang mở) */}
              <Box
                key={rowKey(detailTarget)}
                sx={[{ flex: 1, minHeight: 0, overflowY: 'auto', pt: 1.25 }, appScrollbarSx]}
              >
                {tab.renderDetail({ target: detailTarget, data })}
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ px: 1.75, pt: 1.5, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography noWrap sx={{ fontSize: 15, fontWeight: 700 }}>
                    {tab.listTitle}
                  </Typography>
                  {tab.help && (
                    <IconButton
                      size="small"
                      aria-label="Giải thích trạng thái"
                      onClick={(e) => setHelpAnchor(e.currentTarget)}
                      sx={{ p: 0.25, color: 'text.secondary' }}
                    >
                      <HelpOutlineRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  )}
                </Box>

                {/* ô số (lưới 2×2) = bộ lọc theo nhóm; bấm lại để bỏ lọc */}
                <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75 }}>
                  {tiles.map((t) => (
                    <StatTile
                      key={t.label}
                      tone={t.tone}
                      label={t.label}
                      count={t.count}
                      active={!!t.section && sectionFilter === t.section}
                      onClick={t.section
                        ? () => setSectionFilter((f) => (f === t.section ? null : t.section!))
                        : undefined}
                    />
                  ))}
                </Box>

                {/* lịch sử an toàn: nhãn nhạt trái, nút khoảng ngày phải */}
                {tab.history && history && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, flex: '0 0 auto' }}>
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {tab.history.label}
                      </Typography>
                      <Tooltip title={tab.history.note}>
                        <HelpOutlineRoundedIcon
                          aria-label={tab.history.note}
                          sx={{ fontSize: 14, color: 'text.disabled', cursor: 'help' }}
                        />
                      </Tooltip>
                    </Box>

                    <HistoryRangeButton value={history} onChange={setHistory} ariaLabel={tab.history.label} />
                  </Box>
                )}

                {/* dòng phụ nhạt duy nhất */}
                <Typography noWrap title={summary} sx={{ mt: 0.75, fontSize: 11.5, color: 'text.secondary' }}>
                  {summary}
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  type="search"
                  value={query}
                  placeholder={tab.groups ? 'Tìm mã máy / nhóm, ví dụ 1443, INS' : 'Tìm mã máy, ví dụ 1443'}
                  autoComplete="off"
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return
                    if (list.length) onRowClick({ kind: 'machine', id: list[0] })
                    else if (openGroups.length || safeGroups.length) {
                      onRowClick({ kind: 'group', id: (openGroups[0] ?? safeGroups[0]).key })
                    }
                  }}
                  slotProps={{ htmlInput: { 'aria-label': 'Tìm mã máy' } }}
                  sx={{
                    mt: 1,
                    '& .MuiInputBase-input': { fontFamily: codeFontFamily, fontSize: 14 },
                  }}
                />

                <FormControlLabel
                  sx={{
                    mt: 0.5,
                    mr: 0,
                    '& .MuiFormControlLabel-label': { fontSize: 12.5 },
                    '& .MuiCheckbox-root': { p: 0.5 },
                  }}
                  control={(
                    <Checkbox
                      size="small"
                      checked={onlyActive}
                      onChange={(e) => setOnlyActive(e.target.checked)}
                    />
                  )}
                  label={tab.activeFilterLabel}
                />
              </Box>

              <Box
                role="list"
                onPointerLeave={() => setListHover(null)}
                sx={[{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1, pb: 1.5 }, appScrollbarSx]}
              >
                {sections.map((s) => (
                  <Box key={s.id}>
                    <SectionHeader
                      label={`${s.label} (${s.codes.length})`}
                      hint={s.hint}
                      open={!collapsed.has(s.id)}
                      onToggle={() => toggleCollapsed(s.id)}
                    />
                    <Collapse in={!collapsed.has(s.id)}>
                      {s.codes.map((c) => renderRow(
                        { kind: 'machine', id: c },
                        c,
                        marks[c],
                        floor.machines[c] ? undefined : 'không có trên bản đồ',
                      ))}
                    </Collapse>
                  </Box>
                ))}

                {!sections.length && sectionFilter !== GROUPS_SECTION && (
                  <Typography sx={{ py: 3, textAlign: 'center', fontSize: 13, color: 'text.secondary' }}>
                    {q ? 'Không có mã máy khớp.' : 'Không có máy nào có lỗi chưa đóng.'}
                  </Typography>
                )}

                {showGroups && (
                  <Box>
                    <SectionHeader
                      label={`Lỗi không gắn máy (${groupsOpen})`}
                      hint="Lỗi ở khu vực / thiết bị không có trên bản đồ"
                      open={!collapsed.has(GROUPS_SECTION)}
                      onToggle={() => toggleCollapsed(GROUPS_SECTION)}
                    />

                    <Collapse in={!collapsed.has(GROUPS_SECTION)}>
                      {openGroups.map((g) => renderRow({ kind: 'group', id: g.key }, g.label, g.mark))}

                      {!openGroups.length && (
                        <Typography sx={{ py: 1, px: 1, fontSize: 12.5, color: 'text.secondary' }}>
                          {q ? 'Không có nhóm chưa đóng khớp.' : 'Không có lỗi chưa đóng.'}
                        </Typography>
                      )}

                      {safeGroups.length > 0 && (
                        <>
                          <ButtonBase
                            onClick={() => setShowSafeGroups((v) => !v)}
                            aria-expanded={showSafeGroups}
                            sx={{
                              width: '100%',
                              justifyContent: 'space-between',
                              px: 1,
                              py: 0.75,
                              borderRadius: 1.5,
                              fontSize: 12.5,
                              color: 'text.secondary',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            {`Đã an toàn (${safeGroups.length})`}
                            <ExpandMoreRoundedIcon
                              sx={{
                                fontSize: 18,
                                transition: 'transform .2s',
                                transform: showSafeGroups ? 'rotate(180deg)' : 'none',
                              }}
                            />
                          </ButtonBase>

                          <Collapse in={showSafeGroups} unmountOnExit>
                            {safeGroups.map((g) => renderRow({ kind: 'group', id: g.key }, g.label, g.mark))}
                          </Collapse>
                        </>
                      )}
                    </Collapse>
                  </Box>
                )}

                {/* mục cuối: đã an toàn trong khoảng lịch sử, mặc định thu gọn */}
                {tab.history && historyRows.length > 0 && (
                  <Box>
                    <SectionHeader
                      label={`${tab.history.rowsTitle} (${historyRows.length})`}
                      hint={history ? rangeLabel(history) : undefined}
                      open={showHistoryRows}
                      onToggle={() => setShowHistoryRows((v) => !v)}
                    />

                    <Collapse in={showHistoryRows} unmountOnExit>
                      {historyRows.map((r) => (
                        <HistoryRow
                          key={rowKey(r.target)}
                          row={r}
                          mono={r.target.kind === 'machine'}
                          selected={r.target.kind === 'machine' && r.target.id === cur}
                          onClick={() => onHistoryRowClick(r.target)}
                          onPointerEnter={() => setListHover(
                            r.target.kind === 'machine' && floor.machines[r.target.id] ? r.target.id : null,
                          )}
                        />
                      ))}
                    </Collapse>
                  </Box>
                )}
              </Box>
            </>
          )}
        </Box>
      </GlassPanel>

      {/* "?": giải thích trạng thái + màu */}
      <Popover
        open={!!helpAnchor}
        anchorEl={helpAnchor}
        onClose={() => setHelpAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 1.5, maxWidth: 340, borderRadius: uiTokens.card.borderRadius } } }}
      >
        <Typography sx={{ mb: 1, fontSize: 13, fontWeight: 700 }}>
          Trạng thái và màu
        </Typography>
        {(tab.help ?? []).map((h) => (
          <Box key={h.chip.label} sx={{ display: 'grid', gridTemplateColumns: '128px 1fr', gap: 1, py: 0.6 }}>
            <Box><StatusChip chip={h.chip} /></Box>
            <Typography sx={{ fontSize: 12, lineHeight: 1.45, color: 'text.secondary' }}>
              {h.text}
            </Typography>
          </Box>
        ))}
      </Popover>
    </>
  )
}

// chip trạng thái bằng chữ: quá hạn nền đậm; còn lại nền nhạt; dashed = viền đứt
function StatusChip({ chip }: { chip: MonitorChip }) {
  return (
    <Box
      component="span"
      sx={(theme) => {
        const c = toneColor(chip.tone, theme.palette.mode === 'dark')
        const solid = chip.tone === 'critical'

        return {
          display: 'inline-block',
          px: 0.75,
          py: '1px',
          borderRadius: '10px',
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1.45,
          whiteSpace: 'nowrap',
          color: solid ? '#fff' : c,
          bgcolor: solid ? c : alpha(c, 0.12),
          border: `1px ${chip.dashed ? 'dashed' : 'solid'} ${chip.dashed ? c : 'transparent'}`,
        }
      }}
    >
      {chip.label}
    </Box>
  )
}

// ô số ở header panel phải: số lớn + nhãn 1 dòng, màu theo status; active = đang lọc (viền đậm)
function StatTile({
  tone,
  label,
  count,
  active,
  onClick,
}: {
  tone: MonitorTone
  label: string
  count: number
  active: boolean
  onClick?: () => void
}) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={active}
      title={active ? 'Bỏ lọc' : `Chỉ hiện: ${label}`}
      sx={(theme) => {
        const c = toneColor(tone, theme.palette.mode === 'dark')

        return {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          minWidth: 0,
          px: 0.9,
          py: 0.6,
          borderRadius: 1.5,
          border: active ? `2px solid ${c}` : '1px solid',
          borderColor: active ? c : count ? alpha(c, 0.35) : 'divider',
          // giữ kích thước khi viền dày lên
          m: active ? 0 : '1px',
          bgcolor: active ? alpha(c, 0.16) : count ? alpha(c, 0.07) : 'transparent',
          textAlign: 'left',
          '&:hover': { bgcolor: alpha(c, 0.13) },
          '& .v': { color: count ? c : 'text.disabled' },
        }
      }}
    >
      <Box component="span" className="v" sx={{ font: `700 18px/1.15 ${codeFontFamily}` }}>
        {count}
      </Box>
      {/* lưới 2×2 đủ rộng cho nhãn 1 dòng, không cắt chữ */}
      <Box component="span" sx={{ fontSize: 12, lineHeight: 1.3, color: 'text.secondary', whiteSpace: 'nowrap' }}>
        {label}
      </Box>
    </ButtonBase>
  )
}

// 1 dòng mục "Đã an toàn trong khoảng": mã máy / nhóm · area · HSE xác nhận dd/MM · số lỗi
function HistoryRow({
  row,
  mono,
  selected,
  onClick,
  onPointerEnter,
}: {
  row: MonitorHistoryRow
  mono: boolean
  selected: boolean
  onClick: () => void
  onPointerEnter: () => void
}) {
  return (
    <ButtonBase
      role="listitem"
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      sx={(theme) => {
        const c = toneColor('ok', theme.palette.mode === 'dark')

        return {
          width: '100%',
          minWidth: 0,
          mt: '2px',
          px: 1,
          py: 0.75,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          alignItems: 'center',
          gap: 1,
          borderRadius: 1.5,
          textAlign: 'left',
          bgcolor: selected ? alpha(c, 0.12) : 'transparent',
          '&:hover': { bgcolor: alpha(c, 0.08) },
        }
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          noWrap
          sx={mono ? { font: `700 13px ${codeFontFamily}` } : { fontSize: 13, fontWeight: 700 }}
        >
          {row.title}
        </Typography>
        {row.detail && (
          <Typography noWrap sx={{ fontSize: 11.5, color: 'text.secondary' }}>
            {row.detail}
          </Typography>
        )}
      </Box>
      <Typography sx={{ fontSize: 11.5, color: 'text.secondary', whiteSpace: 'nowrap' }}>
        {`${row.count} lỗi`}
      </Typography>
    </ButtonBase>
  )
}

// tiêu đề nhóm: tên + số + 1 dòng giải thích; bấm để thu gọn / mở
function SectionHeader({
  label,
  hint,
  open,
  onToggle,
}: {
  label: string
  hint?: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <ButtonBase
      onClick={onToggle}
      aria-expanded={open}
      sx={{
        width: '100%',
        mt: 1,
        px: 1,
        py: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        borderRadius: 1.5,
        textAlign: 'left',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: 11.5,
            fontWeight: 700,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '.04em',
          }}
        >
          {label}
        </Typography>
        {hint && (
          <Typography noWrap sx={{ fontSize: 11, color: 'text.disabled' }}>
            {hint}
          </Typography>
        )}
      </Box>
      <ExpandMoreRoundedIcon
        sx={{
          fontSize: 18,
          color: 'text.secondary',
          transition: 'transform .2s',
          transform: open ? 'rotate(180deg)' : 'none',
        }}
      />
    </ButtonBase>
  )
}

// 1 dòng danh sách (máy hoặc nhóm lỗi không gắn máy), mở rộng tại chỗ khi bấm.
// Dòng 1: mã + chip trạng thái + badge (> 1) ... chip risk. Dòng 2 (nhạt): area · PIC · mốc thời gian
function MonitorRow({
  rowRef,
  title,
  mono,
  mark,
  detail,
  selected,
  hovered,
  expanded,
  preview,
  onClick,
  onOpenDetail,
  onPointerEnter,
}: {
  rowRef: (el: HTMLDivElement | null) => void
  title: string
  mono: boolean
  mark: MachineMark | undefined
  detail?: string
  selected: boolean
  hovered: boolean
  expanded: boolean
  preview: MonitorPreviewItem[]
  onClick: () => void
  onOpenDetail: () => void
  onPointerEnter: () => void
}) {
  const tone = mark?.tone ?? 'none'

  return (
    <Box
      ref={rowRef}
      role="listitem"
      onPointerEnter={onPointerEnter}
      sx={(theme) => {
        const c = toneColor(tone, theme.palette.mode === 'dark')

        return {
          mt: '2px',
          borderRadius: 1.5,
          scrollMarginBlock: '8px',
          bgcolor: selected ? alpha(c, 0.12) : hovered ? alpha(c, 0.07) : 'transparent',
          boxShadow: hovered || expanded ? `inset 3px 0 0 ${c}` : 'none',
        }
      }}
    >
      <ButtonBase
        onClick={onClick}
        aria-expanded={expanded}
        title={mark?.sub}
        sx={(theme) => ({
          width: '100%',
          minHeight: 52,
          px: 1,
          py: 0.6,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          alignItems: 'center',
          gap: 1,
          borderRadius: 1.5,
          textAlign: 'left',
          '&:hover': { bgcolor: selected ? 'transparent' : alpha(toneColor(tone, theme.palette.mode === 'dark'), 0.07) },
        })}
      >
        <Box sx={{ minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            <Typography
              noWrap
              sx={mono
                ? { font: `700 13.5px ${codeFontFamily}`, flexShrink: 0 }
                : { fontSize: 13, fontWeight: 700, minWidth: 0, maxWidth: 140 }}
            >
              {title}
            </Typography>
            {mark?.chip && <StatusChip chip={mark.chip} />}
            {mark?.badge ? (
              <Box
                component="span"
                title={`${mark.badge} lỗi chưa đóng`}
                sx={(theme) => ({
                  minWidth: 18,
                  px: 0.5,
                  borderRadius: '9px',
                  textAlign: 'center',
                  color: '#fff',
                  font: `700 10.5px/17px ${codeFontFamily}`,
                  bgcolor: toneColor(tone, theme.palette.mode === 'dark'),
                })}
              >
                {mark.badge}
              </Box>
            ) : null}
          </Box>
          {detail && (
            <Typography noWrap sx={{ mt: 0.25, fontSize: 11.5, color: 'text.secondary' }}>
              {detail}
            </Typography>
          )}
        </Box>

        {mark?.level && (
          <Box
            component="span"
            title="Mức risk cao nhất"
            sx={(theme) => {
              const c = toneColor(mark.level!.strong ? 'critical' : 'warn', theme.palette.mode === 'dark')

              return {
                minWidth: 24,
                px: 0.5,
                borderRadius: '6px',
                textAlign: 'center',
                font: `700 10.5px/18px ${codeFontFamily}`,
                color: mark.level!.strong ? '#fff' : c,
                bgcolor: mark.level!.strong ? c : alpha(c, 0.14),
              }
            }}
          >
            {mark.level.label}
          </Box>
        )}
      </ButtonBase>

      {/* mở rộng: từng lỗi chưa đóng + "Xem chi tiết" */}
      <Collapse in={expanded} unmountOnExit>
        <Box sx={{ px: 1, pb: 1 }}>
          {preview.map((p) => (
            <Box
              key={p.id}
              sx={{ py: 0.6, borderTop: '1px dashed', borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                <StatusChip chip={p.chip} />
                <Typography noWrap sx={{ flex: 1, minWidth: 0, fontSize: 12.5 }} title={p.text}>
                  {p.text}
                </Typography>
              </Box>
              {p.meta && (
                <Typography noWrap sx={{ mt: 0.25, fontSize: 11.5, color: 'text.secondary' }}>
                  {p.meta}
                </Typography>
              )}
            </Box>
          ))}

          <AppButton
            onClick={onOpenDetail}
            endIcon={<ChevronRightRoundedIcon sx={{ fontSize: 18 }} />}
            sx={{ mt: 0.5, height: 28 }}
          >
            Xem chi tiết
          </AppButton>
        </Box>
      </Collapse>
    </Box>
  )
}
