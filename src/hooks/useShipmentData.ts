import { useCallback, useMemo, useState } from 'react'
import { getShipmentDetail, getShipmentFulfillment } from '../services/shipmentService'
import type { ProductionOrder } from '../types/report'
import type { ShipmentDetailFilter, ShipmentFulfillment } from '../types/shipment'
import { getMessages } from '../i18n/i18nContext'
import { useCachedQuery } from './useCachedQuery'

const EMPTY_DATA: ShipmentFulfillment[] = []

export function useShipmentData(appliedFromD: string, appliedToD: string) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailFilter, setDetailFilter] = useState<ShipmentDetailFilter | null>(null)
  const [detailData, setDetailData] = useState<ProductionOrder[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  // Cache theo khoảng ngày: quay lại trang / khoảng vừa xem => hiện ngay, tải lại ngầm nếu đã cũ
  const query = useCachedQuery(
    `shipment:fulfillment:${appliedFromD}|${appliedToD}`,
    (signal) => getShipmentFulfillment(appliedFromD, appliedToD, signal),
    {
      refreshKey,
      fallbackError: () => getMessages().shipment.loadFailed,
    },
  )

  const data = query.data ?? EMPTY_DATA
  const { loading, error } = query
  const lastUpdated = useMemo(
    () => (query.updatedAt == null ? null : new Date(query.updatedAt)),
    [query.updatedAt],
  )

  const handleRefresh = useCallback(() => setRefreshKey((value) => value + 1), [])

  const openShipmentDetail = useCallback(async (filter: ShipmentDetailFilter) => {
    setDetailFilter(filter)
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailError(null)
    setDetailData([])
    try {
      setDetailData(await getShipmentDetail(filter))
    } catch (requestError) {
      setDetailError(requestError instanceof Error
        ? requestError.message
        : getMessages().shipment.detailLoadFailed)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false)
    setDetailError(null)
  }, [])

  return {
    data, loading, error, lastUpdated, handleRefresh,
    detailOpen, detailFilter, detailData, detailLoading, detailError,
    openShipmentDetail, handleCloseDetail,
  }
}
