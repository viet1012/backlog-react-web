import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined'
import TransformOutlinedIcon from '@mui/icons-material/TransformOutlined'
import { Alert, Box, Button, Chip, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { logout } from '../../services/authService'
import { PageHeader } from '../../components/common/PageHeader'
import { PageShell } from '../../components/common/PageShell'
import { ConvertTab } from '../../components/pdf2cad/ConvertTab'
import { PDF2CAD_TEXT, usePdf2cadText } from '../../components/pdf2cad/pdf2cadText'
import { RedrawTab } from '../../components/pdf2cad/RedrawTab'
import { usePdf2cadBot } from '../../hooks/usePdf2cadBot'
import { PDF2CAD_IS_MOCK, Pdf2cadError, pdf2cadApi } from '../../services/pdf2cadService'
import { uiTokens } from '../../theme/uiTokens'
import type { Pdf2cadHealth, Pdf2cadLearnResult } from '../../types/pdf2cad'

interface Pdf2cadPageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

// ?tab=redraw mở thẳng tab Vẽ lại từ mẫu
type Pdf2cadSection = 'convert' | 'redraw'

const sectionTabsSx = {
  minHeight: 32,
  '& .MuiTabs-list': { height: 32 },
  '& .MuiTab-root': {
    minHeight: 32,
    minWidth: 0,
    px: 1.25,
    py: 0,
    gap: 0.5,
    textTransform: 'none',
    fontSize: 13,
    fontWeight: 800,
  },
} as const

export function Pdf2cadPage({ mode, onToggleMode }: Pdf2cadPageProps) {
  const { tx, language } = usePdf2cadText()
  const [searchParams, setSearchParams] = useSearchParams()
  const section: Pdf2cadSection = searchParams.get('tab') === 'redraw' ? 'redraw' : 'convert'

  const bot = usePdf2cadBot(language)
  const navigate = useNavigate()
  const [health, setHealth] = useState<Pdf2cadHealth | null | false>(null)
  // 401: chưa có / hết hạn token đăng nhập → phải đăng nhập lại; 403: không có quyền
  const [authError, setAuthError] = useState<401 | 403 | null>(null)

  // tab Vẽ lại: mount lần đầu khi mở, sau đó giữ nguyên (ẩn) để không mất hội thoại
  const [redrawMounted, setRedrawMounted] = useState(section === 'redraw')
  if (section === 'redraw' && !redrawMounted) setRedrawMounted(true)

  const { start } = bot
  useEffect(() => {
    if (section === 'redraw') start()
  }, [section, start])

  useEffect(() => {
    let alive = true
    pdf2cadApi.health()
      .then((h) => alive && setHealth(h))
      .catch((e: unknown) => {
        if (!alive) return
        setHealth(false)
        if (e instanceof Pdf2cadError && (e.status === 401 || e.status === 403)) setAuthError(e.status)
      })
    return () => {
      alive = false
    }
  }, [])

  function changeSection(next: Pdf2cadSection) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev)
      if (next === 'redraw') params.set('tab', 'redraw')
      else params.delete('tab')
      return params
    }, { replace: true })
  }

  // "Dạy bot" ở bảng kết quả → sang tab Vẽ lại với mẫu vừa học
  function handleLearned(result: Pdf2cadLearnResult, output: string) {
    const n = result.templates.length
    bot.announceLearned(result, {
      vi: PDF2CAD_TEXT.vi.learnMsg(n, output, result.templates),
      en: PDF2CAD_TEXT.en.learnMsg(n, output, result.templates),
    })
    changeSection('redraw')
  }

  const llmModel = health && health.llm ? (health.llm.ok ? health.llm.model ?? '' : '') : null

  return (
    <PageShell>
      <PageHeader
        title={tx.title}
        subtitle={tx.subtitle}
        status={PDF2CAD_IS_MOCK && (
          <Tooltip title={tx.mockTip}>
            <Chip
              size="small"
              color="warning"
              variant="outlined"
              icon={<ScienceOutlinedIcon />}
              label={tx.mockChip}
              sx={{ height: 24, fontSize: 11.5, fontWeight: 700 }}
            />
          </Tooltip>
        )}
        bottom={
          <Stack direction="row" sx={{ alignItems: 'center', flexWrap: 'wrap', columnGap: 1.5, rowGap: 0.5, py: 0.25 }}>
            <Tabs
              value={section}
              onChange={(_, next: Pdf2cadSection) => changeSection(next)}
              aria-label={tx.sectionAria}
              sx={sectionTabsSx}
            >
              <Tab value="convert" iconPosition="start" icon={<TransformOutlinedIcon sx={{ fontSize: 18 }} />} label={tx.tabConvert} />
              <Tab value="redraw" iconPosition="start" icon={<SmartToyOutlinedIcon sx={{ fontSize: 18 }} />} label={tx.tabRedraw} />
            </Tabs>

            <Typography
              sx={{
                ml: { md: 'auto' },
                fontSize: uiTokens.header.metaFontSize,
                color: health === false ? 'error.main' : 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
              {health === false ? (authError ? tx.authShort : tx.noServer) : health ? tx.health(health) : '…'}
            </Typography>
          </Stack>
        }
        mode={mode}
        onToggleMode={onToggleMode}
      />

      {authError && (
        <Alert
          severity={authError === 401 ? 'warning' : 'error'}
          sx={{ flexShrink: 0 }}
          action={authError === 401 && (
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                logout()
                navigate('/login', { replace: true })
              }}
            >
              {tx.relogin}
            </Button>
          )}
        >
          {authError === 401 ? tx.sessionExpired : tx.forbidden}
        </Alert>
      )}

      <Box sx={{ flex: 1, minHeight: 0, display: section === 'convert' ? 'flex' : 'none', flexDirection: 'column' }}>
        <ConvertTab onLearned={handleLearned} />
      </Box>

      {redrawMounted && (
        <Box sx={{ flex: 1, minHeight: 0, display: section === 'redraw' ? 'flex' : 'none', flexDirection: 'column' }}>
          <RedrawTab bot={bot} llmModel={llmModel} />
        </Box>
      )}
    </PageShell>
  )
}
