import { createContext } from 'react'

import type { Language } from '../utils/uiPreferences'
import { en, type Messages } from './messages/en'
import { vi } from './messages/vi'

export type { Language, Messages }

export const DEFAULT_LANGUAGE: Language = 'vi'

export const dictionaries: Record<Language, Messages> = { vi, en }

export interface I18nValue {
    language: Language
    t: Messages
    setLanguage: (language: Language) => void
    toggleLanguage: () => void
}

export const I18nContext = createContext<I18nValue | null>(null)

// For code outside React (services, plain helpers). Kept in sync by I18nProvider.
let currentLanguage: Language = DEFAULT_LANGUAGE

export function setCurrentLanguage(language: Language) {
    currentLanguage = language
}

export function getCurrentLanguage() {
    return currentLanguage
}

export function getMessages(): Messages {
    return dictionaries[currentLanguage]
}
