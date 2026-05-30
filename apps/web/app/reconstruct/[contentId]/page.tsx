'use client';
import { useState } from 'react';
import { reconstructData } from '@cosmoslock/core';
import { decryptCoordinateMap, loadFromIndexedDB } from '@cosmoslock/vault';
import { useTranslations } from '../../../components/LanguageProvider';

export default function ReconstructPage(props: any) {
  const { params } = props as { params: { contentId: string } };
  const t = useTranslations();
  const [passphrase, setPassphrase] = useState('');
  const [plain, setPlain] = useState('');
  const [audit, setAudit] = useState('');

  const go = async () => {
    try {
      const serverFragmentBlob = await fetch(`/api/fragments/${params.contentId}`).then((r) => r.json());
      const record = await loadFromIndexedDB(params.contentId);
      if (!record) throw new Error('Missing local vault record');
      const userCoordinateMap = await decryptCoordinateMap(record, passphrase);
      const { plaintext } = reconstructData({ serverFragmentBlob, userCoordinateMap });
      setPlain(plaintext);
      setAudit('success');
      await fetch('/api/reconstruct-log', {
        method: 'POST',
        body: JSON.stringify({ contentId: params.contentId, timestamp: new Date().toISOString(), success: true, reason: 'ok' }),
      });
    } catch (e: any) {
      setAudit(`failure: ${e.message}`);
      await fetch('/api/reconstruct-log', {
        method: 'POST',
        body: JSON.stringify({ contentId: params.contentId, timestamp: new Date().toISOString(), success: false, reason: e.message }),
      });
    }
  };

  return (
    <main>
      <h2>{t('reconstructHeading')}</h2>
      <input
        type='password'
        value={passphrase}
        onChange={(e) => setPassphrase(e.target.value)}
        placeholder={t('passphrasePlaceholder')}
        style={{ padding: '6px', minWidth: '220px', marginRight: '12px' }}
      />
      <button onClick={go} style={{ padding: '8px 14px' }}>
        {t('unlockButton')}
      </button>
      {plain && <pre style={{ marginTop: '16px' }}>{plain}</pre>}
      <p style={{ marginTop: '12px' }}>
        {t('auditEvent')}: {audit}
      </p>
    </main>
  );
}
