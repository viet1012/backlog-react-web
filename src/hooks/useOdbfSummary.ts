import {
  useCallback,
  useMemo,
  useState,
} from 'react'
import type { OdbfSummaryItem } from '../types/odbf'
import { getOdbfSummary } from '../services/odbfService'
import { getMessages } from '../i18n/i18nContext'
import { useCachedQuery } from './useCachedQuery'

const EMPTY_ITEMS: OdbfSummaryItem[] = []

// Cache theo phiên: quay lại trang ODBF => hiện ngay, tải lại ngầm nếu đã cũ
export function useOdbfSummary() {
  const [refreshKey, setRefreshKey] =
    useState(0)

  const refresh =
    useCallback(() => {
      setRefreshKey(
        (value) => value + 1,
      )
    }, [])

  const query = useCachedQuery(
    'odbf:summary',
    (signal) => getOdbfSummary(signal),
    {
      refreshKey,
      fallbackError: () => getMessages().odbf.loadFailed,
    },
  )

  const lastUpdated = useMemo(
    () => (query.updatedAt == null ? null : new Date(query.updatedAt)),
    [query.updatedAt],
  )

  return {
    items: query.data ?? EMPTY_ITEMS,
    loading: query.loading,
    error: query.error,
    lastUpdated,
    refresh,
  }
}
