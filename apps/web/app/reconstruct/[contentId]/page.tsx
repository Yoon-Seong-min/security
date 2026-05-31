'use client';
import { useState, use, useCallback } from 'react';
import { reconstructData, type ServerFragmentBlob, type UserCoordinateMap } from '@cosmoslock/core';
import { loadFromIndexedDB, decryptCoordinateMap, importVaultFile } from '@cosmoslock/vault';
import { useT, useLanguage } from '../../../components/LanguageProvider';

interface AnimStep {
  phase: 'idle'|'fetching'|'fragments'|'decrypting'|'merging'|'typing'|'done';
  fragments: Array<{coordinate:string;value:string;isDecoy:boolean;state:'hidden'|'visible'|'highlight'|'matched'}>;
  coordRows: Array<{idx:number;coord:string;enc:string;val:string;state:'hidden'|'visible'|'decrypted'}>;
  mergeProgress: number;
  typedText: string;
  statusMsg: string;
  statusType: 'idle'|'active'|'done'|'error';
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

function encFake(coord: string): string {
  const hash = Array.from(coord).reduce((a, c) => a + c.charCodeAt(0), 0);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  return Array.from({length: 8}, (_, i) => chars[(hash * (i+7) * 31) % chars.length]).join('') + '...';
}

export default function ReconstructPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = use(params);
  const t = useT();
  const { language } = useLanguage();

  const [passphrase, setPassphrase] = useState('');
  const [importedFile, setImportedFile] = useState<any>(null);
  const [error, setError] = useState('');
  const [animState, setAnimState] = useState<AnimStep>({
    phase: 'idle', fragments: [], coordRows: [],
    mergeProgress: 0, typedText: '', statusMsg: '', statusType: 'idle'
  });

  const updateAnim = useCallback((patch: Partial<AnimStep>) => {
    setAnimState(prev => ({ ...prev, ...patch }));
  }, []);

  const runAnimation = async (serverFragmentBlob: ServerFragmentBlob, plaintext: string, coordMap: UserCoordinateMap) => {
    const ko = language === 'ko';

    // Phase 1: Show server fragments one by one
    updateAnim({ phase: 'fetching', statusMsg: ko ? '서버 조각 블롭 가져오는 중...' : 'Fetching server fragment blob...', statusType: 'active' });
    await delay(500);

    const fragsInit = serverFragmentBlob.fragments.map(f => ({
      coordinate: f.coordinate, value: f.value, isDecoy: f.isDecoy, state: 'hidden' as const
    }));
    updateAnim({ phase: 'fragments', fragments: fragsInit, statusMsg: ko ? '서버의 스크램블된 조각 로딩 중...' : 'Loading scrambled fragments from server...', statusType: 'active' });

    // Reveal fragments one by one
    for (let i = 0; i < fragsInit.length; i++) {
      await delay(40);
      setAnimState(prev => {
        const frags = [...prev.fragments];
        frags[i] = { ...frags[i], state: 'visible' };
        return { ...prev, fragments: frags };
      });
    }
    await delay(300);

    // Phase 2: Decrypt coordinate map
    updateAnim({ phase: 'decrypting', statusMsg: ko ? 'AES-GCM으로 좌표 맵 복호화 중...' : 'Decrypting coordinate map (AES-GCM + PBKDF2)...', statusType: 'active' });
    await delay(400);

    const coordRowsInit = coordMap.reconstructionSequence
      .sort((a, b) => a.originalIndex - b.originalIndex)
      .map((seq, idx) => ({
        idx, coord: seq.coordinate, enc: encFake(seq.elementId), val: '', state: 'hidden' as const
      }));

    // Get values from fragment blob
    const fragMap = new Map(serverFragmentBlob.fragments.map(f => [f.coordinate, f.value]));
    const coordRowsFull = coordRowsInit.map(r => ({ ...r, val: fragMap.get(r.coord) ?? '?' }));

    updateAnim({ coordRows: coordRowsFull });

    for (let i = 0; i < coordRowsFull.length; i++) {
      await delay(30);
      // Show encrypted row
      setAnimState(prev => {
        const rows = [...prev.coordRows];
        rows[i] = { ...rows[i], state: 'visible' };
        return { ...prev, coordRows: rows };
      });
      await delay(90);
      // Reveal decrypted
      setAnimState(prev => {
        const rows = [...prev.coordRows];
        rows[i] = { ...rows[i], state: 'decrypted' };
        // Highlight matching fragment
        const frags = prev.fragments.map(f =>
          f.coordinate === coordRowsFull[i].coord ? { ...f, state: 'highlight' as const } : f
        );
        return { ...prev, coordRows: rows, fragments: frags };
      });
    }
    await delay(400);

    // Phase 3: Merge animation
    updateAnim({ phase: 'merging', statusMsg: ko ? '서버 조각과 좌표 맵 병합 중...' : 'Merging server fragments with coordinate map...', statusType: 'active' });

    // Mark all matched fragments
    setAnimState(prev => ({
      ...prev,
      fragments: prev.fragments.map(f =>
        !f.isDecoy ? { ...f, state: 'matched' as const } : f
      )
    }));

    // Animate merge bar
    for (let p = 0; p <= 100; p += 2) {
      await delay(20);
      updateAnim({ mergeProgress: p });
    }
    await delay(400);

    // Phase 4: Typewriter output
    updateAnim({ phase: 'typing', statusMsg: ko ? '원본 데이터 복원 중...' : 'Reconstructing original data...', statusType: 'active', typedText: '' });
    await delay(200);

    for (let i = 0; i < plaintext.length; i++) {
      await delay(80);
      updateAnim({ typedText: plaintext.slice(0, i + 1) });
    }

    await delay(300);
    updateAnim({
      phase: 'done',
      statusMsg: ko ? '✓ 복원 완료 — 감사 로그 기록됨' : '✓ Reconstruction complete — audit logged',
      statusType: 'done'
    });
  };

