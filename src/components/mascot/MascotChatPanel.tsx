import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined'
import CloseFullscreenRoundedIcon from '@mui/icons-material/CloseFullscreenRounded'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined'
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useI18n } from '../../i18n/useI18n'
import { loadPreference, savePreference } from '../../utils/uiPreferences'
import { ASSISTANT_TIMEOUT_MS } from '../../services/assistantService'
import type {
  AssistantErrorCode,
  AssistantErrorDetail,
  AssistantSource,
  AssistantSuggestion,
} from '../../services/assistantService'
import { MascotMarkdown } from './MascotMarkdown'
import { MascotSvg } from './MascotSvg'
import { getScreenName } from './mascotMessages'
import type { MascotScreen, ScreenId } from './mascotMessages'
import { useMascotContext, useMascotName } from './mascotContext'
import type { MascotMonthControl } from './mascotContext'
import styles from './Mascot.module.css'

const MAX_QUESTION_LENGTH = 2000
const WIDE_KEY = 'mascot:chatWide'

/** Dòng phân cách cột của bảng GFM: "| --- | :---: |" hoặc "---|---" (không khớp "---" của hr) */
const TABLE_DELIMITER = /^\s*\|?\s*:?-{3,}:?\s*\|/m

function hasMarkdownTable(text: string) {
  return TABLE_DELIMITER.test(text)
}
/** Chờ quá ngưỡng này → đổi sang câu "đang suy nghĩ kỹ" */
const SLOW_THINKING_MS = 15_000
const SHOW_ERROR_DETAIL = import.meta.env.DEV

export type ChatItem =
  | { id: number; kind: 'user'; text: string }
  | { id: number; kind: 'assistant'; text: string; sources: AssistantSource[]; answeredMonth?: string }
  | {
    id: number
    kind: 'error'
    code: AssistantErrorCode
    detail?: AssistantErrorDetail
    /** câu hỏi bị lỗi + id bubble user tương ứng → nút "Thử lại" gửi lại */
    question?: string
    userId?: number
  }
  | { id: number; kind: 'divider'; screenId: ScreenId }

interface MascotChatPanelProps {
  id: string
  /** null → đang tải câu chào từ API (hiện bubble "đang gõ") */
  greeting: string | null
  screen: MascotScreen
  items: ChatItem[]
  pending: boolean
  /** gợi ý đang hiển thị (Mascot đã chọn bộ 4 ban đầu hay 2 follow-up) */
  suggestions: AssistantSuggestion[]
  /** > 0 → gợi ý đang tải, hiện bấy nhiêu khung skeleton giữ chỗ */
  suggestionSkeletons: number
  /** tháng đang xem trên màn hình ("YYYY.MM") */
  viewingMonth?: string
  /** null → trang không cho đổi tháng → ẩn nút "Xem tháng …" */
  monthControl: MascotMonthControl | null
  onSend: (question: string) => void
  /** hủy câu đang chờ trả lời */
  onCancel: () => void
  /** gửi lại câu hỏi của item lỗi */
  onRetry: (errorId: number) => void
  onNewConversation: () => void
  onClose: () => void
}

const preWrap = { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } as const

/** bề rộng khung skeleton gợi ý – lệch nhau cho giống chip thật */
const SKELETON_WIDTHS = ['72%', '58%', '64%', '46%']

