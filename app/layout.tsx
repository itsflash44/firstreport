import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FirstReport — आपकी आवाज़, आपका हक़',
  description:
    'Voice-first AI legal assistant for India. 11 languages. 5 specialist modes. Built on Gemma 4. BNSS 2023 / POCSO / PWDVA / MWPSC compliant.',
  keywords: ['BNSS', 'FIR', 'legal aid', 'POCSO', 'voice AI', 'Hindi', 'Gemma', 'Sarvam'],
  authors: [{ name: 'FirstReport' }],
  openGraph: {
    title: 'FirstReport — Your Voice. Your Right.',
    description: '11-language voice-first legal assistant for India.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#1A2A44',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <body className="min-h-screen bg-off-white text-primary antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
