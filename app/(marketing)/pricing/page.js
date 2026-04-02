import Link from 'next/link';

export const metadata = {
  title: 'Pricing — FLEX Gym Laundry',
  description: 'Simple, transparent pricing. From £3.50 per drop. No hidden fees, cancel anytime.',
  openGraph: {
    title: 'Pricing — FLEX Gym Laundry',
    description: 'From £3.50 per drop. No hidden fees.',
    url: 'https://www.flexlaundry.co.uk/pricing',
  },
};

export default function PricingPage() {
  return (
    <>
      <section className="section-padding pt-24 md:pt-32 bg-flex-bg">
        <div className="container-page text-center">
          <span className="label-tag">Pricing</span>
          <h1 className="heading-1 mt-3">Simple, transparent pricing.</h1>
          <p className="text-flex-text mt-3 text-lg">No hidden fees. No sign-up costs. Cancel anytime.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-page">
          <div className="grid md:grid-cols-2 gap-4 md:gap-5 max-w-[800px] mx-auto">
            {/* PAYG */}
            <div className="bg-white rounded-[28px] p-7 md:p-10 relative shadow-sm">
              <div className="text-[0.6rem] font-semibold tracking-wider uppercase text-flex-muted mb-3">Pay As You Go</div>
              <div className="font-display text-[2.6rem] md:text-[3.2rem] font-black leading-none">£5 <span className="font-display text-sm font-semibold opacity-70">/drop</span></div>
              <div className="text-[0.72rem] text-flex-muted mt-1.5 mb-5">One-off · no commitment</div>
              <ul className="space-y-1.5 mb-6">
                <li className="text-[0.82rem] text-flex-text flex items-center gap-1.5">✓ 1 bag of gym clothes</li>
                <li className="text-[0.82rem] text-flex-text flex items-center gap-1.5">✓ 48-hour turnaround</li>
                <li className="text-[0.82rem] text-flex-text flex items-center gap-1.5">✓ WhatsApp tracking</li>
                <li className="text-[0.82rem] text-flex-text flex items-center gap-1.5">✓ No commitment at all</li>
              </ul>
              <Link href="/join?plan=payg" className="btn-secondary w-full">Try Once &rarr;</Link>
            </div>

            {/* Essential */}
            <div className="bg-flex-black text-white rounded-[28px] p-7 md:p-10 relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white text-flex-black text-[0.55rem] font-bold tracking-wider uppercase px-4 py-1 rounded-full shadow-md">Recommended</div>
              <div className="text-[0.6rem] font-semibold tracking-wider uppercase text-gray-400 mb-3">Essential</div>
              <div className="font-display text-[2.6rem] md:text-[3.2rem] font-black leading-none">£3.50 <span className="font-display text-sm font-semibold opacity-70">/drop</span></div>
              <div className="text-[0.72rem] text-gray-500 mt-1.5">Up to 12 drops per month</div>
              <div className="text-[0.62rem] text-gray-500 bg-white/10 rounded-full px-3 py-1 inline-block mt-2 mb-5">Billed at £42/month · Top up £4/drop</div>
              <ul className="space-y-1.5 mb-6">
                <li className="text-[0.82rem] text-gray-300 flex items-center gap-1.5">✓ Up to 12 drops per month</li>
                <li className="text-[0.82rem] text-gray-300 flex items-center gap-1.5">✓ 48-hour turnaround</li>
                <li className="text-[0.82rem] text-gray-300 flex items-center gap-1.5">✓ WhatsApp tracking</li>
                <li className="text-[0.82rem] text-gray-300 flex items-center gap-1.5">✓ Top up anytime for £4/drop</li>
                <li className="text-[0.82rem] text-gray-300 flex items-center gap-1.5">✓ Cancel anytime</li>
              </ul>
              <Link href="/join?plan=essential" className="btn-white w-full">Subscribe &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="section-padding bg-flex-bg">
        <div className="container-page">
          <div className="text-center mb-6">
            <span className="label-tag">Compare</span>
            <h2 className="heading-2 mt-2">Side by side.</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full max-w-[800px] mx-auto bg-white rounded-[20px] overflow-hidden shadow-sm text-[0.82rem]">
              <thead>
                <tr>
                  <th className="text-left p-3 md:p-4 text-[0.6rem] font-semibold tracking-wider uppercase text-flex-muted bg-flex-bg">Feature</th>
                  <th className="text-left p-3 md:p-4 text-[0.6rem] font-semibold tracking-wider uppercase text-flex-muted bg-flex-bg">Pay As You Go</th>
                  <th className="text-left p-3 md:p-4 text-[0.6rem] font-semibold tracking-wider uppercase text-flex-muted bg-flex-bg">Essential</th>
                </tr>
              </thead>
              <tbody className="text-flex-text">
                <tr className="border-b border-flex-border"><td className="p-3 md:p-4 font-medium">Per drop price</td><td className="p-3 md:p-4">£5.00</td><td className="p-3 md:p-4 font-bold">£3.50</td></tr>
                <tr className="border-b border-flex-border"><td className="p-3 md:p-4 font-medium">Monthly cost</td><td className="p-3 md:p-4">Pay per use</td><td className="p-3 md:p-4">£42/month</td></tr>
                <tr className="border-b border-flex-border"><td className="p-3 md:p-4 font-medium">Drops included</td><td className="p-3 md:p-4">1</td><td className="p-3 md:p-4">Up to 12</td></tr>
                <tr className="border-b border-flex-border"><td className="p-3 md:p-4 font-medium">Extra drops</td><td className="p-3 md:p-4">N/A</td><td className="p-3 md:p-4">£4 each</td></tr>
                <tr className="border-b border-flex-border"><td className="p-3 md:p-4 font-medium">Turnaround</td><td className="p-3 md:p-4">48 hours</td><td className="p-3 md:p-4">48 hours</td></tr>
                <tr className="border-b border-flex-border"><td className="p-3 md:p-4 font-medium">WhatsApp tracking</td><td className="p-3 md:p-4">✓</td><td className="p-3 md:p-4">✓</td></tr>
                <tr><td className="p-3 md:p-4 font-medium">Commitment</td><td className="p-3 md:p-4">None</td><td className="p-3 md:p-4">Cancel anytime</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing FAQ */}
      <section className="section-padding">
        <div className="container-narrow">
          <div className="text-center mb-6">
            <span className="label-tag">Questions</span>
            <h2 className="heading-2 mt-2">About pricing.</h2>
          </div>
          {[
            { q: 'What gym clothes can I include?', a: 'T-shirts, shorts, leggings, sports bras, socks, underwear, hoodies, and joggers. Basically anything you\'d wear to train in.' },
            { q: 'What happens to unused drops?', a: 'Unused drops reset at the start of each billing cycle. They don\'t roll over, so make the most of them.' },
            { q: 'Can I change or cancel my plan?', a: 'Yes. Pause, cancel, or change anytime from the member portal or via WhatsApp. No penalties, no questions.' },
          ].map((faq, i) => (
            <details key={i} className="bg-white rounded-2xl mb-2 shadow-sm group">
              <summary className="px-5 py-4 font-semibold text-[0.88rem] cursor-pointer flex justify-between items-center list-none">
                {faq.q}
                <span className="text-flex-muted group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="px-5 pb-4 text-flex-text text-[0.82rem]">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-flex-black text-white text-center py-12 md:py-20 rounded-[28px] mx-3 mb-3">
        <div className="container-page">
          <h2 className="heading-2 text-white">Start with one drop.</h2>
          <p className="text-flex-muted mt-2 mb-6">See if FLEX is right for you. No commitment.</p>
          <Link href="/join" className="btn-white">Try for £5 &rarr;</Link>
        </div>
      </section>
    </>
  );
}
