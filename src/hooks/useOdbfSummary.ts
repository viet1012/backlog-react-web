import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import type { OdbfSummaryItem } from '../types/odbf'
import { getOdbfSummary } from '../services/odbfService'



export function useOdbfSummary() {
  const [items, setItems] =
    useState<OdbfSummaryItem[]>([])

  const [loading, setLoading] =
    useState(true)

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

  useEffect(() => {
    const controller =
      new AbortController()

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const response =
          await getOdbfSummary(
            controller.signal,
          )

        setItems(response)
        setLastUpdated(new Date())
      } catch (err) {
        if (
          !controller.signal.aborted
        ) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to load ODBF summary',
          )
        }
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      controller.abort()
    }
  }, [refreshKey])

  return {
    items,
    loading,
    error,
    lastUpdated,
    refresh,
  }
}
