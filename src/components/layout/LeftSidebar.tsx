import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  Box,
  ButtonBase,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  type Theme,
} from '@mui/material'
import { alpha, keyframes } from '@mui/material/styles'

import {
  ChevronLeftRounded,
  ChevronRightRounded,
  ConstructionRounded,
  ExpandMoreRounded,
  LightModeRounded,
  LogoutRounded,
  NightsStayRounded,
  ScheduleRounded,
  SearchRounded,
  WbSunnyRounded,
  WbTwilightRounded,
} from '@mui/icons-material'
import logo from '../../assets/logo.png'

import {
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { uiTokens } from '../../theme/uiTokens'
import { getDayPeriod, monoFont, type DayPeriod } from '../shift/shiftParts'

import {
  getGroupColor,
  menuGroups,
  type MenuGroupId,
  type MenuItemConfig,
} from './sidebarConfig'

import {
  getBrandCardSx,
  getFooterSx,
  getGroupHeaderSx,
  getMenuItemSx,
  getSidebarSx,
  hazardStripe,
  iconTransition,
  labelTransition,
} from './sidebarStyles'
import {
  getAuthSession,
  getAuthenticatedUsername,
  hasAnyRole,
  logout,
} from '../../services/authService'

import { randomAvatarSeed, readAvatarSeed, writeAvatarSeed } from '../shift/workerCharacter'
import { FactoryAvatar } from './FactoryAvatar'
import { LogoutConfirmDialog } from './LogoutConfirmDialog'
import { QuickJumpDialog, type QuickJumpItem } from './QuickJumpDialog'
import { useI18n } from '../../i18n/useI18n'

// =========================================================
// CONSTANTS
// =========================================================

// openGroups key of the "Coming soon" section (not a MenuGroupId)
const UPCOMING = 'upcoming'

const ledPulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.45; transform: scale(0.8); }
`

const onlinePing = keyframes`
  0% { opacity: 0.7; transform: scale(1); }
  100% { opacity: 0; transform: scale(2.4); }
