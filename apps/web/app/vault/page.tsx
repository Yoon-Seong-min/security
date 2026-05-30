'use client';
import { useEffect, useState } from 'react';
import { listFromIndexedDB, deleteFromIndexedDB, downloadVaultFile, downloadVaultBundle, importVaultBundle, saveToIndexedDB, type EncryptedVaultRecord } from '@cosmoslock/vault';
export default function VaultPage() {
  const [records, setRecords] = useState<EncryptedVaultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [importStatus, setImportStatus] = useState('');
  const refresh = async () => { setLoading(true); try { setRecords((await listFromIndexedDB()).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())); } finally { setLoading(false); } };
  useEffect(()=>{ refresh(); },[]);
  const handleDelete = async (id: string) => { if (!confirm('Delete this coordinate map?')) return; await deleteFromIndexedDB(id); refresh(); };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f=e.target.files?.[0]; if (!f) return;
    const r=new FileReader();
    r.onload=async ev=>{ try { const recs=importVaultBundle(ev.target?.result as string); for(const r of recs) await saveToIndexedDB(r); setImportStatus(`✓ Imported ${recs.length} record(s)`); refresh(); } catch { setImportStatus('✗ Invalid vault file'); } };
    r.readAsText(f);
  };
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div><h1 className="text-2xl font-bold text-cosmos-text">Vault Manager</h1><p className="text-cosmos-dim text-sm mt-1">Your coordinate maps — encrypted, stored in IndexedDB.</p></div>
        <div className="flex gap-2">
          <label className="cursor-pointer bg-cosmos-surface border border-cosmos-border hover:border-cosmos-accent rounded-lg px-4 py-2 text-xs font-mono text-cosmos-dim transition-colors">
            ⬆ Import<input type="file" accept=".json" onChange={handleImport} className="hidden"/>
          </label>
          {records.length>0&&<button onClick={()=>downloadVaultBundle(records)} className="bg-cosmos-surface border border-cosmos-purple/40 hover:border-cosmos-purple rounded-lg px-4 py-2 text-xs font-mono text-cosmos-purple transition-colors">⬇ Export All</button>}
        </div>
      </div>
      {importStatus&&<div className={`text-xs font-mono px-3 py-2 rounded border ${importStatus.startsWith('✓')?'bg-green-900/20 border-green-500/30 text-cosmos-success':'bg-red-900/20 border-red-500/30 text-cosmos-danger'}`}>{importStatus}</div>}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-4 col-span-2 space-y-2 text-xs">
          <div className="text-xs font-mono text-cosmos-dim uppercase tracking-widest mb-2">Storage</div>
          <div className="flex gap-3"><span className="text-cosmos-purple font-mono">PRIMARY</span><span className="text-cosmos-text">IndexedDB (this browser) — AES-GCM encrypted</span></div>
          <div className="flex gap-3"><span className="text-cosmos-accent font-mono">BACKUP</span><span className="text-cosmos-text">Export as JSON — save to device or cloud</span></div>
        </div>
        <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-cosmos-accent font-mono">{records.length}</div>
          <div className="text-xs text-cosmos-dim mt-1">coordinate maps</div>
        </div>
      </div>
      {loading?<div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-cosmos-accent border-t-transparent rounded-full animate-spin"/></div>
      :records.length===0?<div className="text-center py-16 text-cosmos-dim"><div className="text-4xl mb-3">🔒</div><div className="text-sm">No maps yet.</div><a href="/protect" className="text-cosmos-accent text-sm mt-2 inline-block">Protect data first →</a></div>
      :<div className="space-y-3">{records.map(r=>(
        <div key={r.contentId} className="bg-cosmos-surface border border-cosmos-border rounded-xl p-5 flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {r.label&&<div className="text-sm font-semibold text-cosmos-text">{r.label}</div>}
            <div className="text-[10px] font-mono text-cosmos-dim truncate mt-0.5">{r.contentId}</div>
            <div className="mt-1 text-[10px] font-mono text-cosmos-dim">🔐 {r.cipher}/{r.kdf} · {new Date(r.createdAt).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={`/reconstruct/${r.contentId}`} className="text-xs font-mono text-cosmos-success border border-green-500/30 hover:border-cosmos-success rounded px-2.5 py-1.5 transition-colors">Reconstruct</a>
            <button onClick={()=>downloadVaultFile(r)} className="text-xs font-mono text-cosmos-accent border border-cosmos-accent/30 hover:border-cosmos-accent rounded px-2.5 py-1.5 transition-colors">Export</button>
            <button onClick={()=>handleDelete(r.contentId)} className="text-xs font-mono text-cosmos-dim border border-cosmos-border hover:border-red-500/50 hover:text-cosmos-danger rounded px-2.5 py-1.5 transition-colors">Delete</button>
          </div>
        </div>
      ))}</div>}
      <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-4 text-xs text-cosmos-dim">
        <span className="text-cosmos-warn">⚠ </span>Maps stored only in <strong className="text-cosmos-text">this browser</strong>. Always export backups.
      </div>
    </div>
  );
}
