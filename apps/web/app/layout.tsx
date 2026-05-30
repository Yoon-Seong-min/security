import { LanguageProvider } from '../components/LanguageProvider';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ fontFamily: 'Arial', padding: '20px' }}>
        <LanguageProvider>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>COSMOS LOCK Coordinate Vault MVP</div>
            <LanguageSwitcher />
          </header>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
