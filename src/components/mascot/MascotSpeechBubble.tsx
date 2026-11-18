import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { Box, Button, ButtonBase, IconButton, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { MascotTexts } from './mascotConfig'
import type { MascotBubble } from './useMascotBehavior'
import styles from './Mascot.module.css'

interface MascotSpeechBubbleProps {
  bubble: MascotBubble
  texts: MascotTexts
  name: string
  /** bấm vào nội dung bubble → mở chat (kèm câu hỏi gợi ý nếu có) */
  onOpen: () => void
  /** bấm link chuyển màn */
  onLink: (to: string) => void
  onDismiss: () => void
  onMute: () => void
}

/** Bong bóng thoại tự hiện phía trên đầu mascot (chào, bắt chuyện, màn chưa hỗ trợ) */
export function MascotSpeechBubble({ bubble, texts, name, onOpen, onLink, onDismiss, onMute }: MascotSpeechBubbleProps) {
  const unsupported = bubble.kind === 'unsupported'

  return (
    <Paper
      className={styles.speech}
      elevation={6}
      role="status"
      aria-live="polite"
      sx={(theme) => ({
        borderRadius: 2.5,
        border: `1px solid ${unsupported ? alpha(theme.palette.warning.main, 0.45) : theme.palette.divider}`,
        '--tail-border': unsupported ? alpha(theme.palette.warning.main, 0.45) : theme.palette.divider,
      })}
    >
      <Box aria-hidden="true" className={styles.speechTail} sx={{ background: 'inherit' }} />

      <Stack direction="row" sx={{ alignItems: 'flex-start' }}>
        <ButtonBase
          onClick={onOpen}
          aria-label={`${texts.openChatHint(name)}: ${bubble.text}`}
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'block',
            textAlign: 'left',
            pl: 1.5,
            pr: 0.5,
            pt: 1,
            pb: bubble.link ? 0.5 : 0.75,
            borderTopLeftRadius: 'inherit',
          }}
        >
          <Typography sx={{ fontSize: 13, lineHeight: 1.45, color: 'text.primary', whiteSpace: 'pre-wrap' }}>
            {bubble.text}
          </Typography>
          {bubble.hint && (
            <Typography color="primary" sx={{ fontSize: 12, lineHeight: 1.4, mt: 0.5, fontWeight: 600 }}>
              {bubble.hint}
            </Typography>
          )}
        </ButtonBase>
        <IconButton
          size="small"
          aria-label={texts.dismiss}
          title={texts.dismiss}
          onClick={onDismiss}
          sx={{ m: 0.25, p: 0.375, color: 'text.secondary' }}
        >
          <CloseRoundedIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Stack>

      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 1, pb: 0.625 }}
      >
        {bubble.link ? (
          <Button
            size="small"
            endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: '15px !important' }} />}
            onClick={() => onLink(bubble.link!.to)}
            sx={{ px: 0.75, py: 0.125, minWidth: 0, fontSize: 12, fontWeight: 600, textTransform: 'none' }}
          >
            {bubble.link.label}
          </Button>
        ) : <span />}
        <Button
          size="small"
          onClick={onMute}
          sx={{ px: 0.75, py: 0, minWidth: 0, fontSize: 11, textTransform: 'none', color: 'text.disabled' }}
        >
          {texts.mute}
        </Button>
      </Stack>
    </Paper>
  )
}
