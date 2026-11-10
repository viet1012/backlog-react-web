import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Snackbar,
  Tab,
  Tabs,
} from '@mui/material'
import type { PaletteMode } from '@mui/material'
import { useState } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { AiLogDetailDrawer } from '../components/aiLogs/AiLogDetailDrawer'
import { AiLogsDailyChart } from '../components/aiLogs/AiLogsDailyChart'
import { AiLogsFilterBar } from '../components/aiLogs/AiLogsFilterBar'
import { AiLogsKpi } from '../components/aiLogs/AiLogsKpi'
import { AiLogsTable } from '../components/aiLogs/AiLogsTable'
import { AiTestSuitePanel } from '../components/aiLogs/AiTestSuitePanel'
import { AI_LOGS_PAGE_SIZES, defaultFilters } from '../components/aiLogs/aiLogsUtils'
import { useAiLogDetail, useAiLogList, useAiLogStats } from '../hooks/useAssistantLogs'
import { exportAiLogsExcel } from '../services/assistantLogService'
import type { AiLogFilters, AiLogListQuery } from '../types/assistantLogs'
import { uiTokens } from '../theme/uiTokens'
import { useI18n } from '../i18n/useI18n'

interface AiLogsPageProps {
  mode: PaletteMode
  onToggleMode: () => void
}

const DEFAULT_QUERY: AiLogListQuery = {
  page: 0,
  // 50 = mặc định BE
  size: AI_LOGS_PAGE_SIZES[1],
  sort: 'timestamp',
  order: 'desc',
}

type AiLogsTab = 'logs' | 'tests'

export function AiLogsPage({ mode, onToggleMode }: AiLogsPageProps) {
  const { t } = useI18n()

  const [tab, setTab] = useState<AiLogsTab>('logs')

  const [filters, setFilters] = useState<AiLogFilters>(defaultFilters)
  const [query, setQuery] = useState<AiLogListQuery>(DEFAULT_QUERY)
  const [refreshKey, setRefreshKey] = useState(0)

  const list = useAiLogList(filters, query, refreshKey)
  const stats = useAiLogStats(filters, refreshKey)

  // giữ rid khi đóng để nội dung không mất trong lúc drawer trượt ra
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRid, setDetailRid] = useState<string | null>(null)
  const detail = useAiLogDetail(detailRid)

  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  // đổi bộ lọc → về trang đầu
  function changeFilters(next: AiLogFilters) {
    setFilters(next)
    setQuery((prev) => ({ ...prev, page: 0 }))
  }

  async function handleExport() {
    setExporting(true)
    setExportError(null)

    try {
      await exportAiLogsExcel(filters, query)
    } catch (err) {
      setExportError(`${t.aiLogs.exportFailed}: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setExporting(false)
    }
  }

  const loading = list.loading || stats.loading
  const error = list.error ?? stats.error
  const total = list.data?.totalElements ?? 0

  return (
    <PageShell>
      <PageHeader
        title={t.aiLogs.title}
        status={
          <UpdatedStatus
            updatedAt={list.updatedAt == null ? null : new Date(list.updatedAt)}
            error={Boolean(error)}
          />
        }
        actions={tab === 'logs' && (
          <>
            <Button
              size="small"
              variant="outlined"
              startIcon={exporting ? <CircularProgress size={14} /> : <FileDownloadOutlinedIcon />}
              disabled={exporting || total === 0}
              onClick={() => void handleExport()}
              sx={{ textTransform: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
            >
              {t.aiLogs.exportExcel}
            </Button>

            <RefreshButton
              loading={loading}
              onClick={() => setRefreshKey((k) => k + 1)}
            />
          </>
        )}
        bottom={
          <>
            <Tabs
              value={tab}
              onChange={(_, next: AiLogsTab) => setTab(next)}
              sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0.5, textTransform: 'none', fontWeight: 700 } }}
            >
              <Tab value="logs" label={t.aiLogs.tabs.logs} />
              <Tab value="tests" label={t.aiLogs.tabs.tests} />
            </Tabs>

            {tab === 'logs' && (
              <AiLogsFilterBar
                value={filters}
                onChange={changeFilters}
                onReset={() => changeFilters(defaultFilters())}
              />
            )}
          </>
        }
        mode={mode}
        onToggleMode={onToggleMode}
      />

      {tab === 'logs' && error && (
        <Alert severity="error" sx={{ flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {/* tab Bộ test luôn mounted để lượt chạy không bị hủy khi chuyển tab */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: tab === 'tests' ? 'flex' : 'none',
          flexDirection: 'column',
        }}
      >
        <AiTestSuitePanel />
      </Box>

      {/* trang cuộn dọc; bảng giữ chiều cao tối thiểu để đọc được */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: tab === 'logs' ? 'flex' : 'none',
          flexDirection: 'column',
          gap: uiTokens.page.gap,
        }}
      >
        <AiLogsKpi stats={stats.data} loading={stats.loading} />

        <AiLogsDailyChart rows={stats.data?.byDay ?? []} />

        <AiLogsTable
          rows={list.data?.content ?? []}
          total={total}
          loading={list.loading}
          query={query}
          onQueryChange={setQuery}
          selectedRid={detailOpen ? detailRid : null}
          onSelect={(rid) => {
            setDetailRid(rid)
            setDetailOpen(true)
          }}
        />
      </Box>

      <AiLogDetailDrawer
        open={detailOpen}
        rid={detailRid}
        data={detail.data}
        loading={detail.loading}
        error={detail.error}
        onClose={() => setDetailOpen(false)}
      />

      <Snackbar
        open={exportError !== null}
        autoHideDuration={6000}
        onClose={() => setExportError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setExportError(null)}>
          {exportError ?? ''}
        </Alert>
      </Snackbar>
    </PageShell>
  )
}
