'use client';
import { useState, use } from 'react';
import { reconstructData } from '@cosmoslock/core';
import { loadFromIndexedDB, decryptCoordinateMap, importVaultFile } from '@cosmoslock/vault';
import { useT, useLanguage } from '../../../components/LanguageProvider';

export default function ReconstructPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = use(params);
  const t = useT();
  const { language } = useLanguage();
  const [passphrase, setPassphrase] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sourceUsed, setSourceUsed] = useState<'indexeddb'|'file'|null>(null);
  const [importedFile, setImportedFile] = useState<any>(null);

  const showPopup = (msg: string) => {
    alert(msg);
  };

  const isPassphraseError = (msg: string) => {
    return msg.toLowerCase().includes('decrypt') ||
           msg.toLowerCase().includes('operation') ||
           msg.toLowerCase().includes('failed') ||
           msg.includes('OperationError') ||
           msg.includes('The operation failed');
  };

  const go = async (source: 'indexeddb'|'file') => {
    setError(''); setPlaintext(''); setLoading(true);
    try {
      const res = await fetch(`/api/fragments/${contentId}`);
      if (!res.ok) throw new Error('Fragment blob not found on server');
      const serverFragmentBlob = await res.json();
      let record;
      if (source === 'indexeddb') {
        record = await loadFromIndexedDB(contentId);
        if (!record) throw new Error(language === 'ko' ? '로컬 금고에 좌표 맵이 없습니다' : 'Coordinate map not found in local vault');
      } else {
        if (!importedFile) throw new Error(language === 'ko' ? '금고 파일을 가져오지 않았습니다' : 'No vault file imported');
        record = importedFile;
      }
      setSourceUsed(source);
      const userCoordinateMap = await decryptCoordinateMap(record, passphrase);
      const { plaintext: pt } = reconstructData({ serverFragmentBlob, userCoordinateMap });
      setPlaintext(pt);
      await fetch('/api/reconstruct-log', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ contentId, timestamp: new Date().toISOString(), success: true, reason: `via ${source}` })
      });
    } catch (e: any) {
      const msg = e.message ?? 'Unknown error';
      // Wrong passphrase → show popup alert
      if (isPassphraseError(msg) || msg.includes('OperationError')) {
        const popupMsg = language === 'ko'
          ? '❌ 패스프레이즈가 틀립니다\n\n입력한 암호가 올바르지 않습니다. 데이터 보호 시 사용한 패스프레이즈를 정확히 입력해 주세요.'
          : '❌ Wrong Passphrase\n\nThe passphrase you entered is incorrect. Please enter the exact passphrase used when protecting this data.';
        showPopup(popupMsg);
        setError(language === 'ko' ? '패스프레이즈가 올바르지 않습니다.' : 'Incorrect passphrase.');
      } else {
        setError(msg);
      }
      await fetch('/api/reconstruct-log', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ contentId, timestamp: new Date().toISOString(), success: false, reason: msg })
      }).catch(() => {});
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-cosmos-text">{t('reconstructTitle')}</h1>
        <p className="text-lg text-cosmos-dim mt-2">{t('reconstructDesc')}</p>
        <div className="mt-3 text-sm font-mono text-cosmos-dim bg-cosmos-surface border border-cosmos-border rounded px-4 py-2 inline-block">{contentId}</div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-5 text-center">
          <div className="text-sm font-mono text-cosmos-accent mb-1">{t('reconstructSource1')}</div>
          <div className="text-base text-cosmos-text">{t('reconstructSource1Desc')}</div>
          <div className="mt-2 text-base text-cosmos-success">{t('reconstructAutoFetch')}</div>
        </div>
        <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-5 text-center">
          <div className="text-sm font-mono text-cosmos-purple mb-1">{t('reconstructSource2')}</div>
          <div className="text-base text-cosmos-text">{t('reconstructSource2Desc')}</div>
          <div className="mt-2 text-base text-cosmos-dim">{t('reconstructRequires')}</div>
        </div>
      </div>

      <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-7 space-y-5">
        <div>
          <label className="text-sm font-mono text-cosmos-dim block mb-2">{t('reconstructPassLabel')}</label>
          <input
            type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && passphrase && go('indexeddb')}
            placeholder={t('reconstructPassPlaceholder')}
            className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-4 py-3 text-base text-cosmos-text placeholder:text-cosmos-dim/50 focus:outline-none focus:border-cosmos-accent transition-colors"
          />
        </div>
        <button onClick={() => go('indexeddb')} disabled={loading || !passphrase}
          className="w-full flex items-center justify-between bg-cosmos-accent/10 hover:bg-cosmos-accent/20 disabled:opacity-40 border border-cosmos-accent/30 rounded-lg px-5 py-4 transition-colors">
          <div className="text-left">
            <div className="text-base font-semibold text-cosmos-accent">{t('reconstructUseLocal')}</div>
            <div className="text-sm text-cosmos-dim">{t('reconstructUseLocalDesc')}</div>
          </div>
          {loading && sourceUsed === 'indexeddb'
            ? <div className="w-5 h-5 border-2 border-cosmos-accent border-t-transparent rounded-full animate-spin"/>
            : <span className="text-cosmos-accent text-lg">→</span>}
        </button>
        <div className="border border-cosmos-border rounded-xl p-5 space-y-3">
          <div className="text-sm font-mono text-cosmos-dim">{t('reconstructOrFile')}</div>
          <input type="file" accept=".json"
            onChange={e => {
              const f = e.target.files?.[0]; if (!f) return;
              const r = new FileReader();
              r.onload = ev => { try { setImportedFile(importVaultFile(ev.target?.result as string)); } catch { setError('Invalid vault file'); } };
              r.readAsText(f);
            }}
            className="text-base text-cosmos-dim file:mr-3 file:text-sm file:bg-cosmos-muted file:text-cosmos-text file:border-0 file:rounded file:px-3 file:py-1.5 file:cursor-pointer"
          />
          {importedFile && <div className="text-sm font-mono text-cosmos-success">✓ Vault file loaded</div>}
          <button onClick={() => go('file')} disabled={loading || !passphrase || !importedFile}
            className="w-full bg-cosmos-purple/10 hover:bg-cosmos-purple/20 disabled:opacity-40 border border-cosmos-purple/30 rounded-lg px-5 py-3 text-base text-cosmos-purple font-semibold transition-colors">
            {t('reconstructFromFile')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5">
          <div className="text-lg font-semibold text-cosmos-danger">{t('reconstructFailed')}</div>
          <div className="text-base font-mono text-cosmos-dim mt-1">{error}</div>
        </div>
      )}

      {plaintext && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 space-y-4">
          <div className="text-lg font-semibold text-cosmos-success">{t('reconstructSuccess')}</div>
          <div className="bg-cosmos-bg border border-cosmos-border rounded-lg p-5">
            <div className="text-sm font-mono text-cosmos-dim mb-2">{t('reconstructedData')}</div>
            <div className="text-base font-mono text-cosmos-text whitespace-pre-wrap break-all">{plaintext}</div>
          </div>
          <div className="text-sm font-mono text-cosmos-dim">Source: {sourceUsed} | {t('reconstructAudit')}</div>
        </div>
      )}
    </div>
  );
}
