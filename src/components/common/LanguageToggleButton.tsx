import { Box, Tooltip } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { useI18n } from '../../i18n/useI18n'
import type { Language } from '../../utils/uiPreferences'

const options: Language[] = ['vi', 'en']

interface LanguageToggleButtonProps {
    /** `glass` for dark photographic backgrounds such as the login page. */
    tone?: 'surface' | 'glass'
}

export function LanguageToggleButton({ tone = 'surface' }: LanguageToggleButtonProps) {
    const { language, toggleLanguage, t } = useI18n()
    const activeIndex = options.indexOf(language)

    return (
        <Tooltip title={t.language.switchTo}>
            <Box
                component="button"
                type="button"
                onClick={toggleLanguage}
                aria-label={t.language.switchTo}
                sx={(theme) => {
                    const glass = tone === 'glass'

                    return {
                        position: 'relative',
                        display: 'inline-grid',
                        gridTemplateColumns: '1fr 1fr',
                        alignItems: 'center',
                        flexShrink: 0,
                        width: 68,
                        height: 34,
                        p: '3px',
                        borderRadius: '34px',
                        border: '1px solid',
                        borderColor: glass ? 'rgba(132,207,255,0.26)' : 'divider',
                        bgcolor: glass
                            ? 'rgba(8,30,52,0.35)'
                            : theme.palette.action.hover,
                        backdropFilter: glass ? 'blur(12px)' : 'none',
                        cursor: 'pointer',
                        font: 'inherit',

                        '&:focus-visible': {
                            outline: `2px solid ${theme.palette.primary.main}`,
                            outlineOffset: 2,
                        },

                        '& .lang-thumb': {
                            position: 'absolute',
                            top: 3,
                            bottom: 3,
                            left: 3,
                            width: 'calc(50% - 3px)',
                            borderRadius: '30px',
                            bgcolor: glass ? 'rgba(120,206,255,0.9)' : 'primary.main',
                            boxShadow: `0 2px 6px ${alpha(theme.palette.primary.main, 0.35)}`,
                            transform: `translateX(${activeIndex * 100}%)`,
                            transition: 'transform 220ms cubic-bezier(0.2, 0, 0, 1)',
                        },

                        '& .lang-option': {
                            position: 'relative',
                            zIndex: 1,
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            lineHeight: 1,
                            textAlign: 'center',
                            color: glass ? 'rgba(220,238,255,0.72)' : 'text.secondary',
                            transition: 'color 200ms ease',
                        },

                        '& .lang-option.is-active': {
                            color: glass ? '#06223a' : theme.palette.primary.contrastText,
                        },

                        '@media (prefers-reduced-motion: reduce)': {
                            '& .lang-thumb, & .lang-option': { transition: 'none' },
                        },
                    }
                }}
            >
                <span className="lang-thumb" aria-hidden />
                {options.map((option) => (
                    <span
                        key={option}
                        className={`lang-option${option === language ? ' is-active' : ''}`}
                        aria-hidden
                    >
                        {option.toUpperCase()}
                    </span>
                ))}
            </Box>
        </Tooltip>
    )
}