`

const periodIcons: Record<DayPeriod, { icon: ReactNode, color: string }> = {
  morning: { icon: <WbTwilightRounded />, color: '#f97316' },
  noon: { icon: <LightModeRounded />, color: '#eab308' },
  afternoon: { icon: <WbSunnyRounded />, color: '#ea580c' },
  night: { icon: <NightsStayRounded />, color: '#818cf8' },
}

interface NavEntry {
  item: MenuItemConfig
  groupId: MenuGroupId
}

interface IndicatorBox {
  x: number
  y: number
  width: number
  height: number
  visible: boolean
  // Jump without sliding (first show / re-show after hidden)
  instant: boolean
}

function isVisible(item: MenuItemConfig) {
  return !item.disabled && (!item.roles || hasAnyRole(item.roles))
}

function isReady(item: MenuItemConfig) {
  return (item.status ?? 'ready') === 'ready'
}

// Re-checked every minute so the greeting follows the clock.
function useDayPeriod() {
  const [period, setPeriod] = useState(() => getDayPeriod(new Date()))

  useEffect(() => {
    const timer = window.setInterval(() => setPeriod(getDayPeriod(new Date())), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return period
}

const logoutButtonSx = (theme: Theme) => ({
  width: 32,
  height: 32,
  flexShrink: 0,
  color: 'text.secondary',
  bgcolor: theme.palette.mode === 'dark'
    ? 'rgba(255,255,255,0.035)'
    : 'rgba(60, 110, 150, 0.035)',
  border: '1px solid rgba(135, 178, 207, 0.12)',
  borderRadius: '10px',
  transition: 'color 180ms ease, background 180ms ease, border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease',

  '&:hover': {
    color: 'error.main',
    bgcolor: 'rgba(210, 65, 65, 0.08)',
    borderColor: 'rgba(220, 92, 92, 0.22)',
    transform: 'translateY(-1px)',
    boxShadow: '0 6px 14px rgba(120, 30, 30, 0.10)',
  },
})

// =========================================================
// SIDEBAR
// =========================================================

export function LeftSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useTheme()
  const mode = theme.palette.mode
  const dark = mode === 'dark'
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const { t } = useI18n()

  const session = getAuthSession()
  const username = getAuthenticatedUsername() ?? t.sidebar.fallbackUser
  const primaryRole = session?.roles[0]
  const period = useDayPeriod()

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  function handleLogout() {
    setLogoutOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  // =======================================================
  // MENU DATA
  // Ready pages stay in their group; everything not ready yet
  // is gathered into a single "Coming soon" section.
  // =======================================================

  const groups = menuGroups
    .map((group) => ({
      id: group.id,
      items: group.items.filter((item) => isVisible(item) && isReady(item)),
    }))
    .filter((group) => group.items.length > 0)

  const upcoming: NavEntry[] = menuGroups.flatMap((group) =>
    group.items
      .filter((item) => isVisible(item) && !isReady(item))
      .map((item) => ({ item, groupId: group.id })))

  const activeEntry: NavEntry | undefined = groups
    .flatMap((group) => group.items.map((item) => ({ item, groupId: group.id })))
    .find((entry) => entry.item.path === location.pathname)

  const activePath = activeEntry?.item.path

  // =======================================================
  // GROUP STATE
  // =======================================================

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    production: true,
    planning: true,
    management: true,
    monitoring: true,
    setting: true,
    [UPCOMING]: false,
  })

  // Vào trang thuộc group đang thu gọn thì tự mở group đó
  const [openedForPath, setOpenedForPath] = useState<string | null>(null)

  if (openedForPath !== location.pathname) {
    setOpenedForPath(location.pathname)

    if (activeEntry && !openGroups[activeEntry.groupId]) {
      setOpenGroups((current) => ({ ...current, [activeEntry.groupId]: true }))
    }
  }

  function toggleGroup(id: string) {
    setOpenGroups((current) => ({ ...current, [id]: !current[id] }))
  }

  // =======================================================
  // QUICK JUMP (Ctrl+K)
  // =======================================================

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const quickJumpItems: QuickJumpItem[] = groups.flatMap((group) =>
    group.items.map((item) => ({
      path: item.path,
      label: t.nav[item.labelKey],
      groupLabel: t.nav.groups[group.id],
      color: getGroupColor(group.id, mode),
      icon: item.icon,
      actionLabel: actionLabelOf(item),
    })))

  function actionLabelOf(item: MenuItemConfig) {
    if (item.action === 'input') return t.sidebar.input
    if (item.action === 'view') return t.sidebar.view
    return undefined
  }

  // =======================================================
  // SLIDING ACTIVE INDICATOR
  // One shared highlight that glides to the active item.
  // =======================================================

  const menuInnerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<string, HTMLElement>())
  const [indicator, setIndicator] = useState<IndicatorBox | null>(null)

  useLayoutEffect(() => {
    const inner = menuInnerRef.current
    if (!inner) return

    const measure = () => {
      const el = activePath ? itemRefs.current.get(activePath) : undefined

      // Hidden when the active item's group is closed
      if (!el || el.getClientRects().length === 0) {
        setIndicator((prev) => prev && { ...prev, visible: false })
        return
      }

      const box = inner.getBoundingClientRect()
      const rect = el.getBoundingClientRect()

      setIndicator((prev) => ({
        x: rect.left - box.left,
        y: rect.top - box.top,
        width: rect.width,
        height: rect.height,
        visible: true,
        instant: !prev || !prev.visible,
      }))
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(inner)
    return () => observer.disconnect()
  }, [activePath, collapsed, openGroups])

  const indicatorColor = activeEntry
    ? getGroupColor(activeEntry.groupId, mode)
    : theme.palette.primary.main

  // =======================================================
  // COLLAPSED FLYOUT
  // Hovering a group's icons shows its pages with labels.
  // =======================================================

  const [flyout, setFlyout] = useState<{ groupId: MenuGroupId, anchor: HTMLElement } | null>(null)
  const flyoutTimer = useRef<number | undefined>(undefined)

  function openFlyout(groupId: MenuGroupId, anchor: HTMLElement) {
    window.clearTimeout(flyoutTimer.current)
    setFlyout({ groupId, anchor })
  }

  function keepFlyout() {
    window.clearTimeout(flyoutTimer.current)
  }

  function scheduleFlyoutClose() {
    window.clearTimeout(flyoutTimer.current)
    flyoutTimer.current = window.setTimeout(() => setFlyout(null), 140)
  }

  useEffect(() => () => window.clearTimeout(flyoutTimer.current), [])

  const flyoutGroup = collapsed && flyout
    ? groups.find((group) => group.id === flyout.groupId)
    : undefined

  // =======================================================
  // ITEMS
  // =======================================================

  function renderItem(item: MenuItemConfig, groupId: MenuGroupId) {
    const color = getGroupColor(groupId, mode)
    const active = item.path === location.pathname
    const label = t.nav[item.labelKey]
    const actionLabel = actionLabelOf(item)

    return (
      <Tooltip
        key={item.path}
        // Collapsed: the flyout shows the label instead
        title={!collapsed && actionLabel ? `${label} · ${actionLabel}` : ''}
        placement="right"
        arrow
        enterDelay={600}
        enterNextDelay={600}
      >
        <ListItemButton
          component={NavLink}
          to={item.path}
          selected={active}
          aria-label={label}
          ref={(el: HTMLElement | null) => {
            if (el) itemRefs.current.set(item.path, el)
            else itemRefs.current.delete(item.path)
          }}
          sx={(th) => getMenuItemSx(th, collapsed, active, color)}
        >
          <ListItemIcon
            sx={{
              minWidth: 26,
              justifyContent: 'center',
              color: 'inherit',
              '& svg': { fontSize: 18, transition: iconTransition },
            }}
          >
            {item.icon}
          </ListItemIcon>

          <ListItemText
            aria-hidden
            primary={label}
            sx={{
              position: 'absolute',
              left: 34,
              right: 22,
              overflow: 'hidden',
              opacity: collapsed ? 0 : 1,
              pointerEvents: collapsed ? 'none' : 'auto',
              transform: collapsed ? 'translateX(-6px)' : 'translateX(0)',
              transition: labelTransition,
            }}
            slotProps={{
              primary: {
                noWrap: true,
                sx: { fontSize: 11.5, fontWeight: active ? 700 : 500 },
              },
            }}
          />

          {/* Status LED of the active page */}
          {active && (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                right: collapsed ? 6 : 10,
                top: collapsed ? 6 : 'calc(50% - 3.5px)',
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
                animation: reduceMotion ? 'none' : `${ledPulse} 1.6s ease-in-out infinite`,
              }}
            />
          )}
        </ListItemButton>
      </Tooltip>
    )
  }

  function renderUpcoming({ item, groupId }: NavEntry) {
    const developing = item.status === 'developing'
    const label = t.nav[item.labelKey]
    const status = developing
      ? { label: t.sidebar.developing, icon: <ConstructionRounded />, color: 'warning.main' }
      : { label: t.sidebar.notStarted, icon: <ScheduleRounded />, color: 'text.disabled' }

    return (
      <Tooltip
        key={item.path}
        title={developing ? t.sidebar.developingTooltip(label) : t.sidebar.notStartedTooltip(label)}
        placement="right"
        arrow
      >
        <ListItemButton
          component="div"
          aria-disabled="true"
          tabIndex={-1}
          disableRipple
          sx={(th) => ({
            ...getMenuItemSx(th, false, false, getGroupColor(groupId, mode)),
            minHeight: 32,
            opacity: developing ? 0.8 : 0.6,
            cursor: 'not-allowed',
            '&:hover': { bgcolor: 'transparent' },
          })}
        >
          <ListItemIcon
            sx={{
              minWidth: 26,
              justifyContent: 'center',
              color: 'inherit',
              '& svg': { fontSize: 16 },
            }}
          >
            {item.icon}
          </ListItemIcon>

          <ListItemText
            primary={label}
            sx={{ position: 'absolute', left: 34, right: 78, overflow: 'hidden' }}
            slotProps={{ primary: { noWrap: true, sx: { fontSize: 11 } } }}
          />

          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              right: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 0.3,
              color: status.color,
              '& svg': { fontSize: 11 },
            }}
          >
            {status.icon}
            <Typography component="span" sx={{ fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {status.label}
            </Typography>
          </Box>
        </ListItemButton>
      </Tooltip>
    )
  }

  // =======================================================
  // FOOTER PIECES
  // =======================================================

  const greeting = periodIcons[period]
  const [avatarSeed, setAvatarSeed] = useState(() => readAvatarSeed(username))

  function shuffleAvatar() {
    const seed = randomAvatarSeed()
    setAvatarSeed(seed)
    writeAvatarSeed(username, seed)
  }

  const avatar = (
    <ButtonBase
      aria-label={t.sidebar.shuffleAvatar}
      onClick={shuffleAvatar}
      sx={{
        position: 'relative',
        width: 36,
        height: 36,
        flexShrink: 0,
        borderRadius: '10px',
        '&:hover .factory-avatar-hat, &.Mui-focusVisible .factory-avatar-hat': {
          transform: 'translateY(-2.5px) rotate(-14deg)',
        },
        '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: '10px',
          border: '1px solid',
          borderColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.08)',
          boxShadow: '0 4px 10px rgba(15,23,42,0.18)',
        }}
      >
        <FactoryAvatar seed={avatarSeed} size={36} period={period} animate={!reduceMotion} />
      </Box>

      {/* Online dot */}
      <Box
        role="img"
        aria-label={t.sidebar.online}
        sx={{
          position: 'absolute',
          right: -3,
          bottom: -3,
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: '#22c55e',
          border: '2px solid',
          borderColor: 'background.paper',

          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            bgcolor: '#22c55e',
            animation: reduceMotion ? 'none' : `${onlinePing} 1.8s ease-out infinite`,
          },
        }}
      />
    </ButtonBase>
  )

  const logoutButton = (
    <Tooltip title={t.sidebar.signOut} placement="right">
      <IconButton
        aria-label={t.sidebar.signOut}
        size="small"
        onClick={() => setLogoutOpen(true)}
        sx={logoutButtonSx}
      >
        <LogoutRounded sx={{ fontSize: 17 }} />
      </IconButton>
    </Tooltip>
  )

  // =======================================================
  // RENDER
  // =======================================================

  return (
    <Box
      component="aside"
      data-ambient={logoutOpen ? 'paused' : undefined}
      sx={(th) => getSidebarSx(th, collapsed)}
    >

      {/* ===================================================
          HEADER
      =================================================== */}
      <Box
        sx={{
          position: 'relative',
          height: collapsed ? 52 : 68,
          minHeight: collapsed ? 52 : 68,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {/* EXPANDED */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            px: 1.25,
            opacity: collapsed ? 0 : 1,
            transform: collapsed ? 'translateX(-6px)' : 'translateX(0)',
            visibility: collapsed ? 'hidden' : 'visible',
            pointerEvents: collapsed ? 'none' : 'auto',
            transition: labelTransition,
          }}
        >
          <Box sx={(th) => getBrandCardSx(th)}>
            <Box
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '10px',
                overflow: 'hidden',
                bgcolor: dark ? 'rgba(255,255,255,0.08)' : '#EEF4FF',
                border: '1px solid',
                borderColor: dark ? 'rgba(132,207,255,0.22)' : 'rgba(37,99,235,0.14)',
                boxShadow: '0 4px 12px rgba(37,99,235,0.14)',
              }}
            >
              <Box
                component="img"
                src={logo}
                alt="F2"
                sx={{
                  width: 30,
                  height: 30,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.18))',
                }}
              />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 800, lineHeight: 1.15, color: 'text.primary' }}>
                {t.sidebar.appName}
              </Typography>
              <Typography noWrap sx={{ mt: 0.2, fontSize: 10, fontWeight: 500, lineHeight: 1.15, color: 'text.secondary' }}>
                {t.sidebar.appTagline}
              </Typography>
            </Box>
          </Box>

          <Tooltip title={t.sidebar.collapse} placement="right" arrow>
            <IconButton
              size="small"
              onClick={() => setCollapsed(true)}
              sx={{
                position: 'absolute',
                right: 8,
                width: 26,
                height: 26,
                color: 'text.secondary',
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { color: 'primary.main', bgcolor: 'action.selected' },
              }}
            >
              <ChevronLeftRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* COLLAPSED */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            opacity: collapsed ? 1 : 0,
            transform: collapsed ? 'scale(1)' : 'scale(0.94)',
            visibility: collapsed ? 'visible' : 'hidden',
            pointerEvents: collapsed ? 'auto' : 'none',
            transition: labelTransition,
          }}
        >
          <Tooltip title={t.sidebar.expand} placement="right" arrow>
            <IconButton
              onClick={() => setCollapsed(false)}
              sx={{
                width: 34,
                height: 34,
                color: 'primary.main',
                bgcolor: dark ? 'rgba(59,130,246,.12)' : 'rgba(37,99,235,.08)',
                border: '1px solid',
                borderColor: dark ? 'rgba(96,165,250,.22)' : 'rgba(37,99,235,.14)',
                transition: 'background-color 150ms ease, transform 150ms ease',
                '&:hover': {
                  bgcolor: dark ? 'rgba(59,130,246,.20)' : 'rgba(37,99,235,.14)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              <ChevronRightRounded sx={{ fontSize: 21 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ===================================================
          QUICK JUMP TRIGGER
      =================================================== */}
      <Box sx={{ px: collapsed ? 0 : 1.25, pb: 1, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        {collapsed ? (
          <Tooltip title={t.sidebar.searchAria} placement="right" arrow>
            <IconButton
              aria-label={t.sidebar.searchAria}
              onClick={() => setSearchOpen(true)}
              sx={{
                width: 34,
                height: 34,
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '10px',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <SearchRounded sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        ) : (
          <ButtonBase
            aria-label={t.sidebar.searchAria}
            onClick={() => setSearchOpen(true)}
            sx={{
              width: '100%',
              height: 34,
              px: 1.1,
              gap: 0.9,
              justifyContent: 'flex-start',
              borderRadius: '10px',
              color: 'text.secondary',
              bgcolor: dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.62)',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'color 160ms ease, border-color 160ms ease',
              '&:hover': { color: 'text.primary', borderColor: alpha(theme.palette.primary.main, 0.45) },
            }}
          >
            <SearchRounded sx={{ fontSize: 17 }} />
            <Typography noWrap sx={{ flex: 1, textAlign: 'left', fontSize: 11.5 }}>
              {t.sidebar.search}
            </Typography>
            <Box
              component="kbd"
              sx={{
                px: 0.6,
                py: 0.1,
                borderRadius: '5px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'action.hover',
                fontFamily: monoFont,
                fontSize: 9.5,
                lineHeight: 1.5,
              }}
            >
              Ctrl K
            </Box>
          </ButtonBase>
        )}
      </Box>

      <Divider />

      {/* ===================================================
          MENU
      =================================================== */}
      <Box
        sx={{
          flex: 1,
          overflowX: 'hidden',
          overflowY: 'auto',
          py: 0.75,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'action.selected', borderRadius: '4px' },
        }}
      >
        <Box ref={menuInnerRef} sx={{ position: 'relative' }}>

          {indicator && (
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 0,
                pointerEvents: 'none',
                borderRadius: '11px',
                bgcolor: alpha(indicatorColor, dark ? 0.16 : 0.1),
                border: '1px solid',
                borderColor: alpha(indicatorColor, 0.3),
                boxShadow: `0 6px 18px ${alpha(indicatorColor, 0.16)}`,
                transition: indicator.instant
                  ? 'opacity 160ms ease'
                  : 'transform 280ms cubic-bezier(.3,1.25,.5,1), width 180ms ease, height 180ms ease, opacity 160ms ease, background-color 220ms ease, border-color 220ms ease',

                // Left rail
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: -1,
                  top: 8,
                  bottom: 8,
                  width: 3,
                  borderRadius: '0 4px 4px 0',
                  bgcolor: indicatorColor,
                  boxShadow: `0 0 10px ${alpha(indicatorColor, 0.7)}`,
                },
              }}
              style={{
                transform: `translate(${indicator.x}px, ${indicator.y}px)`,
                width: indicator.width,
                height: indicator.height,
                opacity: indicator.visible ? 1 : 0,
              }}
            />
          )}

          {groups.map((group) => {
            const color = getGroupColor(group.id, mode)
            const groupOpen = openGroups[group.id]

            return (
              <Box key={group.id} sx={{ mb: collapsed ? 0.75 : 1 }}>

                {/* GROUP HEADER */}
                <ListItemButton
                  aria-hidden={collapsed}
                  aria-expanded={groupOpen}
                  tabIndex={collapsed ? -1 : 0}
                  onClick={() => toggleGroup(group.id)}
                  sx={(th) => getGroupHeaderSx(th, collapsed)}
                >
                  <Box
                    aria-hidden
                    sx={{
                      width: 7,
                      height: 7,
                      flexShrink: 0,
                      borderRadius: '50%',
                      bgcolor: color,
                      boxShadow: `0 0 0 3px ${alpha(color, 0.18)}`,
                    }}
                  />
                  <Typography
                    noWrap
                    sx={{
                      flex: 1,
                      fontSize: uiTokens.sidebar.sectionFontSize,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                    }}
                  >
                    {t.nav.groups[group.id]}
                  </Typography>
                  <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.disabled' }}>
                    {group.items.length}
                  </Typography>
                  <ExpandMoreRounded
                    sx={{
                      fontSize: 16,
                      transform: groupOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: iconTransition,
                    }}
                  />
                </ListItemButton>

                {/* ITEMS */}
                <Box
                  onMouseEnter={collapsed ? (event) => openFlyout(group.id, event.currentTarget) : undefined}
                  onMouseLeave={collapsed ? scheduleFlyoutClose : undefined}
                  sx={{ display: collapsed || groupOpen ? 'block' : 'none' }}
                >
                  <List disablePadding sx={{ px: 0.35 }}>
                    {group.items.map((item) => renderItem(item, group.id))}
                  </List>
                </Box>

                {collapsed && <Divider sx={{ mx: 1, mt: 0.75 }} />}
              </Box>
            )
          })}

          {/* COMING SOON */}
          {!collapsed && upcoming.length > 0 && (
            <Box sx={{ mt: 0.5 }}>
              <ListItemButton
                aria-expanded={openGroups[UPCOMING]}
                onClick={() => toggleGroup(UPCOMING)}
                sx={(th) => getGroupHeaderSx(th, false)}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 14,
                    height: 7,
                    flexShrink: 0,
                    borderRadius: '2px',
                    backgroundImage: hazardStripe(dark),
                  }}
                />
                <Typography
                  noWrap
                  sx={{
                    flex: 1,
                    fontSize: uiTokens.sidebar.sectionFontSize,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t.sidebar.comingSoon}
                </Typography>
                <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.disabled' }}>
                  {upcoming.length}
                </Typography>
                <ExpandMoreRounded
                  sx={{
                    fontSize: 16,
                    transform: openGroups[UPCOMING] ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: iconTransition,
                  }}
                />
              </ListItemButton>

              {openGroups[UPCOMING] && (
                <List disablePadding sx={{ px: 0.35 }}>
                  {upcoming.map(renderUpcoming)}
                </List>
              )}
            </Box>
          )}
        </Box>
      </Box>

      {/* ===================================================
          FLYOUT (collapsed only)
      =================================================== */}
      <Popper
        open={Boolean(flyoutGroup)}
        anchorEl={flyout?.anchor}
        placement="right-start"
        modifiers={[{ name: 'offset', options: { offset: [-4, 10] } }]}
        sx={{ zIndex: theme.zIndex.tooltip }}
      >
        {flyoutGroup && (
          <Paper
            elevation={8}
            onMouseEnter={keepFlyout}
            onMouseLeave={scheduleFlyoutClose}
            sx={{
              minWidth: 200,
              p: 0.75,
              borderRadius: '12px',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.9, px: 1, pt: 0.25, pb: 0.75 }}>
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: getGroupColor(flyoutGroup.id, mode),
                }}
              />
              <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', color: 'text.secondary' }}>
                {t.nav.groups[flyoutGroup.id]}
              </Typography>
            </Box>

            {flyoutGroup.items.map((item) => {
              const color = getGroupColor(flyoutGroup.id, mode)
              const active = item.path === location.pathname
              const actionLabel = actionLabelOf(item)

              return (
                <ListItemButton
                  key={item.path}
                  component={NavLink}
                  to={item.path}
                  onClick={() => setFlyout(null)}
                  sx={{
                    minHeight: 34,
                    gap: 1,
                    px: 1,
                    borderRadius: '8px',
                    color: active ? color : 'text.primary',
                    bgcolor: active ? alpha(color, 0.1) : 'transparent',
                    '& svg': { fontSize: 17, color },
                  }}
                >
                  {item.icon}
                  <Typography noWrap sx={{ flex: 1, fontSize: 12.5, fontWeight: active ? 700 : 500 }}>
                    {t.nav[item.labelKey]}
                  </Typography>
                  {actionLabel && (
                    <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
                      {actionLabel}
                    </Typography>
                  )}
                </ListItemButton>
              )
            })}
          </Paper>
        )}
      </Popper>

      {/* ===================================================
          FOOTER (employee badge)
      =================================================== */}
      <Box sx={(th) => getFooterSx(th, collapsed)}>
        {collapsed ? (
          <>
            <Tooltip
              title={`${t.sidebar.greeting[period]}, ${username} · ${t.sidebar.shuffleAvatar}`}
              placement="right"
            >
              {avatar}
            </Tooltip>
            {logoutButton}
          </>
        ) : (
          <>
            <Tooltip title={t.sidebar.shuffleAvatar} placement="top">
              {avatar}
            </Tooltip>

            {/* One piece per line (greeting / name / role) so none of them cuts another */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  mb: 0.3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.4,
                  color: greeting.color,
                  '& svg': { fontSize: 13, flexShrink: 0 },
                }}
              >
                {greeting.icon}
                <Typography sx={{ fontSize: 10, fontWeight: 700, lineHeight: 1.2 }}>
                  {t.sidebar.greeting[period]}
                </Typography>
              </Box>

              <Typography
                title={username}
                sx={{
                  fontSize: 12,
                  fontWeight: 750,
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em',
                  color: 'text.primary',
                  overflowWrap: 'anywhere',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {username}
              </Typography>

              <Box sx={{ mt: 0.4, display: 'flex', minWidth: 0 }}>
                <Box
                  component="span"
                  sx={{
                    px: 0.7,
                    py: 0.2,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    borderRadius: 999,
                    color: dark ? '#72c7ff' : '#2563eb',
                    bgcolor: dark ? 'rgba(68, 170, 235, 0.10)' : 'rgba(37, 99, 235, 0.07)',
                    border: dark ? '1px solid rgba(94, 189, 245, 0.18)' : '1px solid rgba(37, 99, 235, 0.12)',
                    fontSize: 8.5,
                    fontWeight: 800,
                    lineHeight: 1,
                    letterSpacing: '0.09em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {primaryRole ?? t.sidebar.fallbackRole}
                </Box>
              </Box>
            </Box>

            {logoutButton}
          </>
        )}

        <LogoutConfirmDialog
          open={logoutOpen}
          username={username}
          role={primaryRole}
          avatarSeed={avatarSeed}
          onCancel={() => setLogoutOpen(false)}
          onConfirm={handleLogout}
        />
      </Box>

      {searchOpen && (
        <QuickJumpDialog
          items={quickJumpItems}
          onClose={() => setSearchOpen(false)}
          onSelect={(path) => {
            setSearchOpen(false)
            navigate(path)
          }}
        />
      )}
    </Box>
  )
}
