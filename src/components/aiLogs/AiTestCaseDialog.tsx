import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import { newCaseId } from '../../hooks/useAiTestSuite'
import type { AiTestCase } from '../../types/aiTestSuite'
import { useI18n } from '../../i18n/useI18n'
import { DRAWER_OPTIONS, drawerValue, parseDrawer } from './aiTestUtils'

interface AiTestCaseDialogProps {
  open: boolean
  // null = thêm mới
  initial: AiTestCase | null
  groups: string[]
  onClose: () => void
  onSave: (testCase: AiTestCase) => void
}

// form nhận initial lúc mở; key ở nơi gọi buộc dựng lại khi đổi case
function AiTestCaseForm({ initial, groups, onClose, onSave }: Omit<AiTestCaseDialogProps, 'open'>) {
  const { t } = useI18n()
  const labels = t.aiLogs.tests.dialog

  const [group, setGroup] = useState(initial?.group ?? groups[groups.length - 1] ?? '')
  const [question, setQuestion] = useState(initial?.question ?? '')
  const [expected, setExpected] = useState(initial?.expected ?? '')
  const [drawer, setDrawer] = useState(drawerValue(initial?.drawer ?? null))
  const [maxSec, setMaxSec] = useState(initial?.maxSec == null ? '' : String(initial.maxSec))

  const canSave = question.trim() !== ''

  function handleSave() {
    if (!canSave) return
    const sec = Number(maxSec)
    onSave({
      id: initial?.id ?? newCaseId(),
      group: group.trim(),
      question: question.trim(),
      expected: expected.trim(),
      drawer: parseDrawer(drawer),
      maxSec: maxSec.trim() === '' || !Number.isFinite(sec) || sec <= 0 ? null : sec,
    })
  }

  return (
    <>
      <DialogTitle sx={{ fontSize: 16, fontWeight: 800 }}>
        {initial ? labels.editTitle : labels.addTitle}
      </DialogTitle>

      <DialogContent>
        <Stack sx={{ gap: 2, pt: 1 }}>
          <Autocomplete
            freeSolo
            options={groups}
            inputValue={group}
            onInputChange={(_, value) => setGroup(value)}
            renderInput={(params) => <TextField {...params} size="small" label={labels.group} />}
          />

          <TextField
            size="small"
            label={labels.question}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
            autoFocus
            multiline
            minRows={2}
          />

          <TextField
            size="small"
            label={labels.expected}
            helperText={labels.expectedHelp}
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            multiline
            minRows={3}
          />

          <Stack direction="row" sx={{ gap: 2 }}>
            <TextField
              select
              size="small"
              label={labels.drawer}
              helperText={labels.drawerHelp}
              value={drawer}
              onChange={(e) => setDrawer(e.target.value)}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">{labels.drawerNone}</MenuItem>
              {DRAWER_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              type="number"
              label={labels.maxSec}
              helperText={labels.maxSecHelp}
              value={maxSec}
              onChange={(e) => setMaxSec(e.target.value)}
              sx={{ width: 180 }}
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
            />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>{labels.cancel}</Button>
        <Button
          variant="contained"
          disabled={!canSave}
          onClick={handleSave}
          sx={{ textTransform: 'none' }}
        >
          {labels.save}
        </Button>
      </DialogActions>
    </>
  )
}

export function AiTestCaseDialog({ open, initial, ...rest }: AiTestCaseDialogProps) {
  return (
    <Dialog open={open} onClose={rest.onClose} fullWidth maxWidth="sm">
      {open && <AiTestCaseForm key={initial?.id ?? 'new'} initial={initial} {...rest} />}
    </Dialog>
  )
}
