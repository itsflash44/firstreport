import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export const metadata: Metadata = {
  title: 'FirstReport — आपकी आवाज़, आपका हक़',
  description:
    'Voice-first AI legal assistant for India. 11 languages. 5 specialist modes. Built on Gemma 4. BNSS 2023 / POCSO / PWDVA / MWPSC compliant.',
  keywords: ['BNSS', 'FIR', 'legal aid', 'POCSO', 'voice AI', 'Hindi', 'Gemma', 'Sarvam'],
  authors: [{ name: 'FirstReport' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FirstReport',
  },
  openGraph: {
    title: 'FirstReport — Your Voice. Your Right.',
    description: '11-language voice-first legal assistant for India.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0F1F3D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-off-white text-primary antialiased font-sans">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
