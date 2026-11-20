import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded'
import { Box, ButtonBase, IconButton, Paper, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useI18n } from '../../i18n/useI18n'
import styles from './Mascot.module.css'

interface MascotChatResumeProps {
  name: string
  pending: boolean
  offline: boolean
  /** câu trả lời về trong lúc thu nhỏ */
  hasNewReply: boolean
  /** số câu đã hỏi trong cuộc trò chuyện */
  count: number
  /** tin cuối (markdown thô) – hiện 2 dòng xem trước */
  preview?: string
  previewFromUser: boolean
  onRestore: () => void
  onClose: () => void
}

/** Markdown thô -> 1 đoạn chữ ngắn để xem trước */
function plain(text: string) {
  return text
    .replace(/[*_`#>|~]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Khung chat đang thu nhỏ: bong bóng thoại nhỏ trên đầu mascot (cùng vị trí / đuôi với bong bóng chào),
 * thay cho thanh tiêu đề trôi ở đáy. Bấm để mở lại; có trả lời mới -> viền + chấm xanh nhấp nháy.
 */
export function MascotChatResume({
  name,
  pending,
  offline,
  hasNewReply,
  count,
  preview,
  previewFromUser,
  onRestore,
  onClose,
}: MascotChatResumeProps) {
  const { t, language } = useI18n()
  const vi = language !== 'en'

  const status = offline
    ? t.mascot.chat.statusOffline
    : pending
      ? t.mascot.chat.statusTyping
      : hasNewReply
        ? t.mascot.chat.newReply
        : count === 0
          ? (vi ? 'Khung chat đang thu nhỏ' : 'Chat minimized')
          : vi ? `Đang trò chuyện · ${count} câu hỏi` : `Chatting · ${count} question${count === 1 ? '' : 's'}`

  const highlight = hasNewReply || (pending && !offline)

  return (
    <Paper
      className={`${styles.speech} ${styles.resume} ${hasNewReply ? styles.resumeNew : ''}`}
      elevation={6}
      role="status"
      aria-live="polite"
      sx={(theme) => {
        const border = highlight ? alpha(theme.palette.primary.main, 0.55) : theme.palette.divider
        return {
          borderRadius: 2.5,
          border: `1px solid ${border}`,
          '--tail-border': border,
          '--resume-glow': alpha(theme.palette.primary.main, 0.35),
        }
      }}
    >
      <Box aria-hidden="true" className={styles.speechTail} sx={{ background: 'inherit' }} />

      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <ButtonBase
          onClick={onRestore}
          aria-label={`${t.mascot.chat.restore}: ${name}`}
          title={t.mascot.chat.restore}
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'block',
            textAlign: 'left',
            pl: 1.25,
            pr: 0.5,
            py: 0.875,
            borderTopLeftRadius: 'inherit',
            borderBottomLeftRadius: 'inherit',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {highlight
              ? <Box component="span" className={styles.resumeDot} />
              : <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 14, color: offline ? 'text.disabled' : 'text.secondary' }} />}
            <Typography
              noWrap
              color={highlight ? 'primary' : 'text.secondary'}
              sx={{ fontSize: 12, fontWeight: highlight ? 700 : 600, lineHeight: 1.3 }}
            >
              {status}
            </Typography>
          </Box>

          {preview && !pending && (
            <Typography
              sx={{
                mt: 0.375,
                fontSize: 12.5,
                lineHeight: 1.4,
                color: 'text.primary',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}
            >
              {previewFromUser && (
                <Box component="span" sx={{ color: 'text.secondary' }}>{vi ? 'Bạn: ' : 'You: '}</Box>
              )}
              {plain(preview)}
            </Typography>
          )}

          <Typography color="primary" sx={{ mt: 0.375, fontSize: 11.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.375 }}>
            <OpenInNewRoundedIcon sx={{ fontSize: 13 }} />
            {vi ? 'Mở lại chat' : 'Open chat'}
          </Typography>
        </ButtonBase>

        <IconButton
          size="small"
          aria-label={t.mascot.chat.close}
          title={t.mascot.chat.close}
          onClick={onClose}
          sx={{ m: 0.25, p: 0.375, color: 'text.secondary' }}
        >
          <CloseRoundedIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Box>
    </Paper>
  )
}
