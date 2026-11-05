import { useCallback, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'

import dayjs from 'dayjs'
import 'dayjs/locale/vi'

import { loadLanguage, saveLanguage } from '../utils/uiPreferences'
import {
    DEFAULT_LANGUAGE,
    dictionaries,
    I18nContext,
    setCurrentLanguage,
    type I18nValue,
    type Language,
} from './i18nContext'

function applyLanguage(language: Language) {
    setCurrentLanguage(language)
    dayjs.locale(language)
    document.documentElement.lang = language
}

export function I18nProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        const initial = loadLanguage(DEFAULT_LANGUAGE)
        applyLanguage(initial)
        return initial
    })

    useLayoutEffect(() => {
        applyLanguage(language)
    }, [language])

    const setLanguage = useCallback((next: Language) => {
        saveLanguage(next)
        setLanguageState(next)
    }, [])

    const toggleLanguage = useCallback(() => {
        setLanguage(language === 'vi' ? 'en' : 'vi')
    }, [language, setLanguage])

    const value = useMemo<I18nValue>(() => ({
        language,
        t: dictionaries[language],
        setLanguage,
        toggleLanguage,
    }), [language, setLanguage, toggleLanguage])

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    )
}
