import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import type { ReactElement } from 'react'

import type { Language } from '../../utils/uiPreferences'
import { loadPreference, savePreference } from '../../utils/uiPreferences'

// Tab con của tab "Phân quyền" (trang Admin). File nhẹ, nằm trong
// chunk trang; nội dung (AuthGuidePanel) tách chunk riêng.

export type AuthGuideSection = 'how' | 'tables' | 'roles' | 'newScreen' | 'trouble' | 'mine'

export const AUTH_GUIDE_SECTIONS: { value: AuthGuideSection; icon: ReactElement; label: Record<Language, string> }[] = [
  { value: 'how', icon: <AccountTreeOutlinedIcon />, label: { vi: 'Cách hoạt động', en: 'How it works' } },
  { value: 'tables', icon: <TableChartOutlinedIcon />, label: { vi: 'Bảng dữ liệu', en: 'Tables' } },
  { value: 'roles', icon: <ManageAccountsOutlinedIcon />, label: { vi: 'Gán quyền', en: 'Roles' } },
  { value: 'newScreen', icon: <AddBoxOutlinedIcon />, label: { vi: 'Thêm màn hình', en: 'New screen' } },
  { value: 'trouble', icon: <BuildOutlinedIcon />, label: { vi: 'Sự cố', en: 'Troubleshooting' } },
  { value: 'mine', icon: <BadgeOutlinedIcon />, label: { vi: 'Quyền của bạn', en: 'My access' } },
]

const PREF_KEY = 'ai-logs:auth-section'

export function loadAuthGuideSection(): AuthGuideSection {
  const stored = loadPreference(PREF_KEY)
  return AUTH_GUIDE_SECTIONS.some((s) => s.value === stored) ? (stored as AuthGuideSection) : 'how'
}

export function saveAuthGuideSection(section: AuthGuideSection) {
  savePreference(PREF_KEY, section)
}
