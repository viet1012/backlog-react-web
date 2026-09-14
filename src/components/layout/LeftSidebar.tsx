import {
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material'

import {
  ChevronLeftRounded,
  ChevronRightRounded,
  ConstructionRounded,
  EditOutlined,
  ExpandMoreRounded,
  FactoryOutlined,
  LogoutRounded,
  ScheduleRounded,
  VisibilityOutlined,
} from '@mui/icons-material'

import {
  useState,
} from 'react'

import {
  NavLink,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  uiTokens,
} from '../../theme/uiTokens'

import {
  groupAccent,
  menuGroups,
} from './sidebarConfig'

import {
  getBrandCardSx,
  getFooterSx,
  getGroupHeaderSx,
  getMenuItemSx,
  getSidebarSx,
  iconTransition,
  labelTransition,
} from './sidebarStyles'
import {
  getAuthSession,
  getAuthenticatedUsername,
  hasAnyRole,
  logout,
} from '../../services/authService'


// =========================================================
// SIDEBAR
// =========================================================

export function LeftSidebar() {

  const location =
    useLocation()

  const navigate =
    useNavigate()

  const session =
    getAuthSession()

  const username =
    getAuthenticatedUsername()
    ?? 'Production User'



  const primaryRole =
    session?.roles[0]

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }


  // =======================================================
  // COLLAPSE
  // =======================================================

  const [
    collapsed,
    setCollapsed,
  ] = useState(false)


  // =======================================================
  // GROUP STATE
  // =======================================================

  const [
    openGroups,
    setOpenGroups,
  ] = useState<Record<string, boolean>>({
    production: true,
    planning: true,
    management: true,
  })


  function toggleGroup(
    id: string,
  ) {

    setOpenGroups(
      (current) => ({
        ...current,

        [id]:
          !current[id],
      }),
    )
  }


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <Box
      component="aside"

      sx={(theme) =>
        getSidebarSx(
          theme,
          collapsed,
        )
      }
    >

      {/* ===================================================
          HEADER
      =================================================== */}

      <Box
        sx={{
          position:
            'relative',

          height:
            collapsed
              ? 52
              : 68,

          minHeight:
            collapsed
              ? 52
              : 68,

          display:
            'flex',

          alignItems:
            'center',

          px:
            0,

          flexShrink:
            0,

          transition:
            'none',
        }}
      >

        {/* ===============================================
            EXPANDED
        =============================================== */}

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            px: 1.25,
            opacity: collapsed ? 0 : 1,
            transform: collapsed
              ? 'translateX(-6px)'
              : 'translateX(0)',
            visibility: collapsed ? 'hidden' : 'visible',
            pointerEvents: collapsed ? 'none' : 'auto',
            transition: labelTransition,
          }}
        >

          <Box
            sx={(theme) =>
              getBrandCardSx(
                theme,
              )
            }
          >
            {/* LOGO */}
            <Box
              sx={{
                width: 32,
                height: 32,

                flexShrink: 0,

                display: 'grid',
                placeItems: 'center',

                borderRadius: '10px',

                color: '#fff',

                background:
                  'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',

                boxShadow:
                  '0 5px 14px rgba(37,99,235,0.24)',

                '& svg': {
                  fontSize: 18,
                },
              }}
            >
              <FactoryOutlined />
            </Box>

            {/* TITLE */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <Typography
                noWrap
                sx={{
                  fontSize: 12.5,
                  fontWeight: 800,
                  lineHeight: 1.15,

                  color: 'text.primary',

                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Production Control
              </Typography>

              <Typography
                noWrap
                sx={{
                  mt: 0.2,

                  fontSize: 10,
                  fontWeight: 500,
                  lineHeight: 1.15,

                  color: 'text.secondary',

                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Factory Operations
              </Typography>
            </Box>
          </Box>

          {/* COLLAPSE BUTTON */}

          <Tooltip
            title="Collapse sidebar"
            placement="right"
            arrow
          >
            <IconButton
              size="small"

              onClick={() =>
                setCollapsed(true)
              }

              sx={{
                position:
                  'absolute',

                right:
                  8,

                width:
                  26,

                height:
                  26,

                color:
                  'text.secondary',

                bgcolor:
                  'action.hover',

                border:
                  '1px solid',

                borderColor:
                  'divider',

                '&:hover': {
                  color:
                    'primary.main',

                  bgcolor:
                    'action.selected',
                },
              }}
            >
              <ChevronLeftRounded
                sx={{
                  fontSize:
                    18,
                }}
              />
            </IconButton>
          </Tooltip>

        </Box>


        {/* ===============================================
            COLLAPSED
        =============================================== */}

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            opacity: collapsed ? 1 : 0,
            transform: collapsed
              ? 'scale(1)'
              : 'scale(0.94)',
            visibility: collapsed ? 'visible' : 'hidden',
            pointerEvents: collapsed ? 'auto' : 'none',
            transition: labelTransition,
          }}
        >
          <Tooltip
            title="Expand sidebar"
            placement="right"
            arrow
          >
            <IconButton
              onClick={() => {
                setCollapsed(false)
              }}

              sx={(theme) => ({
                mx:
                  'auto',

                width:
                  34,

                height:
                  34,

                color:
                  'primary.main',

                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(59,130,246,.12)'
                    : 'rgba(37,99,235,.08)',

                border:
                  '1px solid',

                borderColor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(96,165,250,.22)'
                    : 'rgba(37,99,235,.14)',

                transition:
                  'background-color 150ms ease, transform 150ms ease',

                '&:hover': {
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? 'rgba(59,130,246,.20)'
                      : 'rgba(37,99,235,.14)',

                  transform:
                    'scale(1.05)',
                },
              })}
            >
              <ChevronRightRounded
                sx={{
                  fontSize:
                    21,
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>

      </Box>


      <Divider />


      {/* ===================================================
          MENU
      =================================================== */}

      <Box
        sx={{
          flex:
            1,

          overflowX:
            'hidden',

          overflowY:
            'auto',

          py:
            0.75,

          '&::-webkit-scrollbar': {
            width:
              4,
          },

          '&::-webkit-scrollbar-thumb': {
            bgcolor:
              'action.selected',

            borderRadius:
              '4px',
          },
        }}
      >

        {menuGroups.map(
          (group) => {

            const visibleItems =
              group.items.filter(
                (item) =>
                  !item.roles
                  || hasAnyRole(item.roles),
              )

            if (visibleItems.length === 0) {
              return null
            }

            const groupOpen =
              openGroups[
              group.id
              ]

            const accent =
              groupAccent[
              group.id
              ]


            return (
              <Box
                key={
                  group.id
                }

                sx={{
                  mb:
                    collapsed
                      ? 0.75
                      : 1,
                }}
              >

                {/* =========================================
                    GROUP HEADER
                ========================================= */}

                <ListItemButton
                  aria-hidden={
                    collapsed
                  }

                  tabIndex={
                    collapsed
                      ? -1
                      : 0
                  }

                  onClick={() =>
                    toggleGroup(
                      group.id,
                    )
                  }

                  sx={(theme) =>
                    getGroupHeaderSx(
                      theme,
                      collapsed,
                      accent,
                    )
                  }
                >
                  <ListItemText
                    primary={
                      group.label
                    }

                    slotProps={{
                      primary: {
                        sx: {
                          fontSize:
                            uiTokens
                              .sidebar
                              .sectionFontSize,

                          fontWeight:
                            700,

                          letterSpacing:
                            '0.08em',

                          color:
                            'text.secondary',
                        },
                      },
                    }}
                  />

                  <ExpandMoreRounded
                    sx={{
                      fontSize:
                        16,

                      color:
                        'text.secondary',

                      transform:
                        groupOpen
                          ? 'rotate(180deg)'
                          : 'rotate(0deg)',

                      transition:
                        iconTransition,
                    }}
                  />

                </ListItemButton>


                {/* =========================================
                    ITEMS
                ========================================= */}

                <Box
                  sx={{
                    display:
                      collapsed || groupOpen
                        ? 'block'
                        : 'none',
                  }}
                >
                  <List
                    disablePadding
                    sx={{
                      px: collapsed
                        ? 0.35
                        : 0.35,
                    }}
                  >

                    {visibleItems
                      .filter((item) => !item.disabled)
                      .map(
                        (item) => {

                          const status =
                            item.status
                            ?? 'ready'

                          const isReady =
                            status === 'ready'

                          const isDeveloping =
                            status === 'developing'

                          const isTodo =
                            status === 'todo'

                          const unavailable =
                            !isReady

                          const active =
                            isReady
                            && location.pathname === item.path

                          const tooltipTitle =
                            isDeveloping
                              ? `${item.label} — Đang phát triển`
                              : isTodo
                                ? `${item.label} — Chưa làm`
                                : item.label

                          const statusIndicator =
                            isDeveloping
                              ? {
                                label: 'Developing',
                                icon: <ConstructionRounded />,
                                color: 'warning.main',
                              }
                              : isTodo
                                ? {
                                  label: 'Chưa làm',
                                  icon: <ScheduleRounded />,
                                  color: 'text.disabled',
                                }
                                : null

                          const actionIndicator =
                            item.action === 'input'
                              ? {
                                icon: <EditOutlined />,
                                label: 'Input',
                              }
                              : item.action === 'view'
                                ? {
                                  icon: <VisibilityOutlined />,
                                  label: 'View',
                                }
                                : null
                          const menuContent = (
                            <>

                              {/* ICON */}

                              <ListItemIcon
                                sx={{
                                  minWidth:
                                    26,

                                  justifyContent:
                                    'center',

                                  color:
                                    'inherit',

                                  '& svg': {
                                    fontSize:
                                      18,

                                    transform:
                                      'translateX(0) scale(1)',

                                    transition:
                                      iconTransition,
                                  },
                                }}
                              >
                                {item.icon}
                              </ListItemIcon>


                              {/* LABEL */}

                              <ListItemText
                                aria-hidden={collapsed}
                                primary={item.label}

                                sx={{
                                  position: 'absolute',

                                  left: 34,

                                  right:
                                    isReady && actionIndicator
                                      ? 72
                                      : statusIndicator
                                        ? 54
                                        : 6,
                                  opacity:
                                    collapsed
                                      ? 0
                                      : 1,

                                  overflow: 'hidden',

                                  pointerEvents:
                                    collapsed
                                      ? 'none'
                                      : 'auto',

                                  transform:
                                    collapsed
                                      ? 'translateX(-6px)'
                                      : 'translateX(0)',

                                  transition:
                                    labelTransition,
                                }}

                                slotProps={{
                                  primary: {
                                    noWrap: true,

                                    sx: {
                                      fontSize: 11.5,

                                      fontWeight:
                                        active
                                          ? 700
                                          : 500,

                                      overflow: 'hidden',

                                      textOverflow: 'ellipsis',

                                      whiteSpace: 'nowrap',
                                    },
                                  },
                                }}
                              />

                              {statusIndicator && (
                                <Box
                                  aria-hidden="true"

                                  sx={{
                                    position: 'absolute',

                                    right:
                                      collapsed
                                        ? 5
                                        : 6,

                                    top:
                                      collapsed
                                        ? 5
                                        : '50%',

                                    display: 'flex',

                                    alignItems: 'center',

                                    gap: 0.2,

                                    color:
                                      statusIndicator.color,

                                    transform:
                                      collapsed
                                        ? 'none'
                                        : 'translateY(-50%)',

                                    '& svg': {
                                      fontSize:
                                        collapsed
                                          ? 9
                                          : 10,
                                    },
                                  }}
                                >
                                  {statusIndicator.icon}

                                  {!collapsed && (
                                    <Typography
                                      component="span"

                                      sx={{
                                        fontSize: 7.5,
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {statusIndicator.label}
                                    </Typography>
                                  )}
                                </Box>
                              )}

                              {!collapsed && isReady && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    right: 8,
                                    top: '50%',
                                    transform: 'translateY(-50%)',

                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.55,

                                    color: 'text.secondary',
                                  }}
                                >
                                  {actionIndicator && (
                                    <Tooltip
                                      title={actionIndicator.label}
                                      placement="right"
                                    >
                                      <Box
                                        sx={{
                                          display: 'grid',
                                          placeItems: 'center',

                                          '& svg': {
                                            fontSize: 16,
                                          },
                                        }}
                                      >
                                        {actionIndicator.icon}
                                      </Box>
                                    </Tooltip>
                                  )}
                                </Box>
                              )}

                            </>
                          )

                          const menuItemSx = (theme: Parameters<typeof getMenuItemSx>[0]) => ({
                            ...getMenuItemSx(
                              theme,
                              collapsed,
                              active,
                            ),

                            ...(isDeveloping && {
                              opacity: 0.72,
                              cursor: 'not-allowed',
                            }),

                            ...(isTodo && {
                              opacity: 0.52,
                              color: 'text.disabled',
                              cursor: 'not-allowed',
                            }),

                            ...(unavailable && {
                              '&:hover': {
                                transform: 'none',
                                color: isDeveloping
                                  ? 'text.secondary'
                                  : 'text.disabled',
                                background: theme.palette.mode === 'dark'
                                  ? 'rgba(255,255,255,0.025)'
                                  : 'rgba(255,255,255,0.28)',
                                boxShadow: 'none',
                                borderColor: 'transparent',
                              },
                            }),
                          })


                          const menuButton = !unavailable ? (
                            <ListItemButton
                              component={
                                NavLink
                              }

                              to={
                                item.path
                              }

                              selected={
                                active
                              }

                              sx={menuItemSx}
                            >
                              {menuContent}
                            </ListItemButton>
                          ) : (
                            <ListItemButton
                              component="div"
                              aria-disabled="true"
                              tabIndex={-1}
                              selected={false}
                              sx={menuItemSx}
                            >
                              {menuContent}
                            </ListItemButton>
                          )


                          return (
                            <Tooltip
                              key={
                                item.path
                              }

                              title={
                                tooltipTitle
                              }

                              placement="right"

                              arrow

                              disableHoverListener={
                                !collapsed
                                && isReady
                              }

                              disableFocusListener={
                                !collapsed
                                && isReady
                              }

                              disableTouchListener={
                                !collapsed
                                && isReady
                              }
                            >
                              {menuButton}
                            </Tooltip>
                          )
                        },
                      )}

                  </List>
                </Box>


                {/* COLLAPSED SEPARATOR */}

                {collapsed && (
                  <Divider
                    sx={{
                      mx:
                        1,

                      mt:
                        0.75,
                    }}
                  />
                )}

              </Box>
            )
          },
        )}

      </Box>


      {/* ===================================================
          FOOTER
      =================================================== */}
      <Box
        sx={(theme) => ({
          ...getFooterSx(theme),

          position: 'relative',

          display: 'flex',
          alignItems: 'center',

          gap: 0.8,

          minHeight: collapsed ? 48 : 56,

          px: collapsed ? 0.5 : 1.2,
          py: collapsed ? 0.55 : 0.8,

          justifyContent: collapsed
            ? 'center'
            : 'space-between',

          overflow: 'hidden',

          borderRadius: collapsed
            ? 2
            : '16px',

          border: collapsed
            ? '1px solid transparent'
            : theme.palette.mode === 'dark'
              ? '1px solid rgba(110, 195, 245, 0.14)'
              : '1px solid rgba(92, 146, 190, 0.16)',

          background: collapsed
            ? 'transparent'
            : theme.palette.mode === 'dark'
              ? `
          linear-gradient(
            145deg,
            rgba(27, 53, 76, 0.54) 0%,
            rgba(16, 37, 58, 0.42) 100%
          )
        `
              : `
          linear-gradient(
            145deg,
            rgba(255,255,255,0.82) 0%,
            rgba(239,247,255,0.72) 100%
          )
        `,

          backdropFilter: collapsed
            ? 'none'
            : 'blur(14px) saturate(135%)',

          WebkitBackdropFilter: collapsed
            ? 'none'
            : 'blur(14px) saturate(135%)',

          boxShadow: collapsed
            ? 'none'
            : theme.palette.mode === 'dark'
              ? `
          0 8px 22px rgba(0,0,0,0.14),
          inset 0 1px 0 rgba(255,255,255,0.07)
        `
              : `
          0 8px 22px rgba(62,100,135,0.08),
          inset 0 1px 0 rgba(255,255,255,0.75)
        `,

          '&::before': collapsed
            ? {}
            : {
              content: '""',

              position: 'absolute',

              inset: 0,

              pointerEvents: 'none',

              borderRadius: 'inherit',

              background: `
            linear-gradient(
              135deg,
              rgba(255,255,255,0.20) 0%,
              rgba(255,255,255,0.04) 28%,
              transparent 48%
            )
          `,

              opacity: theme.palette.mode === 'dark'
                ? 0.45
                : 0.7,
            },

          '& > *': {
            position: 'relative',
            zIndex: 1,
          },
        })}
      >
        {collapsed ? (
          <Tooltip
            title="Sign out"
            placement="right"
          >
            <IconButton
              aria-label="Sign out"
              onClick={handleLogout}
              sx={(theme) => ({
                width: 34,
                height: 34,

                color: 'text.secondary',

                bgcolor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.035)'
                  : 'rgba(55,110,155,0.04)',

                border:
                  '1px solid rgba(135, 178, 207, 0.12)',

                borderRadius: '10px',

                transition:
                  'color 180ms ease, background 180ms ease, border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease',

                '&:hover': {
                  color: 'error.light',

                  bgcolor:
                    'rgba(210, 65, 65, 0.08)',

                  borderColor:
                    'rgba(220, 92, 92, 0.2)',

                  transform:
                    'translateY(-1px)',

                  boxShadow:
                    '0 5px 13px rgba(120, 30, 30, 0.1)',
                },
              })}
            >
              <LogoutRounded
                sx={{
                  fontSize: 17,
                }}
              />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Box
              sx={{
                minWidth: 0,
                flex: 1,

                display: 'flex',
                flexDirection: 'column',

                justifyContent: 'center',
              }}
            >
              <Typography
                noWrap
                sx={{
                  fontSize: 11.5,

                  fontWeight: 750,

                  lineHeight: 1.2,

                  color: 'text.primary',

                  overflow: 'hidden',

                  textOverflow: 'ellipsis',

                  letterSpacing: '-0.01em',
                }}
              >
                {username}
              </Typography>

              <Box
                component="span"
                sx={(theme) => ({
                  mt: 0.5,

                  px: 0.72,
                  py: 0.22,

                  display: 'inline-flex',

                  alignSelf: 'flex-start',

                  maxWidth: '100%',

                  borderRadius: 999,

                  color: theme.palette.mode === 'dark'
                    ? '#72c7ff'
                    : '#2563eb',

                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(68, 170, 235, 0.10)'
                    : 'rgba(37, 99, 235, 0.07)',

                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(94, 189, 245, 0.18)'
                    : '1px solid rgba(37, 99, 235, 0.12)',

                  boxShadow: theme.palette.mode === 'dark'
                    ? 'inset 0 1px 0 rgba(255,255,255,0.04)'
                    : 'none',

                  fontSize: 8.5,

                  fontWeight: 800,

                  lineHeight: 1,

                  letterSpacing: '0.09em',

                  whiteSpace: 'nowrap',
                })}
              >
                {primaryRole ?? 'Production System'}
              </Box>
            </Box>

            <Tooltip
              title="Sign out"
              placement="right"
            >
              <IconButton
                aria-label="Sign out"
                size="small"
                onClick={handleLogout}
                sx={(theme) => ({
                  width: 32,
                  height: 32,

                  flexShrink: 0,

                  color: 'text.secondary',

                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(255,255,255,0.035)'
                    : 'rgba(60, 110, 150, 0.035)',

                  border:
                    '1px solid rgba(135, 178, 207, 0.12)',

                  borderRadius: '10px',

                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.04)',

                  transition:
                    'color 180ms ease, background 180ms ease, border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease',

                  '&:hover': {
                    color: 'error.main',

                    bgcolor:
                      'rgba(210, 65, 65, 0.08)',

                    borderColor:
                      'rgba(220, 92, 92, 0.22)',

                    transform:
                      'translateY(-1px)',

                    boxShadow:
                      '0 6px 14px rgba(120, 30, 30, 0.10)',
                  },
                })}
              >
                <LogoutRounded
                  sx={{
                    fontSize: 17,
                  }}
                />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  )
}
