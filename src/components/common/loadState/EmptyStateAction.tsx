import { Button } from '@mui/material'
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'

import { useI18n } from '../../../i18n/useI18n'

/**
 * Default empty-state button: "Clear filters" if the view is filtered,
 * otherwise "Refresh". Renders nothing when neither handler is given.
 */
export function EmptyStateAction({
  onClearFilters,
  onRefresh,
}: {
  onClearFilters?: () => void
  onRefresh?: () => void
}) {
  const { t } = useI18n()

  if (!onClearFilters && !onRefresh) return null

  const clear = Boolean(onClearFilters)

  return (
    <Button
      variant="outlined"
      size="small"
      onClick={clear ? onClearFilters : onRefresh}
      startIcon={clear ? <FilterAltOffOutlinedIcon /> : <RefreshRoundedIcon />}
      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
    >
      {clear ? t.common.clearFilters : t.common.refresh}
    </Button>
  )
}
