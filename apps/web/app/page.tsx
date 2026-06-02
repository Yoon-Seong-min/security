'use client';
import Link from 'next/link';
import { useT, useLanguage } from '../components/LanguageProvider';

const CLAIMS_EN = [
  [1,  'Split data elements + random coordinate assignment'],
  [2,  'Coordinate display means (rows x columns grid)'],
  [3,  'Coordinate info encrypted (AES-GCM/PBKDF2)'],
  [5,  'Data security method — full pipeline'],
  [6,  'System: server=fragments, user=coordinates'],
  [9,  'Syllable / word / token split modes'],
  [11, 'Passphrase-authenticated reconstruction on request'],
  [14, 'Full data security method with audit log'],
];
const CLAIMS_KO = [
  [1,  '데이터 요소 분할 + 좌표 무작위 배치'],
  [2,  '좌표 표시 수단 (행 x 열 그리드)'],
  [3,  '좌표 정보 암호화 (AES-GCM/PBKDF2)'],
  [5,  '데이터 보안 방법 — 전체 파이프라인'],
  [6,  '시스템: 서버=조각, 사용자=좌표'],
  [9,  '음절 / 단어 / 토큰 분할 모드'],
  [11, '사용자 요청 시 패스프레이즈 인증 복원'],
  [14, '감사 로그 포함 전체 데이터 보안 방법'],
];

const EXTENSIBILITY_EN = [
  ['🤖', 'AI-Agent Access Governance', 'Limiting what agents can reconstruct after credential access — a natural extension of the reconstruction-control primitive.'],
  ['🔗', 'Delegated Workflow Security', 'Separating access grants from data reconstruction rights in multi-party or automated workflows.'],
  ['🛡️', 'Post-Breach Resilience', 'Ensuring a server-side compromise alone does not yield reconstructable plaintext under this model.'],
];
const EXTENSIBILITY_KO = [
  ['🤖', 'AI 에이전트 접근 거버넌스', '자격증명 접근 후 에이전트가 복원할 수 있는 범위를 제한 — 복원제어 원시요소의 자연스러운 확장 방향.'],
  ['🔗', '위임 워크플로우 보안', '다자 또는 자동화 워크플로우에서 접근 권한과 데이터 복원 권한을 분리.'],
  ['🛡️', '침해 후 복원력', '이 모델에서 서버 측 침해만으로는 복원 가능한 평문을 얻을 수 없도록 보장.'],
];

