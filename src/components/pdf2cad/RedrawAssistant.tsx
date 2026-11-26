import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Pdf2cadBot, Pdf2cadChatMessage } from '../../hooks/usePdf2cadBot'
import { pdf2cadApi } from '../../services/pdf2cadService'
import { uiTokens } from '../../theme/uiTokens'
import {
  MascotSvg,
  SpinningMascotSvg,
  createMascotSpin,
  useMascotName,
  useMascotSkin,
  useSpinDrag,
} from '../mascot'
import type { MascotMood } from '../mascot'
import { notify } from '../common/notify'
import { translateServer, usePdf2cadText } from './pdf2cadText'

// ---------------------------------------------------------
// Chữ bot: **đậm**, dòng ⚠ màu cảnh báo, dòng bảng "a | b" dạng monospace
// ---------------------------------------------------------

function renderInline(line: string): ReactNode[] {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : <Fragment key={i}>{part}</Fragment>,
  )
}

function BotText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        const warn = line.trimStart().startsWith('⚠')
        const table = line.includes(' | ')
        return (
          <Box
            key={i}
            component="span"
            sx={{
              display: 'block',
              minHeight: '1.2em',
              color: warn ? 'warning.main' : undefined,
              fontWeight: warn ? 600 : undefined,
              fontFamily: table ? 'ui-monospace, SFMono-Regular, Consolas, monospace' : undefined,
              fontSize: table ? 12 : undefined,
              whiteSpace: table ? 'pre' : 'pre-wrap',
            }}
          >
            {renderInline(line)}
          </Box>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------
// Avatar mascot (đầu) trong khung tròn màu nền của skin
// ---------------------------------------------------------

function MascotAvatar({ mood, size }: { mood: MascotMood; size: number }) {
  const { avatarBg } = useMascotSkin()
  return (
    <Box
      aria-hidden
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        bgcolor: avatarBg,
        boxShadow: '0 0 0 2px rgba(255,255,255,0.65)',
        '& svg': { display: 'block', width: '100%', height: '100%' },
      }}
    >
      <MascotSvg waving={false} headOnly mood={mood} />
    </Box>
  )
}

/** Mascot đứng ở đầu khung chat: kéo ngang để xoay 360° */
function MascotHero({ mood, waving, line }: { mood: MascotMood; waving: boolean; line: string }) {
  const { tx } = usePdf2cadText()
  const spin = useMemo(() => createMascotSpin(), [])
  const { handlers, consumeClick } = useSpinDrag(spin)

  useEffect(() => () => spin.dispose(), [spin])

  return (
    <Stack direction="row" sx={{ alignItems: 'flex-end', gap: 1.25, px: 0.5, pt: 0.5 }}>
      <Box
        role="img"
        aria-label={tx.spin}
        title={tx.spin}
        {...handlers}
        onClick={() => {
          if (!consumeClick()) spin.spinOnce()
        }}
        sx={{
          width: 84,
          height: 105,
          flexShrink: 0,
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
          '&:active': { cursor: 'grabbing' },
          '& svg': { display: 'block', width: '100%', height: '100%', overflow: 'visible', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.18))' },
        }}
      >
        <SpinningMascotSvg spin={spin} waving={waving} mood={mood} followCursor />
      </Box>
      <Typography
        sx={(theme) => ({
          position: 'relative',
          mb: 3,
          px: 1.25,
          py: 0.75,
          fontSize: 12.5,
          lineHeight: 1.45,
          borderRadius: '12px',
          borderBottomLeftRadius: '3px',
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
          color: 'text.primary',
        })}
      >
        {line}
      </Typography>
    </Stack>
  )
}

// ---------------------------------------------------------
// Khung chat
// ---------------------------------------------------------

