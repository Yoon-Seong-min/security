'use client';
import { useEffect, useState } from 'react';
import { useT } from './LanguageProvider';
export default function Footer() {
  const t = useT();
  const [visitors, setVisitors] = useState({ total: 0, daily: 0 });
  useEffect(() => {
    fetch('/api/visitors', { method: 'POST' }).then(r => r.json()).then(setVisitors).catch(() => {});
  }, []);
  return (
    <footer className="border-t border-cosmos-border mt-20 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-4">
        <div className="flex items-center justify-center gap-10">
          <div className="text-center">
            <div className="text-3xl font-bold font-mono text-cosmos-accent">{visitors.daily.toLocaleString()}</div>
            <div className="text-sm font-mono text-cosmos-dim mt-1">{t('visitorDaily')}</div>
          </div>
          <div className="w-px h-12 bg-cosmos-border" />
          <div className="text-center">
            <div className="text-3xl font-bold font-mono text-cosmos-success">{visitors.total.toLocaleString()}</div>
            <div className="text-sm font-mono text-cosmos-dim mt-1">{t('visitorTotal')}</div>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm font-mono text-cosmos-dim border-t border-cosmos-border pt-4">
          <span>{t('footerVersion')}</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cosmos-success badge-live inline-block" />{t('footerServer')} | {t('footerVault')}</span>
        </div>
      </div>
    </footer>
  );
}
