import { Alert, Box, Stack } from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { FactoryNoRowsOverlay } from '../components/common/FactoryNoRowsOverlay'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { OdbfSummaryTable } from '../components/odbf/OdbfSummaryTable'
import { useOdbfSummary } from '../hooks/useOdbfSummary'
import { useI18n } from '../i18n/useI18n'

interface OdbfPageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

export function OdbfPage({
  mode,
  onToggleMode,
}: OdbfPageProps) {
  const { t } = useI18n()

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
        title={t.odbf.title}
        subtitle={t.odbf.subtitle}
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
          {/* Còn bảng cũ thì chỉ báo trên thanh; không có dữ liệu thì hiện cảnh lỗi bên dưới */}
          {error && showMatrices && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {showMatrices ? (
            <>
              <OdbfSummaryTable
                title={t.odbf.poCount}
                items={items}
                metric="countPo"
                loading={loading}
              />

              <OdbfSummaryTable
                title={t.odbf.quantity}
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
              <FactoryNoRowsOverlay title={t.odbf.noData} />
            </Box>
          ) : (
            <Box
              sx={(theme) => ({
                display: 'grid',
                placeItems: 'center',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1.5,
                bgcolor: theme.palette.background.paper,
              })}
            >
              <FactoryNoRowsOverlay tone="error" detail={error} onRetry={refresh} />
            </Box>
          )}
        </Stack>
      </Box>
    </PageShell>
  )
}
