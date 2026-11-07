import { lazy, type ComponentType } from 'react'

// Every page is its own chunk, loaded on the first visit. The login page is
// not here: it stays in the main bundle so the first screen needs no second
// request. preload() starts the download early (e.g. during the clock-in).
function lazyPage<P>(load: () => Promise<ComponentType<P>>) {
  const preload = () => load().then((component) => ({ default: component }))

  return Object.assign(lazy(preload), { preload })
}

export const AsakaiPage = lazyPage(() => import('./AsakaiPage').then((m) => m.AsakaiPage))
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
export const SalesStatusPage = lazyPage(() => import('./SalesStatusPage').then((m) => m.SalesStatusPage))
export const ShipmentPage = lazyPage(() => import('./ShipmentPage').then((m) => m.ShipmentPage))
export const SphPage = lazyPage(() => import('./SphPage').then((m) => m.SphPage))
export const UserHomePage = lazyPage(() => import('./UserHomePage').then((m) => m.UserHomePage))

// Default routes after sign-in (getDefaultAuthRoute)
const pagesByRoute: Record<string, { preload: () => Promise<unknown> }> = {
  '/odbf': OdbfPage,
  '/user-home': UserHomePage,
}

export function preloadRoute(path: string) {
  pagesByRoute[path]?.preload().catch(() => {
    // The route loads it again (and shows its error) on navigation
  })
}
