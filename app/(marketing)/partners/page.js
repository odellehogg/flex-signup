import Link from 'next/link';

export const metadata = {
  title: 'Partner With FLEX — Gym Partnership',
  description: 'Add a unique member perk at zero cost. FLEX handles everything.',
  openGraph: { title: 'Partner With FLEX', url: 'https://www.flexlaundry.co.uk/partners' },
};

export default function PartnersPage() {
  return (
    <>
      <section className="section-padding pt-24 md:pt-32 bg-flex-bg">
        <div className="container-page text-center">
          <span className="label-tag">Gym Partners</span>
          <h1 className="heading-1 mt-3">A unique perk your<br />members will love.</h1>
          <p className="text-flex-text mt-3 text-lg">We handle everything. Your gym gets a premium member benefit at zero cost.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-page">
          <div className="text-center mb-6">
            <span className="label-tag">Why Partner</span>
            <h2 className="heading-2 mt-2">Benefits for your gym.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-[20px] p-7 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="heading-3 mb-2">Zero Cost</h3>
              <p className="text-flex-text text-[0.82rem]">No setup fees, no operational costs. We supply everything and handle all logistics.</p>
            </div>
            <div className="bg-white rounded-[20px] p-7 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="heading-3 mb-2">Member Retention</h3>
              <p className="text-flex-text text-[0.82rem]">Give members a reason to stay. A unique benefit that no other gym offers.</p>
            </div>
            <div className="bg-white rounded-[20px] p-7 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="heading-3 mb-2">Premium Positioning</h3>
              <p className="text-flex-text text-[0.82rem]">Position your gym as forward-thinking. Show members you care about their experience.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-flex-bg">
        <div className="container-page">
          <div className="text-center mb-6">
            <span className="label-tag">How It Works</span>
            <h2 className="heading-2 mt-2">Getting started is easy.</h2>
          </div>
          <div className="max-w-[700px] mx-auto">
            {[
              { num: '01', title: 'We set you up', desc: 'We provide branded materials, bags, and a quick staff briefing. Takes about 15 minutes.' },
              { num: '02', title: 'Members drop off', desc: 'Members leave their gym clothes at reception in a FLEX bag. Your staff just stores them.' },
              { num: '03', title: 'We handle the rest', desc: 'Daily collection, professional cleaning, 48-hour return. Your staff hands bags back when asked.' },
              { num: '04', title: 'Members love it', desc: 'Your gym offers something no one else does. Members stay longer, talk about it, bring friends.' },
            ].map((step) => (
              <div key={step.num} className="flex gap-3.5 items-start py-4 border-b border-flex-border last:border-none group">
                <div className="w-10 h-10 min-w-[40px] bg-white rounded-full flex items-center justify-center font-display font-extrabold text-sm text-flex-muted group-hover:bg-flex-black group-hover:text-white transition-all">
                  {step.num}
                </div>
                <div>
                  <h3 className="heading-3 mb-0.5">{step.title}</h3>
                  <p className="text-flex-text text-[0.82rem]">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-flex-black text-white text-center py-12 md:py-20 rounded-[28px] mx-3 mb-3">
        <div className="container-page">
          <h2 className="heading-2 text-white">Let&apos;s partner up.</h2>
          <p className="text-flex-muted mt-2 mb-6">Email us to get started. We&apos;ll have you set up within a week.</p>
          <a href="mailto:hello@flexlaundry.co.uk" className="btn-white">Get in Touch &rarr;</a>
        </div>
      </section>
    </>
  );
}
