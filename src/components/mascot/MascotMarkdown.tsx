import { Box } from '@mui/material'
import type { SxProps, Theme } from '@mui/material'
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cleanLatex } from './cleanLatex'

// Không dùng rehype-raw → HTML thô trong câu trả lời hiển thị như text, không render.

const components: Components = {
  // link luôn mở tab mới
  a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
  // bảng rộng → cuộn ngang trong bubble
  table: ({ node: _node, ...props }) => (
    <Box className="md-table-wrap">
      <table {...props} />
    </Box>
  ),
}

const markdownSx: SxProps<Theme> = (theme) => ({
  fontSize: 14,
  lineHeight: 1.5,
  wordBreak: 'break-word',

  '& p': { m: '0 0 6px' },
  '& > :last-child, & li > :last-child': { mb: 0 },

  '& ul, & ol': { pl: '18px', my: '4px', mx: 0 },
  '& li': { my: '2px' },

  '& strong': { fontWeight: 600, color: 'text.primary' },

  '& code': {
    bgcolor: 'action.hover',
    px: '4px',
    borderRadius: '4px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: 13,
  },
  '& pre': {
    m: '4px 0 6px',
    p: '6px 8px',
    bgcolor: 'action.hover',
    borderRadius: '4px',
    overflowX: 'auto',
    '& code': { bgcolor: 'transparent', p: 0 },
  },

  '& h1, & h2, & h3, & h4, & h5, & h6': {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.5,
    m: '0 0 4px',
  },

  '& .md-table-wrap': { overflowX: 'auto', maxWidth: '100%', my: '4px' },
  '& table': { borderCollapse: 'collapse', fontSize: 13 },
  '& th, & td': {
    border: `1px solid ${theme.palette.divider}`,
    p: '4px 8px',
    fontSize: 13,
    whiteSpace: 'nowrap',
    textAlign: 'left',
    verticalAlign: 'top',
  },
  // nền header: lớp action.hover phủ lên nền bubble (cột sticky cần nền đặc)
  '& th': {
    fontWeight: 600,
    backgroundImage: `linear-gradient(${theme.palette.action.hover}, ${theme.palette.action.hover})`,
  },
  // cột đầu dính trái khi cuộn ngang; viền phải vẽ bằng shadow vì border-collapse
  // không giữ viền theo ô sticky
  '& th:first-of-type, & td:first-of-type': {
    position: 'sticky',
    left: 0,
    zIndex: 1,
    bgcolor: `var(--bubble-bg, ${theme.palette.background.paper})`,
    boxShadow: `inset -1px 0 0 ${theme.palette.divider}`,
  },

  '& a': { color: 'primary.main' },
  '& blockquote': {
    m: '4px 0',
    pl: 1,
    borderLeft: `3px solid ${theme.palette.divider}`,
    color: 'text.secondary',
  },
  '& hr': { border: 0, borderTop: `1px solid ${theme.palette.divider}`, my: 1 },
})

export function MascotMarkdown({ children }: { children: string }) {
  // LaTeX (\frac, \times, $…$…) → text đọc được trước khi parse markdown
  const content = useMemo(() => cleanLatex(children), [children])

  return (
    <Box sx={markdownSx}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </Box>
  )
}
