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
import { MachineInfo } from '../components/machineLocator/MachineInfo'
import {
  MachineList,
  type ElsewhereMatch,
} from '../components/machineLocator/MachineList'
import { MapCanvas } from '../components/machineLocator/MapCanvas'
import {
  codeFontFamily,
  mapColors,
} from '../components/machineLocator/machineLocatorColors'
import {
  DEFAULT_MACHINE_LAYOUT_ID,
  machineLayouts,
} from '../config/machineLocatorLayouts'
import { useMachineLocator } from '../hooks/useMachineLocator'
import { useStableCallback } from '../hooks/useStableCallback'
import { hasAnyRole } from '../services/authService'
import { loadMachineStore } from '../services/machineLocatorService'
import { uiTokens } from '../theme/uiTokens'
import type { MachineLayoutConfig } from '../types/machineLocator'
import {
  buildBaseBoxes,
  buildEffectiveMachines,
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

interface OtherLayoutCodes {
  id: string
  name: string
  codes: string[]
}

function findLayout(id: unknown): MachineLayoutConfig | undefined {
  return machineLayouts.find((l) => l.id === id)
}

export function MachineLocatorPage({
  mode,
  onToggleMode,
}: MachineLocatorPageProps) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // ?layout=… > tab mở gần nhất > Fac B
  const layout =
    findLayout(searchParams.get('layout'))
    ?? findLayout(loadPreference(PREF_LAYOUT))
    ?? findLayout(DEFAULT_MACHINE_LAYOUT_ID)
    ?? machineLayouts[0]

  useEffect(() => {
    savePreference(PREF_LAYOUT, layout.id)
  }, [layout.id])

  // Mã máy của mọi layout (bản đã lưu mới nhất) để gợi ý khi tìm mã không có ở layout đang mở
  const [allCodes, setAllCodes] = useState<Record<string, string[]>>({})

  useEffect(() => {
    let alive = true

    Promise.all(machineLayouts.map(async (l): Promise<[string, string[]]> => {
      try {
        const s = await loadMachineStore(l)

        return [l.id, Object.keys(buildEffectiveMachines(s.data, buildBaseBoxes(s.data), s.edits, null))]
      } catch {
        return [l.id, Object.keys(l.data.m)]
      }
    })).then((entries) => {
      if (alive) setAllCodes(Object.fromEntries(entries))
    })

    return () => {
      alive = false
    }
  }, [layout.id])

  const otherLayouts: OtherLayoutCodes[] = machineLayouts
    .filter((l) => l.id !== layout.id)
    .map((l) => ({ id: l.id, name: l.name, codes: allCodes[l.id] ?? [] }))

  // Thay đổi chưa lưu của layout đang mở (view báo lên) -> hỏi trước khi chuyển tab
  const dirtyCode = useRef<string | null>(null)
  const [pending, setPending] = useState<{ layoutId: string, code?: string, dirty: string } | null>(null)

  const onDirtyChange = useStableCallback((code: string | null) => {
    dirtyCode.current = code
  })

  function switchLayout(layoutId: string, code?: string) {
    // đổi search (và hash nếu mở kèm máy) trong cùng trang, không reload
    navigate(
      { search: `?layout=${encodeURIComponent(layoutId)}`, hash: code ? `#${code}` : '' },
      { replace: true },
    )
  }

  const requestSwitch = useStableCallback((layoutId: string, code?: string) => {
    if (layoutId === layout.id) return

    if (dirtyCode.current) {
      setPending({ layoutId, code, dirty: dirtyCode.current })
      return
    }

    switchLayout(layoutId, code)
  })

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
            {machineLayouts.map((l) => (
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

            <EditToolbar ml={ml} />
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
    </GlassPanel>
  )
}