export function RedrawAssistant({ bot, llmModel }: { bot: Pdf2cadBot; llmModel: string | null }) {
  const { tx, language } = usePdf2cadText()
  const theme = useTheme()
  const name = useMascotName()
  const [input, setInput] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const current = bot.templates?.find((t) => t.name === bot.template)
  const engine = bot.engine ?? llmModel
  const accent = theme.palette.primary.main

  // tin mới / đang trả lời → cuộn xuống cuối
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [bot.messages, bot.busy])

  function submit() {
    const text = input.trim()
    if (!text || !bot.template) return
    setInput('')
    bot.send(text)
    inputRef.current?.focus()
  }

  async function download(job: string, output: string) {
    try {
      await pdf2cadApi.downloadFile(job, output)
    } catch (e) {
      notify.error(tx.noPreview, { detail: translateServer(language, e instanceof Error ? e.message : String(e)) })
    }
  }

  function messageBody(m: Pdf2cadChatMessage) {
    if (m.who === 'me') return m.text
    if (m.error) {
      return (
        <Typography component="span" sx={{ color: 'error.main', fontSize: 'inherit' }}>
          {tx.errorPrefix}
          {translateServer(language, m.error)}
        </Typography>
      )
    }
    return (
      <>
        <BotText text={language === 'en' ? m.en : m.vi} />
        {m.output && m.job && (
          <Stack direction="row" sx={{ gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<DownloadRoundedIcon />}
              onClick={() => download(m.job!, m.output!)}
              sx={{ textTransform: 'none', fontSize: 12, py: 0.25, maxWidth: '100%' }}
            >
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {tx.download(m.output)}
              </Box>
            </Button>
            <Button
              size="small"
              startIcon={<VisibilityOutlinedIcon />}
              onClick={() => bot.view(m.job!, m.output!)}
              sx={{ textTransform: 'none', fontSize: 12, py: 0.25 }}
            >
              {tx.viewAgain}
            </Button>
          </Stack>
        )}
      </>
    )
  }

  const status = bot.busy
    ? tx.replying
    : `${tx.online}${engine !== null ? ` · ${engine ? tx.aiBot(engine) : tx.rulesBot}` : ''}`

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: uiTokens.card.borderRadius,
        bgcolor: 'background.paper',
      }}
    >
      {/* ===== đầu khung: mascot + tên + mẫu ===== */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.25,
          py: 1,
          color: '#fff',
          background: `linear-gradient(100deg, ${accent}, #7c4dff)`,
        }}
      >
        <MascotAvatar mood={bot.mood} size={40} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 14, fontWeight: 800, lineHeight: 1.25 }}>
            {tx.botName(name)}
          </Typography>
          <Typography
            noWrap
            title={engine ? tx.aiTitle : undefined}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 11.5, opacity: 0.9 }}
          >
            <Box
              component="span"
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: bot.busy ? '#ffd54f' : '#69f0ae',
                boxShadow: `0 0 6px ${bot.busy ? '#ffd54f' : '#69f0ae'}`,
              }}
            />
            {status}
          </Typography>
        </Box>
        <Tooltip title={tx.newChat}>
          <span>
            <IconButton
              size="small"
              onClick={bot.restart}
              disabled={!bot.template}
              aria-label={tx.newChat}
              sx={{ color: '#fff', '&.Mui-disabled': { color: 'rgba(255,255,255,0.4)' } }}
            >
              <RestartAltRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* ===== chọn mẫu ===== */}
      <Box sx={{ px: 1.25, pt: 1 }}>
        <Select
          size="small"
          fullWidth
          displayEmpty
          value={bot.templates?.some((t) => t.name === bot.template) ? bot.template : ''}
          onChange={(e) => bot.selectTemplate(e.target.value)}
          disabled={!bot.templates?.length}
          inputProps={{ 'aria-label': tx.template }}
          sx={{ fontSize: 13, '& .MuiSelect-select': { py: 0.75 } }}
          renderValue={(value) => {
            const t = bot.templates?.find((x) => x.name === value)
            return t ? `${t.draft ? '🆕 ' : ''}${t.title}` : tx.template
          }}
        >
          {(bot.templates ?? []).map((t) => (
            <MenuItem key={t.name} value={t.name} sx={{ fontSize: 13 }}>
              {t.draft ? '🆕 ' : ''}
              {t.title}
              {t.draft && (
                <Typography component="span" sx={{ ml: 0.75, fontSize: 11, color: 'text.secondary' }}>
                  ({tx.draft})
                </Typography>
              )}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* ===== hội thoại ===== */}
      <Box
        ref={logRef}
        role="log"
        aria-live="polite"
        sx={{ flex: 1, minHeight: 180, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1, px: 1.25, py: 1 }}
      >
        <MascotHero mood={bot.mood} waving={bot.mood === 'greeting'} line={tx.heroLine} />

        {bot.templates && !bot.templates.length && (
          <Typography sx={{ fontSize: 12.5, color: bot.templatesError ? 'error.main' : 'text.secondary', px: 0.5 }}>
            {bot.templatesError ? translateServer(language, bot.templatesError) : tx.noTemplates}
          </Typography>
        )}

        {bot.messages.map((m) => (
          <Stack
            key={m.id}
            direction="row"
            sx={{ gap: 0.75, alignItems: 'flex-end', justifyContent: m.who === 'me' ? 'flex-end' : 'flex-start' }}
          >
            {m.who === 'bot' && <MascotAvatar mood={m.error ? 'sad' : 'idle'} size={26} />}
            <Box
              sx={{
                maxWidth: '88%',
                px: 1.25,
                py: 0.75,
                fontSize: 13,
                lineHeight: 1.45,
                borderRadius: '12px',
                wordBreak: 'break-word',
                ...(m.who === 'me'
                  ? { bgcolor: 'primary.main', color: 'primary.contrastText', borderBottomRightRadius: '3px', whiteSpace: 'pre-wrap' }
                  : {
                      bgcolor: theme.palette.mode === 'dark' ? alpha('#fff', 0.05) : '#f5f6f8',
                      border: `1px solid ${theme.palette.divider}`,
                      borderBottomLeftRadius: '3px',
                      overflowX: 'auto',
                    }),
              }}
            >
              {messageBody(m)}
            </Box>
          </Stack>
        ))}

        {bot.busy && (
          <Stack direction="row" sx={{ gap: 0.75, alignItems: 'flex-end' }}>
            <MascotAvatar mood="thinking" size={26} />
            <Box
              aria-label={tx.replying}
              sx={{
                display: 'flex',
                gap: 0.5,
                px: 1.25,
                py: 1.1,
                borderRadius: '12px',
                borderBottomLeftRadius: '3px',
                border: `1px solid ${theme.palette.divider}`,
                '& span': {
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: 'text.secondary',
                  animation: 'pdf2cadDot 1s infinite',
                },
                '& span:nth-of-type(2)': { animationDelay: '0.2s' },
                '& span:nth-of-type(3)': { animationDelay: '0.4s' },
                '@keyframes pdf2cadDot': { '0%, 80%, 100%': { opacity: 0.25 }, '40%': { opacity: 1 } },
              }}
            >
              <span />
              <span />
              <span />
            </Box>
          </Stack>
        )}
      </Box>

      {/* ===== gợi ý + ô nhập ===== */}
      {bot.chips.length > 0 && (
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.75, px: 1.25, pb: 0.75 }}>
          {bot.chips.map((c) => (
            <Button
              key={c}
              size="small"
              onClick={() => bot.send(c)}
              sx={{
                textTransform: 'none',
                fontSize: 12,
                py: 0.1,
                px: 1.1,
                minWidth: 0,
                borderRadius: 999,
                bgcolor: alpha(accent, theme.palette.mode === 'dark' ? 0.18 : 0.08),
                '&:hover': { bgcolor: alpha(accent, 0.2) },
              }}
            >
              {c}
            </Button>
          ))}
        </Stack>
      )}

      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        sx={{ display: 'flex', gap: 0.75, alignItems: 'center', px: 1.25, pb: 1.25, pt: 0.25 }}
      >
        <TextField
          inputRef={inputRef}
          size="small"
          fullWidth
          autoComplete="off"
          value={input}
          disabled={!bot.template}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tx.chatPh(current?.example ?? '')}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 999, fontSize: 13 } }}
        />
        <Tooltip title={tx.send}>
          <span>
            <IconButton
              type="submit"
              disabled={!input.trim() || !bot.template}
              aria-label={tx.send}
              sx={{
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
              }}
            >
              <SendRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  )
}
