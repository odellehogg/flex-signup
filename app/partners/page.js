import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { getPageSections, getPageContent, isSectionActive, getContent, parseJsonContent } from '@/lib/cms'

export const metadata = {
  title: 'Partner With FLEX | Gym Partnership',
  description: 'Add FLEX laundry service to your gym. Boost member retention and create new revenue.',
}

export default async function PartnersPage() {
  const [sections, content] = await Promise.all([
    getPageSections('partners'),
    getPageContent('partners'),
  ])

  const c = (key, fallback) => getContent(content, key, fallback)

  const defaultBenefits = [
    { title: 'Zero Investment', description: 'We provide all equipment, bags, and marketing materials. No upfront costs for you.', icon: '💰' },
    { title: 'Member Retention', description: 'Give members another reason to choose your gym. FLEX members visit more frequently.', icon: '🔄' },
    { title: 'Premium Service', description: 'Offer your members a convenience they can\'t get elsewhere.', icon: '✨' },
    { title: 'Simple Operations', description: 'Just designate a drop-off point. We handle collection, cleaning, and returns.', icon: '📦' },
  ]

  const defaultSteps = [
    { step: 1, title: 'Express Interest', description: 'Fill out our partner form below' },
    { step: 2, title: 'Quick Call', description: 'We\'ll discuss your gym and answer questions' },
    { step: 3, title: 'Setup', description: 'We install the drop-off point and train your staff' },
    { step: 4, title: 'Launch', description: 'Promote to members and start growing' },
  ]

  const defaultWeProvide = [
    'FLEX-branded drop-off bin for your reception area',
    'Supply of reusable FLEX bags for members',
    'Staff training (takes 15 minutes)',
    'Marketing materials: posters, flyers, digital assets',
    'Daily collection and delivery service',
    'Member support via WhatsApp (we handle it)',
    'Monthly performance reports',
  ]

  const defaultYouProvide = [
    'Small space at reception for drop-off bin (~60cm x 60cm)',
    'Staff to hand out/receive bags (30 seconds per interaction)',
    'Promotion to your members',
  ]

  const benefits = parseJsonContent(content, 'benefits_items', defaultBenefits)
  const steps = parseJsonContent(content, 'setup_steps', defaultSteps)
  const weProvide = parseJsonContent(content, 'we_provide_items', defaultWeProvide)
  const youProvide = parseJsonContent(content, 'you_provide_items', defaultYouProvide)

  return (
    <>
      <Header />
      <main>
        {isSectionActive(sections, 'hero') && (
          <section className="bg-flex-navy text-white py-20">
            <div className="container-width">
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">{c('hero_title', 'Partner With FLEX')}</h1>
                <p className="text-xl text-gray-300 mb-8">{c('hero_subtitle', 'Add a premium laundry service to your gym. Boost member satisfaction, increase retention, and create a new revenue stream — at zero cost to you.')}</p>
                <a href="#contact-form" className="bg-white text-flex-navy px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block">{c('hero_cta', 'Become a Partner')}</a>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'benefits') && (
          <section className="py-16 bg-white">
            <div className="container-width">
              <div className="text-center mb-12">
                <h2 className="heading-2 mb-4">{c('benefits_title', 'Why Partner With FLEX?')}</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">{c('benefits_subtitle', 'We\'ve designed FLEX to be a win-win for gyms and members alike.')}</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {benefits.map((benefit, index) => (
                  <div key={index} className="text-center p-6">
                    <div className="text-4xl mb-4">{benefit.icon}</div>
                    <h3 className="text-lg font-semibold text-flex-navy mb-2">{benefit.title}</h3>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'setup') && (
          <section className="py-16 bg-gray-50">
            <div className="container-width">
              <div className="text-center mb-12"><h2 className="heading-2 mb-4">{c('setup_title', 'Simple Setup Process')}</h2></div>
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-4 gap-8">
                  {steps.map((item) => (
                    <div key={item.step} className="text-center">
                      <div className="w-12 h-12 bg-flex-navy text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">{item.step}</div>
                      <h3 className="font-semibold text-flex-navy mb-2">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'what-we-provide') && (
          <section className="py-16 bg-white">
            <div className="container-width">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="heading-2 mb-6">{c('provide_title', 'What We Provide')}</h2>
                  <ul className="space-y-4">
                    {weProvide.map((item, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <svg className="w-6 h-6 text-flex-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h2 className="heading-2 mb-6">{c('require_title', 'What You Provide')}</h2>
                  <ul className="space-y-4">
                    {youProvide.map((item, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <svg className="w-6 h-6 text-flex-navy flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 text-gray-500 text-sm">{c('require_footer', 'That\'s it. We handle everything else.')}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'revenue-share') && (
          <section className="py-16 bg-flex-navy text-white">
            <div className="container-width text-center">
              <h2 className="text-3xl font-bold mb-4">{c('revenue_title', 'Revenue Share Model')}</h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">{c('revenue_subtitle', 'Earn ongoing commission on every FLEX subscription sold at your gym.')}</p>
              <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
                <div className="bg-white/10 rounded-xl p-6">
                  <p className="text-3xl font-bold mb-2">{c('revenue_percent', '10%')}</p>
                  <p className="text-gray-300">{c('revenue_percent_label', 'of monthly subscription revenue')}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <p className="text-3xl font-bold mb-2">{c('revenue_amount', '£3-5')}</p>
                  <p className="text-gray-300">{c('revenue_amount_label', 'per active member per month')}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6">
                  <p className="text-3xl font-bold mb-2">{c('revenue_frequency', 'Monthly')}</p>
                  <p className="text-gray-300">{c('revenue_frequency_label', 'payments via bank transfer')}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'contact-form') && (
          <section id="contact-form" className="py-16 bg-gray-50">
            <div className="container-width">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="heading-2 mb-4">{c('form_title', 'Get Started')}</h2>
                  <p className="text-gray-600">{c('form_subtitle', 'Fill out the form below and we\'ll be in touch within 24 hours.')}</p>
                </div>
                <form className="bg-white rounded-2xl shadow-lg p-8">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label><input type="text" required className="input-field" placeholder="John Smith" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Gym Name</label><input type="text" required className="input-field" placeholder="Your Gym" /></div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" required className="input-field" placeholder="you@gym.com" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" className="input-field" placeholder="07123 456789" /></div>
                  </div>
                  <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Gym Location</label><input type="text" className="input-field" placeholder="Area, City" /></div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Approximate Member Count</label>
                    <select className="input-field"><option value="">Select...</option><option value="<500">Under 500</option><option value="500-1000">500 - 1,000</option><option value="1000-2500">1,000 - 2,500</option><option value="2500+">2,500+</option></select>
                  </div>
                  <div className="mb-6"><label className="block text-sm font-medium text-gray-700 mb-1">Anything else?</label><textarea rows={3} className="input-field resize-none" placeholder="Questions or comments..." /></div>
                  <button type="submit" className="w-full btn-primary">Submit Partnership Enquiry</button>
                </form>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
