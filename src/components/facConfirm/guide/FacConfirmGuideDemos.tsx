import {
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'

import LockRoundedIcon from '@mui/icons-material/LockRounded'
import PauseRoundedIcon from '@mui/icons-material/PauseRounded'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'

import {
  alpha,
  Box,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'

import {
  FAC_CONFIRM_PROCESS_CONFIG,
} from '../../../config/facConfirmProcessConfig'


// Demo minh họa công đoạn Rough (To Drill / To Heat)
// => dùng đúng màu Rough của bảng thật.
const PROCESS_COLOR =
  FAC_CONFIRM_PROCESS_CONFIG.Rough.getColor


// =========================================================
// DEMO SHELL
//
// Tự chuyển khung hình theo chu kỳ.
// Bấm chấm tròn để xem một khung cụ thể (dừng tự chạy).
// Nút ⏸/▶ để dừng / chạy tiếp.
// =========================================================

const FRAME_MS = 1600

interface DemoShellProps {
  captions: string[]
  height?: number
  children: (frame: number) => ReactNode
}

function DemoShell({
  captions,
  height = 150,
  children,
}: DemoShellProps) {

  const [frame, setFrame] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) {
      return
    }

    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % captions.length)
    }, FRAME_MS)

    return () => window.clearInterval(id)
  }, [paused, captions.length])

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: 'relative',
          p: 1.5,
          height,
          overflow: 'hidden',
        }}
      >
        {children(frame)}
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          px: 1.5,
          py: 0.75,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <IconButton
          size="small"
          aria-label={paused ? 'Chạy tiếp minh họa' : 'Tạm dừng minh họa'}
          onClick={() => setPaused((p) => !p)}
          sx={{ p: 0.25, ml: -0.5 }}
        >
          {paused
            ? <PlayArrowRoundedIcon sx={{ fontSize: 18 }} />
            : <PauseRoundedIcon sx={{ fontSize: 18 }} />}
        </IconButton>

        <Typography
          variant="caption"
          aria-live="polite"
          sx={{ flex: 1, fontWeight: 600 }}
        >
          {frame + 1}. {captions[frame]}
        </Typography>

        <Stack direction="row" spacing={0.5}>
          {captions.map((caption, i) => (
            <Box
              key={caption}
              component="button"
              type="button"
              aria-label={`Xem bước ${i + 1}: ${caption}`}
              onClick={() => {
                setFrame(i)
                setPaused(true)
              }}
              sx={{
                width: 8,
                height: 8,
                p: 0,
                border: 0,
                borderRadius: '50%',
                cursor: 'pointer',
                bgcolor: i === frame ? 'primary.main' : 'action.disabled',
                '&:focus-visible': {
                  outline: 2,
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            />
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}


// =========================================================
// SHARED: ô bảng mini
// =========================================================

const COLS = ['Item', 'To Drill', 'To Heat']
const ITEMS = ['A-1023', 'A-1024', 'A-1025']
const VALUE = '05/10 08:30'

interface MiniCellProps {
  children?: ReactNode
  selected?: boolean
  edited?: boolean
  dashed?: boolean
  locked?: boolean
  handle?: boolean
}

function MiniCell({
  children,
  selected,
  edited,
  dashed,
  locked,
  handle,
}: MiniCellProps) {

  const theme = useTheme()
  const reduceMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  return (
    <Box
      sx={{
        position: 'relative',
        px: 1,
        height: 26,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        fontSize: 12,
        borderTop: 1,
        borderColor: 'divider',
        color: locked ? 'text.disabled' : 'text.primary',
        bgcolor: edited
          ? alpha(PROCESS_COLOR(theme), 0.22)
          : 'transparent',
        outline: selected
          ? `2px solid ${theme.palette.primary.main}`
          : dashed
            ? `1px dashed ${theme.palette.primary.main}`
            : 'none',
        outlineOffset: -2,
        transition: reduceMotion ? 'none' : 'background-color 250ms ease',
      }}
    >
      {locked && <LockRoundedIcon sx={{ fontSize: 12 }} />}
      {children}

      {handle && (
        <Box
          sx={{
            position: 'absolute',
            right: -3,
            bottom: -3,
            width: 7,
            height: 7,
            bgcolor: 'primary.main',
            border: 1,
            borderColor: 'background.paper',
            zIndex: 1,
          }}
        />
      )}
    </Box>
  )
}

function MiniHeader({ highlight }: { highlight: boolean }) {
  const theme = useTheme()

  return (
    <>
      {COLS.map((col, i) => {
        const active = highlight && i > 0

        return (
          <Box
            key={col}
            sx={{
              px: 1,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: active ? PROCESS_COLOR(theme) : 'text.secondary',
              bgcolor: active
                ? alpha(PROCESS_COLOR(theme), 0.14)
                : 'action.hover',
            }}
          >
            {col}
          </Box>
        )
      })}
    </>
  )
}

const gridSx = {
  display: 'grid',
  gridTemplateColumns: '0.9fr 1.1fr 1.1fr',
  border: 1,
  borderColor: 'divider',
  borderRadius: 1,
  overflow: 'hidden',
  bgcolor: 'background.paper',
} as const


// =========================================================
// BƯỚC 9: NHẬP THỜI GIAN
// =========================================================

const EDIT_CAPTIONS = [
  'Tiêu đề cột của công đoạn được tô sáng',
  'Nhấp đúp vào ô cần nhập',
  'Chọn ngày giờ rồi bấm OK',
  'Ô vừa sửa được tô màu',
  'Kéo góc ô để chép xuống dưới',
]

export function FacConfirmEditDemo() {
  return (
    <DemoShell captions={EDIT_CAPTIONS}>
      {(f) => {
        const editedRows =
          f >= 4 ? [0, 1, 2] : f >= 3 ? [0] : []

        return (
          <>
            <Box sx={gridSx}>
              <MiniHeader highlight />

              {ITEMS.map((item, row) => {
                const edited = editedRows.includes(row)

                return [
                  <MiniCell key={`${item}-i`}>{item}</MiniCell>,

                  <MiniCell
                    key={`${item}-d`}
                    selected={row === 0 && f >= 1 && f <= 3}
                    handle={row === 0 && f === 3}
                    dashed={f === 4 && row > 0}
                    edited={edited}
                  >
                    {edited ? VALUE : ''}
                  </MiniCell>,

                  <MiniCell
                    key={`${item}-h`}
                    locked={row === 0}
                  >
                    {row === 0 ? '04/10 16:00' : ''}
                  </MiniCell>,
                ]
              })}
            </Box>

            {/* Popup chọn ngày giờ */}
            {f === 2 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 70,
                  left: '36%',
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  boxShadow: 6,
                  border: 1,
                  borderColor: 'divider',
                  fontSize: 12,
                  zIndex: 2,
                }}
              >
                <Box
                  sx={{
                    px: 1,
                    py: 0.5,
                    border: 1,
                    borderColor: 'primary.main',
                    borderRadius: 0.75,
                    mb: 0.75,
                  }}
                >
                  05/10/2026 08:30
                </Box>

                <Stack
                  direction="row"
                  spacing={0.75}
                  sx={{ justifyContent: 'flex-end' }}
                >
                  <Box sx={{ px: 1, py: 0.25, color: 'text.secondary' }}>
                    Cancel
                  </Box>
                  <Box
                    sx={{
                      px: 1.25,
                      py: 0.25,
                      borderRadius: 0.75,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      fontWeight: 600,
                    }}
                  >
                    OK
                  </Box>
                </Stack>
              </Box>
            )}
          </>
        )
      }}
    </DemoShell>
  )
}


// =========================================================
// BƯỚC 10: XÁC NHẬN THAY ĐỔI
// =========================================================

const CONFIRM_CAPTIONS = [
  'Có 3 ô đã sửa nhưng chưa lưu',
  'Bấm Confirm Changes',
  'Đã lưu, bảng tự tải lại',
]

function ToolbarButton({
  children,
  primary,
  pressed,
}: {
  children: ReactNode
  primary?: boolean
  pressed?: boolean
}) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        px: 1,
        py: 0.4,
        fontSize: 11.5,
        fontWeight: 600,
        borderRadius: 0.75,
        border: 1,
        borderColor: primary ? 'primary.main' : 'divider',
        color: primary ? 'primary.main' : 'text.secondary',
        bgcolor: pressed
          ? alpha(theme.palette.primary.main, 0.18)
          : 'transparent',
        boxShadow: pressed
          ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.25)}`
          : 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Box>
  )
}

export function FacConfirmConfirmDemo() {
  return (
    <DemoShell captions={CONFIRM_CAPTIONS}>
      {(f) => {
        const saved = f === 2

        return (
          <>
            <Stack
              direction="row"
              spacing={0.75}
              sx={{ mb: 1, height: 24, alignItems: 'center' }}
            >
              {!saved && (
                <>
                  <ToolbarButton primary pressed={f === 1}>
                    Confirm Changes (3)
                  </ToolbarButton>
                  <ToolbarButton>Cancel Changes</ToolbarButton>
                </>
              )}
            </Stack>

            <Box sx={gridSx}>
              <MiniHeader highlight />

              {ITEMS.map((item) => [
                <MiniCell key={`${item}-i`}>{item}</MiniCell>,
                <MiniCell key={`${item}-d`} edited={!saved}>
                  {VALUE}
                </MiniCell>,
                <MiniCell key={`${item}-h`} />,
              ])}
            </Box>
          </>
        )
      }}
    </DemoShell>
  )
}
