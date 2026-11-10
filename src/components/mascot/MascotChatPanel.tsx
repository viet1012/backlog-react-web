import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import CloseFullscreenRoundedIcon from '@mui/icons-material/CloseFullscreenRounded'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import OpenInFullRoundedIcon from '@mui/icons-material/OpenInFullRounded'
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import StopRoundedIcon from '@mui/icons-material/StopRounded'
import TipsAndUpdatesOutlinedIcon from '@mui/icons-material/TipsAndUpdatesOutlined'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CloudOffRoundedIcon from '@mui/icons-material/CloudOffRounded'
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Collapse,
  IconButton,
  LinearProgress,
  InputBase,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
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
import type { MascotMood } from './MascotSvg'
import { getScreenName } from './mascotMessages'
import type { MascotScreen, ScreenId } from './mascotMessages'
import { useMascotContext, useMascotName, useMascotSkin } from './mascotContext'
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
/** thời gian hiện banner "Đã kết nối lại!" */
const RECONNECTED_BANNER_MS = 2500

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
  /** biểu cảm mascot – dùng cho avatar trong panel */
  mood: MascotMood
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
  mood,
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
  const { name: loadedName, status, skin: { avatarBg } } = useMascotContext()
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
  // chưa hỏi gì ở màn này → màn chào (avatar lớn + gợi ý dạng thẻ)
  const welcome = chatEnabled && items.length === 0
  // đã hỏi → gợi ý nằm ở thanh cuộn ngang ngay trên ô nhập
  const showStrip = !welcome && (showSuggestions || showSkeletons)

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

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) {
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
      // không overflow:hidden để đuôi bong bóng lòi ra ngoài; header tự bo góc trên
      sx={(theme) => ({
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${theme.palette.divider}`,
        '--tail-border': theme.palette.divider,
      })}
    >
      {/* đuôi bong bóng: nền kế thừa Paper (kể cả lớp overlay ở dark mode) */}
      <Box aria-hidden="true" className={styles.tail} sx={{ background: 'inherit' }} />

      {/* Header */}
      <Stack
        direction="row"
        sx={(theme) => ({
          borderTopLeftRadius: 'inherit',
          borderTopRightRadius: 'inherit',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.14)} 0%, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.04)} 100%)`,
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
              bgcolor: avatarBg,
              // offline → avatar xám
              filter: offline ? 'grayscale(1)' : 'none',
              opacity: offline ? 0.7 : 1,
              transition: 'filter 0.3s, opacity 0.3s',
            }}
          >
            <MascotSvg waving={false} headOnly mood={mood} className={styles.avatarSvg} />
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
            <Typography
              color={!offline && pending ? 'primary' : 'text.secondary'}
              sx={{ fontSize: 11, lineHeight: 1.2, fontWeight: !offline && pending ? 600 : 400 }}
            >
              {offline
                ? t.mascot.chat.statusOffline
                : pending ? t.mascot.chat.statusTyping : t.mascot.chat.statusOnline}
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

      {/* Mất kết nối API / vừa kết nối lại */}
      {chatEnabled && <ConnectionBanner name={name} />}

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
        {welcome ? (
          /* Màn chào: chưa hỏi gì → avatar lớn + câu chào ở giữa, gợi ý dạng thẻ */
          <Stack sx={{ alignItems: 'center', textAlign: 'center', gap: 0.75, pt: 1.5, pb: 0.5 }}>
            <Box
              className={styles.welcomeAvatar}
              sx={(theme) => ({
                width: 64,
                height: 64,
                borderRadius: '50%',
                overflow: 'hidden',
                bgcolor: avatarBg,
                border: `3px solid ${theme.palette.background.paper}`,
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}, 0 4px 12px ${alpha(theme.palette.common.black, 0.12)}`,
                filter: offline ? 'grayscale(1)' : 'none',
              })}
            >
              <MascotSvg waving={false} headOnly mood={mood} className={styles.avatarSvg} />
            </Box>
            {nameLoading
              ? <Skeleton variant="text" width={100} sx={{ fontSize: 16 }} />
              : <Typography sx={{ fontWeight: 700, fontSize: 15, mt: 0.5 }}>{name}</Typography>}
            {greeting === null
              ? <TypingBubble label={t.mascot.chat.thinking(name)} centered />
              : (
                <Typography
                  className={styles.fadeIn}
                  color="text.secondary"
                  sx={{ fontSize: 13, lineHeight: 1.5, maxWidth: 340, ...preWrap }}
                >
                  {greeting}
                </Typography>
              )}
          </Stack>
        ) : greeting === null ? (
          <AssistantRow mood={mood}>
            <TypingBubble label={t.mascot.chat.thinking(name)} />
          </AssistantRow>
        ) : (
          <AssistantRow mood={mood} className={styles.fadeIn}>
            <Bubble from="assistant" nested>{greeting}</Bubble>
          </AssistantRow>
        )}

        {welcome && showSkeletons && (
          <Stack aria-hidden="true" sx={{ gap: 0.75, pt: 0.5 }}>
            {SKELETON_WIDTHS.slice(0, suggestionSkeletons).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={38} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        )}

        {welcome && showSuggestions && (
          <Stack className={styles.fadeIn} sx={{ gap: 0.75, pt: 0.5 }}>
            {suggestions.map(({ text, kind }) => (
              <SuggestionCard
                key={text}
                text={text}
                dynamic={kind === 'dynamic'}
                dynamicTitle={t.mascot.chat.dynamicSuggestion}
                onClick={() => submit(text)}
              />
            ))}
          </Stack>
        )}

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
              <AssistantRow key={item.id} mood="sad">
                <ErrorCard
                  code={item.code}
                  message={t.mascot.chat.errors[item.code](name)}
                  canRetry={canRetry}
                  pending={pending}
                  onRetry={() => onRetry(item.id)}
                />
                {devLine && (
                  <Typography
                    color="text.disabled"
                    sx={{ fontSize: 11, mt: 0.25, px: 0.5, fontFamily: 'monospace', ...preWrap }}
                  >
                    {devLine}
                  </Typography>
                )}
              </AssistantRow>
            )
          }
          if (item.kind === 'assistant') {
            const otherMonth = item.answeredMonth && item.answeredMonth !== viewingMonth
              ? item.answeredMonth
              : undefined
            const canShowMonth = otherMonth !== undefined && monthControl?.months.includes(otherMonth) === true
            return (
              // có bảng → dùng hết bề ngang panel (bảng tự cuộn ngang bên trong)
              <AssistantRow key={item.id} full={hasMarkdownTable(item.text)}>
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
              </AssistantRow>
            )
          }
          return (
            <Bubble key={item.id} from="user">
              {item.text}
            </Bubble>
          )
        })}

        {pending && (
          <AssistantRow mood="thinking" pulse>
            <ThinkingBubble name={name} slow={slow} onCancel={onCancel} />
          </AssistantRow>
        )}
      </Box>

      {/* Gợi ý (sau khi đã hỏi): thanh cuộn ngang ngay trên ô nhập, luôn nhìn thấy */}
      {showStrip && (
        <Stack
          direction="row"
          className={`${styles.suggestionStrip} ${showSuggestions ? styles.fadeIn : ''}`}
          aria-hidden={showSkeletons ? true : undefined}
          sx={{
            gap: 0.75,
            px: 1.25,
            pt: 0.75,
            pb: 0.25,
            overflowX: 'auto',
            flexShrink: 0,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          {showSkeletons
            ? SKELETON_WIDTHS.slice(0, suggestionSkeletons).map((_, index) => (
              <Skeleton key={index} variant="rounded" width={150} height={28} sx={{ borderRadius: 4, flexShrink: 0 }} />
            ))
            : suggestions.map(({ text, kind }) => {
              const dynamic = kind === 'dynamic'
              return (
                <Chip
                  key={text}
                  label={text}
                  size="small"
                  variant="outlined"
                  color="primary"
                  title={dynamic ? `${t.mascot.chat.dynamicSuggestion}\n${text}` : text}
                  icon={dynamic ? <TipsAndUpdatesOutlinedIcon /> : undefined}
                  onClick={() => submit(text)}
                  sx={(theme) => ({
                    flexShrink: 0,
                    maxWidth: 300,
                    height: 28,
                    borderRadius: 14,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                    '& .MuiChip-label': { fontSize: 12 },
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

      {/* Ô nhập */}
      {chatEnabled && (
        <Box
          sx={{
            px: 1.25,
            pt: 1,
            pb: 0.75,
            // có thanh gợi ý ngay trên → đường kẻ nằm trên thanh gợi ý
            ...(!showStrip && { borderTop: 1, borderColor: 'divider' }),
          }}
        >
          {/* Composer: khung bo tròn, viền sáng khi focus, nút gửi nằm trong khung */}
          <Box
            onClick={() => inputRef.current?.focus()}
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'flex-end',
              gap: 0.75,
              pl: 1.5,
              pr: 0.5,
              py: 0.5,
              borderRadius: '20px',
              cursor: 'text',
              bgcolor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.06)
                : theme.palette.grey[50],
              border: `1px solid ${theme.palette.divider}`,
              transition: 'border-color 0.15s, box-shadow 0.15s, background-color 0.15s',
              '&:hover': { borderColor: offline ? theme.palette.divider : alpha(theme.palette.primary.main, 0.5) },
              '&:focus-within': {
                borderColor: theme.palette.primary.main,
                bgcolor: theme.palette.background.paper,
                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
              },
              ...(offline && { opacity: 0.6, cursor: 'not-allowed' }),
            })}
          >
            <InputBase
              inputRef={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={offline ? t.mascot.chat.offlinePlaceholder : t.mascot.chat.placeholder(name)}
              disabled={offline}
              multiline
              maxRows={5}
              fullWidth
              inputProps={{ maxLength: MAX_QUESTION_LENGTH, 'aria-label': t.mascot.chat.placeholder(name) }}
              sx={{ py: 0.5, fontSize: 13.5, lineHeight: 1.5, alignSelf: 'center' }}
            />
            {/* đang chờ trả lời → nút gửi đổi thành nút dừng (hủy request) */}
            {pending ? (
              <IconButton
                aria-label={t.mascot.chat.cancel}
                title={t.mascot.chat.cancel}
                onClick={(event) => {
                  event.stopPropagation()
                  onCancel()
                }}
                sx={(theme) => ({
                  ...composerButtonSx,
                  bgcolor: 'error.main',
                  color: 'error.contrastText',
                  '&:hover': { bgcolor: theme.palette.error.dark },
                })}
              >
                <StopRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            ) : (
              <IconButton
                aria-label={t.mascot.chat.send}
                title={t.mascot.chat.send}
                disabled={offline || draft.trim().length === 0}
                onClick={(event) => {
                  event.stopPropagation()
                  submit(draft)
                }}
                sx={(theme) => ({
                  ...composerButtonSx,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: theme.palette.primary.dark, transform: 'scale(1.06)' },
                  '&.Mui-disabled': {
                    bgcolor: theme.palette.action.disabledBackground,
                    color: theme.palette.action.disabled,
                  },
                })}
              >
                <SendRoundedIcon sx={{ fontSize: 17, ml: '2px' }} />
              </IconButton>
            )}
          </Box>

          {/* Gợi ý phím tắt + bộ đếm ký tự */}
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, mt: 0.5, px: 1, minHeight: 18 }}
          >
            <Typography component="div" color="text.disabled" sx={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Kbd>Enter</Kbd> {t.mascot.chat.inputHint.send}
              <Box component="span" sx={{ mx: 0.25 }}>·</Box>
              <Kbd>Shift</Kbd>+<Kbd>Enter</Kbd> {t.mascot.chat.inputHint.newLine}
            </Typography>
            {draft.length > MAX_QUESTION_LENGTH * 0.8 && (
              <Typography
                color={draft.length >= MAX_QUESTION_LENGTH ? 'error' : 'text.secondary'}
                sx={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}
              >
                {draft.length}/{MAX_QUESTION_LENGTH}
              </Typography>
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  )
}

const composerButtonSx = {
  width: 32,
  height: 32,
  flexShrink: 0,
  transition: 'transform 0.12s, background-color 0.15s',
  '&:active': { transform: 'scale(0.94)' },
} as const

/** Phím tắt dạng "nút bàn phím" nhỏ */
function Kbd({ children }: { children: string }) {
  return (
    <Box
      component="kbd"
      sx={(theme) => ({
        fontFamily: 'inherit',
        fontSize: 10,
        lineHeight: 1,
        px: 0.5,
        py: '2px',
        borderRadius: 0.75,
        border: `1px solid ${theme.palette.divider}`,
        borderBottomWidth: 2,
        color: 'text.secondary',
        bgcolor: 'background.paper',
      })}
    >
      {children}
    </Box>
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

/** Icon trong vòng tròn màu nhạt (banner / thẻ lỗi) */
function IconCircle({ color, size = 28, children }: { color: string; size?: number; children: ReactNode }) {
  return (
    <Box
      aria-hidden="true"
      sx={{
        display: 'grid',
        placeItems: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        color,
        bgcolor: alpha(color, 0.14),
        '& svg': { fontSize: Math.round(size * 0.6) },
      }}
    >
      {children}
    </Box>
  )
}

/**
 * Banner trạng thái kết nối dưới header:
 * - offline: "Mất kết nối" + đếm ngược lần tự thử lại + nút "Thử ngay" (xoay khi đang kết nối)
 * - vừa kết nối lại: banner xanh "Đã kết nối lại!" vài giây rồi tự thu lại
 */
function ConnectionBanner({ name }: { name: string }) {
  const { t } = useI18n()
  const { status, nextRetryAt, retry } = useMascotContext()
  const reconnecting = status === 'reconnecting'
  const offline = status === 'offline' || reconnecting

  const [prevStatus, setPrevStatus] = useState(status)
  const [showReconnected, setShowReconnected] = useState(false)
  if (status !== prevStatus) {
    setPrevStatus(status)
    setShowReconnected(status === 'online' && (prevStatus === 'offline' || prevStatus === 'reconnecting'))
  }

  useEffect(() => {
    if (!showReconnected) return
    const timer = window.setTimeout(() => setShowReconnected(false), RECONNECTED_BANNER_MS)
    return () => window.clearTimeout(timer)
  }, [showReconnected])

  // đếm ngược tới lần tự kiểm tra lại
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (nextRetryAt === null) return
    const tick = () => setNow(Date.now())
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [nextRetryAt])
  const seconds = nextRetryAt !== null ? Math.max(0, Math.ceil((nextRetryAt - now) / 1000)) : null

  const chat = t.mascot.chat
  const subtitle = reconnecting || seconds === 0
    ? chat.reconnecting
    : seconds !== null ? chat.autoRetryIn(seconds) : chat.waitingConnection

  return (
    <Collapse in={offline || showReconnected} unmountOnExit>
      {/* lúc thu lại (đã online) vẫn giữ nội dung banner xanh, không nháy về banner offline */}
      {offline ? (
        <Box
          role="status"
          sx={(theme) => ({
            position: 'relative',
            bgcolor: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.14 : 0.08),
            borderBottom: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
          })}
        >
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.25, px: 1.5, py: 1 }}>
            <IconCircle color="#d9890b">
              <CloudOffRoundedIcon />
            </IconCircle>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35 }}>
                {chat.offlineTitle(name)}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 11.5, lineHeight: 1.35, fontVariantNumeric: 'tabular-nums' }}>
                {subtitle}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="contained"
              color="warning"
              disableElevation
              aria-busy={reconnecting}
              onClick={retry}
              startIcon={<RefreshRoundedIcon className={reconnecting ? styles.spin : undefined} />}
              sx={{
                flexShrink: 0,
                borderRadius: 999,
                px: 1.5,
                py: 0.375,
                fontSize: 12,
                fontWeight: 600,
                textTransform: 'none',
                whiteSpace: 'nowrap',
                color: '#fff',
              }}
            >
              {chat.retryNow}
            </Button>
          </Stack>
          {reconnecting && (
            <LinearProgress
              color="warning"
              sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2 }}
            />
          )}
        </Box>
      ) : (
        <Stack
          direction="row"
          role="status"
          sx={(theme) => ({
            alignItems: 'center',
            gap: 1.25,
            px: 1.5,
            py: 1,
            bgcolor: alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
            borderBottom: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
          })}
        >
          <IconCircle color="#2e9d5b">
            <CheckCircleRoundedIcon />
          </IconCircle>
          <Box>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, color: 'success.main' }}>
              {chat.reconnected}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: 11.5, lineHeight: 1.35 }}>
              {chat.reconnectedHint}
            </Typography>
          </Box>
        </Stack>
      )}
    </Collapse>
  )
}

/** lỗi tạm thời (bận / hỏi nhanh quá) → tông vàng + đồng hồ cát; còn lại tông đỏ */
const TEMPORARY_ERRORS: readonly AssistantErrorCode[] = ['LLM_BUSY', 'RATE_LIMITED']

interface ErrorCardProps {
  code: AssistantErrorCode
  message: string
  /** lỗi của câu hỏi cuối → có nút thử lại */
  canRetry: boolean
  pending: boolean
  onRetry: () => void
}

/**
 * Thẻ lỗi trong chat: icon theo loại lỗi + nút "Thử lại" dạng pill.
 * Đang mất kết nối: bấm "Thử lại" → kết nối lại trước, có mạng thì tự gửi lại câu hỏi.
 */
function ErrorCard({ code, message, canRetry, pending, onRetry }: ErrorCardProps) {
  const { t } = useI18n()
  const { status, retry } = useMascotContext()
  const reconnecting = status === 'reconnecting'
  const offline = status === 'offline' || reconnecting
  const temporary = TEMPORARY_ERRORS.includes(code)
  const [retryWhenOnline, setRetryWhenOnline] = useState(false)
  // gửi lại đúng 1 lần; sau đó item lỗi bị bỏ → thẻ này unmount
  const autoRetried = useRef(false)

  useEffect(() => {
    if (!retryWhenOnline || status !== 'online' || autoRetried.current) return
    autoRetried.current = true
    onRetry()
  }, [retryWhenOnline, status, onRetry])

  function handleClick() {
    if (offline) {
      setRetryWhenOnline(true)
      retry()
    } else {
      onRetry()
    }
  }

  const waiting = offline && (reconnecting || retryWhenOnline)
  const label = !offline
    ? t.mascot.chat.retry
    : reconnecting
      ? t.mascot.chat.reconnecting
      : retryWhenOnline ? t.mascot.chat.waitingConnection : t.mascot.chat.retry
  const Icon = offline ? CloudOffRoundedIcon : temporary ? HourglassTopRoundedIcon : ErrorOutlineRoundedIcon

  return (
    <Box
      role="alert"
      sx={(theme) => {
        const tone = temporary ? theme.palette.warning.main : theme.palette.error.main
        return {
          px: 1.25,
          py: 1,
          borderRadius: 2,
          borderBottomLeftRadius: 4,
          bgcolor: alpha(tone, theme.palette.mode === 'dark' ? 0.12 : 0.06),
          border: `1px solid ${alpha(tone, 0.3)}`,
        }
      }}
    >
      <Stack direction="row" sx={{ gap: 1, alignItems: 'flex-start' }}>
        <Box sx={{ color: temporary ? 'warning.main' : 'error.main', display: 'flex', pt: '1px' }}>
          <Icon sx={{ fontSize: 18 }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, lineHeight: 1.45, color: 'text.primary', ...preWrap }}>
            {message}
          </Typography>
          {canRetry && (
            <Button
              size="small"
              disabled={pending}
              aria-busy={waiting}
              onClick={handleClick}
              startIcon={(
                <ReplayRoundedIcon
                  className={waiting ? styles.spin : undefined}
                  sx={{ fontSize: '15px !important' }}
                />
              )}
              sx={(theme) => {
                const tone = temporary ? theme.palette.warning.main : theme.palette.error.main
                return {
                  mt: 0.75,
                  px: 1.25,
                  py: 0.25,
                  minWidth: 0,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: 'none',
                  color: tone,
                  bgcolor: alpha(tone, 0.12),
                  '&:hover': { bgcolor: alpha(tone, 0.22) },
                }
              }}
            >
              {label}
            </Button>
          )}
        </Box>
      </Stack>
    </Box>
  )
}

/** Avatar mascot nhỏ (chỉ phần đầu) */
function MiniAvatar({ mood, size = 26 }: { mood: MascotMood; size?: number }) {
  const { avatarBg } = useMascotSkin()
  return (
    <Box
      aria-hidden="true"
      sx={(theme) => ({
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        bgcolor: avatarBg,
        boxShadow: `0 0 0 1px ${theme.palette.divider}`,
      })}
    >
      <MascotSvg waving={false} headOnly mood={mood} className={styles.avatarSvg} />
    </Box>
  )
}

/** đổi câu trạng thái "đang suy nghĩ" sau mỗi khoảng này (giây) */
const THINKING_STEP_S = 4
const THINKING_LINES = ['92%', '64%']

interface ThinkingBubbleProps {
  name: string
  /** chờ quá lâu → câu "đang suy nghĩ kỹ" */
  slow: boolean
  onCancel: () => void
}

/**
 * Bong bóng "đang suy nghĩ": nền tông primary, chữ trạng thái có ánh sáng chạy qua và đổi theo thời gian,
 * 2 dòng skeleton lấp lánh (câu trả lời sắp hiện), đồng hồ đếm giây + nút dừng.
 */
function ThinkingBubble({ name, slow, onCancel }: ThinkingBubbleProps) {
  const { t } = useI18n()
  const chat = t.mascot.chat
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((seconds) => seconds + 1), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const step = Math.floor(elapsed / THINKING_STEP_S)
  const text = slow
    ? chat.thinkingLong(name)
    : step === 0
      ? chat.thinking(name)
      : chat.thinkingSteps[Math.min(step - 1, chat.thinkingSteps.length - 1)]

  return (
    <Box
      role="status"
      sx={(theme) => {
        const dark = theme.palette.mode === 'dark'
        const primary = theme.palette.primary.main
        return {
          minWidth: 230,
          px: 1.5,
          pt: 1.125,
          pb: 0.75,
          borderRadius: 2,
          borderBottomLeftRadius: 4,
          background: `linear-gradient(135deg, ${alpha(primary, dark ? 0.24 : 0.1)} 0%, ${alpha(primary, dark ? 0.1 : 0.03)} 100%)`,
          border: `1px solid ${alpha(primary, dark ? 0.4 : 0.28)}`,
          boxShadow: `0 2px 10px ${alpha(primary, 0.12)}`,
        }
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: '3px', color: 'primary.main', flexShrink: 0 }}>
          {[0, 1, 2].map((index) => (
            <span key={index} className={styles.typingDot} style={{ animationDelay: `${index * 0.15}s` }} />
          ))}
        </Box>
        <Typography
          // key đổi theo câu → hiện dần khi chuyển bước
          key={text}
          // shimmerText đã gồm hiệu ứng hiện dần (không thêm .fadeIn – nó ghi đè animation)
          className={styles.shimmerText}
          sx={(theme) => ({
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.4,
            '--shimmer-base': theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark,
            '--shimmer-hi': theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.primary.light,
          })}
        >
          {text}
        </Typography>
      </Stack>

      {/* câu trả lời "sắp hiện": 2 dòng skeleton lấp lánh */}
      <Stack aria-hidden="true" sx={{ gap: 0.625, mt: 1.125 }}>
        {THINKING_LINES.map((width) => (
          <Box
            key={width}
            className={styles.shimmerLine}
            sx={(theme) => ({
              width,
              height: 7,
              borderRadius: 4,
              '--line-base': alpha(theme.palette.primary.main, 0.12),
              '--line-hi': alpha(theme.palette.primary.main, 0.32),
            })}
          />
        ))}
      </Stack>

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mt: 0.75 }}>
        <Typography color="text.secondary" sx={{ fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>
          {chat.elapsed(elapsed)}
        </Typography>
        <Button
          size="small"
          onClick={onCancel}
          startIcon={<StopRoundedIcon sx={{ fontSize: '14px !important' }} />}
          sx={{
            px: 1,
            py: 0,
            minWidth: 0,
            borderRadius: 999,
            fontSize: 11.5,
            textTransform: 'none',
            color: 'text.secondary',
            '&:hover': { color: 'error.main', bgcolor: (theme) => alpha(theme.palette.error.main, 0.08) },
          }}
        >
          {chat.cancel}
        </Button>
      </Stack>
    </Box>
  )
}

interface AssistantRowProps {
  mood?: MascotMood
  /** avatar có vòng sáng lan ra (đang suy nghĩ) */
  pulse?: boolean
  /** dùng hết bề ngang (câu trả lời có bảng) */
  full?: boolean
  className?: string
  children: ReactNode
}

/** Dòng tin của trợ lý: avatar nhỏ bên trái + nội dung */
function AssistantRow({ mood = 'idle', pulse = false, full = false, className, children }: AssistantRowProps) {
  return (
    <Stack
      direction="row"
      className={className}
      sx={{ alignSelf: 'flex-start', alignItems: 'flex-start', gap: 0.75, maxWidth: full ? '100%' : '90%', minWidth: 0 }}
    >
      <Box sx={{ pt: '2px' }}>
        <Box className={pulse ? styles.avatarPulse : undefined} sx={{ borderRadius: '50%' }}>
          <MiniAvatar mood={mood} />
        </Box>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Stack>
  )
}

interface SuggestionCardProps {
  text: string
  dynamic: boolean
  dynamicTitle: string
  onClick: () => void
}

/** Gợi ý dạng thẻ ở màn chào: icon + câu hỏi + mũi tên, hover đổi màu */
function SuggestionCard({ text, dynamic, dynamicTitle, onClick }: SuggestionCardProps) {
  const Icon = dynamic ? TipsAndUpdatesOutlinedIcon : ChatBubbleOutlineRoundedIcon
  return (
    <ButtonBase
      onClick={onClick}
      title={dynamic ? dynamicTitle : undefined}
      sx={(theme) => {
        const accent = dynamic ? theme.palette.warning.main : theme.palette.primary.main
        return {
          justifyContent: 'flex-start',
          gap: 1,
          width: '100%',
          px: 1.25,
          py: 0.875,
          borderRadius: 2,
          textAlign: 'left',
          border: `1px solid ${alpha(accent, dynamic ? 0.45 : 0.25)}`,
          bgcolor: alpha(accent, 0.04),
          transition: 'background-color 0.15s, border-color 0.15s, transform 0.15s',
          '& .arrow': { opacity: 0, transform: 'translateX(-4px)', transition: 'opacity 0.15s, transform 0.15s' },
          '&:hover, &.Mui-focusVisible': {
            bgcolor: alpha(accent, 0.1),
            borderColor: alpha(accent, 0.6),
            '& .arrow': { opacity: 1, transform: 'none' },
          },
        }
      }}
    >
      <Icon sx={{ fontSize: 16, color: dynamic ? 'warning.main' : 'primary.main', flexShrink: 0 }} />
      <Typography component="span" sx={{ flex: 1, fontSize: 12.5, lineHeight: 1.4, color: 'text.primary' }}>
        {text}
      </Typography>
      <ArrowForwardRoundedIcon className="arrow" sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
    </ButtonBase>
  )
}

/** Bubble "đang gõ" (3 chấm) khi câu chào từ API chưa về */
function TypingBubble({ label, centered = false }: { label: string; centered?: boolean }) {
  return (
    <Box
      role="status"
      aria-label={label}
      sx={(theme) => ({
        alignSelf: centered ? 'center' : 'flex-start',
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
