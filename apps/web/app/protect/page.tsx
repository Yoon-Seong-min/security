'use client';
import { useState, useCallback } from 'react';
import { protectData, type SplitMode } from '@cosmoslock/core';
import { encryptCoordinateMap, saveToIndexedDB, downloadVaultFile } from '@cosmoslock/vault';

type Step = 'input'|'processing'|'done';

export default function ProtectPage() {
  const [step, setStep] = useState<Step>('input');
  const [plaintext, setPlaintext] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('char');
  const [decoyRatio, setDecoyRatio] = useState(0.2);
  const [passphrase, setPassphrase] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [contentId, setContentId] = useState('');
  const [gridCells, setGridCells] = useState<any[]>([]);
  const [gridCols, setGridCols] = useState(0);
  const [vaultRecord, setVaultRecord] = useState<any>(null);
  const [fragmentCount, setFragmentCount] = useState(0);
  const [decoyCount, setDecoyCount] = useState(0);
  const [highlightReal, setHighlightReal] = useState(false);

  const handleProtect = useCallback(async () => {
    if (!plaintext.trim()) { setError('Enter data to protect.'); return; }
    if (!passphrase) { setError('Enter a passphrase.'); return; }
    setError(''); setStep('processing');
    try {
      const { serverFragmentBlob, userCoordinateMap } = protectData({ plaintext, splitMode, decoyRatio, label: label||undefined });
      const res = await fetch('/api/fragments', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(serverFragmentBlob) });
      if (!res.ok) throw new Error('Server storage failed');
      const encrypted = await encryptCoordinateMap(serverFragmentBlob.contentId, userCoordinateMap, passphrase);
      await saveToIndexedDB(encrypted);
      const cells = [...serverFragmentBlob.fragments].sort((a,b) => {
        if (a.coordinate[0]!==b.coordinate[0]) return a.coordinate[0].localeCompare(b.coordinate[0]);
        return parseInt(a.coordinate.slice(1))-parseInt(b.coordinate.slice(1));
      });
      setGridCells(cells); setGridCols(serverFragmentBlob.grid.columns.length);
      setContentId(serverFragmentBlob.contentId);
      setFragmentCount(cells.filter(c=>!c.isDecoy).length);
      setDecoyCount(cells.filter(c=>c.isDecoy).length);
      setVaultRecord(encrypted); setStep('done');
    } catch(e:any) { setError(e.message??'Unknown error'); setStep('input'); }
  }, [plaintext, splitMode, decoyRatio, passphrase, label]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-cosmos-text">Protect Data</h1>
        <p className="text-cosmos-dim text-sm mt-1">Atomize data into coordinate-scrambled fragments.</p>
      </div>
      {step==='input' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-6 space-y-5">
            <div>
              <label className="text-xs font-mono text-cosmos-dim block mb-2">DATA TO PROTECT</label>
              <textarea value={plaintext} onChange={e=>setPlaintext(e.target.value)} placeholder="Enter sensitive data..." rows={6}
                className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg p-3 text-sm text-cosmos-text placeholder:text-cosmos-dim/50 font-mono resize-none focus:outline-none focus:border-cosmos-accent transition-colors"/>
              <div className="text-[10px] font-mono text-cosmos-dim mt-1 text-right">{plaintext.length} chars</div>
            </div>
            <div>
              <label className="text-xs font-mono text-cosmos-dim block mb-2">LABEL (optional)</label>
              <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g. Customer record #001"
                className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-3 py-2 text-sm text-cosmos-text placeholder:text-cosmos-dim/50 focus:outline-none focus:border-cosmos-accent transition-colors"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-mono text-cosmos-dim block mb-2">SPLIT MODE</label>
                <select value={splitMode} onChange={e=>setSplitMode(e.target.value as SplitMode)}
                  className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-3 py-2 text-sm text-cosmos-text focus:outline-none focus:border-cosmos-accent">
                  <option value="char">Character</option>
                  <option value="word">Word</option>
                  <option value="token">Token</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-cosmos-dim block mb-2">DECOY — {Math.round(decoyRatio*100)}%</label>
                <input type="range" min={0} max={0.5} step={0.05} value={decoyRatio} onChange={e=>setDecoyRatio(Number(e.target.value))} className="w-full accent-cosmos-accent mt-2"/>
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-cosmos-dim block mb-2">VAULT PASSPHRASE</label>
              <input type="password" value={passphrase} onChange={e=>setPassphrase(e.target.value)} placeholder="Strong passphrase to encrypt coordinate map"
                className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-3 py-2 text-sm text-cosmos-text placeholder:text-cosmos-dim/50 focus:outline-none focus:border-cosmos-accent transition-colors"/>
              <div className="text-[10px] font-mono text-cosmos-warn mt-1">⚠ If lost, data cannot be recovered</div>
            </div>
            {error && <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-cosmos-danger font-mono">{error}</div>}
            <button onClick={handleProtect} disabled={!plaintext.trim()||!passphrase}
              className="w-full bg-cosmos-accent hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-lg py-3 transition-colors font-mono text-sm">
              ATOMIZE & PROTECT →
            </button>
          </div>
          <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-mono text-cosmos-dim uppercase tracking-widest">What happens</h3>
            {[['01','Split','Data divided into elements'],['02','Scramble','Elements placed on coordinate grid with decoys'],['03','Separate','Grid → Server · Coordinates → Your device'],['04','Encrypt','Coordinate map encrypted (AES-GCM + PBKDF2)'],['05','Delete','Original data wiped from memory']].map(([s,t,d])=>(
              <div key={s} className="flex items-start gap-3">
                <span className="text-[10px] font-mono text-cosmos-accent flex-shrink-0 mt-0.5">{s}</span>
                <div><span className="text-xs font-semibold text-cosmos-text">{t} </span><span className="text-xs text-cosmos-dim">{d}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {step==='processing' && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 border-2 border-cosmos-accent border-t-transparent rounded-full animate-spin"/>
          <div className="text-sm font-mono text-cosmos-dim">Atomizing data...</div>
        </div>
      )}
      {step==='done' && (
        <div className="space-y-6">
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-5">
            <div className="font-semibold text-cosmos-success">✓ Data Protected Successfully</div>
            <div className="text-xs font-mono text-cosmos-dim mt-1">Content ID: <span className="text-cosmos-text">{contentId}</span></div>
            <div className="text-xs text-cosmos-dim mt-2 flex flex-wrap gap-4">
              <span>🔵 <span className="text-cosmos-text">{fragmentCount}</span> real fragments → Server</span>
              <span>🔴 <span className="text-cosmos-text">{decoyCount}</span> decoys → Server</span>
              <span>🟣 Coordinate map → This device (AES-GCM)</span>
            </div>
          </div>
          <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-cosmos-text">Scrambled Coordinate Grid</h3>
                <p className="text-xs text-cosmos-dim">What the server stores — no reconstruction order</p>
              </div>
              <button onClick={()=>setHighlightReal(!highlightReal)}
                className={`text-xs font-mono px-3 py-1.5 rounded border transition-colors ${highlightReal?'border-cosmos-accent text-cosmos-accent':'border-cosmos-border text-cosmos-dim'}`}>
                {highlightReal?'Hide':'Show'} Real Data
              </button>
            </div>
            <div className="grid gap-0.5 overflow-x-auto" style={{gridTemplateColumns:`repeat(${gridCols},minmax(36px,1fr))`}}>
              {gridCells.map((cell,i)=>(
                <div key={i} title={`${cell.coordinate}: "${cell.value}"`}
                  className={`h-9 flex items-center justify-center text-[10px] font-mono rounded cursor-default relative ${cell.isDecoy?'bg-cosmos-muted/30 text-cosmos-dim/50':highlightReal?'bg-blue-500/20 border border-blue-500/30 text-cosmos-accent':'bg-cosmos-muted/60 text-cosmos-dim'}`}>
                  <div className="text-[8px] text-cosmos-dim/40 absolute top-0.5 left-0.5">{cell.coordinate}</div>
                  <div>{cell.isDecoy?'·':(cell.value===' '?'⎵':cell.value.slice(0,3))}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={()=>vaultRecord&&downloadVaultFile(vaultRecord)} className="bg-cosmos-surface border border-cosmos-purple/50 hover:border-cosmos-purple rounded-xl p-4 text-left transition-colors">
              <div className="text-cosmos-purple text-sm font-semibold">⬇ Download Vault File</div>
              <div className="text-xs text-cosmos-dim mt-1">Backup coordinate map as .json</div>
            </button>
            <a href={`/reconstruct/${contentId}`} className="bg-cosmos-surface border border-green-500/30 hover:border-green-500/50 rounded-xl p-4 block transition-colors">
              <div className="text-cosmos-success text-sm font-semibold">↩ Test Reconstruction</div>
              <div className="text-xs text-cosmos-dim mt-1">Verify the full pipeline works</div>
            </a>
            <button onClick={()=>{setStep('input');setPlaintext('');setPassphrase('');setLabel('');}} className="bg-cosmos-surface border border-cosmos-border hover:border-cosmos-accent rounded-xl p-4 text-left transition-colors">
              <div className="text-cosmos-text text-sm font-semibold">+ Protect Another</div>
              <div className="text-xs text-cosmos-dim mt-1">Atomize another piece of data</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