export default function HomePage() {
  const t = useT();
  const { language } = useLanguage();
  const claims = language === 'ko' ? CLAIMS_KO : CLAIMS_EN;
  const extensibility = language === 'ko' ? EXTENSIBILITY_KO : EXTENSIBILITY_EN;
  const ko = language === 'ko';

  return (
    <div className="space-y-10 sm:space-y-14">

      {/* Hero */}
      <div className="text-center space-y-4 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 border border-cosmos-border rounded-full px-4 py-1.5 text-xs sm:text-sm font-mono text-cosmos-dim mb-2">
          <span className="w-2 h-2 rounded-full bg-cosmos-accent badge-live inline-block flex-shrink-0" />
          {t('homeBadge')}
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-cosmos-text leading-tight">
          {t('homeTitle1')}<br/><span className="text-cosmos-accent">{t('homeTitle2')}</span>
        </h1>

        {/* Access != Reconstruction tagline */}
        <div className="inline-block border border-cosmos-accent/30 bg-cosmos-accent/5 rounded-xl px-5 py-3 mt-2">
          <div className="text-base sm:text-lg font-mono text-cosmos-accent font-semibold">
            {ko ? '접근 권한 ≠ 데이터 복원' : 'Access does not automatically equal reconstruction.'}
          </div>
          <div className="text-sm text-cosmos-dim mt-1 max-w-xl mx-auto">
            {ko
              ? '복원제어 레이어의 핵심 원리를 보여주는 PoC — AI 에이전트 거버넌스 및 위임 워크플로우 보안으로 확장 가능한 구조적 데이터 분리 접근법.'
              : 'A reconstruction-control primitive demonstrating structural data separation — extensible toward AI-agent governance and delegated workflow security.'}
          </div>
        </div>

        <p className="text-base sm:text-lg text-cosmos-dim max-w-2xl mx-auto leading-relaxed px-2 mt-2">{t('homeDesc')}</p>
      </div>

      {/* Architecture */}
      <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-5 sm:p-7 space-y-5">
        <h2 className="text-xs font-mono text-cosmos-accent uppercase tracking-widest">{t('homeArchTitle')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="bg-cosmos-bg border border-cosmos-border rounded-lg p-4 space-y-2">
            <div className="text-xs font-mono text-cosmos-dim">{t('homeInput')}</div>
            <div className="text-sm sm:text-base font-mono text-cosmos-text">{t('homeOriginal')}</div>
            <div className="text-xs sm:text-sm text-cosmos-dim">{t('homeAnyText')}</div>
            <div className="text-xs sm:text-sm font-mono text-cosmos-warn mt-2">{t('homeDeleted')}</div>
          </div>
          <div className="text-center space-y-2 py-2">
            <div className="w-12 h-12 rounded-full border-2 border-cosmos-accent glow-blue mx-auto flex items-center justify-center text-cosmos-accent text-xl">⚛</div>
            <div className="text-xs sm:text-sm font-mono text-cosmos-dim">{t('homeEngine')}</div>
            <div className="text-xs font-mono text-cosmos-accent">{t('homeEngineLabel')}</div>
          </div>
          <div className="space-y-3">
            <div className="bg-cosmos-bg border border-blue-900/50 rounded-lg p-3 sm:p-4 glow-blue">
              <div className="text-[10px] sm:text-xs font-mono text-cosmos-accent mb-1">{t('homeServer')}</div>
              <div className="text-sm sm:text-base font-mono text-cosmos-text">{t('homeFragments')}</div>
              <div className="text-xs sm:text-sm text-cosmos-dim mt-1">{t('homeNoOrder')}</div>
            </div>
            <div className="bg-cosmos-bg border border-purple-900/50 rounded-lg p-3 sm:p-4">
              <div className="text-[10px] sm:text-xs font-mono text-cosmos-purple mb-1">{t('homeDevice')}</div>
              <div className="text-sm sm:text-base font-mono text-cosmos-text">{t('homeCoordMap')}</div>
              <div className="text-xs sm:text-sm text-cosmos-dim mt-1">{t('homeNoContent')}</div>
            </div>
          </div>
        </div>
        <div className="border-t border-cosmos-border pt-4 text-center text-sm sm:text-base font-mono text-cosmos-dim">
          {t('homeBoth')} <span className="text-cosmos-success font-bold">{t('homeBothBold')}</span> {t('homeBothEnd')}
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/protect"
          className="group bg-cosmos-surface border border-cosmos-border hover:border-cosmos-accent rounded-xl p-5 sm:p-7 transition-all space-y-3 block">
          <div className="text-2xl sm:text-3xl">🔒</div>
          <div className="text-base sm:text-lg font-semibold text-cosmos-text group-hover:text-cosmos-accent transition-colors">{t('homeProtectTitle')}</div>
          <div className="text-sm sm:text-base text-cosmos-dim">{t('homeProtectDesc')}</div>
        </Link>
        <Link href="/breach-simulation"
          className="group bg-cosmos-surface border border-cosmos-border hover:border-red-500/50 rounded-xl p-5 sm:p-7 transition-all space-y-3 block">
          <div className="text-2xl sm:text-3xl">⚠️</div>
          <div className="text-base sm:text-lg font-semibold text-cosmos-text group-hover:text-cosmos-danger transition-colors">{t('homeBreachTitle')}</div>
          <div className="text-sm sm:text-base text-cosmos-dim">{t('homeBreachDesc')}</div>
        </Link>
        <Link href="/vault"
          className="group bg-cosmos-surface border border-cosmos-border hover:border-purple-500/50 rounded-xl p-5 sm:p-7 transition-all space-y-3 block">
          <div className="text-2xl sm:text-3xl">🗄️</div>
          <div className="text-base sm:text-lg font-semibold text-cosmos-text group-hover:text-cosmos-purple transition-colors">{t('homeVaultTitle')}</div>
          <div className="text-sm sm:text-base text-cosmos-dim">{t('homeVaultDesc')}</div>
        </Link>
      </div>

      {/* Patent claims */}
      <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-5 sm:p-7">
        <h2 className="text-xs font-mono text-cosmos-dim uppercase tracking-widest mb-4">{t('homeClaimsTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs sm:text-sm font-mono">
          {claims.map(([claim, desc]) => (
            <div key={claim} className="flex items-start gap-2 py-2 border-b border-cosmos-border/50 last:border-0">
              <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0 bg-cosmos-success" />
              <span className="text-cosmos-dim flex-shrink-0">Claim {claim}:</span>
              <span className="text-cosmos-text break-anywhere">{desc as string}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Extensibility section */}
      <div className="bg-cosmos-surface border border-cosmos-border rounded-xl p-5 sm:p-7 space-y-5">
        <div>
          <h2 className="text-xs font-mono text-cosmos-accent uppercase tracking-widest mb-1">
            {ko ? '확장 방향 — 잠재적 적용 영역' : 'EXTENSIBILITY — POTENTIAL APPLICATION AREAS'}
          </h2>
          <p className="text-xs sm:text-sm text-cosmos-dim mt-2">
            {ko
              ? '이 MVP는 완성된 AI 에이전트 거버넌스 플랫폼이 아닙니다. 접근 권한과 실제 데이터 복원을 분리하는 복원제어 레이어의 핵심 원리를 보여주는 PoC입니다. 아래는 구현된 기능이 아닌 구조적 확장 방향입니다.'
              : 'This MVP is not a completed AI-agent governance platform. It demonstrates one core primitive: a reconstruction-control layer that separates access from meaningful data reconstruction. The following represent architectural directions, not currently implemented features.'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {extensibility.map(([emoji, title, desc]) => (
            <div key={title as string} className="bg-cosmos-bg border border-cosmos-border rounded-xl p-4 space-y-2">
              <div className="text-xl">{emoji}</div>
              <div className="text-sm font-semibold text-cosmos-text">{title as string}</div>
              <div className="text-xs text-cosmos-dim leading-relaxed">{desc as string}</div>
            </div>
          ))}
        </div>
        <div className="border-t border-cosmos-border pt-4">
          <p className="text-xs font-mono text-cosmos-dim/60 text-center">
            {ko
              ? 'Note: 위 항목들은 현재 구현된 기능이 아닌 잠재적 확장 방향입니다.'
              : 'Note: Items above represent potential architectural directions, not currently implemented features of this PoC.'}
          </p>
        </div>
      </div>

    </div>
  );
}
