import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'CosmosLock', description: 'Patent US 12,411,980 B2' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body className="grid-bg min-h-screen">
      <nav className="border-b border-cosmos-border bg-cosmos-surface/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="text-cosmos-accent font-mono font-bold text-lg">COSMOS<span className="text-cosmos-dim">LOCK</span></a>
          <div className="flex gap-1">
            {[['protect','Protect'],['breach-simulation','Breach Sim'],['vault','Vault']].map(([href,label]) => (
              <a key={href} href={`/${href}`} className="px-3 py-1.5 text-sm font-mono text-cosmos-dim hover:text-cosmos-text hover:bg-cosmos-muted/50 rounded transition-colors">{label}</a>
            ))}
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      <footer className="border-t border-cosmos-border mt-16 py-6">
        <div className="max-w-6xl mx-auto px-4 text-xs font-mono text-cosmos-dim">CosmosLock MVP v0.2 — Patent US 12,411,980 B2</div>
      </footer>
    </body></html>
  );
}
