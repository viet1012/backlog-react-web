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
import { ASSISTANT_SCREENS, getScreenNameByKey } from '../mascot/mascotMessages'
import { DRAWER_OPTIONS, drawerValue, isCostScreen, parseDrawer } from './aiTestUtils'

interface AiTestCaseDialogProps {
  open: boolean
  // null = thêm mới
  initial: AiTestCase | null
  // màn hình mặc định cho câu mới (tab đang chọn)
  defaultScreenKey: string
  // tên nhóm đã có theo từng màn hình → gợi ý ô "Nhóm"
  groupsByScreen: Record<string, string[]>
  onClose: () => void
  onSave: (testCase: AiTestCase) => void
}

// form nhận initial lúc mở; key ở nơi gọi buộc dựng lại khi đổi case
function AiTestCaseForm({
  initial,
  defaultScreenKey,
  groupsByScreen,
  onClose,
  onSave,
}: Omit<AiTestCaseDialogProps, 'open'>) {
  const { t } = useI18n()
  const labels = t.aiLogs.tests.dialog

  // sửa câu cũ → giữ screenKey của câu; thêm mới → màn hình của tab đang chọn
  const [screenKey, setScreenKey] = useState(initial?.screenKey ?? defaultScreenKey)
  const groups = groupsByScreen[screenKey] ?? []
  const [group, setGroup] = useState(initial?.group ?? groups[groups.length - 1] ?? '')
  const [question, setQuestion] = useState(initial?.question ?? '')
  const [expected, setExpected] = useState(initial?.expected ?? '')
  const [drawer, setDrawer] = useState(drawerValue(initial?.drawer ?? null))
  const [maxSec, setMaxSec] = useState(initial?.maxSec == null ? '' : String(initial.maxSec))

  const canSave = question.trim() !== ''
  const showDrawer = isCostScreen(screenKey)

  // màn hình đã khai báo + screenKey lạ của câu đang sửa / tab đang chọn (giữ được giá trị cũ)
  const screenOptions = [
    ...new Set([
      ...ASSISTANT_SCREENS.map((s) => s.screenKey),
      ...(initial ? [initial.screenKey] : []),
      defaultScreenKey,
    ]),
  ]

  function handleSave() {
    if (!canSave) return
    const sec = Number(maxSec)
    onSave({
      id: initial?.id ?? newCaseId(),
      screenKey,
      group: group.trim(),
      question: question.trim(),
      expected: expected.trim(),
      // màn hình khác Cost Monitoring không có drawer
      drawer: showDrawer ? parseDrawer(drawer) : null,
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
          <TextField
            select
            size="small"
            label={t.aiLogs.screenTabs.screenField}
            value={screenKey}
            onChange={(e) => {
              const next = e.target.value
              setScreenKey(next)
              // thêm mới: nhóm mặc định theo màn hình vừa chọn, tránh lưu nhầm nhóm của màn hình cũ
              if (!initial) {
                const nextGroups = groupsByScreen[next] ?? []
                setGroup(nextGroups[nextGroups.length - 1] ?? '')
              }
            }}
          >
            {screenOptions.map((key) => (
              <MenuItem key={key} value={key}>{getScreenNameByKey(key, t)}</MenuItem>
            ))}
          </TextField>

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
            {showDrawer && (
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
            )}

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
