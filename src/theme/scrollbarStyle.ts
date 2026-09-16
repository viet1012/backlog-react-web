export const appScrollbarSx = {
    scrollbarWidth: 'auto',

    scrollbarColor:
        'rgba(148, 163, 184, 0.65) transparent',

    '&::-webkit-scrollbar': {
        width: 18,
        height: 18,
    },

    '&::-webkit-scrollbar-track': {
        backgroundColor:
            'rgba(148, 163, 184, 0.08)',
    },

    '&::-webkit-scrollbar-thumb': {
        backgroundColor:
            'rgba(148, 163, 184, 0.65)',

        borderRadius: 999,

        // 3px -> 2px để phần kéo nhìn dày hơn
        border:
            '2px solid transparent',

        backgroundClip:
            'padding-box',
    },

    '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor:
            'rgba(148, 163, 184, 0.90)',

        backgroundClip:
            'padding-box',
    },
} as const