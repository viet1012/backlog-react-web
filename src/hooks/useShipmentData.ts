import { useCallback, useEffect, useState } from 'react'
import { getShipmentDetail, getShipmentFulfillment } from '../services/shipmentService'
import type { ProductionOrder } from '../types/report'
import type { ShipmentDetailFilter, ShipmentFulfillment } from '../types/shipment'

export function useShipmentData(appliedFromD: string, appliedToD: string) {
  const [data, setData] = useState<ShipmentFulfillment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailFilter, setDetailFilter] = useState<ShipmentDetailFilter | null>(null)
  const [detailData, setDetailData] = useState<ProductionOrder[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        setData(await getShipmentFulfillment(appliedFromD, appliedToD, controller.signal))
        setLastUpdated(new Date())
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error
            ? requestError.message
            : 'Unable to load shipment fulfillment')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void loadData()
    return () => controller.abort()
  }, [appliedFromD, appliedToD, refreshKey])

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
        : 'Unable to load shipment detail')
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
