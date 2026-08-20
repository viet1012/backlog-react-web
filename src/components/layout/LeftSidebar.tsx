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
  ExpandLessRounded,
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

        bgcolor:
          theme.palette.mode === 'dark'
            ? 'rgba(12, 20, 34, 0.96)'
            : 'rgba(250, 252, 255, 0.96)',

        borderRight:
          `1px solid ${theme.palette.divider}`,

        boxShadow:
          theme.palette.mode === 'dark'
            ? '4px 0 18px rgba(0,0,0,0.16)'
            : '4px 0 18px rgba(15,23,42,0.04)',

        transition:
          'width 180ms ease',

        zIndex: 10,
      })}
    >

      {/* =====================================================
          BRAND / HEADER
      ===================================================== */}

      <Box
        sx={{
          height: 58,

          px: collapsed ? 1 : 1.5,

          display: 'flex',
          alignItems: 'center',

          justifyContent:
            collapsed
              ? 'center'
              : 'space-between',

          flexShrink: 0,
        }}
      >

        {!collapsed && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,

              minWidth: 0,
            }}
          >

            {/* LOGO */}

            <Box
              sx={{
                width: 32,
                height: 32,

                display: 'grid',
                placeItems: 'center',

                flexShrink: 0,

                borderRadius: 1.5,

                bgcolor: 'primary.main',
                color: 'primary.contrastText',

                '& svg': {
                  fontSize: 19,
                },
              }}
            >
              <FactoryOutlined />
            </Box>


            {/* TITLE */}

            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{
                  fontSize: 13,
                  fontWeight: 800,
                  lineHeight: 1.25,
                }}
              >
                Production Control
              </Typography>

              <Typography
                noWrap
                color="text.secondary"
                sx={{
                  mt: 0.15,
                  fontSize: 10,
                  lineHeight: 1.2,
                }}
              >
                Factory Operations
              </Typography>
            </Box>
          </Box>
        )}


        {/* COLLAPSE BUTTON */}

        <Tooltip
          title={
            collapsed
              ? 'Expand sidebar'
              : 'Collapse sidebar'
          }
          placement="right"
        >
          <IconButton
            size="small"
            onClick={() =>
              setCollapsed(
                (value) => !value,
              )
            }
            sx={{
              width: 28,
              height: 28,

              border: '1px solid',
              borderColor: 'divider',

              bgcolor: 'action.hover',

              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            {collapsed
              ? (
                <ChevronRightRounded
                  fontSize="small"
                />
              )
              : (
                <ChevronLeftRounded
                  fontSize="small"
                />
              )}
          </IconButton>
        </Tooltip>
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
            borderRadius: 10,
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

              {!collapsed && (
                <ListItemButton
                  onClick={() =>
                    toggleGroup(group.id)
                  }
                  sx={{
                    minHeight: 30,

                    mx: 0.75,
                    px: 1,
                    py: 0.25,

                    borderRadius: 1.5,

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
                          fontSize: 9.5,
                          fontWeight: 800,

                          letterSpacing:
                            '0.08em',

                          color:
                            'text.secondary',
                        },
                      },
                    }}
                  />

                  {groupOpen
                    ? (
                      <ExpandLessRounded
                        sx={{
                          fontSize: 16,
                          color:
                            'text.secondary',
                        }}
                      />
                    )
                    : (
                      <ExpandMoreRounded
                        sx={{
                          fontSize: 16,
                          color:
                            'text.secondary',
                        }}
                      />
                    )}
                </ListItemButton>
              )}


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

                            borderRadius: 1.5,

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
                                active
                                  ? 'primary.main'
                                  : 'transparent',
                            },

                            '&:hover': {
                              bgcolor:
                                'action.hover',

                              color:
                                'text.primary',
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
                              },
                            }}
                          >
                            {item.icon}
                          </ListItemIcon>


                          {/* LABEL */}

                          {!collapsed && (
                            <ListItemText
                              primary={
                                item.label
                              }
                              sx={{
                                ml: 0.5,
                              }}
                              slotProps={{
                                primary: {
                                  noWrap: true,

                                  sx: {
                                    fontSize: 12,

                                    fontWeight:
                                      active
                                        ? 700
                                        : 500,
                                  },
                                },
                              }}
                            />
                          )}

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

      {!collapsed && (
        <>
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
                fontSize: 9.5,
              }}
            >
              Production Backlog System
            </Typography>
          </Box>
        </>
      )}

    </Box>
  )
}