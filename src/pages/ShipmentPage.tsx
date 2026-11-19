import { Alert, Box } from '@mui/material'
import { useMemo, useState } from 'react'
import { AsyncContent } from '../components/common/loadState'
import { PageHeader } from '../components/common/PageHeader'
import { PageShell } from '../components/common/PageShell'
import { RefreshButton } from '../components/common/RefreshButton'
import { UpdatedStatus } from '../components/common/UpdatedStatus'
import { ShipmentDetailDialog } from '../components/common/shipment/ShipmentDetailDialog'
import { ShipmentFilterBar } from '../components/shipment/ShipmentFilterBar'
import { ShipmentHeatmap } from '../components/shipment/ShipmentHeatmap'
import { buildDateRange, buildShipmentRows, getDefaultShipmentDateRange } from '../components/shipment/shipmentHeatmapUtils'
import { useShipmentData } from '../hooks/useShipmentData'
import { readUrlParams, urlParam, useUrlFilters, type UrlParams } from '../hooks/useUrlFilters'
import type { ShipmentHeatmapRow } from '../types/shipment'
import { useI18n } from '../i18n/useI18n'
interface ShipmentPageProps {
  mode: 'light' | 'dark'
  onToggleMode: () => void
}

const SHIPMENT_PATH = '/shipping-schedule'

interface ShipmentRange {
  fromD: string
  toD: string
}

// ?from=YYYY-MM-DD&to=YYYY-MM-DD: khoảng ĐANG ÁP DỤNG (sau khi bấm Áp dụng)
const SHIPMENT_URL_PARAMS: UrlParams<ShipmentRange> = {
  fromD: urlParam.date('from'),
  toD: urlParam.date('to'),
}

// Khoảng ban đầu: từ link (nếu hợp lệ) hoặc 2 tuần mặc định
function initialRange(): ShipmentRange {
  const fromUrl = readUrlParams(SHIPMENT_PATH, SHIPMENT_URL_PARAMS)
  const range = { ...getDefaultShipmentDateRange(), ...fromUrl }

  return range.fromD <= range.toD ? range : getDefaultShipmentDateRange()
}

export function ShipmentPage({
  mode,
  onToggleMode,
}: ShipmentPageProps) {
  // =========================================================
  // PAGE FILTER STATE
  // =========================================================
  const { t } = useI18n()

  const [startRange] = useState(initialRange)
  const [fromD, setFromD] = useState(startRange.fromD)
  const [toD, setToD] = useState(startRange.toD)
  const [appliedFromD, setAppliedFromD] = useState(startRange.fromD)
  const [appliedToD, setAppliedToD] = useState(startRange.toD)
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
  const currentDefault = getDefaultShipmentDateRange()
  const isDefaultRange = appliedFromD === currentDefault.fromD && appliedToD === currentDefault.toD
  const dates = useMemo(() => buildDateRange(appliedFromD, appliedToD), [appliedFromD, appliedToD])
  const rows = useMemo(() => buildShipmentRows(data), [data])

  // =========================================================
  // HANDLERS
  // =========================================================
  function handleApplyDate() {
    if (!fromD || !toD) {
      setValidationError(t.shipment.selectDates)
      return
    }
    if (fromD > toD) {
      setValidationError(t.shipment.fromAfterTo)
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

  // URL ⇄ khoảng đang áp dụng; link từ ngoài => áp khoảng của link
  useUrlFilters({
    path: SHIPMENT_PATH,
    params: SHIPMENT_URL_PARAMS,
    values: { fromD: appliedFromD, toD: appliedToD },
    onUrlChange: (next) => {
      if (next.fromD > next.toD) return
      setFromD(next.fromD)
      setToD(next.toD)
      setAppliedFromD(next.fromD)
      setAppliedToD(next.toD)
      setValidationError(null)
    },
  })

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
        title={t.shipment.title}
        subtitle={t.shipment.subtitle}
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
        filtered={!isDefaultRange}
        onRangeChange={(from, to) => {
          setFromD(from)
          setToD(to)
        }}
        onApply={handleApplyDate} onReset={handleResetTwoWeeks}
      />

      {/* Lỗi API khi chưa có dữ liệu => cảnh lỗi thay cho heatmap; còn dữ liệu cũ thì chỉ báo trên thanh */}
      {(validationError || (dataError && data.length > 0)) && <Alert severity="error">{error}</Alert>}

      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, position: 'relative' }}>
        {/* Tải lần đầu: skeleton heatmap; lỗi khi chưa có dữ liệu: cảnh lỗi + Thử lại;
            trống: "Xóa bộ lọc" (về 2 tuần mặc định) nếu đang chọn khoảng khác, còn lại "Làm mới" */}
        <AsyncContent
          loading={loading}
          error={dataError}
          hasData={data.length > 0}
          onRetry={handleRefresh}
          onClearFilters={isDefaultRange ? undefined : handleResetTwoWeeks}
          filterSummary={`${t.shipment.from}: ${appliedFromD} → ${t.shipment.to}: ${appliedToD}`}
          skeleton="heatmap"
          skeletonProps={{ columns: Math.min(Math.max(dates.length, 7), 21) }}
        >
          <ShipmentHeatmap
            dates={dates} rows={rows}
            selectedRowKey={selectedRowKey} selectedCellKey={selectedCellKey}
            onRowClick={handleRowClick}
            onCellClick={handleCellClick}
          />
        </AsyncContent>
      </Box>

      <ShipmentDetailDialog
        open={detailOpen} filter={detailFilter} data={detailData}
        loading={detailLoading} error={detailError} onClose={handleCloseDetail}
        onRetry={detailFilter ? () => void openShipmentDetail(detailFilter) : undefined}
      />
    </PageShell>
  )
}
