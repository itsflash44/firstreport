'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../../stores/app-store';
import { useHydration } from '../../hooks/use-hydration';
import { useIsMobile } from '../../hooks/use-breakpoint';
import { useSwRegistration } from '../../hooks/use-sw-registration';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { OfflineBanner } from './OfflineBanner';
import { NavGuard } from './NavGuard';

export function AppShell({ children }: { children: React.ReactNode }) {
  const isHydrated = useAppStore((s) => s.isHydrated);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useHydration();
  const { hasUpdate, applyUpdate } = useSwRegistration();

  useEffect(() => {
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = '#1A2A44';
      document.head.appendChild(meta);
    }
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  if (!isHydrated) {
    return (
      <div className="min-h-[100dvh] bg-off-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-secondary">Loading…</span>
        </div>
      </div>
    );
  }

  const sidebarWidth = isMobile ? 0 : (sidebarOpen ? 224 : 56);

  return (
    <div className="min-h-[100dvh] bg-off-white">
      {hasUpdate && (
        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-teal/10 text-teal text-sm">
          <span>Update available</span>
          <button onClick={applyUpdate} className="underline font-semibold">Refresh</button>
        </div>
      )}
      <Header onMenuToggle={toggleSidebar} menuOpen={sidebarOpen} />
      <OfflineBanner />

      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        isMobile={isMobile}
      />

      <main
        className="pt-14 min-h-[100dvh] transition-all duration-200 ease-in-out"
        style={{
          paddingLeft: sidebarWidth,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <NavGuard>
          {children}
        </NavGuard>
      </main>
    </div>
  );
}
