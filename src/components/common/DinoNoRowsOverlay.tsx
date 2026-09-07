// DinoNoRowsOverlay.tsx

import {
    Box,
    Typography,
} from '@mui/material'

export function DinoNoRowsOverlay() {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                minHeight: 280,

                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',

                overflow: 'hidden',

                color: 'text.secondary',
            }}
        >
            {/* =====================================================
          SCENE
      ===================================================== */}

            <Box
                sx={{
                    position: 'relative',

                    width: 360,
                    height: 120,

                    overflow: 'hidden',

                    borderRadius: 2,
                }}
            >
                {/* =================================================
            CLOUD 1
        ================================================= */}

                <Box
                    sx={{
                        position: 'absolute',

                        top: 16,
                        right: -70,

                        fontSize: 24,
                        opacity: 0.45,

                        animation:
                            'cloudMove1 7s linear infinite',

                        '@keyframes cloudMove1': {
                            '0%': {
                                transform:
                                    'translateX(0)',
                            },

                            '100%': {
                                transform:
                                    'translateX(-460px)',
                            },
                        },
                    }}
                >
                    ☁️
                </Box>


                {/* =================================================
            CLOUD 2
        ================================================= */}

                <Box
                    sx={{
                        position: 'absolute',

                        top: 34,
                        right: -130,

                        fontSize: 18,
                        opacity: 0.25,

                        animation:
                            'cloudMove2 10s linear infinite',

                        animationDelay: '2s',

                        '@keyframes cloudMove2': {
                            '0%': {
                                transform:
                                    'translateX(0)',
                            },

                            '100%': {
                                transform:
                                    'translateX(-520px)',
                            },
                        },
                    }}
                >
                    ☁️
                </Box>


                {/* =================================================
            GROUND
        ================================================= */}

                <Box
                    sx={{
                        position: 'absolute',

                        left: 0,
                        right: 0,

                        bottom: 24,

                        height: 2,

                        bgcolor: 'divider',

                        overflow: 'hidden',
                    }}
                >
                    <Box
                        sx={{
                            position: 'absolute',

                            top: 0,
                            left: 0,

                            width: '200%',
                            height: '100%',

                            backgroundImage:
                                'repeating-linear-gradient(90deg, currentColor 0 10px, transparent 10px 22px)',

                            color: 'text.disabled',

                            opacity: 0.5,

                            animation:
                                'groundMove 0.65s linear infinite',

                            '@keyframes groundMove': {
                                '0%': {
                                    transform:
                                        'translateX(0)',
                                },

                                '100%': {
                                    transform:
                                        'translateX(-32px)',
                                },
                            },
                        }}
                    />
                </Box>


                {/* =================================================
            DUST
        ================================================= */}

                <Box
                    sx={{
                        position: 'absolute',

                        left: 46,
                        bottom: 22,

                        width: 6,
                        height: 6,

                        borderRadius: '50%',

                        bgcolor: 'text.disabled',

                        opacity: 0,

                        animation:
                            'dust1 0.8s linear infinite',

                        '@keyframes dust1': {
                            '0%': {
                                transform:
                                    'translate(0, 0) scale(0.6)',
                                opacity: 0,
                            },

                            '25%': {
                                opacity: 0.35,
                            },

                            '100%': {
                                transform:
                                    'translate(-28px, -12px) scale(1.4)',
                                opacity: 0,
                            },
                        },
                    }}
                />

                <Box
                    sx={{
                        position: 'absolute',

                        left: 52,
                        bottom: 21,

                        width: 4,
                        height: 4,

                        borderRadius: '50%',

                        bgcolor: 'text.disabled',

                        opacity: 0,

                        animation:
                            'dust2 0.9s linear infinite',

                        animationDelay: '0.2s',

                        '@keyframes dust2': {
                            '0%': {
                                transform:
                                    'translate(0, 0) scale(0.5)',
                                opacity: 0,
                            },

                            '25%': {
                                opacity: 0.25,
                            },

                            '100%': {
                                transform:
                                    'translate(-22px, -10px) scale(1.2)',
                                opacity: 0,
                            },
                        },
                    }}
                />


                {/* =================================================
            DINO
        ================================================= */}

                <Box
                    sx={{
                        position: 'absolute',

                        left: 58,
                        bottom: 26,

                        fontSize: 46,

                        lineHeight: 1,

                        transformOrigin:
                            '50% 100%',

                        userSelect: 'none',

                        animation:
                            'dinoMotion 2.4s ease-in-out infinite',

                        '@keyframes dinoMotion': {
                            '0%': {
                                transform:
                                    'translateY(0) rotate(0deg)',
                            },

                            '8%': {
                                transform:
                                    'translateY(-2px) rotate(-1deg)',
                            },

                            '16%': {
                                transform:
                                    'translateY(0) rotate(1deg)',
                            },

                            '24%': {
                                transform:
                                    'translateY(-2px) rotate(-1deg)',
                            },

                            '32%': {
                                transform:
                                    'translateY(0) rotate(0deg)',
                            },

                            // jump
                            '48%': {
                                transform:
                                    'translateY(0)',
                            },

                            '58%': {
                                transform:
                                    'translateY(-28px) rotate(-3deg)',
                            },

                            '68%': {
                                transform:
                                    'translateY(-34px) rotate(0deg)',
                            },

                            '78%': {
                                transform:
                                    'translateY(-18px) rotate(2deg)',
                            },

                            '88%': {
                                transform:
                                    'translateY(0) rotate(0deg)',
                            },

                            '100%': {
                                transform:
                                    'translateY(0)',
                            },
                        },
                    }}
                >
                    🦖
                </Box>


                {/* =================================================
            CACTUS 1
        ================================================= */}

                <Box
                    sx={{
                        position: 'absolute',

                        bottom: 26,
                        right: -40,

                        fontSize: 31,

                        lineHeight: 1,

                        animation:
                            'cactusMove1 2.4s linear infinite',

                        '@keyframes cactusMove1': {
                            '0%': {
                                transform:
                                    'translateX(0)',
                            },

                            '100%': {
                                transform:
                                    'translateX(-440px)',
                            },
                        },
                    }}
                >
                    🌵
                </Box>


                {/* =================================================
            CACTUS 2
        ================================================= */}

                <Box
                    sx={{
                        position: 'absolute',

                        bottom: 26,
                        right: -120,

                        fontSize: 24,

                        lineHeight: 1,

                        animation:
                            'cactusMove2 3.7s linear infinite',

                        animationDelay: '1.2s',

                        '@keyframes cactusMove2': {
                            '0%': {
                                transform:
                                    'translateX(0)',
                            },

                            '100%': {
                                transform:
                                    'translateX(-520px)',
                            },
                        },
                    }}
                >
                    🌵
                </Box>
            </Box>


            {/* =====================================================
          TEXT
      ===================================================== */}

            <Typography
                sx={{
                    mt: 0.75,

                    fontSize: 15,
                    fontWeight: 700,

                    color: 'text.primary',
                }}
            >
                Không có dữ liệu
            </Typography>

            <Typography
                variant="caption"

                sx={{
                    mt: 0.2,

                    color: 'text.secondary',

                    textAlign: 'center',
                }}
            >

            </Typography>
        </Box>
    )
}