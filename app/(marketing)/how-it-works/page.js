import Link from 'next/link';

export const metadata = {
  title: 'How It Works — FLEX Gym Laundry',
  description: 'Learn how FLEX works. Drop off gym clothes, we clean and return within 48 hours. 4 simple steps.',
  openGraph: {
    title: 'How It Works — FLEX Gym Laundry',
    description: '4 steps to fresh gym clothes. Under 2 minutes of your time.',
    url: 'https://www.flexlaundry.co.uk/how-it-works',
  },
};

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-padding pt-24 md:pt-32 bg-flex-bg">
        <div className="container-page text-center">
          <span className="label-tag">How It Works</span>
          <h1 className="heading-1 mt-3">From sweaty to fresh<br />in 4 steps.</h1>
          <p className="text-flex-text mt-3 text-lg max-w-lg mx-auto">Under 2 minutes of your time. We handle the rest.</p>
        </div>
      </section>

      {/* Steps */}
      <section className="section-padding">
        <div className="container-page max-w-[700px]">
          <div className="flex flex-col gap-0">
            {[
              { num: '01', title: 'Sign Up & Choose Plan', desc: 'Pay As You Go (£5/drop) or Essential (£3.50/drop, 12/month). Under 2 minutes. Confirmation via WhatsApp.' },
              { num: '02', title: 'Drop Off After Workout', desc: 'Grab a FLEX bag from reception, fill it with your sweaty gym clothes, hand it back. Drop before 6pm for next-day processing.' },
              { num: '03', title: 'We Collect & Clean', desc: 'Sport-specific, fabric-safe detergent at the correct temperature. Lights and darks separated. Performance fabrics air-dried.' },
              { num: '04', title: 'Pick Up Fresh', desc: 'Within 48 hours, your clean, folded gear is back at the gym. You get a WhatsApp the moment it\'s ready. 7 days to collect.' },
            ].map((step) => (
              <div key={step.num} className="flex gap-3.5 items-start py-4 md:py-5 border-b border-flex-border last:border-none group">
                <div className="w-10 h-10 md:w-11 md:h-11 min-w-[40px] bg-flex-bg rounded-full flex items-center justify-center font-display font-extrabold text-sm text-flex-muted group-hover:bg-flex-black group-hover:text-white transition-all">
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

      {/* WhatsApp Flow */}
      <section className="section-padding bg-flex-bg">
        <div className="container-page">
          <div className="text-center mb-8">
            <span className="label-tag">The Experience</span>
            <h2 className="heading-2 mt-2">See how it actually feels.</h2>
            <p className="text-flex-muted mt-1">A real drop, start to finish, right in WhatsApp.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 max-w-[800px] mx-auto">
            {/* Drop flow */}
            <div className="bg-white rounded-[28px] overflow-hidden shadow-md">
              <div className="bg-flex-black text-white px-4 py-2.5 flex items-center gap-2">
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-flex-black font-display font-extrabold text-xs">F</div>
                <div><div className="font-semibold text-[0.78rem]">FLEX</div><div className="text-[0.55rem] text-gray-400">Online</div></div>
              </div>
              <div className="p-3.5 bg-[#EDEAE4] flex flex-col gap-1.5">
                <div className="max-w-[88%] self-end bg-flex-black text-white rounded-xl rounded-br-[3px] p-2.5 text-[0.72rem]">DROP<div className="text-[0.48rem] text-gray-400 text-right mt-0.5">17:42 ✓✓</div></div>
                <div className="max-w-[88%] self-start bg-white rounded-xl rounded-bl-[3px] p-2.5 text-[0.72rem] shadow-sm">📦 <strong>Iron House Gym</strong><br /><strong>8 drops</strong> left.<br />Bag number?<div className="text-[0.48rem] text-flex-muted text-right mt-0.5">17:42</div></div>
                <div className="max-w-[88%] self-end bg-flex-black text-white rounded-xl rounded-br-[3px] p-2.5 text-[0.72rem]">B017<div className="text-[0.48rem] text-gray-400 text-right mt-0.5">17:43 ✓✓</div></div>
                <div className="max-w-[88%] self-start bg-white rounded-xl rounded-bl-[3px] p-2.5 text-[0.72rem] shadow-sm">✅ <strong>B017</strong><br />📍 <strong>Iron House Gym</strong><br />⏰ Ready: <strong>Fri 5pm</strong><br />📊 Drops left: <strong>7</strong><div className="text-[0.48rem] text-flex-muted text-right mt-0.5">17:43</div></div>
              </div>
            </div>
            {/* Ready + Feedback */}
            <div className="bg-white rounded-[28px] overflow-hidden shadow-md">
              <div className="bg-flex-black text-white px-4 py-2.5 flex items-center gap-2">
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-flex-black font-display font-extrabold text-xs">F</div>
                <div><div className="font-semibold text-[0.78rem]">FLEX</div><div className="text-[0.55rem] text-gray-400">Online</div></div>
              </div>
              <div className="p-3.5 bg-[#EDEAE4] flex flex-col gap-1.5">
                <div className="max-w-[88%] self-start bg-white rounded-xl rounded-bl-[3px] p-2.5 text-[0.72rem] shadow-sm">Your clothes are ready! 👕✨<br />Bag <strong>B017</strong> at <strong>Iron House Gym</strong>.<br />Available until <strong>next Fri</strong>.<br /><br />Enjoy! 💪<div className="text-[0.48rem] text-flex-muted text-right mt-0.5">Fri, 16:48</div></div>
                <div className="max-w-[88%] self-end bg-flex-black text-white rounded-xl rounded-br-[3px] p-2.5 text-[0.72rem]">On my way! 💪<div className="text-[0.48rem] text-gray-400 text-right mt-0.5">17:02 ✓✓</div></div>
                <div className="max-w-[88%] self-start bg-white rounded-xl rounded-bl-[3px] p-2.5 text-[0.72rem] shadow-sm">Thanks! ✅<br /><br />How was it?<br />Reply <strong>GREAT</strong>, <strong>OK</strong>, or <strong>NOT GOOD</strong>.<div className="text-[0.48rem] text-flex-muted text-right mt-0.5">17:02</div></div>
                <div className="max-w-[88%] self-end bg-flex-black text-white rounded-xl rounded-br-[3px] p-2.5 text-[0.72rem]">GREAT<div className="text-[0.48rem] text-gray-400 text-right mt-0.5">17:03 ✓✓</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Items Guide */}
      <section className="section-padding">
        <div className="container-page">
          <div className="text-center mb-6">
            <span className="label-tag">Guide</span>
            <h2 className="heading-2 mt-2">Pack your bag right.</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-5 max-w-[700px] mx-auto">
            <div className="bg-white border-2 border-flex-black rounded-[20px] p-5 md:p-7">
              <h3 className="heading-3 mb-3">✓ Include</h3>
              <ul className="space-y-1 text-flex-text text-[0.82rem]">
                <li>✓ T-shirts &amp; tank tops</li>
                <li>✓ Shorts &amp; leggings</li>
                <li>✓ Sports bras</li>
                <li>✓ Socks &amp; underwear</li>
                <li>✓ Hoodies &amp; joggers</li>
              </ul>
            </div>
            <div className="bg-white rounded-[20px] p-5 md:p-7 shadow-sm">
              <h3 className="heading-3 mb-3">✗ Don&apos;t include</h3>
              <ul className="space-y-1 text-flex-text text-[0.82rem]">
                <li>✗ Shoes or trainers</li>
                <li>✗ Swimwear</li>
                <li>✗ Delicates or formal</li>
                <li>✗ Towels</li>
                <li>✗ Excessively muddy items</li>
                <li>✗ Non-clothing items</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-flex-black text-white text-center py-12 md:py-20 rounded-[28px] mx-3 mb-3">
        <div className="container-page">
          <h2 className="heading-2 text-white">Ready to try?</h2>
          <p className="text-flex-muted mt-2 mb-6">One drop, £5, zero strings. Or subscribe from £3.50/drop.</p>
          <Link href="/join" className="btn-white">Get Started &rarr;</Link>
        </div>
      </section>
    </>
  );
}
