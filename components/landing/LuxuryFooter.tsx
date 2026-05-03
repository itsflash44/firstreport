import Link from 'next/link';
import GeometricLogo from '@/components/GeometricLogo';

export default function LuxuryFooter() {
  return (
    <footer className="bg-ink text-paper">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 sm:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand block */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <GeometricLogo size={42} />
              <div className="font-serif text-2xl tracking-tightest">FirstReport</div>
            </div>
            <p className="text-sm font-medium opacity-75 leading-relaxed mb-4">
              Voice-first legal aid. Built on Gemma 4 + Sarvam AI. Available in 11 Indic languages.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-paper/30">
              <span className="w-1.5 h-1.5 rounded-full bg-cognac" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] opacity-80">
                11 भाषाएँ
              </span>
            </div>
          </div>

          {/* Practice */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] opacity-60 mb-4">Practice</div>
            <ul className="space-y-2 text-sm font-medium opacity-90">
              <li>BNSS 2023 escalation</li>
              <li>POCSO 2012 (children)</li>
              <li>PWDVA 2005 (women)</li>
              <li>MWPSC 2007 (seniors)</li>
              <li>Legal advisor triage</li>
            </ul>
          </div>

          {/* Trust / helplines */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] opacity-60 mb-4">Helplines</div>
            <ul className="space-y-2 text-sm font-medium">
              <li><a href="tel:15100" className="hover:text-cognac transition-colors">NALSA · 15100</a></li>
              <li><a href="tel:1098" className="hover:text-cognac transition-colors">Childline · 1098</a></li>
              <li><a href="tel:181" className="hover:text-cognac transition-colors">Sakhi · 181</a></li>
              <li><a href="tel:14567" className="hover:text-cognac transition-colors">Elder Line · 14567</a></li>
              <li><a href="tel:112" className="hover:text-cognac transition-colors">Police · 112</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.28em] opacity-60 mb-4">Legal</div>
            <ul className="space-y-2 text-sm font-medium opacity-90">
              <li><Link href="#" className="hover:text-cognac transition-colors">Privacy · DPDP 2023</Link></li>
              <li><Link href="#" className="hover:text-cognac transition-colors">Terms of Use</Link></li>
              <li><Link href="#" className="hover:text-cognac transition-colors">AI Disclosure</Link></li>
              <li><Link href="#" className="hover:text-cognac transition-colors">Open Source</Link></li>
            </ul>
          </div>
        </div>

        {/* Brass hairline */}
        <hr className="rule-brass my-10 opacity-50" />

        {/* Small caps row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.28em] opacity-55">
            © 2026 FirstReport · Bharatiya Legal Aid Project
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-oxblood border border-paper/40" />
            <span className="w-3 h-3 bg-forest border border-paper/40" />
            <span className="w-4 h-3 bg-cognac border border-paper/40 tri-down" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] opacity-55 ml-3">
              Kaggle Gemma 2026
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
