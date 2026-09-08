import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import type {
  SelectChangeEvent,
} from '@mui/material/Select'

import type {
  FacConfirmClassify,
  FacConfirmHeatType,
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
  heatType: FacConfirmHeatType
  processGroups: FacConfirmProcessGroupSummary[]
  loading: boolean

  onDivChange: (value: string) => void
  onDateChange: (value: string) => void
  onProcessGroupChange: (
    value: FacConfirmProcessGroup
  ) => void
  onClassifyChange: (
    value: FacConfirmClassify[]
  ) => void
  onHeatTypeChange: (
    value: FacConfirmHeatType
  ) => void
}

const heatTypeOptions: FacConfirmHeatType[] = [
  'All',
  'Normal',
  'DC53',
  'TD',
]

export function FacConfirmFilterBar({
  div,
  expD,
  procGrp,
  classify,
  heatType,
  processGroups,
  loading,
  onDivChange,
  onDateChange,
  onProcessGroupChange,
  onClassifyChange,
  onHeatTypeChange,
}: FacConfirmFilterBarProps) {
  const handleHeatTypeChange = (
    event: SelectChangeEvent<FacConfirmHeatType>,
  ) => {
    onHeatTypeChange(event.target.value)
  }

  return (
    <GlassPanel
      sx={{
        p: 1,
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: {
            xs: 'column',
            sm: 'row',
          },
          alignItems: {
            xs: 'stretch',
            sm: 'center',
          },
          gap: 0.75,
        }}
      >
        <FormControl
          size="small"
          disabled={loading}
          sx={{
            width: {
              xs: '100%',
              sm: 125,
            },
            flexShrink: 0,
          }}
        >
          <InputLabel>
            Division
          </InputLabel>

          <Select
            label="Division"
            value={div}
            onChange={(event) =>
              onDivChange(event.target.value)
            }
          >
            <MenuItem value="PR">
              PRESS
            </MenuItem>

            <MenuItem value="PR-RET">
              PRESS Retainer
            </MenuItem>

            <MenuItem value="MO">
              MOLD
            </MenuItem>

            <MenuItem value="GU">
              GUIDE
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Export Date"
          type="date"
          size="small"
          value={expD}
          disabled={loading}
          onChange={(event) =>
            onDateChange(event.target.value)
          }
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
          sx={{
            width: {
              xs: '100%',
              sm: 158,
            },
            flexShrink: 0,
          }}
        />

        <FacConfirmClassifyControl
          value={classify}
          disabled={loading}
          onChange={onClassifyChange}
        />

        <FormControl
          size="small"
          disabled={loading}
          sx={{
            width: {
              xs: '100%',
              sm: 135,
            },
            flexShrink: 0,
          }}
        >
          <InputLabel>
            Heat Type
          </InputLabel>

          <Select<FacConfirmHeatType>
            label="Heat Type"
            value={heatType}
            onChange={handleHeatTypeChange}
          >
            {heatTypeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
