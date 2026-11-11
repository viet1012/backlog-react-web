import { lazy, type ComponentType } from 'react'

import { loadWarehouse3D } from '../components/userHome/warehouse3d/loadWarehouse3D'

// Every page is its own chunk, loaded on the first visit. The login page is
// not here: it stays in the main bundle so the first screen needs no second
// request. preload() starts the download early (e.g. during the clock-in).
function lazyPage<P>(load: () => Promise<ComponentType<P>>) {
  const preload = () => load().then((component) => ({ default: component }))

  return Object.assign(lazy(preload), { preload })
}

export const AiLogsPage = lazyPage(() => import('./AiLogsPage').then((m) => m.AiLogsPage))
export const AsakaiPage =lazyPage(() => import('./AsakaiPage').then((m) => m.AsakaiPage))
export const BacklogPage = lazyPage(() => import('./BacklogPage').then((m) => m.BacklogPage))
export const BosbPage = lazyPage(() => import('./BosbPage').then((m) => m.BosbPage))
export const CostMonitoringPage = lazyPage(() => import('./CostMonitoringPage').then((m) => m.CostMonitoringPage))
export const DeadstockPage = lazyPage(() => import('./DeadstockPage').then((m) => m.DeadstockPage))
export const ExportListPage = lazyPage(() => import('./ExportListPage').then((m) => m.ExportListPage))
export const FacConfirmPage = lazyPage(() => import('./FacConfirmPage').then((m) => m.FacConfirmPage))
export const KpiPage = lazyPage(() => import('./KpiPage').then((m) => m.KpiPage))
export const MachineLocatorPage = lazyPage(() => import('./MachineLocatorPage').then((m) => m.MachineLocatorPage))
export const MachineMonitorPage = lazyPage(() => import('./MachineMonitorPage').then((m) => m.MachineMonitorPage))
export const OdbfPage = lazyPage(() => import('./OdbfPage').then((m) => m.OdbfPage))
export const OtPage = lazyPage(() => import('./OtPage').then((m) => m.OtPage))
export const PackingListPage = lazyPage(() => import('./PackingListPage').then((m) => m.PackingListPage))
export const PcTrainingPage = lazyPage(() => import('./training/PcTrainingPage').then((m) => m.PcTrainingPage))
export const PlPage = lazyPage(() => import('./PlPage').then((m) => m.PlPage))
export const RemainPoControlPage = lazyPage(() => import('./RemainPoControlPage').then((m) => m.RemainPoControlPage))
export const SaleFollowPage = lazyPage(() => import('./SaleFollowPage').then((m) => m.SaleFollowPage))
export const SalesStatusPage = lazyPage(() => import('./SalesStatusPage').then((m) => m.SalesStatusPage))
export const ShipmentPage = lazyPage(() => import('./ShipmentPage').then((m) => m.ShipmentPage))
export const SphPage = lazyPage(() => import('./SphPage').then((m) => m.SphPage))
export const UserHomePage = lazyPage(() => import('./UserHomePage').then((m) => m.UserHomePage))

// Default routes after sign-in (getDefaultAuthRoute) and sidebar hover:
// the chunk is downloading before the click
const pagesByRoute: Record<string, { preload: () => Promise<unknown> }> = {
  '/pc-training': PcTrainingPage,
  '/sph': SphPage,
  '/asakai': AsakaiPage,
  '/cost-monitoring': CostMonitoringPage,
  // Trang chủ cần thêm chunk three.js + font: tải song song, không đợi trang mount mới tải
  '/user-home': { preload: () => Promise.all([UserHomePage.preload(), loadWarehouse3D()]) },
  '/backlog': BacklogPage,
  '/remain-po-control': RemainPoControlPage,
  '/sale-follow': SaleFollowPage,
  '/fac-confirm': FacConfirmPage,
  '/odbf': OdbfPage,
  '/export-list': ExportListPage,
  '/packing-list': PackingListPage,
  '/shipping-schedule': ShipmentPage,
  '/sales-status': SalesStatusPage,
  '/bosb': BosbPage,
  '/deadstock': DeadstockPage,
  '/pl': PlPage,
  '/kpi': KpiPage,
  '/ot': OtPage,
  '/monitoring/machine': MachineMonitorPage,
  '/settings/machine-locator': MachineLocatorPage,
  '/settings/ai-logs': AiLogsPage,
}

export function preloadRoute(path: string) {
  pagesByRoute[path]?.preload().catch(() => {
    // The route loads it again (and shows its error) on navigation
  })
}

// Pages not kept alive when hidden: the 3D warehouse (WebGL context) and the
// machine locator editor (canvas + fitting worker, unsaved-edit flow)
const NOT_KEPT_ALIVE = new Set(['/user-home', '/settings/machine-locator'])

// Key under which KeepAliveOutlet keeps a page mounted (hidden) after leaving
// it, so coming back is instant; null = render normally (redirects, unknown)
export function keepAliveKey(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  return Object.hasOwn(pagesByRoute, path) && !NOT_KEPT_ALIVE.has(path) ? path : null
}
