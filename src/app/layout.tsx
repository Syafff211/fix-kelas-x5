import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        
        {/* ... other meta tags ... */}
      </head>
      <body>
        {children}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
