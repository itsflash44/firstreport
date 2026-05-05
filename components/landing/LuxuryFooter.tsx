import Link from 'next/link';
import FirstReportLogo from '@/components/FirstReportLogo';

export default function LuxuryFooter() {
  return (
    <footer
      style={{ background: 'linear-gradient(180deg, #0F1F3D 0%, #0A1628 100%)' }}
      className="text-white"
    >
      {/* Gold top rule */}
      <div className="h-[3px]"
           style={{ background: 'linear-gradient(90deg, transparent, #B8962E 30%, #5FA8A0 70%, transparent)' }} />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 sm:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand block */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FirstReportLogo size={36} variant="wordmark" theme="light" />
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-5">
              Voice-first legal aid. Built on Gemma 4 + Sarvam AI. Available in 11 Indic languages. Fully offline capable.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="citation-chip citation-chip-dark">BNSS 2023</span>
              <span className="citation-chip citation-chip-dark">11 भाषाएँ</span>
            </div>
          </div>

          {/* Practice */}
          <div>
            <div className="authority-strip mb-5">Practice</div>
            <ul className="space-y-2.5">
              {[
                'BNSS 2023 escalation',
                'POCSO 2012 (children)',
                'PWDVA 2005 (women)',
                'MWPSC 2007 (seniors)',
                'Legal advisor triage',
              ].map((item) => (
                <li key={item} className="text-sm text-white/60 hover:text-white/90 transition-colors duration-300 cursor-default">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Helplines */}
          <div>
            <div className="authority-strip mb-5">Helplines</div>
            <ul className="space-y-2.5">
              {[
                { label: 'NALSA · 15100',    href: 'tel:15100' },
                { label: 'Childline · 1098', href: 'tel:1098'  },
                { label: 'Sakhi · 181',      href: 'tel:181'   },
                { label: 'Elder Line · 14567', href: 'tel:14567' },
                { label: 'Police · 112',     href: 'tel:112'   },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-white/60 hover:text-teal transition-colors duration-300"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="authority-strip mb-5">Legal</div>
            <ul className="space-y-2.5">
              {[
                { label: 'Privacy · DPDP 2023', href: '#' },
                { label: 'Terms of Use',         href: '#' },
                { label: 'AI Disclosure',        href: '#' },
                { label: 'Open Source',          href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/60 hover:text-white/90 transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Gold hairline */}
        <div className="legal-rule my-10" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="authority-strip">
            © 2026 FirstReport · Bharatiya Legal Aid Project · Kaggle Gemma 2026
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:15100"
              className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em]
                         text-white/50 hover:text-error transition-colors duration-300"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-60"/>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-error"/>
              </span>
              NALSA · 15100
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
