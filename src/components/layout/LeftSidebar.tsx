import {
  Box,
  Collapse,
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
  AssessmentOutlined,
  ChevronLeftRounded,
  ChevronRightRounded,
  ExpandMoreRounded,
  FactoryOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  ReceiptLongOutlined,
  SpaceDashboardOutlined,
} from '@mui/icons-material'

import type { ReactNode } from 'react'
import { useState } from 'react'
import {
  NavLink,
  useLocation,
} from 'react-router-dom'
import { uiTokens } from '../../theme/uiTokens'


// =========================================================
// TYPES
// =========================================================

interface MenuItemConfig {
  label: string
  path: string
  icon: ReactNode
}

interface MenuGroupConfig {
  id: string
  label: string
  items: MenuItemConfig[]
}


// =========================================================
// MENU CONFIG
// =========================================================

const menuGroups: MenuGroupConfig[] = [
  {
    id: 'order-control',
    label: 'ORDER CONTROL',
    items: [
      {
        label: 'Backlog Detail',
        path: '/backlog',
        icon: <SpaceDashboardOutlined />,
      },
      {
        label: 'ODBF',
        path: '/odbf',
        icon: <Inventory2Outlined />,
      },
    ],
  },

  {
    id: 'shipping',
    label: 'SHIPPING',
    items: [
      {
        label: 'Shipment',
        path: '/shipment',
        icon: <LocalShippingOutlined />,
      },
      {
        label: 'Export List',
        path: '/export-list',
        icon: <ReceiptLongOutlined />,
      },
      {
        label: 'Sales Status',
        path: '/sales-status',
        icon: <AssessmentOutlined />,
      },
    ],
  },
]

const sidebarTransition = 'width 200ms ease'
const labelTransition = 'opacity 150ms ease, transform 180ms ease'
const iconTransition = 'transform 160ms ease'


// =========================================================
// SIDEBAR
// =========================================================

