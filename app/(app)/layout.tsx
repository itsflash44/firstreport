'use client';

import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import FirstReportLogo from '@/components/FirstReportLogo';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { audioManager } from '@/lib/audioManager';
import { uiStr } from '@/lib/ui-strings';
import type { LangCode } from '@/lib/i18n';

const SettingsDrawer  = lazy(() => import('@/components/SettingsDrawer'));
const OfflineQueueCard = lazy(() => import('@/components/OfflineQueueCard'));

/* ── SVG icons ────────────────────────────────────────────────────── */
const IconHome = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15v-6h-6v6H3.75A.75.75 0 013 21V9.75z" />
  </svg>
);
const IconChat = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641l-.683 2.733 3.38-.845a9.17 9.17 0 002.444.24z" />
  </svg>
);
const IconClipboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
const IconDocument = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);
const IconHistory = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconSettings = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const NAV_ITEMS = [
  { href: '/home',      labelKey: 'home'           as const, Icon: IconHome      },
  { href: '/chat',      labelKey: 'newReport'      as const, Icon: IconChat      },
  { href: '/classify',  labelKey: 'classification' as const, Icon: IconClipboard },
  { href: '/documents', labelKey: 'documents'      as const, Icon: IconDocument  },
  { href: '/history',   labelKey: 'history'        as const, Icon: IconHistory   },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lang, setLang] = useState<LangCode>('hi-IN');
  const pathname = usePathname();

  useEffect(() => {
    const saved  = localStorage.getItem('fr_lang') as LangCode | null;
    const urlLang = new URLSearchParams(window.location.search).get('lang') as LangCode | null;
    if (urlLang) setLang(urlLang);
    else if (saved) setLang(saved);
  }, []);

  useEffect(() => { audioManager.stopAll(); }, [pathname]);

  const handleLangChange = useCallback((next: LangCode) => {
    setLang(next);
    localStorage.setItem('fr_lang', next);
  }, []);

  return (
    <div className="min-h-screen bg-ivory">

      {/* ── TOP HEADER ──────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-4 gap-3"
              style={{ background: 'rgba(15,31,61,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>

        {/* Hamburger */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          className="w-9 h-9 flex flex-col items-center justify-center gap-[5px] rounded-sm
                     hover:bg-white/8 transition-colors shrink-0"
        >
          <span className={`block w-4.5 h-0.5 bg-white/70 transition-all duration-300 origin-center ${sidebarOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`block w-4.5 h-0.5 bg-white/70 transition-all duration-300 ${sidebarOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-4.5 h-0.5 bg-white/70 transition-all duration-300 origin-center ${sidebarOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>

        {/* Logo */}
        <Link href="/home" className="flex-1">
          <FirstReportLogo variant="wordmark" size={34} theme="light" />
        </Link>

        {/* Right cluster */}
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher current={lang} onChange={handleLangChange} compact />
          <a
            href="tel:15100"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm
                       text-xs font-semibold uppercase tracking-[0.12em]
                       bg-error text-white hover:bg-red-600 transition-colors duration-300"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-rec shrink-0" />
            <span className="hidden sm:inline">NALSA ·</span> 15100
          </a>
        </div>
      </header>

      {/* ── SIDEBAR BACKDROP (mobile) ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-deep/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-40 flex flex-col
                    transition-all duration-300 ease-in-out overflow-hidden
                    ${sidebarOpen ? 'w-56' : 'w-0 md:w-[60px]'}`}
        style={{ background: 'linear-gradient(180deg, #0F1F3D 0%, #0A1628 100%)',
                 borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Gold top accent */}
        <div className="h-[2px] shrink-0"
             style={{ background: 'linear-gradient(90deg, #B8962E, #5FA8A0, #B8962E)' }} />

        <nav className="flex-1 py-3 overflow-hidden">
          {NAV_ITEMS.map(({ href, labelKey, Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            const label = uiStr(labelKey, lang);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                title={label}
                className={`relative flex items-center gap-3 mx-2 px-3 py-3 rounded-sm mb-1
                             transition-all duration-300 whitespace-nowrap group
                  ${isActive
                    ? 'text-white'
                    : 'text-white/50 hover:text-white/90 hover:bg-white/6'}`}
                style={isActive ? {
                  background: 'rgba(95,168,160,0.12)',
                  borderLeft: '2px solid #5FA8A0',
                  paddingLeft: '10px',
                } : {}}
              >
                <span className="shrink-0"><Icon /></span>
                <span className={`text-sm font-medium transition-opacity duration-200
                  ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  {label}
                </span>
                {!sidebarOpen && (
                  <span className="hidden md:block absolute left-full ml-2 px-2 py-1
                                   bg-navy-deep text-white text-xs rounded-sm whitespace-nowrap
                                   opacity-0 group-hover:opacity-100 pointer-events-none
                                   transition-opacity duration-200 border border-white/10 shadow-md">
                    {label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Settings */}
        <div className="shrink-0 p-2 border-t border-white/8">
          <button
            onClick={() => { setSettingsOpen(true); setSidebarOpen(false); }}
            title={uiStr('settings', lang)}
            className="relative flex items-center gap-3 w-full px-3 py-3 rounded-sm
                       text-white/50 hover:text-white/90 hover:bg-white/6
                       transition-all duration-300 whitespace-nowrap group"
          >
            <span className="shrink-0"><IconSettings /></span>
            <span className={`text-sm font-medium transition-opacity duration-200
              ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              {uiStr('settings', lang)}
            </span>
            {!sidebarOpen && (
              <span className="hidden md:block absolute left-full ml-2 px-2 py-1
                               bg-navy-deep text-white text-xs rounded-sm whitespace-nowrap
                               opacity-0 group-hover:opacity-100 pointer-events-none
                               transition-opacity duration-200 border border-white/10 shadow-md">
                {uiStr('settings', lang)}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ── SETTINGS DRAWER ───────────────────────────────────────── */}
      <Suspense fallback={null}>
        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          currentLang={lang}
          onLangChange={handleLangChange}
        />
      </Suspense>

      {/* ── MAIN CONTENT ──────────────────────────────────────────── */}
      <main className={`pt-16 min-h-screen transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'md:pl-56' : 'md:pl-[60px]'}`}>
        {children}
      </main>

      {/* ── OFFLINE QUEUE ─────────────────────────────────────────── */}
      <Suspense fallback={null}>
        <OfflineQueueCard />
      </Suspense>
    </div>
  );
}
