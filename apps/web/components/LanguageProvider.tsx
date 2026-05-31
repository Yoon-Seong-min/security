'use client';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations, type Language, type TranslationKey } from '../app/i18n';
interface LangCtx { language: Language; setLanguage: (l: Language) => void; t: (key: TranslationKey) => string; }
const LangContext = createContext<LangCtx | undefined>(undefined);
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  useEffect(() => {
    const s = localStorage.getItem('cl_lang');
    if (s === 'en' || s === 'ko') setLanguage(s as Language);
    // else stays 'en' as default
  }, []);
  useEffect(() => { localStorage.setItem('cl_lang', language); }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key: TranslationKey) => (translations[language][key] ?? translations.en[key]) as string }), [language]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}
export function useLanguage() { const ctx = useContext(LangContext); if (!ctx) throw new Error('useLanguage must be inside LanguageProvider'); return ctx; }
export function useT() { return useLanguage().t; }
