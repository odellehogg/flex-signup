import Link from 'next/link';

export const metadata = {
  title: 'FAQs — FLEX Gym Laundry',
  description: 'Frequently asked questions about FLEX gym clothes laundry service.',
  openGraph: { title: 'FAQs — FLEX', url: 'https://www.flexlaundry.co.uk/faq' },
};

const faqs = [
  { cat: 'Getting Started', items: [
    { q: 'How does FLEX work?', a: 'Sign up online, drop your sweaty gym clothes in a FLEX bag at your gym\'s reception, and we collect, clean, and return them within 48 hours. You get WhatsApp updates at every stage.' },
    { q: 'Which gyms are available?', a: 'We\'re currently at select gyms across London. You\'ll see all available locations when you sign up. We\'re adding new gyms regularly.' },
    { q: 'Do I need to download an app?', a: 'No app needed. Everything works through WhatsApp and our member portal at flexlaundry.co.uk/portal.' },
    { q: 'How do I sign up?', a: 'Click "Get Started", choose your gym and plan, enter your details. The whole process takes under 2 minutes.' },
  ]},
  { cat: 'Pricing', items: [
    { q: 'What plans do you offer?', a: 'Pay As You Go (£5/drop, no commitment) and Essential (£42/month for up to 12 drops at £3.50 each). Essential members can top up with extra drops for £4 each.' },
    { q: 'Can I try before committing?', a: 'Absolutely. Use Pay As You Go for a single £5 drop with no strings attached. If you love it, upgrade to Essential.' },
    { q: 'Are there any hidden fees?', a: 'None. The price you see is the price you pay. No sign-up fees, no cancellation penalties.' },
  ]},
  { cat: 'The Service', items: [
    { q: 'What can I include in a bag?', a: 'Gym clothes: t-shirts, shorts, leggings, sports bras, socks, underwear, hoodies, and joggers. No shoes, swimwear, towels, or formal clothes.' },
    { q: 'How long is the turnaround?', a: '48 hours from when we collect your bag. Drop before 6pm and your clothes will typically be ready the day after next.' },
    { q: 'How long can I leave clothes at the gym?', a: 'Once ready, you have 7 days to pick them up. We\'ll send a reminder before the deadline.' },
  ]},
  { cat: 'Care & Quality', items: [
    { q: 'How do you wash the clothes?', a: 'Sport-specific, fabric-safe detergent at the correct temperature. Lights and darks separated. Performance fabrics air-dried to maintain elasticity.' },
    { q: 'What if something gets lost or damaged?', a: 'Very rare, but covered. Report via WhatsApp or the member portal and we\'ll investigate immediately. We compensate for any genuine loss or damage.' },
  ]},
  { cat: 'Account', items: [
    { q: 'Can I pause my subscription?', a: 'Yes. Pause and resume anytime from the member portal.' },
    { q: 'How do I cancel?', a: 'Cancel anytime via the member portal or WhatsApp. No penalties. Your plan stays active until the end of the current billing period.' },
    { q: 'How do I get support?', a: 'WhatsApp us anytime — it\'s the fastest way. You can also email hello@flexlaundry.co.uk or use the help form in the member portal.' },
  ]},
];

export default function FAQPage() {
  return (
    <>
      <section className="section-padding pt-24 md:pt-32 bg-flex-bg">
        <div className="container-page text-center">
          <span className="label-tag">FAQs</span>
          <h1 className="heading-1 mt-3">Got questions?</h1>
          <p className="text-flex-text mt-2 text-lg">We&apos;ve got answers.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-narrow">
          {faqs.map((section, idx) => (
            <div key={idx} className="mb-8">
              <h2 className="heading-3 mb-3 pb-2 border-b-2 border-flex-black">{section.cat}</h2>
              {section.items.map((faq, i) => (
                <details key={i} className="bg-white rounded-2xl mb-2 shadow-sm group">
                  <summary className="px-5 py-4 font-semibold text-[0.88rem] cursor-pointer flex justify-between items-center list-none">
                    {faq.q}
                    <span className="text-flex-muted group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="px-5 pb-4 text-flex-text text-[0.82rem]">{faq.a}</p>
                </details>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="section-padding bg-flex-bg">
        <div className="container-page text-center">
          <h2 className="heading-2">Still have questions?</h2>
          <p className="text-flex-muted mt-2 mb-5">Message us on WhatsApp. We reply fast.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <a href="https://wa.me/447366907286" className="btn-primary">WhatsApp Us</a>
            <Link href="/contact" className="btn-secondary">Contact Page &rarr;</Link>
          </div>
        </div>
      </section>

      <section className="bg-flex-black text-white text-center py-12 md:py-20 rounded-[28px] mx-3 mb-3">
        <div className="container-page">
          <h2 className="heading-2 text-white">Ready to get started?</h2>
          <p className="text-flex-muted mt-2 mb-6">Try with a single drop for £5.</p>
          <Link href="/join" className="btn-white">Start Now &rarr;</Link>
        </div>
      </section>
    </>
  );
}
