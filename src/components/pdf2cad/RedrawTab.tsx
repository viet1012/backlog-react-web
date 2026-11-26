import ArchitectureOutlinedIcon from '@mui/icons-material/ArchitectureOutlined'
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { useMemo } from 'react'
import type { Pdf2cadBot } from '../../hooks/usePdf2cadBot'
import { uiTokens } from '../../theme/uiTokens'
import { DxfViewer, type ViewerSource } from './DxfViewer'
import { describePreview } from './dxfBounds'
import { Pdf2cadCard } from './Pdf2cadCard'
import { RedrawAssistant } from './RedrawAssistant'
import { translateServer, usePdf2cadText } from './pdf2cadText'

const cellSx = { fontSize: uiTokens.table.cellFontSize, py: 0.4, px: 1, whiteSpace: 'nowrap' } as const

export function RedrawTab({ bot, llmModel }: { bot: Pdf2cadBot; llmModel: string | null }) {
  const { tx, language } = usePdf2cadText()
  const current = bot.templates?.find((t) => t.name === bot.template)
  const p = bot.preview
  const previewData = p?.preview ?? null

  const source = useMemo<ViewerSource | null>(
    () => (previewData ? { kind: 'dxf', preview: previewData } : null),
    [previewData],
  )

  const info = p
    ? p.preview
      ? describePreview(p.output, p.preview, tx.dxfInfo)
      : p.loading
        ? tx.loadingPreview
        : `${tx.noPreview}${p.error ? ` – ${translateServer(language, p.error)}` : ''}`
    : ''

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'grid',
        gap: 1,
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: '420px minmax(0, 1fr)' },
        gridTemplateRows: { xs: '620px auto', lg: 'minmax(0, 1fr)' },
        overflow: { xs: 'auto', lg: 'hidden' },
      }}
    >
      <RedrawAssistant bot={bot} llmModel={llmModel} />

      <Box sx={{ display: 'grid', gridTemplateRows: { xs: '420px auto', lg: 'minmax(0, 1fr) auto' }, gap: 1, minHeight: 0, minWidth: 0 }}>
        <DxfViewer
          source={source}
          info={info}
          loading={p?.loading}
          emptyText={tx.redrawEmpty}
          toolbar={
            <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap' }}>
              <ArchitectureOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
              {tx.tabDxf}
            </Typography>
          }
        />

        <Pdf2cadCard
          title={current ? `${tx.paramTable} · ${current.title}` : tx.paramTable}
          sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, maxHeight: { lg: '30vh' } }}
        >
          {current?.columns?.length && current.rows?.length ? (
            <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', mx: -1.5, mb: -1.25 }}>
              <Table size="small" stickyHeader aria-label={tx.paramTable}>
                <TableHead>
                  <TableRow>
                    {current.columns.map((c) => (
                      <TableCell key={c} sx={{ ...cellSx, fontWeight: 700, bgcolor: 'background.paper' }}>
                        {c}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {current.rows.map((row, i) => (
                    <TableRow
                      key={i}
                      hover
                      onClick={() => bot.send(`${current.columns![0]}=${row[0]}`.replace(/^No=/, 'No.'))}
                      sx={{ cursor: 'pointer' }}
                    >
                      {row.map((v, j) => (
                        <TableCell key={j} sx={{ ...cellSx, fontVariantNumeric: 'tabular-nums', fontWeight: j === 0 ? 700 : 400 }}>
                          {v}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{tx.paramTableEmpty}</Typography>
          )}
        </Pdf2cadCard>
      </Box>
    </Box>
  )
}
