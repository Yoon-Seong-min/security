'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from '../../components/LanguageProvider';

export default function BreachPage() {
  const t = useTranslations();
  const [blob, setBlob] = useState<any>();
  const [result, setResult] = useState('');

  useEffect(() => {
    fetch('/api/fragments')
      .then((r) => r.json())
      .then((d) => setBlob(d[0]));
  }, []);

  return (
    <main>
      <h2>{t('breachHeading')}</h2>
      <p>{t('breachMessage')}</p>
      {blob && <pre>{JSON.stringify(blob.fragments.slice(0, 30), null, 2)}</pre>}
      <button onClick={() => setResult(t('missingCoordinates'))}>{t('attemptReconstruction')}</button>
      <p>{result}</p>
    </main>
  );
}
