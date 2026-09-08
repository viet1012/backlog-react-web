import { useId } from 'react'
import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

export function FactoryNoRowsOverlay() {
    const uid = useId().replace(/:/g, '')
    const glassId = `factory-glass-${uid}`
    const glassShineId = `factory-glass-shine-${uid}`
    const machineFaceId = `factory-machine-face-${uid}`
    const floorId = `factory-floor-${uid}`
    const glowId = `factory-glow-${uid}`
    const beltClipId = `factory-belt-${uid}`
    const windowId = `factory-window-${uid}`
    const machiningClipId = `factory-machining-${uid}`

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                minHeight: 300,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                px: 2,
                color: 'text.secondary',
            }}
        >
            <Box
                sx={(theme) => ({
                    width: 'min(440px, 100%)',
                    aspectRatio: '440 / 230',
                    position: 'relative',
                    flexShrink: 0,
                    overflow: 'hidden',
                    borderRadius: 3,
                    isolation: 'isolate',

                    '--f-primary': theme.palette.primary.main,
                    '--f-primary-soft': alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.14),
                    '--f-primary-faint': alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.10 : 0.07),
                    '--f-line': alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.17 : 0.13),
                    '--f-line-strong': alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.34 : 0.25),
                    '--f-surface': theme.palette.mode === 'dark'
                        ? alpha(theme.palette.background.paper, 0.88)
                        : alpha(theme.palette.background.paper, 0.98),
                    '--f-surface-2': theme.palette.mode === 'dark'
                        ? alpha(theme.palette.common.white, 0.065)
                        : alpha(theme.palette.common.black, 0.032),
                    '--f-surface-3': theme.palette.mode === 'dark'
                        ? alpha(theme.palette.common.white, 0.11)
                        : alpha(theme.palette.common.black, 0.055),
                    '--f-worker': theme.palette.mode === 'dark'
                        ? alpha(theme.palette.common.white, 0.88)
                        : alpha(theme.palette.text.primary, 0.76),
                    '--f-worker-dark': theme.palette.mode === 'dark'
                        ? alpha(theme.palette.common.black, 0.36)
                        : alpha(theme.palette.common.black, 0.22),
                    '--f-glass': theme.palette.mode === 'dark'
                        ? alpha(theme.palette.info.light, 0.16)
                        : alpha(theme.palette.info.dark, 0.07),
                    '--f-shadow': theme.palette.mode === 'dark'
                        ? alpha(theme.palette.common.black, 0.38)
                        : alpha(theme.palette.common.black, 0.10),
                    '--f-success': theme.palette.success.main,

                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: '9% 7% 12%',
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.13 : 0.08)} 0%, transparent 68%)`,
                        filter: 'blur(18px)',
                        pointerEvents: 'none',
                        zIndex: -1,
                    },

                    '& .operator-arm': {
                        transformBox: 'fill-box',
                        transformOrigin: '6px 7px',
                        animation: 'operatorArm 6.8s cubic-bezier(.4,0,.2,1) infinite',
                    },
                    '& .operator-head': {
                        transformBox: 'fill-box',
                        transformOrigin: 'center bottom',
                        animation: 'operatorHead 6.8s ease-in-out infinite',
                    },
                    '& .operator-body': {
                        animation: 'operatorBody 6.8s ease-in-out infinite',
                    },
                    '& .spindle': {
                        animation: 'spindleMotion 6.2s ease-in-out infinite',
                    },
                    '& .workpiece': {
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                        animation: 'workpieceSpin 5.6s linear infinite',
                    },
                    '& .machine-glow': {
                        animation: 'machineGlow 6.2s ease-in-out infinite',
                    },
                    '& .panel-screen': {
                        animation: 'panelGlow 6.8s ease-in-out infinite',
                    },
                    '& .panel-scan': {
                        animation: 'panelScan 3.8s ease-in-out infinite',
                    },
                    '& .status-light': {
                        animation: 'statusGlow 5.8s ease-in-out infinite',
                    },
                    '& .belt-parts': {
                        animation: 'beltMove 7.6s linear infinite',
                    },
                    '& .belt-highlight': {
                        animation: 'beltHighlight 4.8s ease-in-out infinite',
                    },
                    '& .glass-shine': {
                        animation: 'glassShine 7.2s ease-in-out infinite',
                    },
                    '& .fan': {
                        transformBox: 'fill-box',
                        transformOrigin: 'center',
                        animation: 'fanSpin 7s linear infinite',
                    },

                    '@keyframes operatorArm': {
                        '0%, 16%, 100%': { transform: 'rotate(0deg)' },
                        '30%': { transform: 'rotate(-9deg)' },
                        '44%': { transform: 'rotate(2deg)' },
                        '58%': { transform: 'rotate(-6deg)' },
                        '74%': { transform: 'rotate(0deg)' },
                    },
                    '@keyframes operatorHead': {
                        '0%, 22%, 100%': { transform: 'rotate(0deg)' },
                        '36%, 58%': { transform: 'rotate(2deg)' },
                        '72%': { transform: 'rotate(-1deg)' },
                    },
                    '@keyframes operatorBody': {
                        '0%, 100%': { transform: 'translateY(0)' },
                        '45%': { transform: 'translateY(-0.8px)' },
                    },
                    '@keyframes spindleMotion': {
                        '0%, 12%, 100%': { transform: 'translateY(0)' },
                        '30%, 60%': { transform: 'translateY(10px)' },
                        '78%': { transform: 'translateY(3px)' },
                    },
                    '@keyframes workpieceSpin': {
                        from: { transform: 'rotate(0deg)' },
                        to: { transform: 'rotate(360deg)' },
                    },
                    '@keyframes machineGlow': {
                        '0%, 100%': { opacity: 0.18 },
                        '38%, 68%': { opacity: 0.46 },
                    },
                    '@keyframes panelGlow': {
                        '0%, 100%': { opacity: 0.78 },
                        '42%, 66%': { opacity: 1 },
                    },
                    '@keyframes panelScan': {
                        '0%, 18%': { transform: 'translateY(-7px)', opacity: 0 },
                        '32%': { opacity: 0.65 },
                        '70%': { opacity: 0.35 },
                        '86%, 100%': { transform: 'translateY(8px)', opacity: 0 },
                    },
                    '@keyframes statusGlow': {
                        '0%, 100%': { opacity: 0.58, filter: 'drop-shadow(0 0 0 transparent)' },
                        '45%, 70%': { opacity: 1, filter: 'drop-shadow(0 0 4px var(--f-success))' },
                    },
                    '@keyframes beltMove': {
                        from: { transform: 'translateX(0)' },
                        to: { transform: 'translateX(48px)' },
                    },
                    '@keyframes beltHighlight': {
                        '0%, 100%': { opacity: 0.12 },
                        '50%': { opacity: 0.35 },
                    },
                    '@keyframes glassShine': {
                        '0%, 12%': { transform: 'translateX(-45px)', opacity: 0 },
                        '28%': { opacity: 0.45 },
                        '45%': { transform: 'translateX(95px)', opacity: 0 },
                        '100%': { transform: 'translateX(95px)', opacity: 0 },
                    },
                    '@keyframes fanSpin': {
                        from: { transform: 'rotate(0deg)' },
                        to: { transform: 'rotate(360deg)' },
                    },
                    '@media (prefers-reduced-motion: reduce)': {
                        '& .operator-arm, & .operator-head, & .operator-body, & .spindle, & .workpiece, & .machine-glow, & .panel-screen, & .panel-scan, & .status-light, & .belt-parts, & .belt-highlight, & .glass-shine, & .fan': {
                            animation: 'none',
                        },
                    },
                })}
            >
                <svg
                    viewBox="0 0 440 230"
                    width="100%"
                    height="100%"
                    role="presentation"
                    aria-hidden="true"
                    focusable="false"
                    style={{ display: 'block' }}
                >
                    <defs>
                        <linearGradient id={glassId} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="var(--f-glass)" />
                            <stop offset="55%" stopColor="var(--f-primary-faint)" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                        <linearGradient id={glassShineId} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="50%" stopColor="var(--f-primary-soft)" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                        <linearGradient id={machineFaceId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--f-surface)" />
                            <stop offset="100%" stopColor="var(--f-surface-2)" />
                        </linearGradient>
                        <linearGradient id={floorId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--f-surface-2)" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="var(--f-primary-soft)" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                        <linearGradient id={windowId} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="var(--f-glass)" />
                            <stop offset="100%" stopColor="var(--f-primary-faint)" />
                        </linearGradient>
                        <clipPath id={beltClipId}>
                            <path d="M281 151H405L397 174H273Z" />
                        </clipPath>
                        <clipPath id={machiningClipId}>
                            <rect x="151" y="101" width="72" height="59" rx="4" />
                        </clipPath>
                    </defs>

                    {/* Ambient backdrop */}
                    <ellipse cx="222" cy="178" rx="176" ry="24" fill={`url(#${glowId})`} opacity="0.58" />

                    {/* Factory shell */}
                    <path d="M25 54H415V190H25Z" fill="var(--f-surface-2)" />
                    <path d="M25 190H415" stroke="var(--f-line-strong)" strokeWidth="1.5" />
                    <path d="M25 54H415M25 54V190M415 54V190" stroke="var(--f-line)" strokeWidth="1.1" />

                    {/* Roof trusses */}
                    <path
                        d="M38 54L83 31L128 54M135 54L180 31L225 54M232 54L277 31L322 54M329 54L374 31L410 50"
                        fill="none"
                        stroke="var(--f-line)"
                        strokeWidth="1.25"
                    />
                    <path d="M83 31H374" stroke="var(--f-line)" strokeWidth="1.1" />
                    {[83, 180, 277, 374].map((x) => (
                        <path key={x} d={`M${x} 31V54`} stroke="var(--f-line)" strokeWidth="0.8" opacity="0.8" />
                    ))}

                    {/* Windows */}
                    {[43, 101, 159, 217, 275, 333].map((x) => (
                        <g key={x}>
                            <rect x={x} y="67" width="42" height="27" rx="2.5" fill={`url(#${windowId})`} stroke="var(--f-line)" />
                            <path d={`M${x + 21} 67V94M${x} 80.5H${x + 42}`} stroke="var(--f-line)" strokeWidth="0.7" />
                        </g>
                    ))}

                    {/* Utility pipe + ventilation */}
                    <path d="M41 107H112V99H146" fill="none" stroke="var(--f-line-strong)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="69" cy="107" r="4.8" fill="var(--f-surface)" stroke="var(--f-line-strong)" />
                    <circle cx="98" cy="107" r="4.8" fill="var(--f-surface)" stroke="var(--f-line-strong)" />
                    <g transform="translate(374 105)">
                        <circle r="12" fill="var(--f-surface)" stroke="var(--f-line-strong)" />
                        <g className="fan">
                            <path d="M0-8C4-8 5-3 2 0C-1 2-3 0-3-2C-3-5-2-7 0-8Z" fill="var(--f-line-strong)" />
                            <path d="M8 0C8 4 3 5 0 2C-2-1 0-3 2-3C5-3 7-2 8 0Z" fill="var(--f-line-strong)" />
                            <path d="M0 8C-4 8-5 3-2 0C1-2 3 0 3 2C3 5 2 7 0 8Z" fill="var(--f-line-strong)" />
                            <path d="M-8 0C-8-4-3-5 0-2C2 1 0 3-2 3C-5 3-7 2-8 0Z" fill="var(--f-line-strong)" />
                        </g>
                        <circle r="2" fill="var(--f-primary)" opacity="0.7" />
                    </g>

                    {/* Perspective floor */}
                    <path d="M25 190L105 135H415V190Z" fill={`url(#${floorId})`} />
                    <path d="M70 190L137 142M137 190L185 142M204 190L233 142M271 190L281 142M338 190L329 142" stroke="var(--f-line)" strokeWidth="0.75" />
                    <path d="M60 176H405" stroke="var(--f-line)" strokeWidth="0.75" opacity="0.7" />
                    <path d="M46 185H400" stroke="var(--f-primary)" strokeWidth="1.5" strokeDasharray="14 9" opacity="0.28" />

                    {/* Machine shadow */}
                    <ellipse cx="205" cy="183" rx="78" ry="8" fill="var(--f-shadow)" />

                    {/* CNC 2.5D body */}
                    <g>
                        {/* right side face */}
                        <path d="M253 92L266 101V167L253 176Z" fill="var(--f-surface-3)" stroke="var(--f-line-strong)" strokeWidth="1.2" />
                        {/* top face */}
                        <path d="M140 92L153 82H253L266 101L253 106H140Z" fill="var(--f-primary-faint)" stroke="var(--f-line)" strokeWidth="1" />
                        {/* front */}
                        <path d="M140 92H253V176H140Z" fill={`url(#${machineFaceId})`} stroke="var(--f-line-strong)" strokeWidth="1.5" />
                        <path d="M140 92H253V99H140Z" fill="var(--f-primary-faint)" />

                        {/* CNC door */}
                        <rect x="150" y="101" width="73" height="59" rx="4" fill={`url(#${glassId})`} stroke="var(--f-line-strong)" strokeWidth="1.2" />
                        <path d="M186.5 101V160" stroke="var(--f-line)" strokeWidth="1" />
                        <path d="M154 105H218" stroke="var(--f-primary)" strokeWidth="0.8" opacity="0.35" />

                        {/* moving glass sheen */}
                        <g clipPath={`url(#${machiningClipId})`}>
                            <rect className="glass-shine" x="146" y="98" width="28" height="67" transform="skewX(-15)" fill={`url(#${glassShineId})`} opacity="0" />
                        </g>

                        {/* machining zone */}
                        <g clipPath={`url(#${machiningClipId})`}>
                            <ellipse className="machine-glow" cx="180" cy="144" rx="29" ry="13" fill="var(--f-primary-soft)" opacity="0.2" />
                            <g className="spindle">
                                <rect x="174" y="106" width="9" height="18" rx="2" fill="var(--f-worker)" />
                                <path d="M172 123H185L181 132H176Z" fill="var(--f-primary)" opacity="0.9" />
                            </g>
                            <g className="workpiece">
                                <circle cx="179" cy="145" r="9" fill="none" stroke="var(--f-primary)" strokeWidth="2.2" strokeDasharray="5 3" />
                                <circle cx="179" cy="145" r="3" fill="var(--f-line-strong)" />
                            </g>
                            <rect x="164" y="154" width="31" height="4" rx="2" fill="var(--f-line-strong)" />
                            <path d="M161 157H198" stroke="var(--f-line)" strokeWidth="1" />
                        </g>

                        {/* control panel */}
                        <path d="M228 104H247L252 108V149H228Z" fill="var(--f-surface-2)" stroke="var(--f-line-strong)" />
                        <rect className="panel-screen" x="232" y="110" width="15" height="11" rx="1.8" fill="var(--f-primary-soft)" stroke="var(--f-primary)" strokeWidth="0.8" />
                        <rect className="panel-scan" x="233.5" y="113" width="12" height="1.3" rx="0.65" fill="var(--f-primary)" opacity="0.5" />
                        <circle cx="233.5" cy="130" r="2.3" fill="var(--f-success)" opacity="0.8" />
                        <circle cx="241" cy="130" r="2.3" fill="var(--f-line-strong)" />
                        <circle cx="247" cy="138" r="2.6" fill="var(--f-primary)" opacity="0.78" />
                        <rect x="233" y="141.5" width="12" height="3" rx="1.5" fill="var(--f-line-strong)" />

                        {/* lower housing */}
                        <path d="M148 164H245V172H148Z" fill="var(--f-surface-3)" />
                        <rect x="154" y="172" width="20" height="7" rx="1.5" fill="var(--f-line)" />
                        <rect x="222" y="172" width="20" height="7" rx="1.5" fill="var(--f-line)" />

                        {/* status tower */}
                        <rect x="245" y="72" width="5" height="12" rx="1" fill="var(--f-line-strong)" />
                        <rect x="243.5" y="66" width="8" height="8" rx="2" fill="var(--f-surface-3)" stroke="var(--f-line)" />
                        <circle className="status-light" cx="247.5" cy="70" r="3.2" fill="var(--f-success)" />
                    </g>

                    {/* Operator shadow */}
                    <ellipse cx="105" cy="181" rx="24" ry="5" fill="var(--f-shadow)" />

                    {/* Operator with PPE */}
                    <g className="operator-body">
                        <g className="operator-head">
                            <circle cx="106" cy="111" r="8" fill="var(--f-worker)" />
                            <path d="M97 109Q106 98 116 109V112H97Z" fill="var(--f-primary)" />
                            <path d="M98 108H116" stroke="var(--f-primary)" strokeWidth="2" strokeLinecap="round" />
                            <path d="M113 111Q116 113 115 117" fill="none" stroke="var(--f-worker-dark)" strokeWidth="1.2" strokeLinecap="round" />
                        </g>

                        {/* torso / vest */}
                        <path d="M94 122Q105 116 117 123L115 153H96Z" fill="var(--f-worker)" />
                        <path d="M96 126H116L115 141H97Z" fill="var(--f-primary-soft)" />
                        <path d="M103 123V151M110 123V151" stroke="var(--f-primary)" strokeWidth="1.6" opacity="0.65" />
                        <path d="M97 137H115" stroke="var(--f-primary)" strokeWidth="2.4" opacity="0.72" />

                        {/* left arm */}
                        <path d="M96 126L86 142" fill="none" stroke="var(--f-worker)" strokeWidth="6" strokeLinecap="round" />
                        <circle cx="85" cy="143" r="3.2" fill="var(--f-worker)" />

                        {/* right operating arm */}
                        <g className="operator-arm">
                            <path d="M115 126L128 137L141 131" fill="none" stroke="var(--f-worker)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="142" cy="131" r="3.2" fill="var(--f-worker)" />
                        </g>

                        {/* legs */}
                        <path d="M101 152L97 176M111 152L115 176" stroke="var(--f-worker)" strokeWidth="6.5" strokeLinecap="round" />
                        <path d="M91 177H100M112 177H121" stroke="var(--f-line-strong)" strokeWidth="5.5" strokeLinecap="round" />
                    </g>

                    {/* Conveyor shadow */}
                    <ellipse cx="337" cy="183" rx="72" ry="7" fill="var(--f-shadow)" />

                    {/* Perspective conveyor */}
                    <g>
                        <path d="M276 146H407L399 178H267Z" fill="var(--f-surface)" stroke="var(--f-line-strong)" strokeWidth="1.3" />
                        <path d="M281 151H405L397 174H273Z" fill="var(--f-surface-2)" />
                        <path className="belt-highlight" d="M279 154H402" stroke="var(--f-primary)" strokeWidth="1" opacity="0.18" />
                        <path d="M276 166H401" stroke="var(--f-line)" strokeWidth="1" />

                        {[286, 307, 328, 349, 370, 391].map((x) => (
                            <ellipse key={x} cx={x} cy="165" rx="6.4" ry="4.2" fill="none" stroke="var(--f-line-strong)" strokeWidth="1.1" />
                        ))}

                        <g clipPath={`url(#${beltClipId})`}>
                            <g className="belt-parts">
                                {[-48, 0, 48, 96, 144].map((offset) => (
                                    <g key={offset} transform={`translate(${274 + offset} 0)`}>
                                        <path d="M0 153H22L19 166H-3Z" fill="var(--f-primary-soft)" stroke="var(--f-primary)" strokeWidth="1" />
                                        <circle cx="9" cy="160" r="3.2" fill="var(--f-surface)" stroke="var(--f-primary)" strokeWidth="1" />
                                    </g>
                                ))}
                            </g>
                        </g>

                        <path d="M282 178L278 187M392 178L396 187" stroke="var(--f-line-strong)" strokeWidth="3" strokeLinecap="round" />
                    </g>

                    {/* Foreground floor accents */}
                    <path d="M47 194H392" stroke="var(--f-line)" strokeWidth="0.9" opacity="0.55" />
                    <circle cx="64" cy="194" r="2" fill="var(--f-primary)" opacity="0.38" />
                    <circle cx="383" cy="194" r="2" fill="var(--f-primary)" opacity="0.38" />
                </svg>
            </Box>

            <Typography
                sx={{
                    mt: 0.85,
                    fontSize: 15,
                    fontWeight: 750,
                    letterSpacing: '-0.01em',
                    color: 'text.primary',
                    textAlign: 'center',
                }}
            >
                Không có dữ liệu
            </Typography>

            <Typography
                variant="caption"
                sx={{
                    mt: 0.25,
                    color: 'text.secondary',
                    textAlign: 'center',
                    opacity: 0.78,
                }}
            >
                Dữ liệu sẽ hiển thị tại đây khi có kết quả phù hợp.
            </Typography>
        </Box>
    )
}
