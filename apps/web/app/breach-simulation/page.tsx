'use client';
import { useEffect, useState } from 'react';
import type { ServerFragmentBlob } from '@cosmoslock/core';
import { useT } from '../../components/LanguageProvider';
interface AttackStep { label:string; result:'pending'|'running'|'fail'|'ok'; detail?:string; }
export default function BreachPage() {
  const t = useT();
  const [blobs, setBlobs] = useState<ServerFragmentBlob[]>([]);
  const [selected, setSelected] = useState<ServerFragmentBlob|null>(null);
  const [steps, setSteps] = useState<AttackStep[]>([]);
  const [attacking, setAttacking] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(()=>{ fetch('/api/fragments').then(r=>r.json()).then(d=>setBlobs(Array.isArray(d)?d:[])).catch(()=>{}); },[]);
  const runAttack = async (blob:ServerFragmentBlob) => {
    setSelected(blob); setDone(false); setAttacking(true);
    const s:AttackStep[] = [t('breachStep1'),t('breachStep2'),t('breachStep3'),t('breachStep4'),t('breachStep5')].map(label=>({label,result:'pending' as const}));
    setSteps([...s]);
    const d=(ms:number)=>new Promise(r=>setTimeout(r,ms));
    const real=blob.fragments.filter(f=>!f.isDecoy).length;
    s[0]={...s[0],result:'running'};setSteps([...s]);await d(800);
    s[0]={...s[0],result:'ok',detail:`${blob.fragments.length} ${t('breachFragsRetrieved')}`};setSteps([...s]);await d(400);
    s[1]={...s[1],result:'running'};setSteps([...s]);await d(900);
    s[1]={...s[1],result:'ok',detail:`${real} ${t('breachIndistinguishable')}`};setSteps([...s]);await d(400);
    s[2]={...s[2],result:'running'};setSteps([...s]);await d(1200);
    s[2]={...s[2],result:'fail',detail:t('breachInfeasible')};setSteps([...s]);await d(400);
    s[3]={...s[3],result:'running'};setSteps([...s]);await d(1000);
    s[3]={...s[3],result:'fail',detail:t('breachPollute')};setSteps([...s]);await d(400);
    s[4]={...s[4],result:'running'};setSteps([...s]);await d(700);
    s[4]={...s[4],result:'fail',detail:t('breachFailed')};setSteps([...s]);
    setAttacking(false);setDone(true);
  };
  return (
    <div className="space-y-10">
      <div><h1 className="text-3xl font-bold text-cosmos-text">{t('breachTitle')}</h1><p className="text-lg text-cosmos-dim mt-2">{t('breachDesc')}</p></div>
      <div className="bg-red-900/10 border border-red-500/20 rounded-xl p-6">
        <div className="text-sm font-mono text-cosmos-danger uppercase tracking-widest mb-4">{t('breachThreat')}</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-base">
          <div><div className="text-cosmos-text font-semibold mb-2">{t('breachHas')}</div><div className="text-cosmos-dim">{t('breachHas1')}</div><div className="text-cosmos-dim">{t('breachHas2')}</div><div className="text-cosmos-dim">{t('breachHas3')}</div></div>
          <div><div className="text-cosmos-text font-semibold mb-2">{t('breachLacks')}</div><div className="text-cosmos-dim">{t('breachLacks1')}</div><div className="text-cosmos-dim">{t('breachLacks2')}</div><div className="text-cosmos-dim">{t('breachLacks3')}</div></div>
          <div><div className="text-cosmos-text font-semibold mb-2">{t('breachResult')}</div><div className="text-cosmos-success">{t('breachResult1')}</div><div className="text-cosmos-success">{t('breachResult2')}</div></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
        <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-6">
          <h3 className="text-sm font-mono text-cosmos-dim uppercase tracking-widest mb-5">{t('breachStore')} ({blobs.length})</h3>
          {blobs.length===0?<div className="text-center py-10 text-base text-cosmos-dim">{t('breachNoData')} <a href="/protect" className="text-cosmos-accent hover:underline">{t('breachProtectFirst')}</a></div>:(
            <div className="space-y-3">{blobs.map(blob=>(
              <div key={blob.contentId} onClick={()=>!attacking&&runAttack(blob)}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${selected?.contentId===blob.contentId?'border-red-500/50 bg-red-900/10':'border-cosmos-border hover:border-red-500/30'}`}>
                <div className="flex justify-between">
                  <div><div className="text-sm font-mono text-cosmos-dim">{blob.contentId.slice(0,20)}…</div>{blob.label&&<div className="text-base text-cosmos-text mt-0.5">{blob.label}</div>}</div>
                  <div className="text-sm font-mono text-cosmos-dim">{blob.fragments.length} frags</div>
                </div>
              </div>
            ))}</div>
          )}
        </div>
        <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-6">
          <h3 className="text-sm font-mono text-cosmos-dim uppercase tracking-widest mb-5">{t('breachAttack')}</h3>
          {steps.length===0?<div className="text-center py-10 text-base text-cosmos-dim">{t('breachSelect')}</div>:(
            <div className="space-y-4">
              {steps.map((step,i)=>(
                <div key={i} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {step.result==='pending'&&<div className="w-5 h-5 rounded-full border border-cosmos-border"/>}
                    {step.result==='running'&&<div className="w-5 h-5 rounded-full border-2 border-cosmos-accent border-t-transparent animate-spin"/>}
                    {step.result==='ok'&&<div className="w-5 h-5 rounded-full bg-cosmos-success/20 border border-cosmos-success flex items-center justify-center text-xs text-cosmos-success">✓</div>}
                    {step.result==='fail'&&<div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-xs text-cosmos-danger">✗</div>}
                  </div>
                  <div>
                    <div className={`text-base font-mono ${step.result==='fail'?'text-cosmos-danger':step.result==='ok'?'text-cosmos-text':'text-cosmos-dim'}`}>{step.label}</div>
                    {step.detail&&<div className="text-sm text-cosmos-dim mt-0.5">{step.detail}</div>}
                  </div>
                </div>
              ))}
              {done&&<div className="mt-5 bg-red-900/20 border border-red-500/30 rounded-xl p-5"><div className="text-base font-semibold text-cosmos-danger">{t('breachContained')}</div><div className="text-sm text-cosmos-dim mt-1">{t('breachContainedDesc')}</div></div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
