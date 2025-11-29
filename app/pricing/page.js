import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { getPageSections, getPageContent, isSectionActive, getContent, parseJsonContent } from '@/lib/cms'

export const metadata = {
  title: 'Pricing | FLEX',
  description: 'Simple, honest pricing for gym clothes laundry. Plans from £5/drop.',
}

async function getPlans() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/plans`, { next: { revalidate: 300 } })
    if (res.ok) return await res.json()
  } catch (error) { console.error('Error fetching plans:', error) }
  return [
    { name: 'Single Drop', slug: 'single', price: 5, drops: 1, description: 'Try it out, no commitment', features: ['Pay per drop', '48-hour turnaround', 'WhatsApp notifications', 'Activewear-safe cleaning'], isPopular: false },
    { name: 'Essential', slug: 'essential', price: 30, drops: 10, description: 'Perfect for 2-3 workouts per week', features: ['10 drops per month', '48-hour turnaround', 'WhatsApp notifications', 'Activewear-safe cleaning', 'Pause or cancel anytime'], isPopular: true },
  ]
}

export default async function PricingPage() {
  const [sections, content, plans] = await Promise.all([
    getPageSections('pricing'),
    getPageContent('pricing'),
    getPlans(),
  ])

  const c = (key, fallback) => getContent(content, key, fallback)

  const defaultFaqs = [
    { q: 'What counts as one drop?', a: 'One drop is one FLEX bag containing up to 5 items of activewear (tops, bottoms, sports bras, socks).' },
    { q: 'What if I don\'t use all my drops?', a: 'Unused drops don\'t roll over to the next month. We recommend the plan that matches your typical workout frequency.' },
    { q: 'Can I change plans?', a: 'Yes! You can upgrade or downgrade your plan anytime. Changes take effect on your next billing date.' },
    { q: 'Is there a contract?', a: 'No contracts. All plans are month-to-month. You can pause or cancel anytime via WhatsApp.' },
  ]
  const faqs = parseJsonContent(content, 'faqs', defaultFaqs)

  return (
    <>
      <Header />
      <main>
        {isSectionActive(sections, 'hero') && (
          <section className="bg-warm-white py-16">
            <div className="container-width text-center">
              <h1 className="heading-1 mb-4">{c('hero_title', 'Simple, Honest Pricing')}</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">{c('hero_subtitle', 'Choose the plan that fits your workout routine. No hidden fees, cancel anytime.')}</p>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'plans') && (
          <section className="py-16 bg-white">
            <div className="container-width">
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {plans.map((plan) => (
                  <div key={plan.slug} className={`relative card-hover ${plan.isPopular ? 'border-2 border-flex-accent ring-2 ring-flex-accent ring-opacity-20' : 'border border-gray-200'}`}>
                    {plan.isPopular && <div className="popular-badge">Most Popular</div>}
                    <div className="text-center mb-6"><h3 className="text-xl font-bold text-flex-navy mb-2">{plan.name}</h3><p className="text-gray-500 text-sm">{plan.description}</p></div>
                    <div className="text-center mb-6"><span className="text-4xl font-bold text-flex-navy">£{plan.price}</span><span className="text-gray-500">/{plan.slug === 'single' ? 'drop' : 'month'}</span></div>
                    <div className="text-center mb-6 py-3 bg-gray-50 rounded-lg"><span className="text-flex-navy font-semibold">{plan.drops} drop{plan.drops !== 1 ? 's' : ''} {plan.slug !== 'single' ? 'per month' : ''}</span>{plan.slug !== 'single' && <p className="text-sm text-gray-500 mt-1">£{(plan.price / plan.drops).toFixed(2)} per drop</p>}</div>
                    <ul className="space-y-3 mb-8">{plan.features?.map((feature, index) => (<li key={index} className="flex items-start space-x-3"><svg className="w-5 h-5 text-flex-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg><span className="text-gray-600 text-sm">{feature}</span></li>))}</ul>
                    <Link href={`/join?plan=${plan.slug}`} className={`block text-center py-3 px-6 rounded-lg font-semibold transition-colors ${plan.isPopular ? 'bg-flex-accent text-white hover:bg-emerald-600' : 'bg-flex-navy text-white hover:bg-gray-800'}`}>Get Started</Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'faqs') && (
          <section className="py-16 bg-warm-gray">
            <div className="container-width">
              <div className="max-w-3xl mx-auto">
                <h2 className="heading-2 text-center mb-12">{c('faqs_title', 'Pricing Questions')}</h2>
                <div className="space-y-6">{faqs.map((faq, index) => (<div key={index} className="border-b border-gray-200 pb-6"><h3 className="font-semibold text-lg text-flex-navy mb-2">{faq.q}</h3><p className="text-gray-600">{faq.a}</p></div>))}</div>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'cta') && (
          <section className="py-16 bg-flex-navy text-white">
            <div className="container-width text-center">
              <h2 className="text-3xl font-bold mb-4">{c('cta_title', 'Ready to Get Started?')}</h2>
              <p className="text-gray-300 mb-8">{c('cta_subtitle', 'Join FLEX today. Your first drop could be tomorrow.')}</p>
              <Link href="/join" className="bg-white text-flex-navy px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">{c('cta_button', 'Choose Your Plan')}</Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
