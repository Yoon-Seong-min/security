'use client';
import { useEffect, useState } from 'react';
import { useT } from '../../components/LanguageProvider';
import type { ServerFragmentBlob } from '@cosmoslock/core';

export default function AdminPage() {
  const t = useT();
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [blobs, setBlobs] = useState<ServerFragmentBlob[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Check server-side session cookie on mount
  useEffect(() => {
    fetch('/api/admin/session')
      .then(r => r.json())
      .then(d => setAuthed(d.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  const handleLogin = async () => {
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password }),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        setLoginError(t('adminLoginError'));
      }
    } catch {
      setLoginError('Server error');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthed(false);
    setUserId('');
    setPassword('');
    setBlobs([]);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/fragments');
      const data = await res.json();
      setBlobs(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (authed) refresh(); }, [authed]);

  const handleClearAll = async () => {
    if (!confirm(t('adminClearConfirm'))) return;
    try {
      const res = await fetch('/api/admin', { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) { setStatus(t('adminClearSuccess')); setBlobs([]); }
    } catch { setStatus('Error occurred'); }
  };

  const handleDeleteOne = async (contentId: string) => {
    if (!confirm(t('adminDeleteOneConfirm'))) return;
    await fetch(`/api/fragments/${contentId}`, { method: 'DELETE' });
    refresh();
  };

  // Loading session check
  if (authed === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-cosmos-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Login screen
  if (!authed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-8 w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-cosmos-text">{t('adminLoginTitle')}</h1>
            <p className="text-base text-cosmos-dim mt-1">{t('adminLoginDesc')}</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-mono text-cosmos-dim block mb-2">{t('adminUserId')}</label>
              <input value={userId} onChange={e => setUserId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-4 py-2.5 text-base text-cosmos-text focus:outline-none focus:border-cosmos-accent transition-colors" />
            </div>
            <div>
              <label className="text-sm font-mono text-cosmos-dim block mb-2">{t('adminPassword')}</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-4 py-2.5 text-base text-cosmos-text focus:outline-none focus:border-cosmos-accent transition-colors" />
            </div>
            {loginError && <div className="text-sm text-cosmos-danger font-mono">{loginError}</div>}
            <button onClick={handleLogin}
              className="w-full bg-cosmos-accent hover:bg-blue-500 text-white font-semibold rounded-lg py-3 text-base transition-colors">
              {t('adminLoginBtn')}
            </button>
          </div>
          <div className="text-xs font-mono text-cosmos-dim/50 text-center">
            Session expires after 4 hours
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-0">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-cosmos-text">{t('adminTitle')}</h1>
          <p className="text-base text-cosmos-dim mt-1">{t('adminDesc')}</p>
        </div>
        <button onClick={handleLogout}
          className="text-sm font-mono text-cosmos-dim border border-cosmos-border hover:border-cosmos-danger hover:text-cosmos-danger rounded-lg px-4 py-2 transition-colors">
          {t('adminLogout')}
        </button>
      </div>

      {status && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl px-5 py-3 text-base font-mono text-cosmos-success">{status}</div>
      )}

      {/* Danger zone */}
      <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-5 md:p-6 space-y-4">
        <h2 className="text-lg font-bold text-cosmos-danger">{t('adminDanger')}</h2>
        <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
          <div>
            <div className="text-base font-semibold text-cosmos-text">{t('adminClearAll')}</div>
            <div className="text-sm text-cosmos-dim mt-1">{t('adminClearDesc')}</div>
          </div>
          <button onClick={handleClearAll}
            className="w-full md:w-auto bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-cosmos-danger font-semibold rounded-lg px-5 py-2.5 text-base transition-colors flex-shrink-0">
            {t('adminClearBtn')}
          </button>
        </div>
      </div>

      {/* Fragment list */}
      <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-cosmos-text">{t('adminFragList')} ({blobs.length})</h2>
          <button onClick={refresh}
            className="text-sm font-mono text-cosmos-dim hover:text-cosmos-text border border-cosmos-border rounded px-3 py-1.5 transition-colors flex-shrink-0">
            ↻ Refresh
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-2 border-cosmos-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : blobs.length === 0 ? (
          <div className="text-center py-10 text-base text-cosmos-dim">{t('adminNoFrags')}</div>
        ) : (
          <div className="space-y-3">
            {blobs.map(blob => (
              <div key={blob.contentId} className="bg-cosmos-bg border border-cosmos-border rounded-xl p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {blob.label && <div className="text-base font-semibold text-cosmos-text">{blob.label}</div>}
                  <div className="text-xs font-mono text-cosmos-dim truncate mt-0.5">{blob.contentId}</div>
                  <div className="text-xs font-mono text-cosmos-dim mt-1 flex flex-wrap gap-2">
                    <span>Frags: {blob.fragments.length}</span>
                    <span>Real: {blob.fragments.filter((f:any) => !f.isDecoy).length}</span>
                    <span>Decoys: {blob.fragments.filter((f:any) => f.isDecoy).length}</span>
                    <span className="hidden sm:inline">{new Date(blob.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => handleDeleteOne(blob.contentId)}
                  className="text-xs font-mono text-cosmos-dim border border-cosmos-border hover:border-red-500/50 hover:text-cosmos-danger rounded px-2.5 py-1.5 transition-colors flex-shrink-0">
                  {t('adminDeleteOne')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security info */}
      <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-5 text-sm font-mono text-cosmos-dim space-y-1">
        <div className="text-cosmos-accent mb-2">🔐 Security Info</div>
        <div>Session: httpOnly cookie (4h expiry)</div>
        <div>Credentials: stored in Vercel environment variables</div>
        <div>To reset: update ADMIN_ID / ADMIN_PW in Vercel Dashboard → Settings → Environment Variables</div>
      </div>
    </div>
  );
}
