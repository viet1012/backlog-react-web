import { lazy, type ComponentType } from 'react'

import { loadWarehouse3D } from '../components/userHome/warehouse3d/loadWarehouse3D'

// Every page is its own chunk, loaded on the first visit. The login page is
// not here: it stays in the main bundle so the first screen needs no second
// request. preload() starts the download early (e.g. during the clock-in).
function lazyPage<P>(load: () => Promise<ComponentType<P>>) {
  const preload = () => load().then((component) => ({ default: component }))

  return Object.assign(lazy(preload), { preload })
}

export const AiLogsPage = lazyPage(() => import('./settings/AiLogsPage').then((m) => m.AiLogsPage))
export const AuthGuidePage = lazyPage(() => import('./settings/AuthGuidePage').then((m) => m.AuthGuidePage))
export const AsakaiPage = lazyPage(() => import('./production/AsakaiPage').then((m) => m.AsakaiPage))
export const BacklogPage = lazyPage(() => import('./planning/BacklogPage').then((m) => m.BacklogPage))
export const BosbPage = lazyPage(() => import('./management/BosbPage').then((m) => m.BosbPage))
export const CostMonitoringPage = lazyPage(() => import('./production/CostMonitoringPage').then((m) => m.CostMonitoringPage))
export const DeadstockPage = lazyPage(() => import('./management/DeadstockPage').then((m) => m.DeadstockPage))
export const ExportListPage = lazyPage(() => import('./planning/ExportListPage').then((m) => m.ExportListPage))
export const FacConfirmPage = lazyPage(() => import('./planning/FacConfirmPage').then((m) => m.FacConfirmPage))
export const KpiPage = lazyPage(() => import('./management/KpiPage').then((m) => m.KpiPage))
export const MachineLocatorPage = lazyPage(() => import('./settings/MachineLocatorPage').then((m) => m.MachineLocatorPage))
export const MachineMonitorPage = lazyPage(() => import('./monitoring/MachineMonitorPage').then((m) => m.MachineMonitorPage))
export const OdbfPage = lazyPage(() => import('./planning/OdbfPage').then((m) => m.OdbfPage))
export const OtPage = lazyPage(() => import('./management/OtPage').then((m) => m.OtPage))
export const PackingListPage = lazyPage(() => import('./planning/PackingListPage').then((m) => m.PackingListPage))
export const PcTrainingPage = lazyPage(() => import('./production/PcTrainingPage').then((m) => m.PcTrainingPage))
export const PlPage = lazyPage(() => import('./management/PlPage').then((m) => m.PlPage))
export const RemainPoControlPage = lazyPage(() => import('./planning/RemainPoControlPage').then((m) => m.RemainPoControlPage))
export const SaleFollowPage = lazyPage(() => import('./planning/SaleFollowPage').then((m) => m.SaleFollowPage))
export const SalesStatusPage = lazyPage(() => import('./planning/SalesStatusPage').then((m) => m.SalesStatusPage))
export const ShipmentPage = lazyPage(() => import('./planning/ShipmentPage').then((m) => m.ShipmentPage))
export const SphPage = lazyPage(() => import('./production/SphPage').then((m) => m.SphPage))
export const UtilityEvnComparePage = lazyPage(() => import('./settings/UtilityEvnComparePage').then((m) => m.UtilityEvnComparePage))
export const UserHomePage = lazyPage(() => import('./planning/UserHomePage').then((m) => m.UserHomePage))

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
  '/utility-evn-compare': UtilityEvnComparePage,
  '/settings/auth-guide': AuthGuidePage,
}

export function preloadRoute(path: string) {
  pagesByRoute[path]?.preload().catch(() => {
    // The route loads it again (and shows its error) on navigation
  })
}

// Heavy chunks only loaded on intent (hover / visit), never in the background
const NOT_IDLE_PRELOADED = new Set(['/user-home'])

/**
 * Download the given pages' code while the browser is idle, one page per idle
 * slot, so a first visit renders straight away instead of showing an empty
 * area while its chunk loads (page chunks are small: ~12–150 KB).
 */
export function preloadRoutesWhenIdle(paths: string[]) {
  const queue = paths.filter((path) => pagesByRoute[path] && !NOT_IDLE_PRELOADED.has(path))
  const idle = window.requestIdleCallback
    ?? ((cb: () => void) => window.setTimeout(cb, 300))
  let cancelled = false

  const next = () => {
    const path = queue.shift()
    if (cancelled || !path) return
    idle(() => {
      pagesByRoute[path].preload().catch(() => {}).finally(next)
    })
  }

  next()
  return () => {
    cancelled = true
  }
}

// Pages not kept alive when hidden: the machine locator editor (canvas +
// fitting worker, unsaved-edit flow). The 3D home is kept: it pauses its
// render loop while hidden (UserHomeWarehouse3D) so coming back is instant
const NOT_KEPT_ALIVE = new Set(['/settings/machine-locator'])

// Key under which KeepAliveOutlet keeps a page mounted (hidden) after leaving
// it, so coming back is instant; null = render normally (redirects, unknown)
export function keepAliveKey(pathname: string): string | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  return Object.hasOwn(pagesByRoute, path) && !NOT_KEPT_ALIVE.has(path) ? path : null
}
