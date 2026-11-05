import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import type {
  CostMonitoringChartResponse,
  CostSimuWeek,
} from '../types/costMonitoring'
import {
  getCostMonitoringChart,
  getCostMonitoringMonths,
  toApiMonth,
} from '../services/costMonitoringService'
import { getMessages } from '../i18n/i18nContext'


function toErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback
}


export function useCostMonitoring() {
  const [months, setMonths] =
    useState<string[]>([])

  // dạng "2026.10" như API /months trả về
  const [month, setMonth] =
    useState<string | null>(null)

  const [simuWeek, setSimuWeek] =
    useState<CostSimuWeek>('')

  const [data, setData] =
    useState<CostMonitoringChartResponse | null>(null)

  const [monthsLoading, setMonthsLoading] =
    useState(true)

  const [chartLoading, setChartLoading] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null)

  const [refreshKey, setRefreshKey] =
    useState(0)

  const refresh =
    useCallback(() => {
      setRefreshKey(
        (value) => value + 1,
      )
    }, [])

  // ---------- months ----------
  useEffect(() => {
    const controller =
      new AbortController()

    async function load() {
      setMonthsLoading(true)
      setError(null)

      try {
        const response =
          await getCostMonitoringMonths(
            controller.signal,
          )

        setMonths(response)

        // giữ tháng đang chọn nếu còn trong danh sách, không thì lấy mới nhất
        setMonth((current) =>
          current && response.includes(current)
            ? current
            : response[0] ?? null,
        )
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            toErrorMessage(err, getMessages().cost.monthsLoadFailed),
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setMonthsLoading(false)
        }
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [refreshKey])

  // ---------- chart ----------
  useEffect(() => {
    if (!month) {
      return
    }

    const controller =
      new AbortController()

    async function load(selectedMonth: string) {
      setChartLoading(true)
      setError(null)

      try {
        const response =
          await getCostMonitoringChart(
            toApiMonth(selectedMonth),
            simuWeek,
            controller.signal,
          )

        setData(response)
        setLastUpdated(new Date())
      } catch (err) {
        if (!controller.signal.aborted) {
          setData(null)
          setError(
            toErrorMessage(err, getMessages().cost.chartLoadFailed),
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setChartLoading(false)
        }
      }
    }

    void load(month)

    return () => {
      controller.abort()
    }
  }, [month, simuWeek, refreshKey])

  return {
    months,
    month,
    setMonth,
    simuWeek,
    setSimuWeek,
    data,
    loading: monthsLoading || chartLoading,
    error,
    lastUpdated,
    refresh,
  }
}