export function MascotChatPanel({
  id,
  greeting,
  screen,
  items,
  pending,
  suggestions,
  suggestionSkeletons,
  viewingMonth,
  monthControl,
  onSend,
  onCancel,
  onRetry,
  onNewConversation,
  onClose,
}: MascotChatPanelProps) {
  const { t } = useI18n()
  const name = useMascotName()
  const { name: loadedName, status, retry } = useMascotContext()
  const reconnecting = status === 'reconnecting'
  const offline = status === 'offline' || reconnecting
  // lần đầu (chưa có tên lưu) đang tải → skeleton thay vì hiện tên mặc định rồi đổi
  const nameLoading = status === 'loading' && loadedName === null
  const chatEnabled = Boolean(screen.screenKey)
  const canSend = chatEnabled && !offline
  const [draft, setDraft] = useState('')
  // chế độ rộng 720px × 85vh, nhớ qua localStorage
  const [wide, setWide] = useState(() => loadPreference(WIDE_KEY) === true)

  function toggleWide() {
    const next = !wide
    setWide(next)
    savePreference(WIDE_KEY, next)
  }
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const showSuggestions = canSend && !pending && suggestions.length > 0
  const showSkeletons = canSend && !pending && !showSuggestions && suggestionSkeletons > 0

  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!pending) return
    const timer = window.setTimeout(() => setSlow(true), SLOW_THINKING_MS)
    return () => {
      window.clearTimeout(timer)
      setSlow(false)
    }
  }, [pending])

  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [items, pending, slow])

  useEffect(() => {
    inputRef.current?.focus()
  }, [canSend])

  function submit(text: string) {
    const question = text.trim()
    if (!question || pending || offline) return
    onSend(question.slice(0, MAX_QUESTION_LENGTH))
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // Enter gửi, Shift+Enter xuống dòng; bỏ qua khi đang gõ IME
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit(draft)
    }
  }

  return (
    <Paper
      id={id}
      className={`${styles.panel} ${wide ? styles.panelWide : ''}`}
      elevation={8}
      role="dialog"
      aria-label={name}
      sx={{ borderRadius: 3, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      {/* Header */}
      <Stack
        direction="row"
        sx={(theme) => ({
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.1),
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              overflow: 'hidden',
              bgcolor: '#dbeafb',
              // offline → avatar xám
              filter: offline ? 'grayscale(1)' : 'none',
              opacity: offline ? 0.7 : 1,
              transition: 'filter 0.3s, opacity 0.3s',
            }}
          >
            <MascotSvg waving={false} headOnly className={styles.avatarSvg} />
          </Box>
          {status !== 'loading' && (
            <Box
              sx={(theme) => ({
                position: 'absolute',
                right: -1,
                bottom: -1,
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: offline ? 'grey.500' : 'success.main',
                border: `2px solid ${theme.palette.background.paper}`,
              })}
            />
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {nameLoading
            ? <Skeleton variant="text" width={90} sx={{ fontSize: 14 }} />
            : (
              <Typography noWrap sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
                {name}
              </Typography>
            )}
          {status !== 'loading' && (
            <Typography color="text.secondary" sx={{ fontSize: 11, lineHeight: 1.2 }}>
              {offline ? t.mascot.chat.statusOffline : t.mascot.chat.statusOnline}
            </Typography>
          )}
        </Box>
        {chatEnabled && (
          <IconButton
            size="small"
            aria-label={t.mascot.chat.newConversation}
            title={t.mascot.chat.newConversation}
            onClick={() => {
              onNewConversation()
              inputRef.current?.focus()
            }}
          >
            <AddCommentOutlinedIcon fontSize="small" />
          </IconButton>
        )}
        <IconButton
          size="small"
          aria-label={wide ? t.mascot.chat.collapse : t.mascot.chat.expand}
          title={wide ? t.mascot.chat.collapse : t.mascot.chat.expand}
          aria-pressed={wide}
          onClick={toggleWide}
        >
          {wide
            ? <CloseFullscreenRoundedIcon fontSize="small" />
            : <OpenInFullRoundedIcon fontSize="small" />}
        </IconButton>
        <IconButton size="small" aria-label={t.mascot.chat.close} onClick={onClose}>
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      {/* Mất kết nối API */}
      {offline && chatEnabled && (
        <Alert
          severity="warning"
          icon={<CloudOffOutlinedIcon fontSize="small" />}
          action={(
            <Button
              color="inherit"
              size="small"
              onClick={retry}
              disabled={reconnecting}
              startIcon={reconnecting ? <CircularProgress size={12} color="inherit" /> : undefined}
              sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              {reconnecting ? t.mascot.chat.reconnecting : t.mascot.chat.retry}
            </Button>
          )}
          sx={{ borderRadius: 0, py: 0.25, fontSize: 12, alignItems: 'center' }}
        >
          {t.mascot.chat.offline(name)}
        </Alert>
      )}

      {/* Tin nhắn */}
      <Box
        ref={listRef}
        role="log"
        aria-live="polite"
        sx={{
          flex: 1,
          minHeight: 120,
          overflowY: 'auto',
          px: 1.5,
          py: 1.25,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {greeting === null
          ? <TypingBubble label={t.mascot.chat.thinking(name)} />
          : <Bubble from="assistant" className={styles.fadeIn}>{greeting}</Bubble>}

        {!chatEnabled && (
          <Typography color="text.secondary" sx={{ fontSize: 12, fontStyle: 'italic', px: 0.5 }}>
            {t.mascot.chat.notSupported}
          </Typography>
        )}

        {items.map((item, index) => {
          if (item.kind === 'divider') {
            return (
              <Stack key={item.id} direction="row" sx={{ alignItems: 'center', gap: 1, my: 0.5 }}>
                <Box sx={{ flex: 1, borderTop: 1, borderColor: 'divider' }} />
                <Typography color="text.secondary" sx={{ fontSize: 11.5, whiteSpace: 'nowrap' }}>
                  {t.mascot.chat.viewing(getScreenName(item.screenId, t))}
                </Typography>
                <Box sx={{ flex: 1, borderTop: 1, borderColor: 'divider' }} />
              </Stack>
            )
          }
          if (item.kind === 'error') {
            const devLine = SHOW_ERROR_DETAIL && item.detail
              ? formatErrorDetail(item.detail, t.mascot.chat)
              : undefined
            // chỉ lỗi cuối cùng (ứng với câu hỏi cuối) mới có nút "Thử lại"
            const canRetry = Boolean(item.question) && index === items.length - 1
            return (
              <Box key={item.id} sx={{ alignSelf: 'flex-start', maxWidth: '85%' }}>
                <Bubble from="error" nested>{t.mascot.chat.errors[item.code](name)}</Bubble>
                {canRetry && (
                  <Button
                    size="small"
                    variant="text"
                    color="error"
                    startIcon={<ReplayRoundedIcon sx={{ fontSize: '15px !important' }} />}
                    disabled={pending || offline}
                    onClick={() => onRetry(item.id)}
                    sx={{ mt: 0.25, px: 0.75, py: 0.125, minWidth: 0, fontSize: 11.5, textTransform: 'none' }}
                  >
                    {t.mascot.chat.retry}
                  </Button>
                )}
                {devLine && (
                  <Typography
                    color="text.disabled"
                    sx={{ fontSize: 11, mt: 0.25, px: 0.5, fontFamily: 'monospace', ...preWrap }}
                  >
                    {devLine}
                  </Typography>
                )}
              </Box>
            )
          }
          if (item.kind === 'assistant') {
            const otherMonth = item.answeredMonth && item.answeredMonth !== viewingMonth
              ? item.answeredMonth
              : undefined
            const canShowMonth = otherMonth !== undefined && monthControl?.months.includes(otherMonth) === true
            return (
              <Box
                key={item.id}
                // có bảng → dùng hết bề ngang panel (bảng tự cuộn ngang bên trong)
                sx={{ alignSelf: 'flex-start', maxWidth: hasMarkdownTable(item.text) ? '100%' : '85%', minWidth: 0 }}
              >
                <Bubble from="assistant" nested markdown>{item.text}</Bubble>
                {canShowMonth && (
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<CalendarMonthOutlinedIcon sx={{ fontSize: '15px !important' }} />}
                    onClick={() => monthControl?.select(otherMonth)}
                    sx={{ mt: 0.25, px: 0.75, py: 0.125, minWidth: 0, fontSize: 11.5, textTransform: 'none' }}
                  >
                    {t.mascot.chat.showMonth(otherMonth)}
                  </Button>
                )}
                <SourceChips
                  sources={item.sources}
                  answeredMonth={item.answeredMonth}
                  viewingMonth={viewingMonth}
                />
              </Box>
            )
          }
          return (
            <Bubble key={item.id} from="user">
              {item.text}
            </Bubble>
          )
        })}

        {pending && (
          <Stack direction="row" role="status" sx={{ alignItems: 'center', gap: 1, px: 0.5 }}>
            <CircularProgress size={14} />
            <Typography color="text.secondary" sx={{ fontSize: 12.5, flex: 1 }}>
              {slow ? t.mascot.chat.thinkingLong(name) : t.mascot.chat.thinking(name)}
            </Typography>
            <Button
              size="small"
              variant="text"
              color="inherit"
              onClick={onCancel}
              sx={{ px: 0.75, py: 0.125, minWidth: 0, fontSize: 11.5, textTransform: 'none', color: 'text.secondary' }}
            >
              {t.mascot.chat.cancel}
            </Button>
          </Stack>
        )}

        {showSkeletons && (
          <Stack direction="row" aria-hidden="true" sx={{ flexWrap: 'wrap', gap: 0.75, pt: 0.5 }}>
            {SKELETON_WIDTHS.slice(0, suggestionSkeletons).map((width, index) => (
              <Skeleton key={index} variant="rounded" width={width} height={26} sx={{ borderRadius: 4 }} />
            ))}
          </Stack>
        )}

        {showSuggestions && (
          <Stack direction="row" className={styles.fadeIn} sx={{ flexWrap: 'wrap', gap: 0.75, pt: 0.5 }}>
            {suggestions.map(({ text, kind }) => {
              const dynamic = kind === 'dynamic'
              return (
                <Chip
                  key={text}
                  label={text}
                  size="small"
                  variant="outlined"
                  color="primary"
                  title={dynamic ? t.mascot.chat.dynamicSuggestion : undefined}
                  icon={dynamic ? <TipsAndUpdatesOutlinedIcon /> : undefined}
                  onClick={() => submit(text)}
                  sx={(theme) => ({
                    height: 'auto',
                    py: 0.5,
                    '& .MuiChip-label': { whiteSpace: 'normal' },
                    // gợi ý theo dữ liệu: viền vàng cảnh báo nhạt + icon
                    ...(dynamic && {
                      borderColor: alpha(theme.palette.warning.main, 0.5),
                      '& .MuiChip-icon': { fontSize: 15, color: 'warning.main', ml: '6px' },
                    }),
                  })}
                />
              )
            })}
          </Stack>
        )}
      </Box>

      {/* Ô nhập */}
      {chatEnabled && (
        <Stack
          direction="row"
          sx={{ alignItems: 'flex-end', gap: 0.5, p: 1, borderTop: 1, borderColor: 'divider' }}
        >
          <TextField
            inputRef={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={offline ? t.mascot.chat.offlinePlaceholder : t.mascot.chat.placeholder(name)}
            disabled={offline}
            multiline
            maxRows={4}
            size="small"
            fullWidth
            slotProps={{ htmlInput: { maxLength: MAX_QUESTION_LENGTH } }}
            helperText={draft.length > MAX_QUESTION_LENGTH * 0.9
              ? `${draft.length}/${MAX_QUESTION_LENGTH}`
              : undefined}
            sx={{ '& .MuiInputBase-input': { fontSize: 13 } }}
          />
          {/* đang chờ trả lời → nút gửi đổi thành nút dừng (hủy request) */}
          {pending ? (
            <IconButton
              color="error"
              aria-label={t.mascot.chat.cancel}
              title={t.mascot.chat.cancel}
              onClick={onCancel}
              sx={{ mb: 0.25 }}
            >
              <StopRoundedIcon fontSize="small" />
            </IconButton>
          ) : (
            <IconButton
              color="primary"
              aria-label={t.mascot.chat.send}
              title={t.mascot.chat.send}
              disabled={offline || draft.trim().length === 0}
              onClick={() => submit(draft)}
              sx={{ mb: 0.25 }}
            >
              <SendRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      )}
    </Paper>
  )
}

interface SourceChipsProps {
  sources: AssistantSource[]
  answeredMonth?: string
  viewingMonth?: string
}

/**
 * "Đã tra: Phân tích chênh lệch · MOLD RM"; tháng tra khác tháng đang xem → thêm " · 2026.10".
 * Không có nguồn → "Trả lời từ dữ liệu màn hình".
 */
function SourceChips({ sources, answeredMonth, viewingMonth }: SourceChipsProps) {
  const { t } = useI18n()
  const labels = t.mascot.chat.sources

  const texts = sources.length > 0
    ? sources.map((source) => {
      const tool = labels.tools[source.tool] ?? source.tool
      const scope = [source.div, source.cost].filter(Boolean).join(' ')
      const month = source.month ?? answeredMonth
      const parts = [tool, scope, month && month !== viewingMonth ? month : undefined]
      return labels.looked(parts.filter(Boolean).join(' · '))
    })
    : [labels.screenData]

  return (
    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
      {texts.map((text) => (
        <Chip
          key={text}
          label={text}
          size="small"
          sx={{
            height: 'auto',
            py: '2px',
            fontSize: 11,
            color: 'text.secondary',
            bgcolor: 'action.hover',
            '& .MuiChip-label': { px: 1, whiteSpace: 'normal' },
          }}
        />
      ))}
    </Stack>
  )
}

// Chỉ dùng ở dev: "HTTP <status> · <code> · <message>" / "Network error"
function formatErrorDetail(
  detail: AssistantErrorDetail,
  chat: { networkError: string; timeout: (seconds: number) => string },
): string {
  if (detail.kind === 'network') return chat.networkError
  if (detail.kind === 'timeout') return chat.timeout(ASSISTANT_TIMEOUT_MS / 1000)
  return [
    detail.status !== undefined ? `HTTP ${detail.status}` : undefined,
    detail.rawCode,
    detail.message,
  ].filter(Boolean).join(' · ')
}

/** Bubble "đang gõ" (3 chấm) khi câu chào từ API chưa về */
function TypingBubble({ label }: { label: string }) {
  return (
    <Box
      role="status"
      aria-label={label}
      sx={(theme) => ({
        alignSelf: 'flex-start',
        display: 'flex',
        gap: '4px',
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        borderBottomLeftRadius: 4,
        bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
      })}
    >
      {[0, 1, 2].map((index) => (
        <span key={index} className={styles.typingDot} style={{ animationDelay: `${index * 0.15}s` }} />
      ))}
    </Box>
  )
}

interface BubbleProps {
  from: 'user' | 'assistant' | 'error'
  /** nằm trong wrapper đã giới hạn bề rộng */
  nested?: boolean
  /** câu trả lời của assistant: render markdown (GFM), không render HTML thô */
  markdown?: boolean
  className?: string
  children: string
}

function Bubble({ from, nested = false, markdown = false, className, children }: BubbleProps) {
  const isUser = from === 'user'
  return (
    <Box
      className={className}
      sx={(theme) => ({
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: nested ? 'none' : '85%',
        // bảng markdown cuộn ngang bên trong, bubble không tràn
        minWidth: 0,
        px: 1.25,
        py: 0.75,
        borderRadius: 2,
        fontSize: 13,
        lineHeight: 1.45,
        // markdown tự xử lý xuống dòng; pre-wrap sẽ làm hiện thêm dòng trống giữa các khối
        ...(markdown ? { wordBreak: 'break-word' } : preWrap),
        ...(isUser
          ? { bgcolor: 'primary.main', color: 'primary.contrastText', borderBottomRightRadius: 4 }
          : from === 'error'
            ? {
              bgcolor: alpha(theme.palette.error.main, 0.1),
              color: 'error.main',
              border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
            }
            : {
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
              // nền đặc cho cột đầu sticky của bảng markdown (che chữ khi cuộn ngang)
              '--bubble-bg': theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[100],
              color: 'text.primary',
              borderBottomLeftRadius: 4,
            }),
      })}
    >
      {markdown ? <MascotMarkdown>{children}</MascotMarkdown> : children}
    </Box>
  )
}
