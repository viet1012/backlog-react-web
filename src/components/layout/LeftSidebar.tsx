import {
  Box,
  Collapse,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

interface MenuItemConfig {
  label: string
  path: string
  icon: string
}

interface MenuGroupConfig {
  id: string
  label: string
  items: MenuItemConfig[]
}

const menuGroups: MenuGroupConfig[] = [
  {
    id: 'order-control',
    label: 'ORDER CONTROL',
    items: [
      { label: 'Backlog Detail', path: '/backlog', icon: 'B' },
      { label: 'ODBF', path: '/odbf', icon: 'O' },
    ],
  },
  {
    id: 'shipping',
    label: 'SHIPPING',
    items: [
      { label: 'Shipment', path: '/shipment', icon: 'H' },
      { label: 'Export List', path: '/export-list', icon: 'E' },
      { label: 'Sales Status', path: '/sales-status', icon: 'S' },
    ],
  },
]

export function LeftSidebar() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'order-control': true,
    shipping: true,
  })

  return (
    <Box
      component="aside"
      sx={(theme) => ({
        width: collapsed ? 56 : 220,
        height: '100vh',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor:
          theme.palette.mode === 'dark'
            ? 'rgba(15,23,42,0.82)'
            : 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(14px)',
        borderRight: `1px solid ${theme.palette.divider}`,
        boxShadow: '4px 0 24px rgba(15,23,42,0.06)',
        transition: 'width 180ms ease',
      })}
    >
      <Box
        sx={{
          height: 64,
          px: collapsed ? 1 : 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }} noWrap>
              Production Control
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Factory operations
            </Typography>
          </Box>
        )}
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          <IconButton
            size="small"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '\u203a' : '\u2039'}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {menuGroups.map((group) => {
          const groupOpen = openGroups[group.id]

          return (
            <Box key={group.id} sx={{ mb: 1 }}>
              {!collapsed && (
                <ListItemButton
                  onClick={() =>
                    setOpenGroups((current) => ({
                      ...current,
                      [group.id]: !current[group.id],
                    }))
                  }
                  sx={{ minHeight: 32, px: 1.75, py: 0.5 }}
                >
                  <ListItemText
                    primary={group.label}
                    slotProps={{
                      primary: {
                        variant: 'caption',
                        sx: {
                          fontWeight: 700,
                          color: 'text.secondary',
                        },
                      },
                    }}
                  />
                  <Typography variant="caption">
                    {groupOpen ? '\u2303' : '\u2304'}
                  </Typography>
                </ListItemButton>
              )}

              <Collapse in={collapsed || groupOpen} timeout="auto">
                <List disablePadding>
                  {group.items.map((item) => {
                    const active = location.pathname === item.path

                    return (
                      <Tooltip
                        key={item.path}
                        title={collapsed ? item.label : ''}
                        placement="right"
                      >
                        <ListItemButton
                          component={NavLink}
                          to={item.path}
                          selected={active}
                          sx={{
                            minHeight: 40,
                            mx: 0.75,
                            mb: 0.25,
                            px: collapsed ? 1 : 1.25,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            borderRadius: 2,
                            '&.Mui-selected': {
                              color: 'primary.main',
                              bgcolor: 'rgba(59,130,246,0.12)',
                            },
                          }}
                        >
                          <Box
                            aria-hidden
                            sx={{
                              width: 26,
                              height: 26,
                              flex: '0 0 auto',
                              display: 'grid',
                              placeItems: 'center',
                              borderRadius: 1.5,
                              fontSize: 12,
                              fontWeight: 800,
                              bgcolor: active
                                ? 'rgba(59,130,246,0.16)'
                                : 'action.hover',
                            }}
                          >
                            {item.icon}
                          </Box>
                          {!collapsed && (
                            <ListItemText
                              primary={item.label}
                              sx={{ ml: 1.25 }}
                              slotProps={{
                                primary: {
                                  variant: 'body2',
                                  noWrap: true,
                                  sx: { fontWeight: active ? 700 : 500 },
                                },
                              }}
                            />
                          )}
                        </ListItemButton>
                      </Tooltip>
                    )
                  })}
                </List>
              </Collapse>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}
