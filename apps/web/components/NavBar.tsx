'use client';
import { useLanguage, useT } from './LanguageProvider';
export default function NavBar() {
  const { language, setLanguage } = useLanguage();
  const t = useT();
  return (
    <nav className="border-b border-cosmos-border bg-cosmos-surface/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group">
          <span className="text-cosmos-accent font-mono font-bold text-xl tracking-tight group-hover:text-blue-400 transition-colors">{t('navTitle')}</span>
          <span className="text-xs font-mono text-cosmos-dim border border-cosmos-border rounded px-2 py-0.5 hidden sm:inline">{t('navPatent')}</span>
        </a>
        <div className="flex items-center gap-1">
          {([['protect','navProtect'],['breach-simulation','navBreach'],['vault','navVault'],['admin','navAdmin']] as const).map(([href, key]) => (
            <a key={href} href={`/${href}`} className="px-3 py-2 text-base font-mono text-cosmos-dim hover:text-cosmos-text hover:bg-cosmos-muted/50 rounded transition-colors">{t(key)}</a>
          ))}
          <div className="ml-2 flex items-center border border-cosmos-border rounded-lg overflow-hidden">
            <button onClick={() => setLanguage('ko')} className={`px-3 py-1.5 text-sm font-mono transition-colors ${language==='ko'?'bg-cosmos-accent text-white':'text-cosmos-dim hover:text-cosmos-text hover:bg-cosmos-muted/50'}`}>한국어</button>
            <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 text-sm font-mono transition-colors ${language==='en'?'bg-cosmos-accent text-white':'text-cosmos-dim hover:text-cosmos-text hover:bg-cosmos-muted/50'}`}>EN</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
