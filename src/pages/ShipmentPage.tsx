import { Alert, Box, CircularProgress } from '@mui/material'
import { useMemo, useState } from 'react'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { ShipmentDetailDialog } from '../components/common/shipment/ShipmentDetailDialog'
import { ShipmentFilterBar } from '../components/shipment/ShipmentFilterBar'
import { ShipmentHeatmap } from '../components/shipment/ShipmentHeatmap'
import { buildDateRange, buildShipmentRows, getDefaultShipmentDateRange } from '../components/shipment/shipmentHeatmapUtils'
import { useShipmentData } from '../hooks/useShipmentData'
import type { ShipmentHeatmapRow } from '../types/shipment'
interface ShipmentPageProps {
  mode: 'light' | 'dark'
  onToggleMode: () => void
}

const defaultRange = getDefaultShipmentDateRange()

export function ShipmentPage({
  mode,
  onToggleMode,
}: ShipmentPageProps) {
  // =========================================================
  // PAGE FILTER STATE
  // =========================================================
  const [fromD, setFromD] = useState(defaultRange.fromD)
  const [toD, setToD] = useState(defaultRange.toD)
  const [appliedFromD, setAppliedFromD] = useState(defaultRange.fromD)
  const [appliedToD, setAppliedToD] = useState(defaultRange.toD)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null)
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null)

  // =========================================================
  // DATA HOOK
  // =========================================================
  const {
    data, loading, error: dataError, lastUpdated, handleRefresh,
    detailOpen, detailFilter, detailData, detailLoading, detailError,
    openShipmentDetail, handleCloseDetail,
  } = useShipmentData(appliedFromD, appliedToD)

  const error = validationError ?? dataError
  const dates = useMemo(() => buildDateRange(appliedFromD, appliedToD), [appliedFromD, appliedToD])
  const rows = useMemo(() => buildShipmentRows(data), [data])

  // =========================================================
  // HANDLERS
  // =========================================================
  function handleApplyDate() {
    if (!fromD || !toD) {
      setValidationError('Please select From Date and To Date')
      return
    }
    if (fromD > toD) {
      setValidationError('From Date cannot be after To Date')
      return
    }
    setValidationError(null)
    setAppliedFromD(fromD)
    setAppliedToD(toD)
  }

  function handleResetTwoWeeks() {
    const range = getDefaultShipmentDateRange()
    setFromD(range.fromD)
    setToD(range.toD)
    setAppliedFromD(range.fromD)
    setAppliedToD(range.toD)
    setValidationError(null)
  }

  function handleRowClick(row: ShipmentHeatmapRow) {
    setSelectedRowKey(row.key)
    setSelectedCellKey(null)
    void openShipmentDetail({ cusId: row.cusId, shipBy: row.shipBy })
  }

  function handleCellClick(row: ShipmentHeatmapRow, date: string) {
    setSelectedRowKey(null)
    setSelectedCellKey(`${row.key}-${date}`)
    void openShipmentDetail({ cusId: row.cusId, shipBy: row.shipBy, exportDate: date })
  }

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <PageShell>
      <PageHeader
        title="SHIPMENT FULFILLMENT"
        subtitle="Monitor shipment fulfillment and delivery readiness."
        status={
          <UpdatedStatus
            updatedAt={lastUpdated}
            error={Boolean(error)}
          />
        }
        actions={
          <RefreshButton
            loading={loading}
            onClick={handleRefresh}
          />
        }
        mode={mode}
        onToggleMode={onToggleMode}
      />
      <ShipmentFilterBar
        fromD={fromD} toD={toD} loading={loading}
        onFromDateChange={setFromD} onToDateChange={setToD}
        onApply={handleApplyDate} onReset={handleResetTwoWeeks}
      />

      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative' }}>
        {loading && data.length === 0 ? (
          <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <ShipmentHeatmap
            dates={dates} rows={rows}
            selectedRowKey={selectedRowKey} selectedCellKey={selectedCellKey}
            onRowClick={handleRowClick}
            onCellClick={handleCellClick}
          />
        )}
      </Box>

      <ShipmentDetailDialog
        open={detailOpen} filter={detailFilter} data={detailData}
        loading={detailLoading} error={detailError} onClose={handleCloseDetail}
      />
    </PageShell>
  )
}
