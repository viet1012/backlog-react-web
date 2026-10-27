import { hseTab } from './hse/hseTab'
import type { MonitorTabEntry } from './monitorTypes'

// Thêm tab: viết MonitorTabDef (service + marks + legend + renderDetail) rồi gắn vào def
export const MONITOR_TABS: MonitorTabEntry[] = [
  { id: 'hse', label: 'Safety', def: hseTab },
  { id: 'stop', label: 'Downtime', def: null },
  { id: 'load', label: 'Machine Load', def: null },
]
