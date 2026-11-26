import type { ReactNode } from 'react'

import {
  AccessTimeOutlined,
  ArchitectureOutlined,
  AccountBalanceOutlined,
  AssessmentOutlined,
  DeleteSweepOutlined,
  ElectricBoltOutlined,
  EventNoteOutlined,
  FactCheckOutlined,
  FormatListBulletedRounded,
  HomeOutlined,
  Inventory2Outlined,
  InventoryOutlined,
  MapOutlined,
  MonitorHeartOutlined,
  PendingActionsOutlined,
  PrecisionManufacturingOutlined,
  ReceiptLongOutlined,
  SchoolOutlined,
  SettingsSuggestOutlined,
  SmartToyOutlined,
  SpeedOutlined,
  SummarizeOutlined,
  TrackChangesOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material'

import type {
  MenuGroupId,
  MenuItemAction,
  MenuItemLabelKey,
  MenuItemStatus,
} from '../components/layout/sidebarConfig'
import {
  AiLogsPage,
  AsakaiPage,
  BacklogPage,
  BosbPage,
  CostMonitoringPage,
  DeadstockPage,
  ExportListPage,
  FacConfirmPage,
  KpiPage,
  MachineLocatorPage,
  MachineMonitorPage,
  OdbfPage,
  OtPage,
  PackingListPage,
  PcTrainingPage,
  Pdf2cadPage,
  PlPage,
  RemainPoControlPage,
  SaleFollowPage,
  SalesStatusPage,
  ShipmentPage,
  SphPage,
  UserHomePage,
  UtilityEvnComparePage,
} from '../pages/lazyPages'
import type { ThemeMode } from '../utils/uiPreferences'

/*
 * NGUỒN DUY NHẤT cho route + sidebar + quyền xem trang.
 * App.tsx sinh <Route> (bọc PermRoute) và sidebarConfig sinh menu từ danh sách này.
 *
 * perm: [feature, action] theo /auth/me (V xem, E sửa, D xóa, X xuất / nhập).
 * Thứ tự trong mảng = thứ tự trong sidebar (theo group).
 */

export const PERM = {
  BACKLOG: 'BACKLOG',
  FAC_CONFIRM: 'FAC_CONFIRM',
  ODBF: 'ODBF',
  SHIPMENT: 'SHIPMENT',
  COST_MONITORING: 'COST_MONITORING',
  MACHINE_LOCATOR: 'MACHINE_LOCATOR',
  ASSISTANT_LOG: 'ASSISTANT_LOG',
  GENERAL: 'GENERAL',
  UTILITY: 'UTILITY',
  PDF2CAD: 'PDF2CAD',
} as const

export const ACTION = {
  VIEW: 'V',
  EDIT: 'E',
  DELETE: 'D',
  EXPORT: 'X',
} as const

export type PagePerm = readonly [feature: string, action: string]

export interface PageRenderContext {
  mode: ThemeMode
  onToggleMode: () => void
}

export interface AppPage {
  /** Đường dẫn tuyệt đối, vd '/backlog' */
  path: string
  /** i18n key: t.nav[label]; null = không hiện trong sidebar */
  label: MenuItemLabelKey | null
  /** undefined = chưa có route (chỉ hiện ở mục "Sắp ra mắt" của sidebar) */
  element?: (ctx: PageRenderContext) => ReactNode
  /** undefined = mọi người đã đăng nhập */
  perm?: PagePerm

  // --- sidebar ---
  group?: MenuGroupId
  icon?: ReactNode
  status?: MenuItemStatus
  disabled?: boolean
  action?: MenuItemAction
}

const GENERAL_VIEW: PagePerm = [PERM.GENERAL, ACTION.VIEW]

export const appPages: AppPage[] = [
  // =====================================================
  // PRODUCTION
  // =====================================================
  {
    path: '/pc-training',
    label: 'pcTraining',
    element: ({ mode, onToggleMode }) => <PcTrainingPage mode={mode} onToggleMode={onToggleMode} />,
    perm: GENERAL_VIEW,
    group: 'production',
    icon: <SchoolOutlined />,
    status: 'ready',
    disabled: true,
  },
  {
    path: '/sph',
    label: 'sph',
    element: () => <SphPage />,
    perm: GENERAL_VIEW,
    group: 'production',
    icon: <PrecisionManufacturingOutlined />,
    status: 'todo',
  },
  {
    path: '/asakai',
    label: 'asakai',
    element: () => <AsakaiPage />,
    perm: GENERAL_VIEW,
    group: 'production',
    icon: <SettingsSuggestOutlined />,
    status: 'todo',
  },
  {
    path: '/cost-monitoring',
    label: 'costMonitoring',
    element: ({ mode, onToggleMode }) => <CostMonitoringPage mode={mode} onToggleMode={onToggleMode} />,
    perm: [PERM.COST_MONITORING, ACTION.VIEW],
    group: 'production',
    icon: <TrendingUpOutlined />,
    status: 'ready',
    action: 'view',
  },

  // =====================================================
  // PLANNING
  // =====================================================
  {
    // Trang mặc định của mọi tài khoản (getDefaultAuthRoute): không giới hạn quyền
    path: '/user-home',
    label: 'userHome',
    element: ({ mode, onToggleMode }) => <UserHomePage mode={mode} onToggleMode={onToggleMode} />,
    group: 'planning',
    icon: <HomeOutlined />,
    status: 'ready',
  },
  {
    path: '/backlog',
    label: 'backlogDetails',
    element: ({ mode, onToggleMode }) => <BacklogPage mode={mode} onToggleMode={onToggleMode} />,
    perm: [PERM.BACKLOG, ACTION.VIEW],
    group: 'planning',
    icon: <FormatListBulletedRounded />,
    status: 'ready',
    action: 'view',
  },
  {
    // Chưa có route
    path: '/backlog-summary',
    label: 'backlogSummary',
    perm: [PERM.BACKLOG, ACTION.VIEW],
    group: 'planning',
    icon: <SummarizeOutlined />,
    status: 'todo',
    action: 'view',
  },
  {
    path: '/remain-po-control',
    label: 'remainPoControl',
    element: ({ mode }) => <RemainPoControlPage mode={mode} />,
    perm: [PERM.BACKLOG, ACTION.VIEW],
    group: 'planning',
    icon: <PendingActionsOutlined />,
    status: 'ready',
    action: 'view',
  },
  {
    path: '/sale-follow',
    label: 'saleFollow',
    element: ({ mode }) => <SaleFollowPage mode={mode} />,
    perm: [PERM.BACKLOG, ACTION.VIEW],
    group: 'planning',
    icon: <TrackChangesOutlined />,
    status: 'ready',
    action: 'view',
  },
  {
    path: '/fac-confirm',
    label: 'deliveryConfirm',
    element: ({ mode, onToggleMode }) => <FacConfirmPage mode={mode} onToggleMode={onToggleMode} />,
    perm: [PERM.FAC_CONFIRM, ACTION.VIEW],
    group: 'planning',
    icon: <FactCheckOutlined />,
    status: 'ready',
    action: 'input',
  },
  {
    path: '/odbf',
    label: 'odbfSimulation',
    element: ({ mode, onToggleMode }) => <OdbfPage mode={mode} onToggleMode={onToggleMode} />,
    perm: [PERM.ODBF, ACTION.VIEW],
    group: 'planning',
    icon: <Inventory2Outlined />,
    status: 'ready',
    action: 'view',
  },
  {
    path: '/export-list',
    label: 'exportList',
    element: () => <ExportListPage />,
    perm: [PERM.BACKLOG, ACTION.VIEW],
    group: 'planning',
    icon: <ReceiptLongOutlined />,
    status: 'todo',
    action: 'view',
  },
  {
    path: '/packing-list',
    label: 'packingList',
    element: () => <PackingListPage />,
    perm: [PERM.SHIPMENT, ACTION.VIEW],
    group: 'planning',
    icon: <InventoryOutlined />,
    status: 'todo',
    action: 'input',
  },
  {
    path: '/shipping-schedule',
    label: 'shippingSchedule',
    element: ({ mode, onToggleMode }) => <ShipmentPage mode={mode} onToggleMode={onToggleMode} />,
    perm: [PERM.SHIPMENT, ACTION.VIEW],
    group: 'planning',
    icon: <EventNoteOutlined />,
    status: 'todo',
    action: 'view',
  },
  {
    // Không có trong sidebar
    path: '/sales-status',
    label: null,
    element: () => <SalesStatusPage />,
    perm: GENERAL_VIEW,
  },

  // =====================================================
  // MANAGEMENT
  // =====================================================
  {
    path: '/bosb',
    label: 'bosb',
    element: () => <BosbPage />,
    perm: GENERAL_VIEW,
    group: 'management',
    icon: <AccountBalanceOutlined />,
    status: 'todo',
  },
  {
    path: '/deadstock',
    label: 'deadstock',
    element: () => <DeadstockPage />,
    perm: GENERAL_VIEW,
    group: 'management',
    icon: <DeleteSweepOutlined />,
    status: 'todo',
  },
  {
    path: '/pl',
    label: 'pl',
    element: () => <PlPage />,
    perm: GENERAL_VIEW,
    group: 'management',
    icon: <AssessmentOutlined />,
    status: 'todo',
  },
  {
    path: '/kpi',
    label: 'kpi',
    element: () => <KpiPage />,
    perm: GENERAL_VIEW,
    group: 'management',
    icon: <SpeedOutlined />,
    status: 'todo',
  },
  {
    path: '/ot',
    label: 'ot',
    element: () => <OtPage />,
    perm: GENERAL_VIEW,
    group: 'management',
    icon: <AccessTimeOutlined />,
    status: 'todo',
  },

  // =====================================================
  // MONITORING
  // =====================================================
  {
    path: '/monitoring/machine',
    label: 'machine',
    element: ({ mode, onToggleMode }) => <MachineMonitorPage mode={mode} onToggleMode={onToggleMode} />,
    perm: GENERAL_VIEW,
    group: 'monitoring',
    icon: <MonitorHeartOutlined />,
    status: 'ready',
    action: 'view',
  },

  // =====================================================
  // SETTING
  // =====================================================
  {
    path: '/settings/machine-locator',
    label: 'machineLocator',
    element: ({ mode, onToggleMode }) => <MachineLocatorPage mode={mode} onToggleMode={onToggleMode} />,
    perm: [PERM.MACHINE_LOCATOR, ACTION.VIEW],
    group: 'setting',
    icon: <MapOutlined />,
    status: 'ready',
    action: 'view',
  },
  {
    // Trang Admin (Trợ lý AI + Phân quyền); /settings/ai-logs cũ chuyển hướng về đây (App.tsx)
    path: '/settings/admin',
    label: 'aiLogs',
    element: ({ mode, onToggleMode }) => <AiLogsPage mode={mode} onToggleMode={onToggleMode} />,
    perm: [PERM.ASSISTANT_LOG, ACTION.VIEW],
    group: 'setting',
    icon: <SmartToyOutlined />,
    status: 'ready',
    action: 'view',
  },
  {
    path: '/utility-evn-compare',
    label: 'utilityEvnCompare',
    element: ({ mode, onToggleMode }) => <UtilityEvnComparePage mode={mode} onToggleMode={onToggleMode} />,
    perm: [PERM.UTILITY, ACTION.VIEW],
    group: 'setting',
    icon: <ElectricBoltOutlined />,
    status: 'ready',
    action: 'view',
  },
  {
    path: '/settings/pdf2cad',
    label: 'pdf2cad',
    element: ({ mode, onToggleMode }) => <Pdf2cadPage mode={mode} onToggleMode={onToggleMode} />,
    perm: [PERM.PDF2CAD, ACTION.VIEW],
    group: 'setting',
    icon: <ArchitectureOutlined />,
    status: 'ready',
    action: 'input',
  },
]

/** Quyền vào trang theo perm (từ /me); không có perm = mọi người đã đăng nhập */
export function canOpenPage(
  page: Pick<AppPage, 'perm'>,
  can: (feature: string, action: string) => boolean,
): boolean {
  return !page.perm || can(page.perm[0], page.perm[1])
}
