'use client';
import { useState } from 'react';
import { reconstructData } from '@cosmoslock/core';
import { decryptCoordinateMap, loadFromIndexedDB } from '@cosmoslock/vault';

export default function ReconstructPage({ params }: { params: { contentId: string } }) {
  const [passphrase, setPassphrase] = useState(''); const [plain, setPlain] = useState(''); const [audit, setAudit] = useState('');
  const go = async () => {
    try {
      const serverFragmentBlob = await fetch(`/api/fragments/${params.contentId}`).then(r=>r.json());
      const record = await loadFromIndexedDB(params.contentId); if (!record) throw new Error('Missing local vault record');
      const userCoordinateMap = await decryptCoordinateMap(record, passphrase);
      const { plaintext } = reconstructData({ serverFragmentBlob, userCoordinateMap });
      setPlain(plaintext);
      setAudit('success');
      await fetch('/api/reconstruct-log', { method: 'POST', body: JSON.stringify({ contentId: params.contentId, timestamp: new Date().toISOString(), success: true, reason: 'ok' }) });
    } catch (e: any) {
      setAudit(`failure: ${e.message}`);
      await fetch('/api/reconstruct-log', { method: 'POST', body: JSON.stringify({ contentId: params.contentId, timestamp: new Date().toISOString(), success: false, reason: e.message }) });
    }
  };
  return <main><h2>Reconstruct</h2><input type='password' value={passphrase} onChange={(e)=>setPassphrase(e.target.value)} placeholder='Passphrase'/><button onClick={go}>Unlock and reconstruct</button>{plain && <pre>{plain}</pre>}<p>Audit event: {audit}</p></main>;
}
