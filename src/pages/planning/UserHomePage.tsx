import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Alert, Box, Button, Snackbar, useMediaQuery } from '@mui/material'
import type { PaletteMode, Theme } from '@mui/material/styles'
import { SpeedRounded } from '@mui/icons-material'

import { PageHeader } from '../../components/common/PageHeader'
import { PageShell } from '../../components/common/PageShell'
import { FindPageButton } from '../../components/userHome/FindPageButton'
import { GraphicsQualityButton, type RenderSize } from '../../components/userHome/graphics/GraphicsQualityButton'
import {
  detectGpu,
  GRAPHICS_PROFILES,
  loadGraphicsSetting,
  lowerLevel,
  resolveGraphicsLevel,
  saveGraphicsSetting,
  type GraphicsLevel,
  type GraphicsSetting,
} from '../../components/userHome/graphics/graphicsQuality'
import { UserHomeBackdrop } from '../../components/userHome/UserHomeBackdrop'
import { buildHomeMenu } from '../../components/userHome/userHomeMenu'
import { UserHomeTopBar } from '../../components/userHome/UserHomeTopBar'
import { UserHomeRack } from '../../components/userHome/warehouse/UserHomeRack'
import { loadWarehouse3D } from '../../components/userHome/warehouse3d/loadWarehouse3D'
import { Warehouse3DLoading } from '../../components/userHome/warehouse3d/Warehouse3DLoading'
import { WebGLBoundary } from '../../components/userHome/warehouse3d/WebGLBoundary'
import { useI18n } from '../../i18n/useI18n'
import { appScrollbarSx } from '../../theme/scrollbarStyle'

// Chunk riêng: three.js chỉ tải khi thật sự dùng bản 3D (thường đã được tải trước lúc rê chuột vào menu)
const UserHomeWarehouse3D = lazy(loadWarehouse3D)

// Dưới ngưỡng này (FPS trung vị lúc thả hàng) thì coi là chưa mượt
const SLOW_FPS = 30
const TOAST_MS = 12000
// Chân tường nền xưởng khi chưa có kệ 3D báo tầm mắt (kệ 2D / đang tải), và giới hạn khi kệ 3D báo
const DEFAULT_HORIZON = 62
const HORIZON_RANGE: [number, number] = [40, 70]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// Cảnh thả hàng chỉ chạy ở lần đầu vào trang trong phiên. Trang chủ được giữ lại
// (KeepAliveOutlet) nhưng vẫn có thể bị bỏ khi mở quá nhiều trang; lúc dựng lại thì
// hàng nằm sẵn trên kệ, không phát lại hoạt cảnh ~1.5s.
let introPlayed = false

interface UserHomePageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

type QualityToast =
  | { kind: 'suggest'; target: GraphicsLevel }
  | { kind: 'lowered'; target: GraphicsLevel; previous: GraphicsSetting }

/*
 * Trang chủ kiểu kho hàng: thanh điều khiển LED phía trên (người dùng, giờ + ca, việc hôm nay),
 * kệ hàng đứng trên sàn xưởng, băng rôn An toàn / 5S hai bên khi đủ rộng.
 * Từ md trở lên mọi thứ nằm gọn trong 1 khung; màn hình nhỏ thì cho cuộn.
 * Kệ: 2D (CSS) hoặc WebGL theo mức đồ hoạ người dùng chọn (nút "Đồ hoạ" trên header, mặc định Tự động).
 */
