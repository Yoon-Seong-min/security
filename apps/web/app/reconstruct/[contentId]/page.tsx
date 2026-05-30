'use client';
import { useState, use } from 'react';
import { reconstructData } from '@cosmoslock/core';
import { loadFromIndexedDB, decryptCoordinateMap, importVaultFile } from '@cosmoslock/vault';

export default function ReconstructPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = use(params);
  const [passphrase, setPassphrase] = useState('');
  const [plaintext, setPlaintext] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sourceUsed, setSourceUsed] = useState<'indexeddb'|'file'|null>(null);
  const [importedFile, setImportedFile] = useState<any>(null);

  const go = async (source: 'indexeddb'|'file') => {
    setError(''); setPlaintext(''); setLoading(true);
    try {
      const res = await fetch(`/api/fragments/${contentId}`);
      if (!res.ok) throw new Error('Fragment blob not found on server');
      const serverFragmentBlob = await res.json();
      let record;
      if (source === 'indexeddb') {
        record = await loadFromIndexedDB(contentId);
        if (!record) throw new Error('Coordinate map not found in local vault');
      } else {
        if (!importedFile) throw new Error('No vault file imported');
        record = importedFile;
      }
      setSourceUsed(source);
      const userCoordinateMap = await decryptCoordinateMap(record, passphrase);
      const { plaintext: pt } = reconstructData({ serverFragmentBlob, userCoordinateMap });
      setPlaintext(pt);
      await fetch('/api/reconstruct-log', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ contentId, timestamp: new Date().toISOString(), success: true, reason: `via ${source}` }) });
    } catch(e: any) {
      const msg = e.message ?? 'Unknown error';
      setError(msg);
      await fetch('/api/reconstruct-log', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ contentId, timestamp: new Date().toISOString(), success: false, reason: msg }) }).catch(() => {});
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-cosmos-text">Reconstruct Data</h1>
        <p className="text-cosmos-dim text-sm mt-1">Two-source gate: server fragment + coordinate map + passphrase.</p>
        <div className="mt-2 text-xs font-mono text-cosmos-dim bg-cosmos-surface border border-cosmos-border rounded px-3 py-1.5 inline-block">{contentId}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <div className="text-[10px] font-mono text-cosmos-accent mb-1">SOURCE 1 — SERVER</div>
          <div className="text-xs text-cosmos-text">Fragment Blob (Upstash Redis)</div>
          <div className="mt-2 text-cosmos-success text-xs">✓ Auto-fetched</div>
        </div>
        <div className="bg-purple-900/10 border border-purple-500/20 rounded-xl p-4 text-center">
          <div className="text-[10px] font-mono text-cosmos-purple mb-1">SOURCE 2 — YOUR DEVICE</div>
          <div className="text-xs text-cosmos-text">Coordinate Map (IndexedDB)</div>
          <div className="mt-2 text-cosmos-dim text-xs">Requires passphrase</div>
        </div>
      </div>
      <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-6 space-y-4">
        <div>
          <label className="text-xs font-mono text-cosmos-dim block mb-2">VAULT PASSPHRASE</label>
          <input type="password" value={passphrase} onChange={e => setPassphrase(e.target.value)} placeholder="Passphrase used when protecting this data"
            className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-3 py-2.5 text-sm text-cosmos-text placeholder:text-cosmos-dim/50 focus:outline-none focus:border-cosmos-accent transition-colors" />
        </div>
        <button onClick={() => go('indexeddb')} disabled={loading || !passphrase}
          className="w-full flex items-center justify-between bg-cosmos-accent/10 hover:bg-cosmos-accent/20 disabled:opacity-40 border border-cosmos-accent/30 rounded-lg px-4 py-3 transition-colors">
          <div className="text-left">
            <div className="text-sm font-semibold text-cosmos-accent">Use Local Vault (IndexedDB)</div>
            <div className="text-[10px] text-cosmos-dim">Coordinate map on this device</div>
          </div>
          {loading && sourceUsed === 'indexeddb' ? <div className="w-4 h-4 border-2 border-cosmos-accent border-t-transparent rounded-full animate-spin" /> : <span className="text-cosmos-accent">→</span>}
        </button>
        <div className="border border-cosmos-border rounded-lg p-4 space-y-2">
          <div className="text-xs font-mono text-cosmos-dim">OR — IMPORT VAULT FILE</div>
          <input type="file" accept=".json" onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { try { setImportedFile(importVaultFile(ev.target?.result as string)); } catch { setError('Invalid vault file'); } }; r.readAsText(f); }}
            className="text-xs text-cosmos-dim file:mr-3 file:text-xs file:bg-cosmos-muted file:text-cosmos-text file:border-0 file:rounded file:px-2 file:py-1 file:cursor-pointer" />
          {importedFile && <div className="text-[10px] font-mono text-cosmos-success">✓ Vault file loaded</div>}
          <button onClick={() => go('file')} disabled={loading || !passphrase || !importedFile}
            className="w-full bg-cosmos-purple/10 hover:bg-cosmos-purple/20 disabled:opacity-40 border border-cosmos-purple/30 rounded-lg px-4 py-2 text-sm text-cosmos-purple font-semibold transition-colors">
            Reconstruct from File
          </button>
        </div>
      </div>
      {error && <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4"><div className="text-sm font-semibold text-cosmos-danger">Reconstruction Failed</div><div className="text-xs font-mono text-cosmos-dim mt-1">{error}</div></div>}
      {plaintext && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-5 space-y-3">
          <div className="font-semibold text-cosmos-success">✓ Reconstruction Successful</div>
          <div className="bg-cosmos-bg border border-cosmos-border rounded-lg p-4">
            <div className="text-[10px] font-mono text-cosmos-dim mb-2">RECONSTRUCTED DATA</div>
            <div className="text-sm font-mono text-cosmos-text whitespace-pre-wrap break-all">{plaintext}</div>
          </div>
          <div className="text-[10px] font-mono text-cosmos-dim">Source: {sourceUsed} | Audit logged ✓</div>
        </div>
      )}
    </div>
  );
}
