import {
    Box,
    type BoxProps,
} from '@mui/material'

import {
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react'


interface RevealOnScrollProps
    extends Omit<BoxProps, 'children'> {

    children: ReactNode

    delay?: number

    duration?: number

    distance?: number

    scale?: number

    once?: boolean
}


export function RevealOnScroll({
    children,

    delay = 0,

    duration = 460,

    distance = 12,

    scale = 1,

    once = true,

    sx,

    ...boxProps
}: RevealOnScrollProps) {

    const ref =
        useRef<HTMLDivElement | null>(
            null,
        )


    const supportsObserver =
        typeof window !== 'undefined'
        && 'IntersectionObserver' in window


    const [
        visible,
        setVisible,
    ] =
        useState(
            !supportsObserver,
        )


    useEffect(() => {

        const element =
            ref.current


        if (!element) {
            return
        }


        if (
            typeof window === 'undefined'
            || !('IntersectionObserver' in window)
        ) {

            setVisible(true)

            return
        }


        const observer =
            new IntersectionObserver(
                (entries) => {

                    const entry =
                        entries[0]


                    if (!entry) {
                        return
                    }


                    if (
                        entry.isIntersecting
                    ) {

                        setVisible(true)


                        if (once) {
                            observer.disconnect()
                        }

                    } else if (!once) {

                        setVisible(false)
                    }
                },
                {
                    threshold: 0.12,

                    rootMargin:
                        '0px 0px -6% 0px',
                },
            )


        observer.observe(
            element,
        )


        return () =>
            observer.disconnect()

    }, [
        once,
    ])


    return (
        <Box
            ref={ref}

            {...boxProps}

            sx={[
                {
                    opacity:
                        visible
                            ? 1
                            : 0,

                    transform:
                        visible
                            ? 'translate3d(0, 0, 0) scale(1)'
                            : `translate3d(0, ${distance}px, 0) scale(${scale})`,

                    transition: [
                        `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
                        `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
                    ].join(', '),

                    willChange:
                        visible
                            ? 'auto'
                            : 'opacity, transform',

                    '@media (prefers-reduced-motion: reduce)': {
                        opacity: 1,

                        transform: 'none',

                        transition: 'none',

                        willChange: 'auto',
                    },
                },

                ...(Array.isArray(sx)
                    ? sx
                    : [sx]),
            ]}
        >
            {children}
        </Box>
    )
}