import { Alert, Box, Stack, Typography } from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { OdbfSummaryTable } from '../components/odbf/OdbfSummaryTable'
import { useOdbfSummary } from '../hooks/useOdbfSummary'

interface OdbfPageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

export function OdbfPage({
  mode,
  onToggleMode,
}: OdbfPageProps) {
  const {
    items,
    loading,
    error,
    lastUpdated,
    refresh,
  } = useOdbfSummary()

  const showMatrices = loading || items.length > 0

  return (
    <PageShell>
      <PageHeader
        title="ODBF Summary"
        subtitle="Daily PO & quantity progress by product group"
        status={
          <UpdatedStatus
            updatedAt={lastUpdated}
            error={Boolean(error)}
          />
        }
        actions={
          <RefreshButton
            loading={loading}
            onClick={refresh}
          />
        }
        mode={mode}
        onToggleMode={onToggleMode}
      />

      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto' }}>
        <Stack spacing={1.5} sx={{ minWidth: 0 }}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {showMatrices ? (
            <>
              <OdbfSummaryTable
                title="PO COUNT"
                items={items}
                metric="countPo"
                loading={loading}
              />

              <OdbfSummaryTable
                title="QUANTITY"
                items={items}
                metric="sumQty"
                loading={loading}
              />
            </>
          ) : !error ? (
            <Box
              sx={(theme) => ({
                minHeight: 120,
                display: 'grid',
                placeItems: 'center',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1.5,
                bgcolor: theme.palette.background.paper,
              })}
            >
              <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
                No ODBF summary data
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </Box>
    </PageShell>
  )
}
