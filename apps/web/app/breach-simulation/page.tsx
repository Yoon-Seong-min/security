'use client';
import { useEffect, useState } from 'react';

export default function BreachPage() {
  const [blob, setBlob] = useState<any>(); const [result, setResult] = useState('');
  useEffect(() => { fetch('/api/fragments').then(r=>r.json()).then((d)=>setBlob(d[0])); }, []);
  return <main><h2>Breach Simulation</h2><p>Server-side fragments alone cannot reconstruct the original sequence.</p>{blob && <pre>{JSON.stringify(blob.fragments.slice(0,30), null, 2)}</pre>}<button onClick={()=>setResult('Missing user-held reconstruction coordinates.')}>Attempt reconstruction</button><p>{result}</p></main>;
}
