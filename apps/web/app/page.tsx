'use client';
import Link from 'next/link';
import { useTranslations } from '../components/LanguageProvider';

export default function Home() {
  const t = useTranslations();
  return (
    <main>
      <h1>{t('appTitle')}</h1>
      <ul>
        <li>
          <Link href='/protect'>{t('homeProtectLink')}</Link>
        </li>
        <li>
          <Link href='/breach-simulation'>{t('homeBreachLink')}</Link>
        </li>
      </ul>
    </main>
  );
}
