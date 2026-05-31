'use client';
import { useState } from 'react';
import { useLanguage, useT } from './LanguageProvider';

export default function NavBar() {
  const { language, setLanguage } = useLanguage();
  const t = useT();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/protect',           key: 'navProtect'  as const },
    { href: '/breach-simulation', key: 'navBreach'   as const },
    { href: '/vault',             key: 'navVault'    as const },
    { href: '/admin',             key: 'navAdmin'    as const },
  ];

  return (
    <nav className="border-b border-cosmos-border bg-cosmos-surface/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 group flex-shrink-0">
          <span className="text-cosmos-accent font-mono font-bold text-lg tracking-tight group-hover:text-blue-400 transition-colors">
            COSMOS<span className="text-cosmos-dim">LOCK</span>
          </span>
          <span className="text-[10px] font-mono text-cosmos-dim border border-cosmos-border rounded px-1.5 py-0.5 hidden sm:inline">
            {t('navPatent')}
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, key }) => (
            <a key={href} href={href}
              className="px-3 py-2 text-sm font-mono text-cosmos-dim hover:text-cosmos-text hover:bg-cosmos-muted/50 rounded transition-colors">
              {t(key)}
            </a>
          ))}
          <div className="ml-2 flex items-center border border-cosmos-border rounded-lg overflow-hidden">
            <button onClick={() => setLanguage('ko')}
              className={`px-3 py-1.5 text-sm font-mono transition-colors ${language === 'ko' ? 'bg-cosmos-accent text-white' : 'text-cosmos-dim hover:bg-cosmos-muted/50'}`}>
              한국어
            </button>
            <button onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 text-sm font-mono transition-colors ${language === 'en' ? 'bg-cosmos-accent text-white' : 'text-cosmos-dim hover:bg-cosmos-muted/50'}`}>
              EN
            </button>
          </div>
        </div>

        {/* Mobile: language + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <div className="flex items-center border border-cosmos-border rounded-lg overflow-hidden">
            <button onClick={() => setLanguage('ko')}
              className={`px-2 py-1 text-xs font-mono transition-colors ${language === 'ko' ? 'bg-cosmos-accent text-white' : 'text-cosmos-dim'}`}>
              한
            </button>
            <button onClick={() => setLanguage('en')}
              className={`px-2 py-1 text-xs font-mono transition-colors ${language === 'en' ? 'bg-cosmos-accent text-white' : 'text-cosmos-dim'}`}>
              EN
            </button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-cosmos-dim hover:text-cosmos-text border border-cosmos-border rounded-lg transition-colors"
            aria-label="Toggle menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-cosmos-border bg-cosmos-surface/95 backdrop-blur">
          {navLinks.map(({ href, key }) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-base font-mono text-cosmos-dim hover:text-cosmos-text hover:bg-cosmos-muted/30 transition-colors border-b border-cosmos-border/50 last:border-0">
              {t(key)}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
