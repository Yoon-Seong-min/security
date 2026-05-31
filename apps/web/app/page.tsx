'use client';
import Link from 'next/link';
import { useT } from '../components/LanguageProvider';
export default function HomePage() {
  const t = useT();
  return (
    <div className="space-y-14">
      <div className="text-center space-y-5 pt-8">
        <div className="inline-flex items-center gap-2 border border-cosmos-border rounded-full px-5 py-2 text-sm font-mono text-cosmos-dim mb-4">
          <span className="w-2 h-2 rounded-full bg-cosmos-accent badge-live inline-block" />{t('homeBadge')}
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-cosmos-text leading-tight">{t('homeTitle1')}<br/><span className="text-cosmos-accent">{t('homeTitle2')}</span></h1>
        <p className="text-lg text-cosmos-dim max-w-2xl mx-auto leading-relaxed">{t('homeDesc')}</p>
      </div>
      <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-7 space-y-6">
        <h2 className="text-sm font-mono text-cosmos-dim uppercase tracking-widest">{t('homeArchTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          <div className="bg-cosmos-bg border border-cosmos-border rounded-lg p-5 space-y-2">
            <div className="text-sm font-mono text-cosmos-dim">{t('homeInput')}</div>
            <div className="text-base font-mono text-cosmos-text">{t('homeOriginal')}</div>
            <div className="text-sm text-cosmos-dim">{t('homeAnyText')}</div>
            <div className="text-sm font-mono text-cosmos-warn mt-2">{t('homeDeleted')}</div>
          </div>
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full border-2 border-cosmos-accent glow-blue mx-auto flex items-center justify-center text-cosmos-accent text-2xl">⚛</div>
            <div className="text-sm font-mono text-cosmos-dim">{t('homeEngine')}</div>
            <div className="text-xs font-mono text-cosmos-accent">{t('homeEngineLabel')}</div>
          </div>
          <div className="space-y-3">
            <div className="bg-cosmos-bg border border-blue-900/50 rounded-lg p-4 glow-blue">
              <div className="text-xs font-mono text-cosmos-accent mb-1">{t('homeServer')}</div>
              <div className="text-base font-mono text-cosmos-text">{t('homeFragments')}</div>
              <div className="text-sm text-cosmos-dim mt-1">{t('homeNoOrder')}</div>
            </div>
            <div className="bg-cosmos-bg border border-purple-900/50 rounded-lg p-4">
              <div className="text-xs font-mono text-cosmos-purple mb-1">{t('homeDevice')}</div>
              <div className="text-base font-mono text-cosmos-text">{t('homeCoordMap')}</div>
              <div className="text-sm text-cosmos-dim mt-1">{t('homeNoContent')}</div>
            </div>
          </div>
        </div>
        <div className="border-t border-cosmos-border pt-4 text-center text-base font-mono text-cosmos-dim">
          {t('homeBoth')} <span className="text-cosmos-success font-bold">{t('homeBothBold')}</span> {t('homeBothEnd')}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link href="/protect" className="group bg-cosmos-surface border border-cosmos-border hover:border-cosmos-accent rounded-xl p-7 transition-all space-y-3">
          <div className="text-3xl">🔒</div>
          <div className="text-lg font-semibold text-cosmos-text group-hover:text-cosmos-accent transition-colors">{t('homeProtectTitle')}</div>
          <div className="text-base text-cosmos-dim">{t('homeProtectDesc')}</div>
        </Link>
        <Link href="/breach-simulation" className="group bg-cosmos-surface border border-cosmos-border hover:border-red-500/50 rounded-xl p-7 transition-all space-y-3">
          <div className="text-3xl">⚠️</div>
          <div className="text-lg font-semibold text-cosmos-text group-hover:text-cosmos-danger transition-colors">{t('homeBreachTitle')}</div>
          <div className="text-base text-cosmos-dim">{t('homeBreachDesc')}</div>
        </Link>
        <Link href="/vault" className="group bg-cosmos-surface border border-cosmos-border hover:border-purple-500/50 rounded-xl p-7 transition-all space-y-3">
          <div className="text-3xl">🗄️</div>
          <div className="text-lg font-semibold text-cosmos-text group-hover:text-cosmos-purple transition-colors">{t('homeVaultTitle')}</div>
          <div className="text-base text-cosmos-dim">{t('homeVaultDesc')}</div>
        </Link>
      </div>
      <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-7">
        <h2 className="text-sm font-mono text-cosmos-dim uppercase tracking-widest mb-5">{t('homeClaimsTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
          {[
            [1,'데이터 요소 분할 + 좌표 무작위 배치'],
            [2,'좌표 표시 수단 (행 × 열 그리드)'],
            [3,'좌표 정보 암호화 (AES-GCM/PBKDF2)'],
            [5,'데이터 보안 방법 — 전체 파이프라인'],
            [6,'시스템: 서버=조각, 사용자=좌표'],
            [9,'음절 / 단어 / 토큰 분할 모드'],
            [11,'사용자 요청 시 패스프레이즈 인증 복원'],
            [14,'감사 로그 포함 전체 데이터 보안 방법'],
          ].map(([claim, desc]) => (
            <div key={claim} className="flex items-start gap-2 py-2 border-b border-cosmos-border/50 last:border-0">
              <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0 bg-cosmos-success" />
              <span className="text-cosmos-dim">Claim {claim}:</span>
              <span className="text-cosmos-text">{desc as string}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
