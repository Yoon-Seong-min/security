import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '../components/LanguageProvider';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'CosmosLock — Coordinate Vault',
  description: 'Patent US 12,411,980 B2 — Data atomization & reconstruction gate',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grid-bg min-h-screen">
        <LanguageProvider>
          <NavBar />
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
