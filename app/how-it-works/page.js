import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { getPageSections, getPageContent, isSectionActive, getContent, parseJsonContent } from '@/lib/cms'

export const metadata = {
  title: 'How It Works | FLEX',
  description: 'See how FLEX gym laundry service works. Drop off, we clean, pick up fresh.',
}

export default async function HowItWorksPage() {
  const [sections, content] = await Promise.all([
    getPageSections('how-it-works'),
    getPageContent('how-it-works'),
  ])

  const c = (key, fallback) => getContent(content, key, fallback)

  const defaultItems = [
    { item: 'T-shirts', emoji: '👕' },
    { item: 'Shorts/Leggings', emoji: '🩳' },
    { item: 'Sports Bras', emoji: '🎽' },
    { item: 'Socks', emoji: '🧦' },
    { item: 'Hoodies', emoji: '🧥' },
  ]

  const items = parseJsonContent(content, 'included_items', defaultItems)

  return (
    <>
      <Header />
      <main>
        {isSectionActive(sections, 'hero') && (
          <section className="bg-warm-white py-16">
            <div className="container-width text-center">
              <h1 className="heading-1 mb-4">{c('hero_title', 'How FLEX Works')}</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {c('hero_subtitle', 'Three simple steps to fresh gym clothes. No app needed, just WhatsApp.')}
              </p>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'step-1') && (
          <section className="py-16 bg-white">
            <div className="container-width">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-flex-navy text-white rounded-full font-bold text-xl mb-6">1</div>
                  <h2 className="heading-2 mb-4">{c('step1_title', 'Drop Off Your Bag')}</h2>
                  <p className="text-lg text-gray-600 mb-6">{c('step1_description', 'After your workout, grab a FLEX bag from your gym\'s reception. Fill it with your sweaty clothes (up to 5 items), write your bag number on the tag, and drop it in the FLEX bin.')}</p>
                  <ul className="space-y-3">
                    {[c('step1_feature1', 'Tops, bottoms, sports bras, socks — all welcome'), c('step1_feature2', 'Drop off by 6pm for next-day collection'), c('step1_feature3', 'Message us on WhatsApp with your bag number')].map((feature, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <svg className="w-6 h-6 text-flex-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-100 rounded-2xl p-8">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-flex-light rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-flex-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                      </div>
                      <div><p className="font-semibold text-flex-navy">FLEX Bag</p><p className="text-sm text-gray-500">Reusable, numbered</p></div>
                    </div>
                    <div className="border-t pt-4"><p className="text-sm text-gray-600">Your bag number: <span className="font-mono font-bold text-flex-navy">B001</span></p></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'step-2') && (
          <section className="py-16 bg-gray-50">
            <div className="container-width">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1 bg-white rounded-2xl p-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-flex-light rounded-lg"><div className="w-10 h-10 bg-flex-navy rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div><div><p className="font-semibold text-flex-navy">Collected</p><p className="text-sm text-gray-500">Your bag is on its way</p></div></div>
                    <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg"><div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div><div><p className="font-semibold text-yellow-700">Washing</p><p className="text-sm text-gray-500">Being cleaned with care</p></div></div>
                    <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg opacity-50"><div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div><div><p className="font-semibold text-gray-500">Ready</p><p className="text-sm text-gray-400">Coming soon...</p></div></div>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-flex-navy text-white rounded-full font-bold text-xl mb-6">2</div>
                  <h2 className="heading-2 mb-4">{c('step2_title', 'We Clean With Care')}</h2>
                  <p className="text-lg text-gray-600 mb-6">{c('step2_description', 'We collect bags daily and wash your clothes using activewear-safe products. No harsh chemicals that damage performance fabrics.')}</p>
                  <ul className="space-y-3">
                    {[c('step2_feature1', 'Specialist activewear detergents'), c('step2_feature2', 'Low-temperature wash to protect fabrics'), c('step2_feature3', 'Air dried to maintain elasticity')].map((feature, i) => (
                      <li key={i} className="flex items-start space-x-3"><svg className="w-6 h-6 text-flex-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-gray-600">{feature}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'step-3') && (
          <section className="py-16 bg-white">
            <div className="container-width">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-flex-navy text-white rounded-full font-bold text-xl mb-6">3</div>
                  <h2 className="heading-2 mb-4">{c('step3_title', 'Pick Up Fresh')}</h2>
                  <p className="text-lg text-gray-600 mb-6">{c('step3_description', 'Your clean clothes are returned to your gym within 48 hours. We\'ll message you on WhatsApp when they\'re ready — just ask at reception.')}</p>
                  <ul className="space-y-3">
                    {[c('step3_feature1', 'WhatsApp notification when ready'), c('step3_feature2', 'Collect from gym reception'), c('step3_feature3', 'Available for 7 days')].map((feature, i) => (
                      <li key={i} className="flex items-start space-x-3"><svg className="w-6 h-6 text-flex-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-gray-600">{feature}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-100 rounded-2xl p-8">
                  <div className="bg-white rounded-xl shadow-lg p-4 max-w-sm mx-auto">
                    <div className="flex items-center space-x-3 mb-4 pb-3 border-b"><div className="w-10 h-10 bg-flex-navy rounded-full flex items-center justify-center"><span className="text-white font-bold">F</span></div><div><p className="font-semibold text-gray-900">FLEX</p><p className="text-xs text-gray-500">WhatsApp Business</p></div></div>
                    <div className="bg-green-100 rounded-lg p-3"><p className="text-sm text-gray-800">🧺 Your clothes are ready!</p><p className="text-sm text-gray-800 mt-2">Bag <strong>B001</strong> is waiting at <strong>reception</strong>.</p><p className="text-xs text-gray-500 mt-2">10:32 AM</p></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'included') && (
          <section className="py-16 bg-flex-navy text-white">
            <div className="container-width">
              <div className="text-center mb-12"><h2 className="text-3xl font-bold mb-4">{c('included_title', 'What You Can Include')}</h2><p className="text-gray-300">{c('included_subtitle', 'Each FLEX bag holds up to 5 items')}</p></div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
                {items.map((item) => (<div key={item.item} className="text-center"><div className="text-4xl mb-2">{item.emoji}</div><p className="text-sm">{item.item}</p></div>))}
              </div>
              <div className="text-center mt-8"><p className="text-gray-400 text-sm">{c('included_note', 'Trainers? Add our Shoe Refresh service for £5 per pair.')}</p></div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'cta') && (
          <section className="py-16 bg-gray-50">
            <div className="container-width text-center">
              <h2 className="heading-2 mb-4">{c('cta_title', 'Ready to Try It?')}</h2>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto">{c('cta_subtitle', 'Join FLEX today and drop off your first bag tomorrow. It\'s that simple.')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/join" className="btn-primary">{c('cta_primary', 'Get Started — From £5/drop')}</Link>
                <Link href="/pricing" className="btn-secondary">{c('cta_secondary', 'View Pricing')}</Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