  const go = async (source: 'indexeddb' | 'file') => {
    setError('');
    const ko = language === 'ko';
    updateAnim({ phase: 'fetching', statusMsg: ko ? '서버에 연결 중...' : 'Connecting to server...', statusType: 'active', fragments: [], coordRows: [], mergeProgress: 0, typedText: '' });

    try {
      const res = await fetch(`/api/fragments/${contentId}`);
      if (!res.ok) throw new Error(ko ? '서버에서 조각 블롭을 찾을 수 없습니다' : 'Fragment blob not found on server');
      const serverFragmentBlob = await res.json();

      let record;
      if (source === 'indexeddb') {
        record = await loadFromIndexedDB(contentId);
        if (!record) throw new Error(ko ? '로컬 금고에 좌표 맵이 없습니다' : 'Coordinate map not found in local vault');
      } else {
        if (!importedFile) throw new Error(ko ? '금고 파일을 가져오지 않았습니다' : 'No vault file imported');
        record = importedFile;
      }

      let userCoordinateMap: UserCoordinateMap;
      try {
        userCoordinateMap = await decryptCoordinateMap(record, passphrase);
      } catch {
        const msg = ko
          ? '❌ 패스프레이즈 불일치\n\n입력한 암호가 올바르지 않습니다.\n데이터 보호 시 사용한 패스프레이즈를 정확히 입력해 주세요.'
          : '❌ Wrong Passphrase\n\nThe passphrase you entered is incorrect.\nPlease enter the exact passphrase used when protecting this data.';
        alert(msg);
        setError(ko ? '패스프레이즈가 올바르지 않습니다.' : 'Incorrect passphrase.');
        updateAnim({ phase: 'idle', statusMsg: '', statusType: 'idle' });
        await fetch('/api/reconstruct-log', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ contentId, timestamp: new Date().toISOString(), success: false, reason: 'wrong passphrase' }) }).catch(() => {});
        return;
      }

      const { plaintext } = reconstructData({ serverFragmentBlob, userCoordinateMap });

      // Run animation
      await runAnimation(serverFragmentBlob, plaintext, userCoordinateMap);

      await fetch('/api/reconstruct-log', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ contentId, timestamp: new Date().toISOString(), success: true, reason: `via ${source}` }) });
    } catch (e: any) {
      const msg = e.message ?? 'Unknown error';
      setError(msg);
      updateAnim({ phase: 'idle', statusMsg: msg, statusType: 'error' });
      await fetch('/api/reconstruct-log', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ contentId, timestamp: new Date().toISOString(), success: false, reason: msg }) }).catch(() => {});
    }
  };

  const { phase, fragments, coordRows, mergeProgress, typedText, statusMsg, statusType } = animState;
  const isRunning = phase !== 'idle' && phase !== 'done';
  const ko = language === 'ko';

  const phaseDots = ['fetching','fragments','decrypting','merging','typing','done'];

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-cosmos-text">{t('reconstructTitle')}</h1>
        <p className="text-lg text-cosmos-dim mt-2">{t('reconstructDesc')}</p>
        <div className="mt-3 text-sm font-mono text-cosmos-dim bg-cosmos-surface border border-cosmos-border rounded px-4 py-2 inline-block">{contentId}</div>
      </div>

      {/* Source indicators */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`bg-blue-900/10 border rounded-xl p-5 text-center transition-colors ${phase !== 'idle' ? 'border-blue-500/50 bg-blue-900/20' : 'border-blue-500/20'}`}>
          <div className="text-sm font-mono text-cosmos-accent mb-1">{t('reconstructSource1')}</div>
          <div className="text-base text-cosmos-text">{t('reconstructSource1Desc')}</div>
          <div className={`mt-2 text-base transition-colors ${phase !== 'idle' ? 'text-cosmos-success' : 'text-cosmos-dim'}`}>
            {phase !== 'idle' ? t('reconstructAutoFetch') : '—'}
          </div>
        </div>
        <div className={`bg-purple-900/10 border rounded-xl p-5 text-center transition-colors ${phase === 'decrypting' || phase === 'merging' || phase === 'typing' || phase === 'done' ? 'border-purple-500/50 bg-purple-900/20' : 'border-purple-500/20'}`}>
          <div className="text-sm font-mono text-cosmos-purple mb-1">{t('reconstructSource2')}</div>
          <div className="text-base text-cosmos-text">{t('reconstructSource2Desc')}</div>
          <div className={`mt-2 text-base transition-colors ${phase === 'decrypting' || phase === 'merging' || phase === 'typing' || phase === 'done' ? 'text-cosmos-success' : 'text-cosmos-dim'}`}>
            {phase === 'decrypting' || phase === 'merging' || phase === 'typing' || phase === 'done' ? t('reconstructAutoFetch') : t('reconstructRequires')}
          </div>
        </div>
      </div>

      {/* Passphrase input */}
      <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-7 space-y-5">
        <div>
          <label className="text-sm font-mono text-cosmos-dim block mb-2">{t('reconstructPassLabel')}</label>
          <input
            type="password" value={passphrase}
            onChange={e => setPassphrase(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && passphrase && !isRunning && go('indexeddb')}
            placeholder={t('reconstructPassPlaceholder')} disabled={isRunning}
            className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-4 py-3 text-base text-cosmos-text placeholder:text-cosmos-dim/50 focus:outline-none focus:border-cosmos-accent transition-colors disabled:opacity-50"
          />
        </div>
        <button onClick={() => go('indexeddb')} disabled={isRunning || !passphrase}
          className="w-full flex items-center justify-center gap-3 bg-cosmos-accent hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-5 py-4 transition-colors text-base">
          {isRunning
            ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>{ko ? '복원 중...' : 'Reconstructing...'}</>
            : <>{ko ? '▶ 복원 시작 (로컬 금고)' : '▶ RECONSTRUCT (Local Vault)'}</>}
        </button>
        <div className="border border-cosmos-border rounded-xl p-4 space-y-2">
          <div className="text-sm font-mono text-cosmos-dim">{t('reconstructOrFile')}</div>
          <input type="file" accept=".json" disabled={isRunning}
            onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => { try { setImportedFile(importVaultFile(ev.target?.result as string)); } catch { setError('Invalid vault file'); } }; r.readAsText(f); }}
            className="text-sm text-cosmos-dim file:mr-3 file:text-xs file:bg-cosmos-muted file:text-cosmos-text file:border-0 file:rounded file:px-3 file:py-1.5 file:cursor-pointer disabled:opacity-50"
          />
          {importedFile && <div className="text-xs font-mono text-cosmos-success">✓ Vault file loaded</div>}
          <button onClick={() => go('file')} disabled={isRunning || !passphrase || !importedFile}
            className="w-full bg-cosmos-purple/10 hover:bg-cosmos-purple/20 disabled:opacity-40 border border-cosmos-purple/30 rounded-lg px-4 py-2.5 text-base text-cosmos-purple font-semibold transition-colors">
            {t('reconstructFromFile')}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-5">
          <div className="text-lg font-semibold text-cosmos-danger">{t('reconstructFailed')}</div>
          <div className="text-base font-mono text-cosmos-dim mt-1">{error}</div>
        </div>
      )}

      {/* Animation panels */}
      {phase !== 'idle' && (
        <div className="space-y-4">
          {/* Phase progress dots */}
          <div className="flex items-center justify-center gap-2">
            {phaseDots.map((p, i) => {
              const phaseIdx = phaseDots.indexOf(phase);
              const isDone = i < phaseIdx || phase === 'done';
              const isActive = p === phase;
              return (
                <div key={p} className={`transition-all duration-300 rounded-full ${
                  isDone ? 'w-3 h-3 bg-cosmos-success' :
                  isActive ? 'w-3 h-3 bg-cosmos-accent shadow-[0_0_8px_#3b82f660]' :
                  'w-2 h-2 bg-cosmos-muted'
                }`} />
              );
            })}
          </div>

          {/* Status bar */}
          <div className={`text-sm font-mono text-center transition-colors ${
            statusType === 'active' ? 'text-cosmos-accent' :
            statusType === 'done'   ? 'text-cosmos-success' :
            statusType === 'error'  ? 'text-cosmos-danger' : 'text-cosmos-dim'
          }`}>
            {statusType === 'active' && <span className="inline-block w-2 h-2 rounded-full bg-cosmos-accent animate-pulse mr-2"/>}
            {statusMsg}
          </div>

          {/* Server fragment panel */}
          {fragments.length > 0 && (
            <div className={`bg-cosmos-surface border rounded-xl p-5 transition-colors ${
              phase === 'fragments' ? 'border-blue-500/30' :
              phase === 'merging' || phase === 'typing' || phase === 'done' ? 'border-cosmos-success/30' : 'border-cosmos-border'
            }`}>
              <div className="text-xs font-mono text-cosmos-accent uppercase tracking-widest mb-3">
                {ko ? '서버 조각 블롭 (Upstash Redis)' : 'SERVER FRAGMENT BLOB (Upstash Redis)'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {fragments.map((f, i) => (
                  <div key={i} className={`
                    text-xs font-mono px-2 py-1 rounded border transition-all duration-200
                    ${f.state === 'hidden' ? 'opacity-0 scale-75' : ''}
                    ${f.state === 'visible' ? (f.isDecoy ? 'bg-cosmos-muted/20 border-cosmos-border text-cosmos-dim/40' : 'bg-cosmos-muted/50 border-cosmos-border text-cosmos-dim') : ''}
                    ${f.state === 'highlight' ? 'bg-blue-500/20 border-blue-500/50 text-cosmos-accent scale-105' : ''}
                    ${f.state === 'matched' ? 'bg-green-500/20 border-green-500/50 text-cosmos-success scale-105' : ''}
                  `}>
                    {f.coordinate}:{f.isDecoy ? '???' : (f.value === ' ' ? '⎵' : f.value.slice(0, 4))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coordinate map panel */}
          {coordRows.length > 0 && (
            <div className={`bg-cosmos-surface border rounded-xl p-5 transition-colors ${
              phase === 'decrypting' ? 'border-purple-500/30' :
              phase === 'merging' || phase === 'typing' || phase === 'done' ? 'border-cosmos-success/30' : 'border-cosmos-border'
            }`}>
              <div className="text-xs font-mono text-cosmos-purple uppercase tracking-widest mb-3">
                {phase === 'decrypting'
                  ? (ko ? '좌표 맵 — AES-GCM 복호화 중...' : 'COORDINATE MAP — DECRYPTING AES-GCM...')
                  : (ko ? '좌표 맵 — 복호화 완료 ✓' : 'COORDINATE MAP — DECRYPTED ✓')}
              </div>
              <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                {coordRows.map((row, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs font-mono transition-all duration-200 ${
                    row.state === 'hidden' ? 'opacity-0 -translate-x-2' : 'opacity-100 translate-x-0'
                  }`}>
                    <span className="text-cosmos-dim/50 w-5 text-right">{String(i+1).padStart(2,'0')}</span>
                    <span className={`px-2 py-0.5 rounded border transition-all ${
                      row.state === 'decrypted' ? 'bg-cosmos-muted/30 border-cosmos-border text-cosmos-dim/50 line-through' : 'bg-purple-500/10 border-purple-500/30 text-cosmos-purple'
                    }`}>{row.enc}</span>
                    <span className={`transition-colors ${row.state === 'decrypted' ? 'text-cosmos-success' : 'text-cosmos-dim/30'}`}>→</span>
                    <span className={`px-2 py-0.5 rounded border transition-all ${
                      row.state === 'decrypted' ? 'opacity-100 bg-green-500/10 border-green-500/30 text-cosmos-success' : 'opacity-0'
                    }`}>{row.coord} = "{row.val === ' ' ? '⎵' : row.val}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Merge progress bar */}
          {mergeProgress > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-mono text-cosmos-dim">
                {ko ? '병합 중...' : 'Merging...'} {mergeProgress}%
              </div>
              <div className="h-1.5 bg-cosmos-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-75"
                  style={{
                    width: `${mergeProgress}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #a855f7, #22c55e)'
                  }}
                />
              </div>
            </div>
          )}

          {/* Typewriter output */}
          {(phase === 'typing' || phase === 'done') && (
            <div className={`border rounded-xl p-6 transition-colors ${
              phase === 'done' ? 'bg-green-900/20 border-green-500/30' : 'bg-cosmos-surface border-cosmos-border'
            }`}>
              <div className="text-sm font-mono text-cosmos-dim mb-3">{t('reconstructedData')}</div>
              <div className="text-xl font-mono text-cosmos-success tracking-wider min-h-8">
                {typedText}
                {phase === 'typing' && (
                  <span className="inline-block w-0.5 h-5 bg-cosmos-success ml-0.5 animate-pulse align-middle" />
                )}
              </div>
              {phase === 'done' && (
                <div className="text-sm font-mono text-cosmos-dim mt-3">{t('reconstructAudit')}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
