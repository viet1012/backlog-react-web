import { Box } from '@mui/material'
import type {
  FacConfirmProcessGroup,
  FacConfirmProcessGroupSummary,
} from '../../types/facConfirm'
import { FacConfirmProcessGroupButton } from './FacConfirmProcessGroupButton'

interface FacConfirmProcessGroupStripProps {
  value: FacConfirmProcessGroup
  items: FacConfirmProcessGroupSummary[]
  loading: boolean
  onChange: (value: FacConfirmProcessGroup) => void
}

const PROCESS_GROUP_ORDER: readonly FacConfirmProcessGroup[] = [
  'Rough',
  'Heat',
  'Fine',
]

export function FacConfirmProcessGroupStrip({
  value,
  items,
  loading,
  onChange,
}: FacConfirmProcessGroupStripProps) {
  const summariesByGroup = new Map(
    items.map((item) => [item.processGroup, item]),
  )

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 0.6,
        flex: '1 1 420px',
        minWidth: 0,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {PROCESS_GROUP_ORDER.map((processGroup) => {
        const item = summariesByGroup.get(processGroup)

        return (
          <FacConfirmProcessGroupButton
            key={processGroup}
            processGroup={processGroup}
            item={item}
            selected={processGroup === value}
            disabled={loading || !item}
            onClick={() => onChange(processGroup)}
          />
        )
      })}
    </Box>
  )
}
