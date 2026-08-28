import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { GlassPanel } from '../common/GlassPanel'
import type { FacConfirmProcessGroup, FacConfirmProcessGroupSummary } from '../../types/facConfirm'
import { FacConfirmProcessGroupButton } from './FacConfirmProcessGroupButton'

interface Props {
  div: string; expD: string; procGrp: FacConfirmProcessGroup
  processGroups: FacConfirmProcessGroupSummary[]; loading: boolean
  onDivChange: (value: string) => void
  onDateChange: (value: string) => void
  onProcessGroupChange: (value: FacConfirmProcessGroup) => void
}

export function FacConfirmFilterBar({ div, expD, procGrp, processGroups, loading, onDivChange, onDateChange, onProcessGroupChange }: Props) {
  return (
    <GlassPanel sx={{ p: 1, flexShrink: 0 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'center' }, gap: 0.75 }}>
        <FormControl size="small" sx={{ width: { xs: '100%', sm: 125 }, flexShrink: 0 }}>
          <InputLabel>Division</InputLabel>
          <Select label="Division" value={div} onChange={(event) => onDivChange(event.target.value)}>
            <MenuItem value="PR">PRESS</MenuItem><MenuItem value="PR-RET">PRESS Retainer</MenuItem>
            <MenuItem value="MO">MOLD</MenuItem><MenuItem value="GU">GUIDE</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Export Date" type="date" size="small" value={expD}
          onChange={(event) => onDateChange(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }} sx={{ width: { xs: '100%', sm: 158 }, flexShrink: 0 }} />
        <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0.6, flex: 1, minWidth: 0, overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {processGroups.map((item) => (
            <FacConfirmProcessGroupButton key={item.processGroup} item={item}
              selected={item.processGroup === procGrp} disabled={loading}
              onClick={() => onProcessGroupChange(item.processGroup)} />
          ))}
        </Box>
      </Box>
    </GlassPanel>
  )
}
