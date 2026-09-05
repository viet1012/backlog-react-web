import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import type {
  FacConfirmClassify,
  FacConfirmProcessGroup,
  FacConfirmProcessGroupSummary,
} from '../../types/facConfirm'
import { GlassPanel } from '../common/GlassPanel'
import { FacConfirmClassifyControl } from './FacConfirmClassifyControl'
import { FacConfirmProcessGroupStrip } from './FacConfirmProcessGroupStrip'

interface FacConfirmFilterBarProps {
  div: string
  expD: string
  procGrp: FacConfirmProcessGroup
  classify: FacConfirmClassify[]
  processGroups: FacConfirmProcessGroupSummary[]
  loading: boolean
  onDivChange: (value: string) => void
  onDateChange: (value: string) => void
  onProcessGroupChange: (value: FacConfirmProcessGroup) => void
  onClassifyChange: (value: FacConfirmClassify[]) => void
}

export function FacConfirmFilterBar({
  div,
  expD,
  procGrp,
  classify,
  processGroups,
  loading,
  onDivChange,
  onDateChange,
  onProcessGroupChange,
  onClassifyChange,
}: FacConfirmFilterBarProps) {
  return (
    <GlassPanel sx={{ p: 1, flexShrink: 0 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 0.75,
        }}
      >
        <FormControl
          size="small"
          sx={{
            width: { xs: '100%', sm: 125 },
            flexShrink: 0,
          }}
        >
          <InputLabel>Division</InputLabel>
          <Select
            label="Division"
            value={div}
            onChange={(event) => onDivChange(event.target.value)}
          >
            <MenuItem value="PR">PRESS</MenuItem>
            <MenuItem value="PR-RET">PRESS Retainer</MenuItem>
            <MenuItem value="MO">MOLD</MenuItem>
            <MenuItem value="GU">GUIDE</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Export Date"
          type="date"
          size="small"
          value={expD}
          onChange={(event) => onDateChange(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{
            width: { xs: '100%', sm: 158 },
            flexShrink: 0,
          }}
        />

        <FacConfirmClassifyControl
          value={classify}
          disabled={loading}
          onChange={onClassifyChange}
        />

        <FacConfirmProcessGroupStrip
          value={procGrp}
          items={processGroups}
          loading={loading}
          onChange={onProcessGroupChange}
        />
      </Box>
    </GlassPanel>
  )
}
