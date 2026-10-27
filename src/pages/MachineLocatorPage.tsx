import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import {
  Box,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import type { PaletteMode } from '@mui/material'
import {
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import { AppButton } from '../components/common/AppButton'
import { GlassPanel } from '../components/common/GlassPanel'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { EditToolbar } from '../components/machineLocator/EditToolbar'
import { FitToastBar } from '../components/machineLocator/FitToastBar'
import { MachineDataFooter } from '../components/machineLocator/MachineDataFooter'
import {
  MachineInfo,
  PanelButton,
} from '../components/machineLocator/MachineInfo'
import { MachineLocatorHelp } from '../components/machineLocator/MachineLocatorHelp'
import {
  MachineList,
  type ElsewhereMatch,
} from '../components/machineLocator/MachineList'
import { MapCanvas } from '../components/machineLocator/MapCanvas'
import {
  codeFontFamily,
  mapColors,
} from '../components/machineLocator/machineLocatorColors'
import { useMachineLocator } from '../hooks/useMachineLocator'
import { useStableCallback } from '../hooks/useStableCallback'
import { hasAnyRole } from '../services/authService'
import {
  listFloors,
  loadMachineStore,
} from '../services/machineLocatorService'
import { uiTokens } from '../theme/uiTokens'
import type { MachineLayoutConfig } from '../types/machineLocator'
import {
  compareCodes,
  matchesMachineFilter,
  matchesQuery,
} from '../utils/machineLocatorGeometry'
import {
  loadPreference,
  savePreference,
} from '../utils/uiPreferences'

interface MachineLocatorPageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

const PREF_LAYOUT = 'machine-locator:layout'
// đã tự mở hướng dẫn lần đầu
const PREF_HELP_SEEN = 'machine-locator:helpSeen'
const DEFAULT_MACHINE_LAYOUT_ID = 'factory-b-f1'

interface OtherLayoutCodes {
  id: string
  name: string
  codes: string[]
}

export function MachineLocatorPage({
  mode,
  onToggleMode,
}: MachineLocatorPageProps) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Tab layout lấy từ server (GET /floors); null = đang tải
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
    ?? findLayout(DEFAULT_MACHINE_LAYOUT_ID)
    ?? layouts?.[0]
  const layoutId = layout?.id

  useEffect(() => {
    if (layoutId) savePreference(PREF_LAYOUT, layoutId)
  }, [layoutId])

  // Mã máy của các layout khác (bản mới nhất trên server) để gợi ý khi tìm mã không có ở layout đang mở
  const [allCodes, setAllCodes] = useState<Record<string, string[]>>({})

  useEffect(() => {
    if (!layouts || !layoutId) return

    let alive = true

    Promise.all(layouts.filter((l) => l.id !== layoutId).map(async (l): Promise<[string, string[]]> => {
      try {
        return [l.id, Object.keys((await loadMachineStore(l)).data.m)]
      } catch {
        return [l.id, []]
      }
    })).then((entries) => {
      if (alive) setAllCodes(Object.fromEntries(entries))
    })

    return () => {
      alive = false
    }
  }, [layouts, layoutId])

  const otherLayouts: OtherLayoutCodes[] = (layouts ?? [])
    .filter((l) => l.id !== layoutId)
    .map((l) => ({ id: l.id, name: l.name, codes: allCodes[l.id] ?? [] }))

  // Thay đổi chưa lưu của layout đang mở (view báo lên) -> hỏi trước khi chuyển tab
  const dirtyCode = useRef<string | null>(null)
  const [pending, setPending] = useState<{ layoutId: string, code?: string, dirty: string } | null>(null)

  const onDirtyChange = useStableCallback((code: string | null) => {
    dirtyCode.current = code
  })

  function switchLayout(id: string, code?: string) {
    // đổi search (và hash nếu mở kèm máy) trong cùng trang, không reload
    navigate(
      { search: `?layout=${encodeURIComponent(id)}`, hash: code ? `#${code}` : '' },
      { replace: true },
    )
  }

  const requestSwitch = useStableCallback((id: string, code?: string) => {
    if (id === layoutId) return

    if (dirtyCode.current) {
      setPending({ layoutId: id, code, dirty: dirtyCode.current })
      return
    }

    switchLayout(id, code)
  })

  if (!layout) {
    return (
      <PageShell>
        <PageHeader
          title="Machine Locator"
          subtitle="Vị trí máy"
          mode={mode}
          onToggleMode={onToggleMode}
        />

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
      <PageHeader
        title="Machine Locator"
        subtitle={`Vị trí máy — ${layout.name}`}
        bottom={(
          <Tabs
            value={layout.id}
            onChange={(_, v: string) => requestSwitch(v)}
            variant="scrollable"
            scrollButtons={false}
            sx={{
              minHeight: 32,
              '& .MuiTab-root': {
                minHeight: 32,
                py: 0.5,
                px: 2,
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'none',
              },
            }}
          >
            {(layouts ?? []).map((l) => (
              <Tab key={l.id} value={l.id} label={l.name} />
            ))}
          </Tabs>
        )}
        mode={mode}
        onToggleMode={onToggleMode}
      />

      {/* key: đổi layout thì bỏ chọn máy, xoá ô tìm, fit lại bản đồ */}
      <MachineLocatorView
        key={layout.id}
        layout={layout}
        otherLayouts={otherLayouts}
        onDirtyChange={onDirtyChange}
        onOpenElsewhere={requestSwitch}
      />

      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        slotProps={{ paper: { sx: { borderRadius: uiTokens.dialog.borderRadius } } }}
      >
        <DialogTitle sx={{ fontSize: uiTokens.dialogTypography.titleFontSize, fontWeight: 700 }}>
          Chuyển layout?
        </DialogTitle>
        <DialogContent sx={{ fontSize: 13 }}>
          Thay đổi chưa lưu của {pending?.dirty} sẽ bị bỏ nếu chuyển sang
          {' '}{findLayout(pending?.layoutId)?.name}.
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton onClick={() => setPending(null)}>
            Ở lại
          </AppButton>
          <AppButton
            appearance="destructive"
            onClick={() => {
              if (pending) switchLayout(pending.layoutId, pending.code)
              dirtyCode.current = null
              setPending(null)
            }}
          >
            Bỏ thay đổi và chuyển
          </AppButton>
        </DialogActions>
      </Dialog>
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

interface MachineLocatorViewProps {
  layout: MachineLayoutConfig
  otherLayouts: OtherLayoutCodes[]
  onDirtyChange: (code: string | null) => void
  onOpenElsewhere: (layoutId: string, code: string) => void
}

function MachineLocatorView({
  layout,
  otherLayouts,
  onDirtyChange,
  onOpenElsewhere,
}: MachineLocatorViewProps) {
  const ml = useMachineLocator(layout, hasAnyRole(['ADMIN']))

  const codes = Object.keys(ml.machines).sort(compareCodes)
  const nLoc = codes.reduce((a, c) => a + ml.machines[c].boxes.length, 0)
  const nMan = codes.filter((c) => ml.machines[c].manual).length

  const dirtyCode = ml.dirtyLabel

  useEffect(() => {
    onDirtyChange(dirtyCode)
  }, [dirtyCode, onDirtyChange])

  useEffect(() => () => onDirtyChange(null), [onDirtyChange])

  // Gõ mã không có ở layout này nhưng có ở layout khác -> gợi ý mở layout đó
  const q = ml.query.trim()
  const elsewhere: ElsewhereMatch[] = q && !codes.some((c) => matchesQuery(c, q))
    ? otherLayouts
      .flatMap((l) => l.codes
        .filter((c) => matchesQuery(c, q))
        .map((c) => ({ code: c, layoutId: l.id, layoutName: l.name })))
      .sort((a, b) => compareCodes(a.code, b.code))
      .slice(0, 3)
    : []

  // Callback cố định để MapCanvas / MachineList (memo) không render lại theo trang
  const onDimBackgroundChange = useStableCallback(ml.setDimBackground)
  const onToggleGroup = useStableCallback(ml.toggleGroup)
  const onClearSelection = useStableCallback(ml.clearSelection)
  const onCadOutlineChange = useStableCallback(ml.setCadOutline)
  const onZoomOnSelectChange = useStableCallback(ml.setZoomOnSelect)
  const onSelectBox = useStableCallback((c: string, keepView: boolean) => ml.select(c, { keepView }))
  const onActivate = useStableCallback(ml.setAct)
  const onBoxChange = useStableCallback(ml.updateBox)
  const onDrawComplete = useStableCallback(ml.completeDraw)
  const onGestureStart = useStableCallback(ml.beginBoxGesture)
  const onGestureEnd = useStableCallback(ml.endBoxGesture)
  const onPickFitMode = useStableCallback(ml.chooseFitMode)
  const onRefine = useStableCallback(ml.refineFit)
  const onFitClick = useStableCallback(ml.fitAtPoint)
  const onStroke = useStableCallback(ml.strokeFit)
  const onOutlineChange = useStableCallback(ml.updateOutline)
  const onVertexDrop = useStableCallback(ml.snapVertex)
  const onTuneFit = useStableCallback(ml.tuneFit)
  const onAcceptFit = useStableCallback(ml.acceptFit)
  const onRejectFit = useStableCallback(ml.rejectFit)
  const onTidyLevel = useStableCallback(ml.setTidyLevel)
  const onAcceptTidy = useStableCallback(ml.acceptTidy)
  const onRejectTidy = useStableCallback(ml.rejectTidy)
  const onSelectFromList = useStableCallback((c: string) => ml.select(c))
  const onStartNew = useStableCallback(ml.startNew)

  // rê chuột trên danh sách -> khung trên bản đồ hiện hover
  const [listHover, setListHover] = useState<string | null>(null)
  const onListHover = useStableCallback(setListHover)

  // Hướng dẫn: nút "?" / phím ?; lần đầu mở trang (chưa có cờ) tự mở 1 lần
  const [helpOpen, setHelpOpen] = useState(() => loadPreference(PREF_HELP_SEEN) !== true)

  useEffect(() => {
    if (helpOpen) savePreference(PREF_HELP_SEEN, true)
  }, [helpOpen])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey) return

      const el = document.activeElement as HTMLInputElement | null
      const tag = el?.tagName

      // đang gõ chữ (thanh trượt / công tắc không tính)
      if (tag === 'TEXTAREA' || el?.isContentEditable
        || (tag === 'INPUT' && el?.type !== 'range' && el?.type !== 'checkbox')) return

      e.preventDefault()
      setHelpOpen(true)
    }

    document.addEventListener('keydown', onKeyDown)

    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!ml.ready) {
    return (
      <LoadState
        text={ml.loaded ? ml.status.t : 'Đang tải dữ liệu từ server…'}
        error={ml.loaded}
        onRetry={ml.loaded ? ml.reloadFloor : undefined}
      />
    )
  }

  return (
    <GlassPanel
      sx={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        display: 'grid',
        gridTemplateColumns: '1fr 300px',

        '@media (max-width: 760px)': {
          gridTemplateColumns: '1fr',
          gridTemplateRows: '55vh 1fr',
          overflowY: 'auto',
        },
      }}
    >
      <MapCanvas
        layout={layout}
        data={ml.data}
        machines={ml.machines}
        canWrite={ml.canWrite}
        cur={ml.cur}
        act={ml.act}
        editing={ml.editing}
        drawMode={ml.drawMode}
        draftBoxes={ml.draft?.boxes ?? null}
        hint={ml.hint}
        reveal={ml.reveal}
        groups={ml.groups}
        listHover={listHover}
        zoomOnSelect={ml.zoomOnSelect}
        cadOutline={ml.cadOutline}
        dimBackground={ml.dimBackground}
        onToggleGroup={onToggleGroup}
        onDimBackgroundChange={onDimBackgroundChange}
        onCadOutlineChange={onCadOutlineChange}
        onZoomOnSelectChange={onZoomOnSelectChange}
        onSelectBox={onSelectBox}
        onClearSelection={onClearSelection}
        onActivate={onActivate}
        onBoxChange={onBoxChange}
        onDrawComplete={onDrawComplete}
        onGestureStart={onGestureStart}
        onGestureEnd={onGestureEnd}
        fittingIdx={ml.fittingIdx}
        warnIdx={ml.warnIdx}
        fitPreviewIdx={ml.fitPreviewIdx}
        activeFitMode={ml.activeFitMode}
        onPickFitMode={onPickFitMode}
        onRefine={onRefine}
        fitTool={ml.fitTool}
        onFitClick={onFitClick}
        onStroke={onStroke}
        onOutlineChange={onOutlineChange}
        onVertexDrop={onVertexDrop}
        fitTightness={ml.fitTightness}
        fitOrtho={ml.fitOrtho}
        fitGap={ml.fitGap}
        fitGhost={ml.fitGhost}
        onTuneFit={onTuneFit}
        onAcceptFit={onAcceptFit}
        onRejectFit={onRejectFit}
        tidyPreview={ml.tidyPreview}
        tidyLevel={ml.tidyLevel}
        onTidyLevel={onTidyLevel}
        onAcceptTidy={onAcceptTidy}
        onRejectTidy={onRejectTidy}
      />

      <FitToastBar ml={ml} />

      <Box
        component="aside"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          borderLeft: '1px solid',
          borderColor: 'divider',

          '@media (max-width: 760px)': {
            borderLeft: 0,
            borderTop: '1px solid',
            borderTopColor: 'divider',
          },
        }}
      >
        <Box sx={{ px: 1.75, pt: 1.5, pb: 1.25 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
              Vị trí máy
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <EditToolbar ml={ml} />

              <Tooltip title="Hướng dẫn (?)">
                <PanelButton
                  compact
                  aria-label="Hướng dẫn"
                  icon={<HelpOutlineRoundedIcon sx={{ fontSize: 18 }} />}
                  onClick={() => setHelpOpen(true)}
                />
              </Tooltip>
            </Box>
          </Box>

          <Typography sx={{ mt: 0.25, fontSize: 12, color: 'text.secondary' }}>
            {`${codes.length} mã máy, ${nLoc} vị trí`}
            {nMan ? `, ${nMan} mã đã chỉnh tay` : ''}
          </Typography>

          <TextField
            fullWidth
            size="small"
            type="search"
            value={ml.query}
            placeholder="Tìm mã, ví dụ 1443"
            autoComplete="off"
            onChange={(e) => ml.setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                ml.selectFirst(codes.filter((c) =>
                  matchesMachineFilter(c, ml.machines, ml.query, ml.groups, ml.canWrite)))
              }
            }}
            slotProps={{ htmlInput: { 'aria-label': 'Tìm mã máy' } }}
            sx={{
              mt: 1.25,
              '& .MuiInputBase-input': {
                fontFamily: codeFontFamily,
                fontSize: 14,
              },
            }}
          />

          {ml.canWrite && (
            <FormControlLabel
              sx={{
                mt: 0.75,
                mr: 0,
                '& .MuiFormControlLabel-label': { fontSize: 12.5 },
                '& .MuiCheckbox-root': { p: 0.5 },
              }}
              control={(
                <Checkbox
                  size="small"
                  checked={ml.reviewOnly}
                  onChange={(e) => ml.setReviewOnly(e.target.checked)}
                />
              )}
              label={(
                <>
                  Chỉ hiện máy cần soát
                  <Box component="span" sx={{ ml: 0.75, fontWeight: 700, color: mapColors.review }}>
                    Cần soát: {ml.reviewCount}
                  </Box>
                </>
              )}
            />
          )}
        </Box>

        <MachineList
          machines={ml.machines}
          base={ml.base}
          cur={ml.cur}
          query={ml.query}
          canWrite={ml.canWrite}
          groups={ml.groups}
          elsewhere={elsewhere}
          onSelect={onSelectFromList}
          onStartNew={onStartNew}
          onOpenElsewhere={onOpenElsewhere}
          onHover={onListHover}
        />

        <MachineInfo ml={ml} />

        <MachineDataFooter ml={ml} />
      </Box>

      <MachineLocatorHelp open={helpOpen} canWrite={ml.canWrite} onClose={() => setHelpOpen(false)} />
    </GlassPanel>
  )
}
