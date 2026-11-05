import {
  Box,
  FormControlLabel,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import {
  useState,
  type ReactNode,
} from 'react'

import type { MachineLocatorState } from '../../hooks/useMachineLocator'
import type { FitMode } from '../../types/machineLocator'
import {
  FIT_MODES,
} from '../../utils/machineLocatorFit'
import { normalizeCode } from '../../utils/machineLocatorGeometry'
import {
  AppButton,
  type AppButtonProps,
} from '../common/AppButton'
import { codeFontFamily } from './machineLocatorColors'
import { useI18n } from '../../i18n/useI18n'

interface MachineInfoProps {
  ml: MachineLocatorState
}

// =========================================================
// SMALL PARTS
// =========================================================

export function PanelButton({ sx, ...props }: AppButtonProps) {
  return (
    <AppButton
      {...props}
      sx={[
        { height: 28, minWidth: 0, px: 1, fontSize: 12.5 },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  )
}

function Actions({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mt: 1 }}>
      {children}
    </Box>
  )
}

function StatusLine({ ml }: MachineInfoProps) {
  const { t, k } = ml.status

  return (
    <Typography
      role="status"
      sx={{
        mt: 0.75,
        minHeight: 18,
        fontSize: 12.5,
        color: k === 'err'
          ? 'warning.main'
          : k === 'ok' ? 'success.main' : 'text.secondary',
      }}
    >
      {t}
    </Typography>
  )
}

interface CodeInputProps {
  placeholder: string
  label: string
  onSubmit: (code: string) => void
  onInvalid: () => void
}

function CodeInput({ placeholder, label, onSubmit, onInvalid }: CodeInputProps) {
  const [value, setValue] = useState('')

  function go() {
    const c = normalizeCode(value)

    if (!c) {
      onInvalid()
      return
    }

    onSubmit(c)
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.6, mt: 1 }}>
      <TextField
        size="small"
        autoFocus
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') go()
        }}
        slotProps={{
          htmlInput: {
            'aria-label': placeholder,
            style: { textTransform: 'uppercase' },
          },
        }}
        sx={{
          flex: 1,
          minWidth: 0,
          '& .MuiInputBase-input': {
            py: 0.6,
            fontFamily: codeFontFamily,
            fontSize: 13,
          },
        }}
      />

      <PanelButton appearance="action" onClick={go}>
        {label}
      </PanelButton>
    </Box>
  )
}

// =========================================================
// INFO PANEL
// =========================================================

