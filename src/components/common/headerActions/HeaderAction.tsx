import type { ReactNode } from 'react'

import { Box, Tooltip } from '@mui/material'

import { useI18n } from '../../../i18n/useI18n'
import { AppButton, type AppButtonAppearance } from '../AppButton'
import {
  HEADER_ACTIONS,
  type HeaderActionDefinition,
  type HeaderActionKind,
} from './headerActionRegistry'

interface HeaderActionBaseProps {
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
  /** Why the action is unavailable – shown in the tooltip while disabled */
  disabledReason?: string
  /** Second tooltip line (what the action does / for whom) */
  description?: string
  /** Show the label next to the icon. Use for at most one primary action per page. */
  showLabel?: boolean
  appearance?: AppButtonAppearance
  /** Guided-tour anchor (react-joyride style `data-tour`) */
  tour?: string
}

type HeaderActionProps = HeaderActionBaseProps & (
  // Registered kind: icon / label come from the registry, both overridable
  | { kind: HeaderActionKind, icon?: ReactNode, label?: string }
  // One-off action: icon + label are required
  | { kind?: undefined, icon: ReactNode, label: string }
)

/**
 * The one button used in page headers.
 *
 * - Icon-only by default, 36px square, label in the tooltip and aria-label
 * - `loading` swaps the icon for a spinner and the label for the busy label
 * - Disabled buttons still show a tooltip (with `disabledReason` if given)
 */
export function HeaderAction({
  kind,
  icon,
  label,
  onClick,
  loading = false,
  disabled = false,
  disabledReason,
  description,
  showLabel = false,
  appearance,
  tour,
}: HeaderActionProps) {
  const { t } = useI18n()
  const def: HeaderActionDefinition | undefined = kind ? HEADER_ACTIONS[kind] : undefined

  const baseLabel = label ?? def?.label(t) ?? ''
  const currentLabel = loading && def?.busyLabel ? def.busyLabel(t) : baseLabel
  const unavailable = disabled || loading

  const tooltip = (
    <Box sx={{ py: 0.25 }}>
      <Box sx={{ fontWeight: 700 }}>{currentLabel}</Box>
      {disabled && disabledReason ? (
        <Box sx={{ opacity: 0.8 }}>{disabledReason}</Box>
      ) : description ? (
        <Box sx={{ opacity: 0.8 }}>{description}</Box>
      ) : null}
    </Box>
  )

  return (
    <Tooltip title={tooltip} arrow>
      {/* span: tooltips need a non-disabled element to listen on */}
      <Box component="span" data-tour={tour} sx={{ display: 'inline-flex', flexShrink: 0 }}>
        <AppButton
          aria-label={currentLabel}
          aria-busy={loading || undefined}
          compact={!showLabel}
          loading={loading}
          disabled={unavailable}
          appearance={appearance ?? def?.appearance}
          icon={icon ?? def?.icon}
          onClick={onClick}
        >
          {showLabel ? currentLabel : undefined}
        </AppButton>
      </Box>
    </Tooltip>
  )
}
