import Link from 'next/link'

export const metadata = {
  title: 'FLEX — Gym Clothes Laundry, Sorted',
  description: 'Drop off sweaty gym clothes, pick up fresh. 48-hour turnaround at your gym. From £3.50 per drop.',
  openGraph: {
    title: 'FLEX — Gym Clothes Laundry, Sorted',
    description: 'Gym clothes laundry made easy. 48-hour turnaround. From £3.50 per drop.',
    url: 'https://www.flexlaundry.co.uk',
    siteName: 'FLEX',
    locale: 'en_GB',
    type: 'website',
  },
}

export default function HomePage() {
  return (
    <>
      {/* Hero — Split layout: headline left, pricing right */}
      <section className="min-h-[100svh] flex items-center pt-[60px] pb-8 md:pb-10">
        <div className="container-page">
          <div className="flex flex-col gap-5 md:grid md:grid-cols-[1.2fr_0.8fr] md:gap-12 md:items-center">
            {/* Left — Headline */}
            <div>
              <h1 className="font-display font-extrabold text-[2.4rem] md:text-[clamp(3.2rem,5.5vw,5rem)] leading-[1.05] tracking-tight text-flex-black text-center md:text-left">
                Drop sweaty.<br />Pick up fresh.
              </h1>

              <p className="text-flex-text text-base leading-relaxed mt-3.5 max-w-[420px] text-center md:text-left mx-auto md:mx-0">
                Your gym gear, washed, folded, and returned to your gym within 48 hours. From just £3.50 a drop.
              </p>

              <div className="flex justify-center md:justify-start mt-4">
                <Link href="/how-it-works" className="btn-primary">
                  How it works &rarr;
                </Link>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-2 mt-6">
                <div className="bg-flex-bg rounded-[20px] p-3 md:p-4 text-center">
                  <div className="font-display text-xl md:text-2xl font-extrabold">48h</div>
                  <div className="text-[0.55rem] text-flex-muted uppercase tracking-wider mt-0.5">Turnaround</div>
                </div>
                <div className="bg-flex-bg rounded-[20px] p-3 md:p-4 text-center">
                  <div className="font-display text-xl md:text-2xl font-extrabold">£3.50</div>
                  <div className="text-[0.55rem] text-flex-muted uppercase tracking-wider mt-0.5">Per Drop</div>
                </div>
                <div className="bg-flex-bg rounded-[20px] p-3 md:p-4 text-center">
                  <div className="font-display text-xl md:text-2xl font-extrabold">100%</div>
                  <div className="text-[0.55rem] text-flex-muted uppercase tracking-wider mt-0.5">Tracked</div>
                </div>
              </div>
            </div>

            {/* Right — Pricing cards (equal size) */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Pay As You Go */}
              <div className="bg-flex-bg rounded-[20px] p-5 md:p-7 text-center flex flex-col">
                <div className="text-[0.58rem] font-semibold tracking-wider uppercase text-flex-muted mb-2">Pay As You Go</div>
                <div className="font-display text-2xl md:text-[2.6rem] font-black leading-none">£5</div>
                <div className="font-display text-[0.7rem] font-semibold text-flex-muted">/drop</div>
                <div className="text-[0.6rem] text-flex-muted mt-1">One-off</div>
                <div className="mt-auto pt-3">
                  <Link href="/join?plan=payg" className="btn-secondary text-[0.72rem] px-4 py-2 w-full">
                    Try Once
                  </Link>
                </div>
              </div>

              {/* Essential */}
              <div className="bg-flex-black text-white rounded-[20px] p-5 md:p-7 text-center flex flex-col relative">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white text-flex-black text-[0.5rem] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-md">
                  Best value
                </div>
                <div className="text-[0.58rem] font-semibold tracking-wider uppercase text-gray-400 mb-2">Essential</div>
                <div className="font-display text-2xl md:text-[2.6rem] font-black leading-none">£3.50</div>
                <div className="font-display text-[0.7rem] font-semibold text-gray-400">/drop</div>
                <div className="text-[0.6rem] text-gray-500 mt-1">£42/mo · 12 drops</div>
                <div className="mt-auto pt-3">
                  <Link href="/join?plan=essential" className="btn-white text-[0.72rem] px-4 py-2 w-full">
                    Subscribe
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section-padding bg-flex-bg">
        <div className="container-page">
          <div className="mb-6 md:mb-10">
            <span className="label-tag">The problem</span>
            <h2 className="heading-2 mt-2">Your gym bag is a problem.</h2>
            <p className="text-flex-text mt-2 max-w-lg">Most gym-goers waste 3-4 hours a week on sweaty laundry. There's a better way.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-3 md:gap-5">
            <div className="bg-white rounded-[20px] p-6 shadow-sm">
              <h3 className="heading-3 mb-1">Time Drain</h3>
              <p className="text-flex-text text-[0.82rem]">3-4 hours every week sorting, washing, drying, folding. That's 200 hours a year.</p>
            </div>
            <div className="bg-white rounded-[20px] p-6 shadow-sm">
              <h3 className="heading-3 mb-1">Ruined Gear</h3>
              <p className="text-flex-text text-[0.82rem]">Wrong temperatures and harsh detergents destroying your premium gym wear.</p>
            </div>
            <div className="bg-white rounded-[20px] p-6 shadow-sm">
              <h3 className="heading-3 mb-1">Smelly Bag</h3>
              <p className="text-flex-text text-[0.82rem]">Damp clothes festering between sessions. Your gym neighbours have noticed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Section — from mockup 8 with real chat flow */}
      <section className="section-padding">
        <div className="container-page">
          <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-12 md:items-start">
            {/* Left — Features */}
            <div>
              <span className="label-tag">WhatsApp</span>
              <h2 className="heading-2 mt-2">Your gym laundry,<br />right in your chat.</h2>
              <p className="text-flex-text mt-3 max-w-[420px]">
                No app to download. No login to remember. Drop, track, and get notified — all through WhatsApp.
              </p>
              <ul className="mt-6 space-y-0">
                <li className="flex gap-3 items-start py-3 border-b border-flex-border">
                  <span className="text-lg mt-0.5">📦</span>
                  <div>
                    <strong className="text-sm">Drop a bag</strong>
                    <p className="text-flex-muted text-[0.82rem]">Text DROP and follow the prompts. Confirmed in seconds.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start py-3 border-b border-flex-border">
                  <span className="text-lg mt-0.5">🔔</span>
                  <div>
                    <strong className="text-sm">Know when it's ready</strong>
                    <p className="text-flex-muted text-[0.82rem]">We ping you the moment clean clothes are back at the gym.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start py-3 border-b border-flex-border">
                  <span className="text-lg mt-0.5">📊</span>
                  <div>
                    <strong className="text-sm">Track your drops</strong>
                    <p className="text-flex-muted text-[0.82rem]">Check remaining drops, view status, manage your subscription.</p>
                  </div>
                </li>
                <li className="flex gap-3 items-start py-3">
                  <span className="text-lg mt-0.5">💬</span>
                  <div>
                    <strong className="text-sm">Get help instantly</strong>
                    <p className="text-flex-muted text-[0.82rem]">Describe an issue, get a ticket. Real humans reply fast.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right — Animated WhatsApp phone mockup */}
            <div className="bg-white rounded-[28px] overflow-hidden shadow-lg max-w-[380px] mx-auto md:mx-0 w-full">
              <div className="bg-flex-black text-white px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-flex-black font-display font-extrabold text-sm">F</div>
                <div>
                  <div className="font-semibold text-[0.82rem]">FLEX Laundry</div>
                  <div className="text-[0.6rem] text-gray-400">Online</div>
                </div>
              </div>
              <div className="p-4 bg-[#EDEAE4] flex flex-col gap-1.5 min-h-[340px]">
                {/* Messages with staggered animation delays via inline styles */}
                <div className="wa-msg max-w-[88%] self-start bg-white rounded-[14px] rounded-bl-[3px] p-2.5 text-[0.78rem] leading-snug shadow-sm" style={{ opacity: 0, transform: 'translateY(6px)', animation: 'msgIn 0.3s 0.3s forwards' }}>
                  Hey Sarah! 👋<br /><br />
                  • <strong>1</strong> or <strong>DROP</strong> — Start a drop<br />
                  • <strong>2</strong> or <strong>STATUS</strong> — Check status<br />
                  • <strong>3</strong> or <strong>HELP</strong> — Support
                  <div className="text-[0.5rem] text-flex-muted text-right mt-1">10:30</div>
                </div>
                <div className="max-w-[88%] self-end bg-flex-black text-white rounded-[14px] rounded-br-[3px] p-2.5 text-[0.78rem] leading-snug" style={{ opacity: 0, transform: 'translateY(6px)', animation: 'msgIn 0.3s 1.2s forwards' }}>
                  1
                  <div className="text-[0.5rem] text-gray-400 text-right mt-1">10:30 ✓✓</div>
                </div>
                <div className="max-w-[88%] self-start bg-white rounded-[14px] rounded-bl-[3px] p-2.5 text-[0.78rem] leading-snug shadow-sm" style={{ opacity: 0, transform: 'translateY(6px)', animation: 'msgIn 0.3s 2.2s forwards' }}>
                  📦 Drop at <strong>Iron House Gym</strong><br /><br />
                  <strong>8 drops</strong> remaining.<br /><br />
                  Reply with your bag number
                  <div className="text-[0.5rem] text-flex-muted text-right mt-1">10:30</div>
                </div>
                <div className="max-w-[88%] self-end bg-flex-black text-white rounded-[14px] rounded-br-[3px] p-2.5 text-[0.78rem] leading-snug" style={{ opacity: 0, transform: 'translateY(6px)', animation: 'msgIn 0.3s 3.2s forwards' }}>
                  B042
                  <div className="text-[0.5rem] text-gray-400 text-right mt-1">10:31 ✓✓</div>
                </div>
                <div className="max-w-[88%] self-start bg-white rounded-[14px] rounded-bl-[3px] p-2.5 text-[0.78rem] leading-snug shadow-sm" style={{ opacity: 0, transform: 'translateY(6px)', animation: 'msgIn 0.3s 4.2s forwards' }}>
                  Got it! ✅<br /><br />
                  📦 <strong>B042</strong><br />
                  📍 <strong>Iron House Gym</strong><br />
                  ⏰ Ready: <strong>Thu 4pm</strong><br />
                  📊 Drops left: <strong>7</strong><br /><br />
                  We'll text when ready!
                  <div className="text-[0.5rem] text-flex-muted text-right mt-1">10:31</div>
                </div>
                <div className="max-w-[88%] self-end bg-flex-black text-white rounded-[14px] rounded-br-[3px] p-2.5 text-[0.78rem] leading-snug" style={{ opacity: 0, transform: 'translateY(6px)', animation: 'msgIn 0.3s 5.4s forwards' }}>
                  💪
                  <div className="text-[0.5rem] text-gray-400 text-right mt-1">10:32 ✓✓</div>
                </div>
                <div className="max-w-[88%] self-start bg-white rounded-[14px] rounded-bl-[3px] p-2.5 text-[0.78rem] leading-snug shadow-sm" style={{ opacity: 0, transform: 'translateY(6px)', animation: 'msgIn 0.3s 6.6s forwards' }}>
                  Your clothes are ready! 👕✨<br /><br />
                  Bag <strong>B042</strong> at <strong>Iron House Gym</strong>.<br />
                  Available until <strong>next Thu</strong>.<br /><br />
                  Enjoy! 💪
                  <div className="text-[0.5rem] text-flex-muted text-right mt-1">Thu, 16:12</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-flex-black text-white text-center py-12 md:py-20 rounded-[28px] mx-3 mb-3">
        <div className="container-page">
          <h2 className="heading-2 text-white">Ready to ditch the laundry pile?</h2>
          <p className="text-flex-muted mt-2 mb-6 text-[0.9rem]">£5 to try. £3.50/drop on Essential.</p>
          <Link href="/join" className="btn-white">
            Get Started &rarr;
          </Link>
        </div>
      </section>
    </>
  )
}
