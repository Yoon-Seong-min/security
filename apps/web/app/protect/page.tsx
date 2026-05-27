'use client';
import { useState } from 'react';
import { protectData, type SplitMode } from '@cosmoslock/core';
import { encryptCoordinateMap, saveToIndexedDB, exportVaultFile } from '@cosmoslock/vault';

export default function ProtectPage() {
  const [plaintext, setPlaintext] = useState(''); const [splitMode, setSplitMode] = useState<SplitMode>('char'); const [decoyRatio, setDecoyRatio] = useState(0.2); const [passphrase, setPassphrase] = useState('');
  const [status, setStatus] = useState<string>(''); const [contentId, setContentId] = useState<string>(''); const [vaultExport, setVaultExport] = useState('');

  const onProtect = async () => {
    const { serverFragmentBlob, userCoordinateMap } = protectData({ plaintext, splitMode, decoyRatio });
    await fetch('/api/fragments', { method: 'POST', body: JSON.stringify(serverFragmentBlob) });
    const encrypted = await encryptCoordinateMap(serverFragmentBlob.contentId, userCoordinateMap, passphrase);
    await saveToIndexedDB(encrypted);
    setVaultExport(exportVaultFile(encrypted));
    setContentId(serverFragmentBlob.contentId);
    setPlaintext('');
    setStatus('Protected. Server fragment saved and user vault encrypted/saved locally. Losing your vault can make reconstruction impossible.');
  };
  return <main><h2>Protect Data</h2><textarea value={plaintext} onChange={(e)=>setPlaintext(e.target.value)} rows={8} cols={70}/><div><select value={splitMode} onChange={(e)=>setSplitMode(e.target.value as SplitMode)}><option value='char'>char</option><option value='word'>word</option><option value='token'>token</option></select><input type='number' step='0.1' min='0' max='1' value={decoyRatio} onChange={(e)=>setDecoyRatio(Number(e.target.value))}/><input placeholder='vault passphrase' type='password' value={passphrase} onChange={(e)=>setPassphrase(e.target.value)}/><button onClick={onProtect}>Protect</button></div>
  <h3>Storage Separation Result</h3><div style={{display:'flex',gap:'20px'}}><div style={{border:'1px solid #ccc',padding:'10px'}}><b>Server stores scrambled fragments</b><p>{contentId || '-'}</p></div><div style={{border:'1px solid #ccc',padding:'10px'}}><b>User vault stores reconstruction coordinates</b><p>Encrypted local vault record</p></div></div><p>{status}</p>{vaultExport && <details><summary>Encrypted vault export JSON</summary><pre>{vaultExport}</pre></details>}
  <h3>Architecture Diagram</h3><pre>{`Original Data -> Split -> Random Coordinate Arrangement -> Server Fragment Store
+ User Coordinate Vault -> Policy/Reconstruction Gate -> Temporary Reconstruction`}</pre></main>;
}
