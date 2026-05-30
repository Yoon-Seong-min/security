'use client';
import { useState } from 'react';
import { protectData, type SplitMode } from '@cosmoslock/core';
import { encryptCoordinateMap, saveToIndexedDB, exportVaultFile } from '@cosmoslock/vault';
import { useTranslations } from '../../components/LanguageProvider';

export default function ProtectPage() {
  const t = useTranslations();
  const [plaintext, setPlaintext] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('char');
  const [decoyRatio, setDecoyRatio] = useState(0.2);
  const [passphrase, setPassphrase] = useState('');
  const [status, setStatus] = useState<string>('');
  const [contentId, setContentId] = useState<string>('');
  const [vaultExport, setVaultExport] = useState('');

  const onProtect = async () => {
    const { serverFragmentBlob, userCoordinateMap } = protectData({ plaintext, splitMode, decoyRatio });
    await fetch('/api/fragments', { method: 'POST', body: JSON.stringify(serverFragmentBlob) });
    const encrypted = await encryptCoordinateMap(serverFragmentBlob.contentId, userCoordinateMap, passphrase);
    await saveToIndexedDB(encrypted);
    setVaultExport(exportVaultFile(encrypted));
    setContentId(serverFragmentBlob.contentId);
    setPlaintext('');
    setStatus(t('statusProtected'));
  };

  return (
    <main>
      <h2>{t('protectHeading')}</h2>
      <textarea
        placeholder={t('plaintextPlaceholder')}
        value={plaintext}
        onChange={(e) => setPlaintext(e.target.value)}
        rows={8}
        cols={70}
      />
      <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <label>
          {t('splitModeLabel')}:
          <select value={splitMode} onChange={(e) => setSplitMode(e.target.value as SplitMode)} style={{ marginLeft: '8px' }}>
            <option value='char'>{t('splitModeChar')}</option>
            <option value='word'>{t('splitModeWord')}</option>
            <option value='token'>{t('splitModeToken')}</option>
          </select>
        </label>
        <label>
          {t('decoyRatioLabel')}:
          <input type='number' step='0.1' min='0' max='1' value={decoyRatio} onChange={(e) => setDecoyRatio(Number(e.target.value))} style={{ marginLeft: '8px', width: '80px' }} />
        </label>
        <input
          placeholder={t('passphrasePlaceholder')}
          type='password'
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          style={{ padding: '6px', minWidth: '180px' }}
        />
        <button onClick={onProtect} style={{ padding: '8px 14px' }}>
          {t('protectButton')}
        </button>
      </div>
      <h3 style={{ marginTop: '24px' }}>{t('storageSeparationHeading')}</h3>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ border: '1px solid #ccc', padding: '10px', minWidth: '220px' }}>
          <b>{t('serverStores')}</b>
          <p>{contentId || '-'}</p>
        </div>
        <div style={{ border: '1px solid #ccc', padding: '10px', minWidth: '220px' }}>
          <b>{t('userVaultStores')}</b>
          <p>{t('encryptedLocalVault')}</p>
        </div>
      </div>
      <p>{status}</p>
      {vaultExport && (
        <details>
          <summary>{t('encryptedVaultExport')}</summary>
          <pre>{vaultExport}</pre>
        </details>
      )}
      <h3 style={{ marginTop: '24px' }}>{t('architectureHeading')}</h3>
      <pre>{`Original Data -> Split -> Random Coordinate Arrangement -> Server Fragment Store
+ User Coordinate Vault -> Policy/Reconstruction Gate -> Temporary Reconstruction`}</pre>
    </main>
  );
}
