'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '../../stores/app-store';
import { useSessionStore } from '../../stores/session-store';
import { t } from '../../types/i18n';
import type { SessionStatus } from '../../types/index';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
}

interface NavItem {
  href: string;
  labelKey: string;
  icon: string;
  requiredStatus?: SessionStatus[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/v2', labelKey: 'home', icon: 'home' },
  { href: '/v2/chat', labelKey: 'newReport', icon: 'chat' },
  {
    href: '/v2/classify',
    labelKey: 'classification',
    icon: 'classify',
    requiredStatus: ['classified', 'documents_ready', 'sent'],
  },
  {
    href: '/v2/documents',
    labelKey: 'documents',
    icon: 'doc',
    requiredStatus: ['documents_ready', 'sent'],
  },
  { href: '/v2/history', labelKey: 'history', icon: 'history' },
];

export function Sidebar({ open, onClose, isMobile }: SidebarProps) {
  const language = useAppStore((s) => s.language);
  const sessionStatus = useSessionStore((s) => s.activeSession?.status);
  const pathname = usePathname();

  return (
    <>
      {isMobile && open && (
        <div
          className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed top-14 left-0 bottom-0 z-40 flex flex-col
          bg-[#142038] transition-all duration-200 ease-in-out overflow-hidden
          ${isMobile
            ? (open ? 'w-56' : 'w-0')
            : (open ? 'w-56' : 'w-14')
          }
        `}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <nav className="flex-1 py-2 overflow-hidden" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/v2' && pathname.startsWith(item.href + '/'));
            const isDisabled = item.requiredStatus && (!sessionStatus || !item.requiredStatus.includes(sessionStatus));
            const label = t(item.labelKey, language);

            return (
              <NavLink
                key={item.href}
                href={item.href}
                label={label}
                icon={item.icon}
                isActive={isActive}
                isDisabled={!!isDisabled}
                expanded={open}
                onClick={() => { if (isMobile) onClose(); }}
              />
            );
          })}
        </nav>

        <div className="shrink-0 p-2 border-t border-white/10">
          <NavLink
            href="/v2/settings"
            label={t('settings', language)}
            icon="settings"
            isActive={pathname === '/v2/settings'}
            isDisabled={false}
            expanded={open}
            onClick={() => { if (isMobile) onClose(); }}
          />
        </div>
      </aside>
    </>
  );
}

interface NavLinkProps {
  href: string;
  label: string;
  icon: string;
  isActive: boolean;
  isDisabled: boolean;
  expanded: boolean;
  onClick: () => void;
}

function NavLink({ href, label, icon, isActive, isDisabled, expanded, onClick }: NavLinkProps) {
  const iconEl = <NavIcon name={icon} />;

  if (isDisabled) {
    return (
      <span
        className="relative flex items-center gap-3 mx-2 px-3 py-3 rounded-md mb-0.5 text-white/25 cursor-not-allowed whitespace-nowrap"
        aria-disabled="true"
        title={label}
      >
        <span className="shrink-0 w-5 h-5">{iconEl}</span>
        <span className={`text-sm font-medium transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {label}
        </span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      title={label}
      aria-current={isActive ? 'page' : undefined}
      className={`
        relative flex items-center gap-3 mx-2 px-3 py-3 rounded-md mb-0.5
        transition-colors duration-150 whitespace-nowrap group
        focus-visible:outline-2 focus-visible:outline-teal
        ${isActive
          ? 'bg-white/10 text-white border-l-2 border-teal pl-[10px]'
          : 'text-white/60 hover:text-white hover:bg-white/[0.08]'}
      `}
    >
      <span className="shrink-0 w-5 h-5">{iconEl}</span>
      <span className={`text-sm font-medium transition-opacity duration-150 ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {label}
      </span>
      {!expanded && (
        <span className="hidden md:block absolute left-full ml-2 px-2 py-1 bg-navy text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
          {label}
        </span>
      )}
    </Link>
  );
}

function NavIcon({ name }: { name: string }) {
  const cls = "w-5 h-5";
  switch (name) {
    case 'home':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15v-6h-6v6H3.75A.75.75 0 013 21V9.75z" />
        </svg>
      );
    case 'chat':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641l-.683 2.733 3.38-.845a9.17 9.17 0 002.444.24z" />
        </svg>
      );
    case 'classify':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      );
    case 'doc':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      );
    case 'history':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'settings':
      return (
        <svg className={cls} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return <span className={cls} />;
  }
}
