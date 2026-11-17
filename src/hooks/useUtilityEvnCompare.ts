import { useCallback, useMemo, useState } from 'react'
import { getMessages } from '../i18n/i18nContext'
import { getUtilityEvnCompare } from '../services/utilityEvnService'
import type { UtilityEvnCompareData } from '../types/utilityEvn'
import { useCachedQuery } from './useCachedQuery'

// month = YYYY-MM. Cache theo phiên theo từng kỳ: đổi qua lại giữa các kỳ đã xem => hiện ngay
export function useUtilityEvnCompare(month: string) {
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1)
  }, [])

  const query = useCachedQuery<UtilityEvnCompareData>(
    `utility-evn:${month}`,
    (signal) => getUtilityEvnCompare(month, signal),
    {
      refreshKey,
      fallbackError: () => getMessages().utilityEvn.loadFailed,
    },
  )

  const lastUpdated = useMemo(
    () => (query.updatedAt == null ? null : new Date(query.updatedAt)),
    [query.updatedAt],
  )

  return {
    // dữ liệu của kỳ trước (đang tải kỳ mới) thì không hiện để khỏi nhầm kỳ
    data: query.stale ? null : query.data,
    loading: query.loading,
    error: query.error,
    lastUpdated,
    refresh,
  }
}
