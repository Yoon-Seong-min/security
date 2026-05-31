'use client';
import { useState, useCallback } from 'react';
import { protectData, type SplitMode } from '@cosmoslock/core';
import { encryptCoordinateMap, saveToIndexedDB, downloadVaultFile } from '@cosmoslock/vault';
import { useT } from '../../components/LanguageProvider';
type Step = 'input'|'processing'|'done';
export default function ProtectPage() {
  const t = useT();
  const [step, setStep] = useState<Step>('input');
  const [plaintext, setPlaintext] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('syllable'); // DEFAULT: syllable
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
      const res = await fetch('/api/fragments', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(serverFragmentBlob) });
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
    } catch(e:any) { setError(e.message??'Error'); setStep('input'); }
  }, [plaintext,splitMode,decoyRatio,passphrase,label]);
  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-cosmos-text">{t('protectTitle')}</h1>
        <p className="text-lg text-cosmos-dim mt-2">{t('protectDesc')}</p>
      </div>
      {step==='input' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
          <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-7 space-y-6">
            <div>
              <label className="text-sm font-mono text-cosmos-dim block mb-2">{t('protectDataLabel')}</label>
              <textarea value={plaintext} onChange={e=>setPlaintext(e.target.value)} placeholder={t('protectDataPlaceholder')} rows={6}
                className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg p-4 text-base text-cosmos-text placeholder:text-cosmos-dim/50 font-mono resize-none focus:outline-none focus:border-cosmos-accent transition-colors"/>
              <div className="text-sm font-mono text-cosmos-dim mt-1 text-right">{plaintext.length} {t('protectChars')}</div>
            </div>
            <div>
              <label className="text-sm font-mono text-cosmos-dim block mb-2">{t('protectLabelLabel')}</label>
              <input value={label} onChange={e=>setLabel(e.target.value)} placeholder={t('protectLabelPlaceholder')}
                className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-4 py-2.5 text-base text-cosmos-text placeholder:text-cosmos-dim/50 focus:outline-none focus:border-cosmos-accent transition-colors"/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-mono text-cosmos-dim block mb-2">{t('protectSplitLabel')}</label>
                <select value={splitMode} onChange={e=>setSplitMode(e.target.value as SplitMode)}
                  className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-4 py-2.5 text-base text-cosmos-text focus:outline-none focus:border-cosmos-accent">
                  <option value="syllable">⭐ {t('protectSyllable')}</option>
                  <option value="char">{t('protectChar')}</option>
                  <option value="word">{t('protectWord')}</option>
                  <option value="token">{t('protectToken')}</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-mono text-cosmos-dim block mb-2">{t('protectDecoy')} — {Math.round(decoyRatio*100)}%</label>
                <input type="range" min={0} max={0.5} step={0.05} value={decoyRatio} onChange={e=>setDecoyRatio(Number(e.target.value))} className="w-full accent-cosmos-accent mt-3"/>
              </div>
            </div>
            <div>
              <label className="text-sm font-mono text-cosmos-dim block mb-2">{t('protectPassLabel')}</label>
              <input type="password" value={passphrase} onChange={e=>setPassphrase(e.target.value)} placeholder={t('protectPassPlaceholder')}
                className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-4 py-2.5 text-base text-cosmos-text placeholder:text-cosmos-dim/50 focus:outline-none focus:border-cosmos-accent transition-colors"/>
              <div className="text-sm font-mono text-cosmos-warn mt-1">{t('protectPassWarn')}</div>
            </div>
            {error && <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-3 text-base text-cosmos-danger font-mono">{error}</div>}
            <button onClick={handleProtect} disabled={!plaintext.trim()||!passphrase}
              className="w-full bg-cosmos-accent hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-lg py-3.5 text-base transition-colors font-mono">
              {t('protectButton')}
            </button>
          </div>
          <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-6 space-y-5">
            <h3 className="text-sm font-mono text-cosmos-dim uppercase tracking-widest">{t('protectWhat')}</h3>
            {(['01','02','03','04','05'] as const).map((s,i)=>(
              <div key={s} className="flex items-start gap-3">
                <span className="text-sm font-mono text-cosmos-accent flex-shrink-0 mt-0.5">{s}</span>
                <span className="text-base text-cosmos-dim">{[t('protectStep1'),t('protectStep2'),t('protectStep3'),t('protectStep4'),t('protectStep5')][i]}</span>
              </div>
            ))}
            <div className="mt-4 bg-cosmos-bg border border-cosmos-border rounded-lg p-4">
              <div className="text-xs font-mono text-cosmos-accent mb-2">⭐ {t('protectSyllable')}</div>
              <div className="text-sm text-cosmos-dim">Korean: 가→나→다 (1 syllable = 1 unit)<br/>English: a→b→c (1 char = 1 unit)<br/>Lower semantic exposure than word-level splitting for mixed-language text</div>
            </div>
          </div>
        </div>
      )}
      {step==='processing' && (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-14 h-14 border-2 border-cosmos-accent border-t-transparent rounded-full animate-spin"/>
          <div className="text-lg font-mono text-cosmos-dim">{t('protectAtomizing')}</div>
        </div>
      )}
      {step==='done' && (
        <div className="space-y-7">
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
            <div className="text-lg font-semibold text-cosmos-success">{t('protectSuccess')}</div>
            <div className="text-sm font-mono text-cosmos-dim mt-1">{t('protectContentId')} <span className="text-cosmos-text">{contentId}</span></div>
            <div className="text-base text-cosmos-dim mt-3 flex flex-wrap gap-5">
              <span>🔵 <span className="text-cosmos-text">{fragmentCount}</span> {t('protectReal')}</span>
              <span>🔴 <span className="text-cosmos-text">{decoyCount}</span> {t('protectDecoys')}</span>
              <span>🟣 {t('protectCoordMap')}</span>
            </div>
          </div>
          <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-7">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-cosmos-text">{t('protectGrid')}</h3>
                <p className="text-base text-cosmos-dim mt-1">{t('protectGridDesc')}</p>
              </div>
              <button onClick={()=>setHighlightReal(!highlightReal)}
                className={`text-sm font-mono px-4 py-2 rounded border transition-colors ${highlightReal?'border-cosmos-accent text-cosmos-accent bg-blue-500/10':'border-cosmos-border text-cosmos-dim hover:border-cosmos-accent'}`}>
                {highlightReal?t('protectHideReal'):t('protectShowReal')}
              </button>
            </div>
            <div className="grid gap-0.5 overflow-x-auto" style={{gridTemplateColumns:`repeat(${gridCols},minmax(38px,1fr))`}}>
              {gridCells.map((cell,i)=>(
                <div key={i} title={`${cell.coordinate}: "${cell.value}"`}
                  className={`h-10 flex items-center justify-center text-xs font-mono rounded cursor-default relative ${cell.isDecoy?'bg-cosmos-muted/30 text-cosmos-dim/50':highlightReal?'bg-blue-500/20 border border-blue-500/30 text-cosmos-accent':'bg-cosmos-muted/60 text-cosmos-dim'}`}>
                  <div className="text-[9px] text-cosmos-dim/40 absolute top-0.5 left-0.5">{cell.coordinate}</div>
                  <div>{cell.isDecoy?'·':(cell.value===' '?'⎵':cell.value.slice(0,3))}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={()=>vaultRecord&&downloadVaultFile(vaultRecord)} className="bg-cosmos-surface border border-cosmos-purple/50 hover:border-cosmos-purple rounded-xl p-5 text-left transition-colors">
              <div className="text-base font-semibold text-cosmos-purple">{t('protectDownload')}</div>
              <div className="text-sm text-cosmos-dim mt-1">{t('protectDownloadDesc')}</div>
            </button>
            <a href={`/reconstruct/${contentId}`} className="bg-cosmos-surface border border-green-500/30 hover:border-green-500/50 rounded-xl p-5 block transition-colors">
              <div className="text-base font-semibold text-cosmos-success">{t('protectTest')}</div>
              <div className="text-sm text-cosmos-dim mt-1">{t('protectTestDesc')}</div>
            </a>
            <button onClick={()=>{setStep('input');setPlaintext('');setPassphrase('');setLabel('');}} className="bg-cosmos-surface border border-cosmos-border hover:border-cosmos-accent rounded-xl p-5 text-left transition-colors">
              <div className="text-base font-semibold text-cosmos-text">{t('protectAnother')}</div>
              <div className="text-sm text-cosmos-dim mt-1">{t('protectAnotherDesc')}</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