export function LeftSidebar() {
  const location = useLocation()

  const [collapsed, setCollapsed] =
    useState(false)

  const [openGroups, setOpenGroups] =
    useState<Record<string, boolean>>({
      'order-control': true,
      shipping: true,
    })


  function toggleGroup(id: string) {
    setOpenGroups((current) => ({
      ...current,
      [id]: !current[id],
    }))
  }


  return (
    <Box
      component="aside"
      sx={(theme) => ({
        width: collapsed ? 60 : 220,
        height: '100vh',

        flexShrink: 0,

        display: 'flex',
        flexDirection: 'column',

        overflow: 'hidden',

        bgcolor: 'background.paper',

        borderRight:
          `1px solid ${theme.palette.divider}`,

        boxShadow:
          theme.palette.mode === 'dark'
            ? '4px 0 18px rgba(0,0,0,0.16)'
            : '4px 0 18px rgba(15,23,42,0.04)',

        transition: sidebarTransition,

        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none',
          '& *': {
            transition: 'none !important',
          },
        },

        zIndex: 10,
      })}
    >

      {/* =====================================================
    BRAND / HEADER
===================================================== */}

      <Box
        sx={{
          position: 'relative',

          height: collapsed ? 52 : 68,
          minHeight: collapsed ? 52 : 68,

          display: 'flex',
          alignItems: 'center',

          px: collapsed ? 0 : 1.25,

          flexShrink: 0,

          transition:
            'height 200ms ease, padding 200ms ease',
        }}
      >
        {/* ============================
      EXPANDED
  ============================ */}

        {!collapsed && (
          <>
            <Box
              sx={{
                flex: 1,
                minWidth: 0,

                display: 'flex',
                alignItems: 'center',

                gap: 1,

                pr: 4,
              }}
            >
              {/* LOGO */}

              <Box
                sx={(theme) => ({
                  width: 34,
                  height: 34,

                  flexShrink: 0,

                  display: 'grid',
                  placeItems: 'center',

                  borderRadius: uiTokens.control.borderRadius,

                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',

                  boxShadow:
                    theme.palette.mode === 'dark'
                      ? '0 3px 10px rgba(0,0,0,.25)'
                      : '0 3px 10px rgba(37,99,235,.18)',

                  '& svg': {
                    fontSize: 19,
                  },
                })}
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
                    fontSize: uiTokens.sidebar.appTitleFontSize,
                    fontWeight: 800,
                    lineHeight: 1.2,

                    color: 'text.primary',
                  }}
                >
                  Production Control
                </Typography>

                <Typography
                  noWrap
                  sx={{
                    mt: 0.35,

                    fontSize: uiTokens.sidebar.subtitleFontSize,
                    fontWeight: 500,
                    lineHeight: 1.2,

                    color: 'text.secondary',
                  }}
                >
                  Factory Operations
                </Typography>
              </Box>
            </Box>

            {/* COLLAPSE */}

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
                  position: 'absolute',

                  right: 8,

                  width: 26,
                  height: 26,

                  color: 'text.secondary',

                  bgcolor: 'action.hover',

                  border: '1px solid',
                  borderColor: 'divider',

                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <ChevronLeftRounded
                  sx={{ fontSize: 18 }}
                />
              </IconButton>
            </Tooltip>
          </>
        )}

        {/* ============================
      COLLAPSED
  ============================ */}

        {collapsed && (
          <Tooltip
            title="Expand sidebar"
            placement="right"
            arrow
          >
            <IconButton
              onClick={() =>
                setCollapsed(false)
              }
              sx={(theme) => ({
                mx: 'auto',

                width: 34,
                height: 34,

                color: 'primary.main',

                bgcolor:
                  theme.palette.mode === 'dark'
                    ? 'rgba(59,130,246,.12)'
                    : 'rgba(37,99,235,.08)',

                border: '1px solid',

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

                  transform: 'scale(1.05)',
                },
              })}
            >
              <ChevronRightRounded
                sx={{
                  fontSize: 21,
                }}
              />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider />


      {/* =====================================================
          MENU
      ===================================================== */}

      <Box
        sx={{
          flex: 1,

          overflowX: 'hidden',
          overflowY: 'auto',

          py: 0.75,

          '&::-webkit-scrollbar': {
            width: 4,
          },

          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'action.selected',
            borderRadius: '4px',
          },
        }}
      >

        {menuGroups.map((group) => {
          const groupOpen =
            openGroups[group.id]

          return (
            <Box
              key={group.id}
              sx={{
                mb: collapsed
                  ? 0.75
                  : 1,
              }}
            >

              {/* GROUP HEADER */}

              <ListItemButton
                aria-hidden={collapsed}
                tabIndex={collapsed ? -1 : 0}
                onClick={() =>
                  toggleGroup(group.id)
                }
                sx={{
                  minHeight: collapsed ? 0 : 30,
                  height: collapsed ? 0 : 30,

                  mx: 0.75,
                  px: 1,
                  py: collapsed ? 0 : 0.25,

                  borderRadius: uiTokens.control.borderRadius,
                  opacity: collapsed ? 0 : 1,
                  overflow: 'hidden',
                  pointerEvents: collapsed ? 'none' : 'auto',
                  transform: collapsed ? 'translateX(-6px)' : 'translateX(0)',
                  transition: `${labelTransition}, height 180ms ease, min-height 180ms ease, padding 180ms ease`,

                  '&:hover': {
                    bgcolor:
                      'action.hover',
                  },
                }}
              >
                <ListItemText
                  primary={group.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: uiTokens.sidebar.sectionFontSize,
                        fontWeight: 700,

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
                    fontSize: 16,
                    color: 'text.secondary',
                    transform: groupOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: iconTransition,
                  }}
                />
              </ListItemButton>


              {/* GROUP ITEMS */}

              <Collapse
                in={
                  collapsed ||
                  groupOpen
                }
                timeout="auto"
              >
                <List
                  disablePadding
                  sx={{
                    px: collapsed
                      ? 0.5
                      : 0.75,
                  }}
                >
                  {group.items.map(
                    (item) => {

                      const active =
                        location.pathname ===
                        item.path

                      const menuButton = (
                        <ListItemButton
                          component={NavLink}
                          to={item.path}
                          selected={active}

                          sx={(theme) => ({
                            position:
                              'relative',

                            minHeight: 38,

                            mb: 0.25,

                            px: collapsed
                              ? 0
                              : 1,

                            justifyContent:
                              collapsed
                                ? 'center'
                                : 'flex-start',

                            borderRadius: uiTokens.control.borderRadius,

                            color: active
                              ? 'primary.main'
                              : 'text.secondary',

                            transition:
                              'background-color 140ms ease, color 140ms ease',

                            // ACTIVE LEFT INDICATOR
                            '&::before': {
                              content: '""',

                              position:
                                'absolute',

                              left: 0,

                              top: 8,
                              bottom: 8,

                              width: 3,

                              borderRadius:
                                '0 4px 4px 0',

                              bgcolor:
                                'primary.main',

                              opacity: active ? 1 : 0,
                              transform: active ? 'scaleY(1)' : 'scaleY(0)',
                              transformOrigin: 'center',
                              transition: 'transform 180ms ease, opacity 180ms ease',
                              boxShadow: active
                                ? `0 0 6px ${theme.palette.primary.main}`
                                : 'none',
                            },

                            '&:hover': {
                              bgcolor:
                                'action.hover',

                              color:
                                'text.primary',

                              '& .MuiListItemIcon-root svg': {
                                transform: 'translateX(2px) scale(1.05)',
                              },
                            },

                            '&.Mui-selected': {
                              bgcolor:
                                theme.palette.mode ===
                                  'dark'
                                  ? 'rgba(59,130,246,0.14)'
                                  : 'rgba(37,99,235,0.08)',

                              color:
                                'primary.main',
                            },

                            '&.Mui-selected:hover': {
                              bgcolor:
                                theme.palette.mode ===
                                  'dark'
                                  ? 'rgba(59,130,246,0.18)'
                                  : 'rgba(37,99,235,0.12)',
                            },
                          })}
                        >

                          {/* ICON */}

                          <ListItemIcon
                            sx={{
                              minWidth:
                                collapsed
                                  ? 0
                                  : 32,

                              justifyContent:
                                'center',

                              color: 'inherit',

                              '& svg': {
                                fontSize: 18,
                                transform: 'translateX(0) scale(1)',
                                transition: iconTransition,
                              },
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>


                          {/* LABEL */}

                          <ListItemText
                            aria-hidden={collapsed}
                            primary={
                              item.label
                            }
                            sx={{
                              ml: collapsed ? 0 : 0.5,
                              maxWidth: collapsed ? 0 : 150,
                              opacity: collapsed ? 0 : 1,
                              overflow: 'hidden',
                              transform: collapsed ? 'translateX(-6px)' : 'translateX(0)',
                              transition: `${labelTransition}, max-width 180ms ease, margin 180ms ease`,
                            }}
                            slotProps={{
                              primary: {
                                noWrap: true,

                                sx: {
                                  fontSize: uiTokens.sidebar.menuFontSize,

                                  fontWeight:
                                    active
                                      ? 700
                                      : 500,
                                },
                              },
                            }}
                          />

                        </ListItemButton>
                      )


                      if (!collapsed) {
                        return (
                          <Box
                            key={
                              item.path
                            }
                          >
                            {menuButton}
                          </Box>
                        )
                      }


                      return (
                        <Tooltip
                          key={item.path}
                          title={item.label}
                          placement="right"
                          arrow
                        >
                          {menuButton}
                        </Tooltip>
                      )
                    },
                  )}
                </List>
              </Collapse>


              {/* separator collapsed */}

              {collapsed && (
                <Divider
                  sx={{
                    mx: 1,
                    mt: 0.75,
                  }}
                />
              )}

            </Box>
          )
        })}

      </Box>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Box
        aria-hidden={collapsed}
        sx={{
          maxHeight: collapsed ? 0 : 48,
          opacity: collapsed ? 0 : 1,
          overflow: 'hidden',
          transform: collapsed ? 'translateX(-6px)' : 'translateX(0)',
          transition: `${labelTransition}, max-height 180ms ease`,
        }}
      >
        <Divider />

        <Box
          sx={{
            px: 1.5,
            py: 1,
          }}
        >
          <Typography
            color="text.disabled"
            sx={{
              fontSize: uiTokens.sidebar.sectionFontSize,
            }}
          >
            Production Backlog System
          </Typography>
        </Box>
      </Box>

    </Box>
  )
}
