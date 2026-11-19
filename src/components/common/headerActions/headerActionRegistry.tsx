import type { ReactNode } from 'react'

import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import GridOnOutlinedIcon from '@mui/icons-material/GridOnOutlined'
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'

import type { Messages } from '../../../i18n/messages/en'
import type { AppButtonAppearance } from '../AppButton'

/**
 * Header action registry – the single place that decides what each kind of
 * header button looks like and says. Pages pick a `kind`; they do not choose
 * icons or wording, so the same action looks the same on every page.
 *
 * Add a kind here (icon + label + optional busy label / tone) and it is
 * available everywhere through <HeaderAction kind="…" />.
 *
 * Order convention inside a header (left → right), separated with
 * <HeaderActionDivider />:
 *   1. data controls (month / week selects, filters)
 *   2. data in / out (import, exportExcel, exportCsv, print)
 *   3. page utilities (refresh, guide) – always last, always in this order
 */
export interface HeaderActionDefinition {
  icon: ReactNode
  label: (t: Messages) => string
  /** Shown in the tooltip / aria-label while `loading` */
  busyLabel?: (t: Messages) => string
  appearance?: AppButtonAppearance
}

export const HEADER_ACTIONS = {
  refresh: {
    icon: <RefreshRoundedIcon fontSize="small" />,
    label: (t) => t.common.refresh,
    busyLabel: (t) => t.common.loading,
  },

  guide: {
    icon: <HelpOutlineRoundedIcon fontSize="small" />,
    label: (t) => t.common.guide,
  },

  exportExcel: {
    icon: <DownloadRoundedIcon fontSize="small" />,
    label: (t) => t.common.exportExcel,
    busyLabel: (t) => t.common.exporting,
  },

  exportCsv: {
    icon: <GridOnOutlinedIcon fontSize="small" />,
    label: (t) => t.common.exportCsv,
    busyLabel: (t) => t.common.exporting,
  },

  import: {
    icon: <UploadFileOutlinedIcon fontSize="small" />,
    label: (t) => t.common.upload,
  },

  print: {
    icon: <PrintOutlinedIcon fontSize="small" />,
    label: (t) => t.common.print,
  },
} satisfies Record<string, HeaderActionDefinition>

export type HeaderActionKind = keyof typeof HEADER_ACTIONS
