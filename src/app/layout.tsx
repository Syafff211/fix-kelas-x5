import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { NoiseTexture } from '@/components/layout/NoiseTexture';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'X-5 SMAN 1 Purbalingga - Premium Digital Classroom',
  description: 'Platform manajemen kelas digital premium untuk Kelas X-5 SMAN 1 Purbalingga. Kelola kehadiran, tugas, nilai, dan galeri kelas dengan mudah.',
  keywords: ['kelas digital', 'sman 1 purbalingga', 'manajemen kelas', 'pendidikan'],
  authors: [{ name: 'X-5 SMAN 1 Purbalingga' }],
  openGraph: {
    title: 'X-5 SMAN 1 Purbalingga',
    description: 'Platform manajemen kelas digital premium',
    type: 'website',
    locale: 'id_ID',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <NoiseTexture />
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: 'rgba(17, 17, 27, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                },
              }}
            />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
