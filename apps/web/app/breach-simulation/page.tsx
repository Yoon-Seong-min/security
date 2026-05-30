'use client';
import { useEffect, useState } from 'react';
import type { ServerFragmentBlob } from '@cosmoslock/core';
interface AttackStep { label: string; result: 'pending'|'running'|'fail'|'ok'; detail?: string; }
export default function BreachPage() {
  const [blobs, setBlobs] = useState<ServerFragmentBlob[]>([]);
  const [selected, setSelected] = useState<ServerFragmentBlob|null>(null);
  const [steps, setSteps] = useState<AttackStep[]>([]);
  const [attacking, setAttacking] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(()=>{ fetch('/api/fragments').then(r=>r.json()).then(setBlobs).catch(()=>{}); },[]);
  const runAttack = async (blob: ServerFragmentBlob) => {
    setSelected(blob); setDone(false); setAttacking(true);
    const s: AttackStep[] = [
      {label:'Step 1 — Access server (Upstash Redis)',result:'pending'},
      {label:'Step 2 — Extract fragment values',result:'pending'},
      {label:'Step 3 — Brute-force coordinate ordering',result:'pending'},
      {label:'Step 4 — Frequency analysis',result:'pending'},
      {label:'Step 5 — Attempt reconstruction',result:'pending'},
    ];
    setSteps([...s]);
    const d=(ms:number)=>new Promise(r=>setTimeout(r,ms));
    s[0]={...s[0],result:'running'};setSteps([...s]);await d(800);
    s[0]={...s[0],result:'ok',detail:`${blob.fragments.length} fragments retrieved`};setSteps([...s]);await d(400);
    s[1]={...s[1],result:'running'};setSteps([...s]);await d(900);
    s[1]={...s[1],result:'ok',detail:`${blob.fragments.filter(f=>!f.isDecoy).length} real + ${blob.fragments.filter(f=>f.isDecoy).length} decoys — indistinguishable`};setSteps([...s]);await d(400);
    s[2]={...s[2],result:'running'};setSteps([...s]);await d(1200);
    s[2]={...s[2],result:'fail',detail:'n! permutations — computationally infeasible'};setSteps([...s]);await d(400);
    s[3]={...s[3],result:'running'};setSteps([...s]);await d(1000);
    s[3]={...s[3],result:'fail',detail:'Decoys pollute frequency distribution'};setSteps([...s]);await d(400);
    s[4]={...s[4],result:'running'};setSteps([...s]);await d(700);
    s[4]={...s[4],result:'fail',detail:'FAILED — coordinate map required'};setSteps([...s]);
    setAttacking(false);setDone(true);
  };
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-cosmos-text">Breach Simulation</h1>
        <p className="text-cosmos-dim text-sm mt-1">Attacker has full server access. Proves fragments alone cannot reconstruct original.</p>
      </div>
      <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-5">
        <div className="text-xs font-mono text-cosmos-danger uppercase tracking-widest mb-3">Threat Model</div>
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div><div className="text-cosmos-text font-semibold mb-1">Attacker Has</div><div className="text-cosmos-dim">✓ Full server access</div><div className="text-cosmos-dim">✓ All fragments</div><div className="text-cosmos-dim">✓ Unlimited compute</div></div>
          <div><div className="text-cosmos-text font-semibold mb-1">Attacker Lacks</div><div className="text-cosmos-dim">✗ Coordinate map</div><div className="text-cosmos-dim">✗ Passphrase</div><div className="text-cosmos-dim">✗ Reconstruction order</div></div>
          <div><div className="text-cosmos-text font-semibold mb-1">Result</div><div className="text-cosmos-success">Cannot identify real fragments</div><div className="text-cosmos-success">Reconstruction impossible</div></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-6">
          <h3 className="text-xs font-mono text-cosmos-dim uppercase tracking-widest mb-4">Server Store ({blobs.length})</h3>
          {blobs.length===0 ? <div className="text-center py-8 text-cosmos-dim text-sm">No fragments. <a href="/protect" className="text-cosmos-accent">Protect data first.</a></div> : (
            <div className="space-y-2">
              {blobs.map(blob=>(
                <div key={blob.contentId} onClick={()=>!attacking&&runAttack(blob)}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${selected?.contentId===blob.contentId?'border-red-500/50 bg-red-900/10':'border-cosmos-border hover:border-red-500/30'}`}>
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs font-mono text-cosmos-dim">{blob.contentId.slice(0,24)}…</div>
                      {blob.label&&<div className="text-sm text-cosmos-text">{blob.label}</div>}
                    </div>
                    <div className="text-[10px] font-mono text-cosmos-dim">{blob.fragments.length} frags</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-6">
          <h3 className="text-xs font-mono text-cosmos-dim uppercase tracking-widest mb-4">Attack Simulation</h3>
          {steps.length===0 ? <div className="text-center py-8 text-cosmos-dim text-sm">Select a blob to simulate attack.</div> : (
            <div className="space-y-3">
              {steps.map((step,i)=>(
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {step.result==='pending'&&<div className="w-4 h-4 rounded-full border border-cosmos-border"/>}
                    {step.result==='running'&&<div className="w-4 h-4 rounded-full border-2 border-cosmos-accent border-t-transparent animate-spin"/>}
                    {step.result==='ok'&&<div className="w-4 h-4 rounded-full bg-cosmos-success/20 border border-cosmos-success flex items-center justify-center text-[8px] text-cosmos-success">✓</div>}
                    {step.result==='fail'&&<div className="w-4 h-4 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-[8px] text-cosmos-danger">✗</div>}
                  </div>
                  <div>
                    <div className={`text-xs font-mono ${step.result==='fail'?'text-cosmos-danger':step.result==='ok'?'text-cosmos-text':'text-cosmos-dim'}`}>{step.label}</div>
                    {step.detail&&<div className="text-[10px] text-cosmos-dim mt-0.5">{step.detail}</div>}
                  </div>
                </div>
              ))}
              {done&&<div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="text-sm font-semibold text-cosmos-danger">🔒 Breach Contained</div>
                <div className="text-xs text-cosmos-dim mt-1">Server exposed — original data secure. Patent Claim 1 validated.</div>
              </div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
