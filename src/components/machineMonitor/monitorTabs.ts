import { hseTab } from './hse/hseTab'
import type { MonitorTabEntry } from './monitorTypes'
import { getMessages } from '../../i18n/i18nContext'

const tabLabels = () => getMessages().monitor.tabs

// Thêm tab: viết MonitorTabDef (service + marks + legend + renderDetail) rồi gắn vào def
export const MONITOR_TABS: MonitorTabEntry[] = [
  // getters: label follows the current UI language
  { id: 'hse', get label() { return tabLabels().hse }, def: hseTab },
  { id: 'stop', get label() { return tabLabels().stop }, def: null },
  { id: 'load', get label() { return tabLabels().load }, def: null },
]
