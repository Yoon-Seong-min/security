import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '../components/LanguageProvider';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
export const metadata: Metadata = { title: 'CosmosLock — Coordinate Vault', description: 'Patent US 12,411,980 B2' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko"><body className="grid-bg min-h-screen">
      <LanguageProvider><NavBar /><main className="max-w-6xl mx-auto px-4 py-10">{children}</main><Footer /></LanguageProvider>
    </body></html>
  );
}