export function UserHomePage({ mode, onToggleMode }: UserHomePageProps) {
  const { t } = useI18n()
  const g = t.userHome.graphics

  const dark = mode === 'dark'
  const menu = useMemo(() => buildHomeMenu(), [])
  const [gpu] = useState(detectGpu)
  const wide = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'))
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const [setting, setSetting] = useState<GraphicsSetting>(loadGraphicsSetting)
  // Đã đổi mức trong phiên này -> dựng lại kệ 3D không phát lại cảnh thả hàng
  const [qualityChanged, setQualityChanged] = useState(false)
  const [firstVisit] = useState(() => !introPlayed)
  useEffect(() => {
    introPlayed = true
  }, [])
  const [renderSize, setRenderSize] = useState<RenderSize | null>(null)
  // Chân tường của nền xưởng (% chiều cao khung) = tầm mắt camera kệ 3D, để kệ và xưởng cùng phối cảnh
  const frameRef = useRef<HTMLDivElement>(null)
  const [horizon, setHorizon] = useState(DEFAULT_HORIZON)
  const handleHorizon = useCallback((clientY: number) => {
    const rect = frameRef.current?.getBoundingClientRect()
    if (!rect || rect.height === 0) return
    const percent = ((clientY - rect.top) / rect.height) * 100
    setHorizon(Math.round(clamp(percent, HORIZON_RANGE[0], HORIZON_RANGE[1]) * 2) / 2)
  }, [])
  const [toast, setToast] = useState<QualityToast | null>(null)
  const slowHandled = useRef(false)

  const level = resolveGraphicsLevel(setting, { gpu, reduceMotion, wide })
  const levelName = (value: GraphicsLevel) => g.levels[value].name

  function changeSetting(next: GraphicsSetting) {
    setSetting(next)
    setQualityChanged(true)
    saveGraphicsSetting(next)
  }

  // Chỉ xử lý 1 lần mỗi phiên. Tự động: tự hạ 1 bậc (có Hoàn tác); chọn tay: chỉ gợi ý
  function handleMeasured(fps: number) {
    if (slowHandled.current || fps >= SLOW_FPS || level === 'flat') return
    slowHandled.current = true
    const target = lowerLevel(level)
    if (setting === 'auto') {
      changeSetting(target)
      setToast({ kind: 'lowered', target, previous: setting })
    } else {
      setToast({ kind: 'suggest', target })
    }
  }

  const cssRack = <UserHomeRack menu={menu} dark={dark} />
  const rack = level === 'flat'
    ? cssRack
    : (
      <WebGLBoundary fallback={cssRack}>
        <Suspense fallback={<Warehouse3DLoading dark={dark} />}>
          <UserHomeWarehouse3D
            menu={menu}
            dark={dark}
            profile={GRAPHICS_PROFILES[level]}
            intro={firstVisit && !qualityChanged}
            onMeasured={handleMeasured}
            onRenderSize={setRenderSize}
            onHorizon={handleHorizon}
          />
        </Suspense>
      </WebGLBoundary>
    )

  return (
    <PageShell>
      <PageHeader
        title={t.userHome.title}
        subtitle={t.userHome.subtitle}
        mode={mode}
        onToggleMode={onToggleMode}
        actions={(
          <>
          <FindPageButton />
          <GraphicsQualityButton
            setting={setting}
            level={level}
            gpu={gpu}
            wide={wide}
            reduceMotion={reduceMotion}
            renderSize={renderSize}
            onChange={changeSetting}
          />
          </>
        )}
      />

      <Box
        ref={frameRef}
        sx={{
          position: 'relative',
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
          borderRadius: 2.5,
          isolation: 'isolate',
          border: `1px solid ${dark ? 'rgba(140, 190, 230, 0.2)' : 'rgba(60, 95, 130, 0.18)'}`,
        }}
      >
        <UserHomeBackdrop dark={dark} horizon={level === 'flat' ? DEFAULT_HORIZON : horizon} />

        <Box
          sx={{
            ...appScrollbarSx,
            position: 'relative',
            zIndex: 1,
            height: '100%',
            overflowX: 'hidden',
            overflowY: { xs: 'auto', md: 'hidden' },
          }}
        >
          <Box
            sx={{
              height: { xs: 'auto', md: '100%' },
              minHeight: { xs: 900, md: 0 },
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 2, md: 2.5 },
              px: { xs: 1.5, sm: 2.5, md: 3.5 },
              pt: { xs: 2, md: 2.5 },
              pb: { xs: 2, md: 3 },
            }}
          >
            {/* Người dùng + giờ / ca + việc hôm nay gộp trong 1 thanh; phần còn lại cho kệ hàng */}
            <UserHomeTopBar />

            {rack}
          </Box>
        </Box>
      </Box>

      {/* Máy chạy chưa mượt: tự hạ (Tự động) hoặc gợi ý hạ (chọn tay) */}
      <Snackbar
        open={toast !== null}
        autoHideDuration={TOAST_MS}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setToast(null)
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          icon={<SpeedRounded />}
          severity="info"
          variant="filled"
          onClose={() => setToast(null)}
          action={toast && (
            toast.kind === 'suggest' ? (
              <>
                <Button color="inherit" size="small" onClick={() => setToast(null)}>{g.dismiss}</Button>
                <Button
                  color="inherit"
                  size="small"
                  sx={{ fontWeight: 800 }}
                  onClick={() => {
                    changeSetting(toast.target)
                    setToast(null)
                  }}
                >
                  {g.switchTo}
                </Button>
              </>
            ) : (
              <Button
                color="inherit"
                size="small"
                sx={{ fontWeight: 800 }}
                onClick={() => {
                  changeSetting(toast.previous)
                  setToast(null)
                }}
              >
                {g.undo}
              </Button>
            )
          )}
          sx={{ alignItems: 'center', boxShadow: 6 }}
        >
          {toast && (toast.kind === 'suggest' ? g.slowSuggest(levelName(toast.target)) : g.autoLowered(levelName(toast.target)))}
        </Alert>
      </Snackbar>
    </PageShell>
  )
}
