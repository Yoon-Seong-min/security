'use client';
import { useEffect, useState } from 'react';
import { useT } from '../../components/LanguageProvider';
import type { ServerFragmentBlob } from '@cosmoslock/core';
export default function AdminPage() {
  const t = useT();
  const [blobs, setBlobs] = useState<ServerFragmentBlob[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const refresh = async () => {
    setLoading(true);
    try { const res = await fetch('/api/fragments'); const data = await res.json(); setBlobs(Array.isArray(data) ? data : []); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);
  const handleClearAll = async () => {
    if (!confirm(t('adminClearConfirm'))) return;
    try { const res = await fetch('/api/admin', { method: 'DELETE' }); const data = await res.json(); if (data.ok) { setStatus(t('adminClearSuccess')); setBlobs([]); } }
    catch { setStatus('Error occurred'); }
  };
  const handleDeleteOne = async (contentId: string) => {
    if (!confirm(t('adminDeleteOneConfirm'))) return;
    await fetch(`/api/fragments/${contentId}`, { method: 'DELETE' }); refresh();
  };
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-cosmos-text">{t('adminTitle')}</h1>
        <p className="text-lg text-cosmos-dim mt-2">{t('adminDesc')}</p>
      </div>
      {status && <div className="bg-green-900/20 border border-green-500/30 rounded-xl px-5 py-3 text-base font-mono text-cosmos-success">{status}</div>}
      <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-cosmos-danger">{t('adminDanger')}</h2>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-base font-semibold text-cosmos-text">{t('adminClearAll')}</div>
            <div className="text-sm text-cosmos-dim mt-1">{t('adminClearDesc')}</div>
          </div>
          <button onClick={handleClearAll} className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-cosmos-danger font-semibold rounded-lg px-5 py-2.5 text-base transition-colors">
            {t('adminClearBtn')}
          </button>
        </div>
      </div>
      <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-cosmos-text">{t('adminFragList')} ({blobs.length})</h2>
          <button onClick={refresh} className="text-sm font-mono text-cosmos-dim hover:text-cosmos-text border border-cosmos-border rounded px-3 py-1.5 transition-colors">↻ Refresh</button>
        </div>
        {loading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-cosmos-accent border-t-transparent rounded-full animate-spin" /></div>
        : blobs.length === 0 ? <div className="text-center py-10 text-base text-cosmos-dim">{t('adminNoFrags')}</div>
        : <div className="space-y-3">{blobs.map(blob => (
          <div key={blob.contentId} className="bg-cosmos-bg border border-cosmos-border rounded-xl p-4 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {blob.label && <div className="text-base font-semibold text-cosmos-text">{blob.label}</div>}
              <div className="text-sm font-mono text-cosmos-dim truncate mt-0.5">{blob.contentId}</div>
              <div className="text-xs font-mono text-cosmos-dim mt-1 flex flex-wrap gap-3">
                <span>조각: {blob.fragments.length}개</span>
                <span>실제: {blob.fragments.filter((f:any) => !f.isDecoy).length}개</span>
                <span>디코이: {blob.fragments.filter((f:any) => f.isDecoy).length}개</span>
                <span>{new Date(blob.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <button onClick={() => handleDeleteOne(blob.contentId)} className="text-sm font-mono text-cosmos-dim border border-cosmos-border hover:border-red-500/50 hover:text-cosmos-danger rounded px-3 py-1.5 transition-colors flex-shrink-0">
              {t('adminDeleteOne')}
            </button>
          </div>
        ))}</div>}
      </div>
    </div>
  );
}
