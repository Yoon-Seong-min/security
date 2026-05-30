'use client';

import { useLanguage } from './LanguageProvider';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label htmlFor='language-select' style={{ fontSize: '0.9rem' }}>
        {t('languageLabel')}:
      </label>
      <select
        id='language-select'
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'en' | 'ko')}
        style={{ padding: '4px 8px', fontSize: '0.9rem' }}
      >
        <option value='en'>English</option>
        <option value='ko'>한국어</option>
      </select>
    </div>
  );
}
