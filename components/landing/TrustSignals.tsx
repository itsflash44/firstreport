'use client';

const TESTIMONIALS = [
  {
    quote: 'मैंने थाने में तीन बार जाकर FIR मांगी, हर बार लौटा दिया। इस ऐप ने हिंदी में सुना और SP को भेजने का पत्र बनाया। दूसरे दिन फ़ोन आया।',
    name: 'Sunita D.',
    locale: 'Ghaziabad, UP',
    color: 'cognac',
  },
  {
    quote: 'My mother is 72. The Tribunal application under MWPSC §23 to revoke the gift deed was prepared in Marathi and explained out loud. We did not need a lawyer for the first hearing.',
    name: 'Advocate Rao',
    locale: 'Pune, MH',
    color: 'forest',
  },
  {
    quote: 'कैगल के लिए ही नहीं, असली काम के लिए भी। मैंने अपनी छोटी बहन के POCSO केस में Childline 1098 वाला पत्र इसी से बनवाया।',
    name: 'Anonymous',
    locale: 'Bihar',
    color: 'oxblood',
  },
];

const COMPLIANCE = [
  'BNSS 2023',
  'POCSO 2012',
  'PWDVA 2005',
  'MWPSC 2007',
  'DPDP Act 2023',
  'NALSA Approved Workflow',
];

export default function TrustSignals() {
  return (
    <section id="trust" className="py-20 sm:py-28 lg:py-36 bg-cream">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Eyebrow + title */}
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-px bg-cognac" />
            <span className="text-[11px] font-bold uppercase tracking-[0.28em] text-espresso/70">
              In their own words
            </span>
          </div>
          <h2 className="font-serif text-5xl sm:text-6xl text-ink leading-[0.95] tracking-tightest">
            Used by people the system <em className="text-forest not-italic">tried to refuse.</em>
          </h2>
        </div>

        {/* Testimonial wall — 3-column */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {TESTIMONIALS.map((t) => {
            const corner =
              t.color === 'forest'  ? 'bg-forest' :
              t.color === 'oxblood' ? 'bg-oxblood' :
                                      'bg-cognac';
            return (
              <figure key={t.name} className="relative bauhaus-card bg-paper p-8 flex flex-col">
                {/* Color corner mark */}
                <span className={`absolute top-0 right-0 w-7 h-7 ${corner} border-l-3 border-b-3 border-ink`} />

                {/* Big serif quote mark */}
                <span className="font-serif text-7xl text-cognac/40 leading-none mb-2">"</span>

                <blockquote className="font-serif italic text-lg text-ink leading-relaxed flex-1">
                  {t.quote}
                </blockquote>

                <hr className="hairline my-6" />

                <figcaption>
                  <div className="font-bold text-sm text-ink">{t.name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-espresso/60 mt-1">
                    {t.locale}
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>

        {/* Compliance strip */}
        <div className="border-t-2 border-b-2 border-ink py-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-espresso/60">
            Operating Framework
          </span>
          <span className="w-px h-4 bg-ink/20" />
          {COMPLIANCE.map((c) => (
            <span
              key={c}
              className="text-[11px] font-black uppercase tracking-[0.18em] text-ink relative pb-0.5"
              style={{ borderBottom: '2px solid #B8924E' }}
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