export function MachineInfo({ ml }: MachineInfoProps) {
  const { t } = useI18n()

  const {
    cur,
    act,
    draft,
    editing,
    panelMode,
    canWrite,
    machines,
  } = ml

  const invalidCode = () =>
    ml.setStatus(t.locator.info.invalidCode, 'err')

  let content: ReactNode

  if (!cur) {
    content = (
      <>
        <div>
          {editing
            ? panelMode === 'new'
              ? t.locator.info.newHint
              : t.locator.info.editHint
            : t.locator.info.viewHint}
        </div>

        {editing && (
          <Actions>
            <PanelButton onClick={() => ml.openPanel('new')}>
              {t.locator.info.addNew}
            </PanelButton>
          </Actions>
        )}

        {editing && panelMode === 'new' && (
          <CodeInput
            placeholder={t.locator.info.newCodePlaceholder}
            label={t.locator.info.create}
            onSubmit={ml.createNew}
            onInvalid={invalidCode}
          />
        )}
      </>
    )
  } else if (!editing) {
    const m = machines[cur]

    content = (
      <>
        <MachineCode code={cur} />

        <div>
          {!m
            ? t.locator.info.removed
            : m.boxes.length > 1
              ? t.locator.info.multiLocations(m.boxes.length)
              : m.manual
                ? t.locator.info.manualFrame
                : m.u
                  ? t.locator.info.uncertain
                  : t.locator.info.estimated}
        </div>

        {canWrite && m && (
          <Actions>
            <PanelButton onClick={() => ml.setEditing(true)}>
              {t.locator.info.editThis}
            </PanelButton>
          </Actions>
        )}
      </>
    )
  } else {
    const nb = draft ? draft.boxes.length : 0
    const dirty = !!draft?.dirty
    const needsReview = !!machines[cur]?.review

    content = (
      <>
        <MachineCode code={cur} />

        <div>
          {(nb ? '' : t.locator.info.noFrame)
            + t.locator.info.pressHelp
            + (nb > 1 ? t.locator.info.selectedLocation(act + 1, nb) : '')}
        </div>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.6, mt: 1 }}>
          <FormControlLabel
            sx={{
              m: 0,
              mr: 'auto',
              '& .MuiFormControlLabel-label': { fontSize: 12.5 },
            }}
            control={(
              <Switch
                size="small"
                checked={ml.autoFit}
                onChange={(e) => ml.setAutoFit(e.target.checked)}
              />
            )}
            label={t.locator.info.autoFit}
          />

          <PanelButton
            disabled={!nb || ml.fitterState === 'error'}
            loading={ml.fittingIdx !== null}
            title={ml.fitterState === 'error'
              ? t.locator.batch.layoutImageFailed
              : ml.fitterState === 'loading' ? t.locator.info.preparingImage : t.locator.info.fitShortcut}
            onClick={(e) => ml.fitCurrent(e.shiftKey)}
          >
            {t.locator.info.fitToMachine}
          </PanelButton>

          <PanelButton
            disabled={!draft?.boxes[act]?.p?.length || ml.fitterState !== 'ready'}
            aria-pressed={!!ml.tidyPreview}
            title={!draft?.boxes[act]?.p?.length
              ? t.locator.info.noOutline
              : t.locator.info.tidyHint}
            onClick={ml.tidyCurrent}
          >
            {t.locator.info.tidy}
          </PanelButton>

          <PanelButton
            aria-pressed={ml.fitTool}
            appearance={ml.fitTool ? 'action' : 'default'}
            disabled={ml.fitterState === 'error'}
            title={t.locator.info.fitModeHint}
            onClick={() => ml.setFitTool(!ml.fitTool)}
          >
            {t.locator.info.fitModeButton}
          </PanelButton>
        </Box>

        {nb > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
            <span>{t.locator.info.fitKind}</span>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={ml.activeFitMode}
              onChange={(_, v: FitMode | null) => {
                if (v) ml.chooseFitMode(v)
              }}
              aria-label={t.locator.info.fitKindAria}
              sx={{
                '& .MuiToggleButton-root': {
                  py: 0.25,
                  px: 1,
                  fontSize: 12,
                  textTransform: 'none',
                },
              }}
            >
              {FIT_MODES.map((m) => (
                <ToggleButton key={m} value={m}>
                  {t.locator.fitMode[m]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        )}

        <Actions>
          <PanelButton onClick={() => ml.beginDraw(nb ? 'replace' : 'add')}>
            {nb ? t.locator.info.redraw : t.locator.info.draw}
          </PanelButton>

          {nb > 0 && (
            <PanelButton onClick={() => ml.beginDraw('add')}>
              {t.locator.info.addLocation}
            </PanelButton>
          )}

          {nb > 1 && (
            <PanelButton appearance="destructive" onClick={ml.removeLocation}>
              {t.locator.info.removeLocation(act + 1)}
            </PanelButton>
          )}

          <PanelButton onClick={() => ml.togglePanel('rename')}>
            {t.locator.info.rename}
          </PanelButton>

          {ml.canRevert && (
            <PanelButton disabled={ml.saving} onClick={() => void ml.revertAuto()}>
              {t.locator.info.revert}
            </PanelButton>
          )}

          <PanelButton appearance="destructive" onClick={() => ml.togglePanel('del')}>
            {t.locator.info.deleteMachine}
          </PanelButton>
        </Actions>

        {panelMode === 'rename' && (
          <CodeInput
            placeholder={t.locator.info.correctCodePlaceholder}
            label={t.locator.info.renameButton}
            onSubmit={ml.renameTo}
            onInvalid={invalidCode}
          />
        )}

        {panelMode === 'del' && (
          <Box sx={{ display: 'flex', gap: 0.6, mt: 1, alignItems: 'center' }}>
            <Box component="span" sx={{ flex: 1 }}>
              {t.locator.info.confirmDelete(cur)}
            </Box>

            <PanelButton appearance="destructive" disabled={ml.saving} onClick={ml.deleteMachine}>
              {t.locator.info.deleteButton}
            </PanelButton>

            <PanelButton onClick={ml.closePanel}>
              {t.locator.info.no}
            </PanelButton>
          </Box>
        )}

        <Actions>
          {needsReview && (
            <PanelButton
              appearance="success"
              disabled={dirty || !nb || ml.saving}
              onClick={ml.confirmReview}
            >
              {t.locator.info.confirmCorrect}
            </PanelButton>
          )}

          <PanelButton
            appearance="action"
            disabled={!(dirty && nb) || ml.saving}
            loading={ml.saving}
            onClick={ml.save}
          >
            {t.locator.info.save}
          </PanelButton>

          <PanelButton disabled={!dirty} onClick={ml.cancel}>
            {t.locator.info.cancelChanges}
          </PanelButton>
        </Actions>
      </>
    )
  }

  return (
    <Box
      sx={{
        px: 1.75,
        pt: 1.25,
        pb: 1.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        fontSize: 12.5,
        color: 'text.secondary',
      }}
    >
      {content}
      <StatusLine ml={ml} />
    </Box>
  )
}

function MachineCode({ code }: { code: string }) {
  return (
    <Typography
      component="div"
      sx={{
        color: 'text.primary',
        font: `600 15px ${codeFontFamily}`,
      }}
    >
      {code}
    </Typography>
  )
}
