export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body style={{fontFamily:'Arial',padding:'20px'}}>{children}</body></html>;
}
