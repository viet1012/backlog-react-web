import { Box, Typography, useMediaQuery } from '@mui/material'
import { keyframes } from '@mui/material/styles'

import { getAuthSession, getAuthenticatedUsername } from '../../../services/authService'
import { useI18n } from '../../../i18n/useI18n'
import { FactoryAvatar } from '../../layout/FactoryAvatar'
import { getDayPeriod, monoFont } from '../../shift/shiftParts'
import { readAvatarSeed } from '../../shift/workerCharacter'

/*
 * Thẻ nhân viên treo dây đeo, đung đưa nhẹ quanh điểm treo phía trên.
 * Avatar dùng chung seed với sidebar.
 */
const LANYARD = 240

const badgeSway = keyframes`
  0%, 100% { transform: rotate(-1.4deg); }
  50%      { transform: rotate(1.4deg); }
`

export function UserHomeIdBadge() {
  const { t } = useI18n()
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const session = getAuthSession()
  const username = getAuthenticatedUsername() ?? t.sidebar.fallbackUser
  const displayName = session?.name || session?.employeeId || 'User'
  const roles = session?.roles.length ? session.roles : ['USER']

  // Chỉ hiện các trường HR có dữ liệu
  const details = [
    { label: t.userHome.factory, value: session?.fac },
    { label: t.userHome.department, value: session?.dept },
    { label: t.userHome.section, value: session?.section },
    { label: t.userHome.line, value: session?.line },
    { label: t.userHome.group, value: session?.group },
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail.value))

  return (
    <Box
      sx={{
        position: 'relative',
        width: { xs: '100%', sm: 270 },
        flexShrink: 0,
        transformOrigin: `50% -${LANYARD}px`,
        animation: `${badgeSway} 5.5s ease-in-out infinite`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    >
      {/* Dây đeo + kẹp kim loại */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          width: 12,
          height: LANYARD,
          transform: 'translateX(-50%)',
          background: 'linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%)',
          // Màn hẹp: thẻ rớt xuống dưới bảng LED, dây sẽ đè lên bảng
          display: { xs: 'none', sm: 'block' },
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          width: 22,
          height: 14,
          transform: 'translate(-50%, 4px)',
          borderRadius: '4px',
          background: 'linear-gradient(180deg, #d9dee5 0%, #8d97a3 100%)',
          border: '1px solid rgba(0, 0, 0, 0.35)',
          zIndex: 1,
        }}
      />

      <Box
        sx={{
          overflow: 'hidden',
          borderRadius: '12px',
          bgcolor: '#f7f9fc',
          color: '#17212d',
          border: '1px solid rgba(20, 30, 45, 0.25)',
          boxShadow: '0 16px 30px rgba(0, 0, 0, 0.32)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.4,
            py: 0.55,
            background: 'linear-gradient(90deg, #1d4ed8 0%, #0ea5e9 100%)',
            color: '#fff',
          }}
        >
          <Typography sx={{ fontSize: 9.5, fontWeight: 900, letterSpacing: '0.18em' }}>{t.userHome.brand}</Typography>
          {/* Khe xỏ dây */}
          <Box sx={{ width: 26, height: 6, borderRadius: 999, bgcolor: 'rgba(255, 255, 255, 0.55)' }} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.2, px: 1.4, pt: 1.1, pb: 1.2 }}>
          <Box sx={{ flexShrink: 0, p: 0.4, borderRadius: '10px', bgcolor: '#e3eaf3', border: '1px solid rgba(20, 30, 45, 0.12)' }}>
            <FactoryAvatar seed={readAvatarSeed(username)} size={52} period={getDayPeriod(new Date())} animate={!reduceMotion} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 800, lineHeight: 1.2 }}>{displayName}</Typography>
            <Typography sx={{ mt: 0.2, fontFamily: monoFont, fontSize: 12, fontWeight: 700, color: '#47566a' }}>
              {t.userHome.employeeId}: {session?.employeeId ?? '—'}
            </Typography>
            <Box sx={{ mt: 0.6, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {roles.map((role) => (
                <Box key={role} sx={{ px: 0.7, py: 0.1, borderRadius: '4px', fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', color: '#1d4ed8', bgcolor: 'rgba(29, 78, 216, 0.1)', border: '1px solid rgba(29, 78, 216, 0.25)' }}>
                  {role}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {details.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: 1.2,
              rowGap: 0.3,
              px: 1.4,
              py: 0.8,
              borderTop: '1px dashed rgba(20, 30, 45, 0.18)',
              bgcolor: '#eef2f7',
              // Màn hình thấp: nhường chỗ cho kệ hàng
              '@media (max-height: 820px)': { display: 'none' },
            }}
          >
            {details.map((detail) => (
              <Typography key={detail.label} noWrap sx={{ fontSize: 11, color: '#5a6879' }}>
                {detail.label}: <Box component="span" sx={{ fontWeight: 800, color: '#17212d' }}>{detail.value}</Box>
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}
