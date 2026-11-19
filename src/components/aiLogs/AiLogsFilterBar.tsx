import dayjs from 'dayjs'

import {
  FilterBar,
  FilterDateRange,
  FilterSearch,
  FilterSelect,
  FilterText,
} from '../common/filterBar'
import type { AiLogFilters, AiLogSource } from '../../types/assistantLogs'
import { MAX_RANGE_DAYS, countAiLogFilters } from './aiLogsUtils'
import { useI18n } from '../../i18n/useI18n'

interface AiLogsFilterBarProps {
  value: AiLogFilters
  onChange: (next: AiLogFilters) => void
  /** Về mặc định (giữ tab màn hình đang chọn) */
  onReset: () => void
}

// Ô gõ tự do → chỉ đẩy lên sau khi ngừng gõ
const TEXT_DEBOUNCE_MS = 400

export function AiLogsFilterBar({ value, onChange, onReset }: AiLogsFilterBarProps) {
  const { t } = useI18n()
  const labels = t.aiLogs.filters

  return (
    <FilterBar
      variant="plain"
      activeCount={countAiLogFilters(value)}
      onClear={onReset}
    >
      {/* BE trả 400 nếu khoảng > MAX_RANGE_DAYS: lệch thì kéo đầu kia theo */}
      <FilterDateRange
        from={value.from}
        to={value.to}
        fromLabel={labels.from}
        toLabel={labels.to}
        maxDays={MAX_RANGE_DAYS}
        max={dayjs().format('YYYY-MM-DD')}
        onChange={(from, to) => onChange({ ...value, from, to })}
      />

      <FilterText
        label={labels.user}
        placeholder={labels.userPlaceholder}
        value={value.userId}
        debounceMs={TEXT_DEBOUNCE_MS}
        width={{ sm: 130 }}
        onChange={(userId) => onChange({ ...value, userId })}
      />

      <FilterSearch
        label={labels.search}
        value={value.q}
        debounceMs={TEXT_DEBOUNCE_MS}
        // BE: q ≤ 200 ký tự
        maxLength={200}
        width={{ sm: 240 }}
        onChange={(q) => onChange({ ...value, q })}
      />

      <FilterSelect<AiLogFilters['ok']>
        label={labels.status}
        value={value.ok}
        options={[
          { value: '', label: labels.all },
          { value: 'true', label: labels.ok },
          { value: 'false', label: labels.error },
        ]}
        width={{ sm: 120 }}
        onChange={(ok) => onChange({ ...value, ok })}
      />

      <FilterSelect<'' | AiLogSource>
        label={labels.source}
        value={value.source}
        options={[
          { value: '', label: labels.all },
          { value: 'chat', label: labels.chat },
          { value: 'eval', label: labels.eval },
        ]}
        width={{ sm: 110 }}
        onChange={(source) => onChange({ ...value, source })}
      />

      <FilterText
        type="number"
        label={labels.slowerThan}
        value={value.slowerThanSec == null ? '' : String(value.slowerThanSec)}
        debounceMs={TEXT_DEBOUNCE_MS}
        width={{ sm: 140 }}
        onChange={(raw) => {
          const n = Number(raw)
          onChange({ ...value, slowerThanSec: raw.trim() === '' || !Number.isFinite(n) || n <= 0 ? null : n })
        }}
      />
    </FilterBar>
  )
}
