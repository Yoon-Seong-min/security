'use client';
import { useEffect, useState } from 'react';
import { listFromIndexedDB, deleteFromIndexedDB, downloadVaultFile, downloadVaultBundle, importVaultBundle, saveToIndexedDB, type EncryptedVaultRecord } from '@cosmoslock/vault';
import { useT } from '../../components/LanguageProvider';
export default function VaultPage() {
  const t = useT();
  const [records, setRecords] = useState<EncryptedVaultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState('');
  const refresh = async () => { setLoading(true); try { setRecords((await listFromIndexedDB()).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())); } finally { setLoading(false); } };
  useEffect(()=>{ refresh(); },[]);
  const handleDelete = async (id:string) => { if (!confirm(t('vaultDeleteConfirm'))) return; await deleteFromIndexedDB(id); refresh(); };
  const handleImport = (e:React.ChangeEvent<HTMLInputElement>) => {
    const f=e.target.files?.[0]; if (!f) return;
    const r=new FileReader();
    r.onload=async ev=>{ try { const recs=importVaultBundle(ev.target?.result as string); for(const rec of recs) await saveToIndexedDB(rec); setImportStatus(`✓ ${recs.length}개 완료`); refresh(); } catch { setImportStatus('✗ 오류'); } };
    r.readAsText(f);
  };
  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between">
        <div><h1 className="text-3xl font-bold text-cosmos-text">{t('vaultTitle')}</h1><p className="text-lg text-cosmos-dim mt-2">{t('vaultDesc')}</p></div>
        <div className="flex gap-2">
          <label className="cursor-pointer bg-cosmos-surface border border-cosmos-border hover:border-cosmos-accent rounded-lg px-4 py-2.5 text-base font-mono text-cosmos-dim transition-colors">
            {t('vaultImport')}<input type="file" accept=".json" onChange={handleImport} className="hidden"/>
          </label>
          {records.length>0&&<button onClick={()=>downloadVaultBundle(records)} className="bg-cosmos-surface border border-cosmos-purple/40 hover:border-cosmos-purple rounded-lg px-4 py-2.5 text-base font-mono text-cosmos-purple transition-colors">{t('vaultExportAll')}</button>}
        </div>
      </div>
      {importStatus&&<div className={`text-base font-mono px-4 py-3 rounded border ${importStatus.startsWith('✓')?'bg-green-900/20 border-green-500/30 text-cosmos-success':'bg-red-900/20 border-red-500/30 text-cosmos-danger'}`}>{importStatus}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-5 col-span-2 space-y-3">
          <div className="text-sm font-mono text-cosmos-dim uppercase tracking-widest mb-2">{t('vaultStorageTitle')}</div>
          <div className="flex gap-3 text-base"><span className="text-cosmos-purple font-mono">{t('vaultPrimary')}</span><span className="text-cosmos-text">{t('vaultPrimaryDesc')}</span></div>
          <div className="flex gap-3 text-base"><span className="text-cosmos-accent font-mono">{t('vaultBackup')}</span><span className="text-cosmos-text">{t('vaultBackupDesc')}</span></div>
        </div>
        <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-5 flex flex-col items-center justify-center text-center">
          <div className="text-4xl font-bold text-cosmos-accent font-mono">{records.length}</div>
          <div className="text-base text-cosmos-dim mt-1">{t('vaultCoordMaps')}</div>
        </div>
      </div>
      {loading?<div className="flex justify-center py-14"><div className="w-10 h-10 border-2 border-cosmos-accent border-t-transparent rounded-full animate-spin"/></div>
      :records.length===0?<div className="text-center py-16 text-cosmos-dim"><div className="text-5xl mb-4">🔒</div><div className="text-lg">{t('vaultNoData')}</div><a href="/protect" className="text-cosmos-accent text-base mt-2 inline-block">{t('vaultProtectFirst')}</a></div>
      :<div className="space-y-3">{records.map(r=>(
        <div key={r.contentId} className="bg-cosmos-surface border border-cosmos-border rounded-xl p-5 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {r.label&&<div className="text-lg font-semibold text-cosmos-text">{r.label}</div>}
            <div className="text-sm font-mono text-cosmos-dim truncate mt-0.5">{r.contentId}</div>
            <div className="mt-1 text-sm font-mono text-cosmos-dim">🔐 {r.cipher}/{r.kdf} · {new Date(r.createdAt).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={`/reconstruct/${r.contentId}`} className="text-sm font-mono text-cosmos-success border border-green-500/30 hover:border-cosmos-success rounded px-3 py-2 transition-colors">{t('vaultReconstruct')}</a>
            <button onClick={()=>downloadVaultFile(r)} className="text-sm font-mono text-cosmos-accent border border-cosmos-accent/30 hover:border-cosmos-accent rounded px-3 py-2 transition-colors">{t('vaultExport')}</button>
            <button onClick={()=>handleDelete(r.contentId)} className="text-sm font-mono text-cosmos-dim border border-cosmos-border hover:border-red-500/50 hover:text-cosmos-danger rounded px-3 py-2 transition-colors">{t('vaultDelete')}</button>
          </div>
        </div>
      ))}</div>}
      <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-5 text-base text-cosmos-dim">
        {t('vaultWarn')} <strong className="text-cosmos-text">{t('vaultWarnBold')}</strong>{t('vaultWarnEnd')}
      </div>
    </div>
  );
}
