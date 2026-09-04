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
  ExpandMoreRounded,
  FactoryOutlined,
  ScheduleRounded,
} from '@mui/icons-material'

import {
  useState,
} from 'react'

import {
  NavLink,
  useLocation,
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


// =========================================================
// SIDEBAR
// =========================================================

export function LeftSidebar() {

  const location =
    useLocation()


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
                      px:
                        collapsed
                          ? 0.5
                          : 0.75,
                    }}
                  >

                    {group.items
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

                          const menuContent = (
                            <>

                              {/* ICON */}

                              <ListItemIcon
                                sx={{
                                  minWidth:
                                    32,

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
                                aria-hidden={
                                  collapsed
                                }

                                primary={
                                  item.label
                                }

                                sx={{
                                  position:
                                    'absolute',

                                  left:
                                    42,

                                  right:
                                    statusIndicator
                                      ? 82
                                      : 8,

                                  opacity:
                                    collapsed
                                      ? 0
                                      : 1,

                                  overflow:
                                    'hidden',

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
                                    noWrap:
                                      true,

                                    sx: {
                                      fontSize:
                                        uiTokens
                                          .sidebar
                                          .menuFontSize,

                                      fontWeight:
                                        active
                                          ? 700
                                          : 500,
                                    },
                                  },
                                }}
                              />

                              {statusIndicator && (
                                <Box
                                  aria-hidden="true"
                                  sx={{
                                    position: 'absolute',
                                    right: collapsed ? 5 : 8,
                                    top: collapsed ? 5 : '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.35,
                                    color: statusIndicator.color,
                                    transform: collapsed
                                      ? 'none'
                                      : 'translateY(-50%)',
                                    '& svg': {
                                      fontSize: collapsed ? 9 : 12,
                                    },
                                  }}
                                >
                                  {statusIndicator.icon}

                                  {!collapsed && (
                                    <Typography
                                      component="span"
                                      sx={{
                                        fontSize: 8.5,
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

      {!collapsed && (
        <Box
          sx={(theme) =>
            getFooterSx(
              theme,
            )
          }
        >
          <Typography
            color="text.disabled"

            sx={{
              fontSize:
                uiTokens
                  .sidebar
                  .sectionFontSize,

              letterSpacing:
                '0.03em',
            }}
          >
            Production System
          </Typography>
        </Box>
      )}

    </Box>
  )
}
