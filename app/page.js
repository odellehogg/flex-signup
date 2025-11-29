import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getPageSections, getPageContent, isSectionActive, getContent, getItems } from '@/lib/cms'

export default async function HomePage() {
  const [sections, content] = await Promise.all([
    getPageSections('homepage'),
    getPageContent('homepage'),
  ])

  const c = (key, fallback) => getContent(content, key, fallback)

  const defaultProblems = [
    { title: 'Time Drain', description: '7+ hours per week spent on laundry chores when you could be doing literally anything else.' },
    { title: 'Ruined Clothes', description: 'Up to 30% of activewear gets damaged by harsh detergents and wrong washing techniques.' },
    { title: 'Smelly Gym Bag', description: 'Sweaty clothes sitting in your bag all day. The smell follows you everywhere.' },
  ]

  const defaultSteps = [
    { title: 'Drop Off', description: 'Grab a FLEX bag at your gym reception. Fill it with your sweaty clothes and drop it off before 6pm.' },
    { title: 'We Clean', description: 'We collect your bag and wash your clothes with activewear-safe products that protect performance fabrics.' },
    { title: 'Pick Up Fresh', description: 'Your clean clothes are returned to your gym within 48 hours. Just ask at reception.' },
  ]

  const defaultTestimonials = [
    { quote: 'Game changer. I work out 5 times a week and my laundry pile was out of control. Now I just drop and forget.', name: 'Sarah K.', since: 'Member since Oct 2024', initials: 'SK' },
    { quote: 'The WhatsApp updates are brilliant. I know exactly when my stuff is ready without checking anything.', name: 'James M.', since: 'Member since Sep 2024', initials: 'JM' },
    { quote: 'My gym clothes actually last longer now. They know how to treat technical fabrics properly.', name: 'Lisa P.', since: 'Member since Nov 2024', initials: 'LP' },
  ]

  const defaultWhatsappFeatures = [
    'Confirmation when we receive your bag',
    'Alert when your clothes are ready',
    'Check your drops and manage subscription',
    'Get help instantly via chat',
  ]

  const problems = getItems(sections, content, 'problem', 'problem_items', defaultProblems)
  const steps = getItems(sections, content, 'how-it-works', 'steps_items', defaultSteps)
  const testimonials = getItems(sections, content, 'testimonials', 'testimonials_items', defaultTestimonials)
  const whatsappFeatures = getItems(sections, content, 'whatsapp', 'whatsapp_features', defaultWhatsappFeatures)

  return (
    <>
      <Header />
      <main>
        {isSectionActive(sections, 'hero') && (
          <section className="bg-warm-white section-padding">
            <div className="container-width">
              <div className="max-w-4xl mx-auto text-center slide-up">
                <h1 className="heading-1 mb-6">
                  {c('hero_title', 'Gym Clothes Laundry')}
                  <span className="text-flex-navy"> {c('hero_title_highlight', 'Made Easy')}</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  {c('hero_subtitle', 'Drop off sweaty gym clothes at your gym. Pick up fresh within 48 hours. No more laundry piling up at home.')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/join" className="btn-primary text-center">{c('hero_cta_primary', 'Start Fresh Today')}</Link>
                  <Link href="/how-it-works" className="btn-secondary text-center">{c('hero_cta_secondary', 'See How It Works')}</Link>
                </div>
                <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-flex-accent" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>{c('hero_badge_1', '48hr turnaround')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-flex-accent" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>{c('hero_badge_2', 'From £5/drop')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-flex-accent" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span>{c('hero_badge_3', 'Cancel anytime')}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'problem') && (
          <section className="section-padding bg-white">
            <div className="container-width">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="heading-2 mb-4">{c('problem_title', 'The Gym Laundry Problem')}</h2>
                <p className="text-lg text-gray-600">{c('problem_subtitle', 'You work out 3-5 times a week. That\'s a lot of sweaty clothes piling up.')}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {problems.map((problem, index) => (
                  <div key={index} className="text-center p-6">
                    <div className={`w-16 h-16 ${index === 0 ? 'bg-red-100' : index === 1 ? 'bg-orange-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <svg className={`w-8 h-8 ${index === 0 ? 'text-red-500' : index === 1 ? 'text-orange-500' : 'text-yellow-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {index === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                        {index === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
                        {index === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />}
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{problem.title}</h3>
                    <p className="text-gray-600">{problem.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'how-it-works') && (
          <section className="section-padding bg-warm-gray">
            <div className="container-width">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="heading-2 mb-4">{c('steps_title', 'How FLEX Works')}</h2>
                <p className="text-lg text-gray-600">{c('steps_subtitle', 'Three simple steps. That\'s all it takes.')}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {steps.map((step, index) => (
                  <div key={index} className="bg-white rounded-2xl p-8 text-center relative">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-flex-navy text-white rounded-full flex items-center justify-center font-bold">{index + 1}</div>
                    <div className="w-20 h-20 bg-flex-light rounded-full flex items-center justify-center mx-auto mb-6 mt-4">
                      <svg className="w-10 h-10 text-flex-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {index === 0 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />}
                        {index === 1 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />}
                        {index === 2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
              <div className="text-center mt-10">
                <Link href="/how-it-works" className="text-flex-navy hover:text-gray-700 font-semibold inline-flex items-center">
                  {c('steps_link', 'Learn more about how it works')}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'pricing-preview') && (
          <section className="section-padding bg-white">
            <div className="container-width">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="heading-2 mb-4">{c('pricing_title', 'Simple, Honest Pricing')}</h2>
                <p className="text-lg text-gray-600">{c('pricing_subtitle', 'Choose the plan that fits your workout routine. Cancel anytime.')}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="card border border-gray-200">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-flex-navy mb-2">{c('pricing_plan1_name', 'Essential')}</h3>
                    <p className="text-gray-500 text-sm">{c('pricing_plan1_desc', 'For regular gym-goers')}</p>
                  </div>
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold text-flex-navy">{c('pricing_plan1_price', '£30')}</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <div className="text-center mb-6 text-flex-navy font-semibold">{c('pricing_plan1_drops', '10 drops per month')}</div>
                  <Link href="/join?plan=essential" className="block text-center btn-primary">Get Started</Link>
                </div>

                {isSectionActive(sections, 'pricing-unlimited') && (
                  <div className="card border-2 border-flex-accent relative">
                    <div className="popular-badge">Most Popular</div>
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-bold text-flex-navy mb-2">{c('pricing_plan2_name', 'Unlimited')}</h3>
                      <p className="text-gray-500 text-sm">{c('pricing_plan2_desc', 'For fitness fanatics')}</p>
                    </div>
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold text-flex-navy">{c('pricing_plan2_price', '£48')}</span>
                      <span className="text-gray-500">/month</span>
                    </div>
                    <div className="text-center mb-6 text-flex-navy font-semibold">{c('pricing_plan2_drops', '16 drops per month')}</div>
                    <Link href="/join?plan=unlimited" className="block text-center btn-accent">Get Started</Link>
                  </div>
                )}

                <div className="card border border-gray-200">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-flex-navy mb-2">{c('pricing_plan3_name', 'Single Drop')}</h3>
                    <p className="text-gray-500 text-sm">{c('pricing_plan3_desc', 'Try it out')}</p>
                  </div>
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold text-flex-navy">{c('pricing_plan3_price', '£5')}</span>
                    <span className="text-gray-500">/drop</span>
                  </div>
                  <div className="text-center mb-6 text-flex-navy font-semibold">{c('pricing_plan3_drops', 'Pay as you go')}</div>
                  <Link href="/join?plan=single" className="block text-center btn-primary">Get Started</Link>
                </div>
              </div>
              <div className="text-center mt-10">
                <Link href="/pricing" className="text-flex-navy hover:text-gray-700 font-semibold inline-flex items-center">
                  {c('pricing_link', 'Compare all plan features')}
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'whatsapp') && (
          <section className="section-padding bg-flex-navy text-white">
            <div className="container-width">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">{c('whatsapp_title', 'Updates Via WhatsApp')}</h2>
                  <p className="text-lg text-gray-300 mb-6">{c('whatsapp_subtitle', 'No app to download. We message you at every step so you always know where your clothes are.')}</p>
                  <ul className="space-y-4">
                    {whatsappFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <svg className="w-6 h-6 text-flex-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        <span>{typeof feature === 'string' ? feature : feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/10 rounded-3xl p-6">
                  <div className="bg-white rounded-2xl shadow-lg p-4 max-w-sm mx-auto">
                    <div className="flex items-center space-x-3 mb-4 pb-3 border-b">
                      <div className="w-10 h-10 bg-flex-navy rounded-full flex items-center justify-center"><span className="text-white font-bold">F</span></div>
                      <div><p className="font-semibold text-gray-900">FLEX</p><p className="text-xs text-gray-500">WhatsApp Business</p></div>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-green-100 rounded-lg p-3 max-w-[80%]">
                        <p className="text-sm text-gray-800">{c('whatsapp_demo_message', 'Your clothes are ready! 🧺 Bag B001 is waiting at East London Fitness reception.')}</p>
                        <p className="text-xs text-gray-500 mt-1">10:32 AM</p>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-flex-light rounded-lg p-3 max-w-[60%]">
                          <p className="text-sm text-gray-800">{c('whatsapp_demo_reply', 'On my way!')}</p>
                          <p className="text-xs text-gray-500 mt-1">10:33 AM ✓✓</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'testimonials') && (
          <section className="section-padding bg-warm-gray">
            <div className="container-width">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <h2 className="heading-2 mb-4">{c('testimonials_title', 'What Members Say')}</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center space-x-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      ))}
                    </div>
                    <p className="text-gray-600 mb-4">"{testimonial.quote}"</p>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-flex-light rounded-full flex items-center justify-center"><span className="font-semibold text-flex-navy">{testimonial.initials}</span></div>
                      <div><p className="font-semibold text-sm">{testimonial.name}</p><p className="text-xs text-gray-500">{testimonial.since}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'cta') && (
          <section className="section-padding bg-flex-navy text-white">
            <div className="container-width text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{c('cta_title', 'Ready to Ditch the Laundry Pile?')}</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">{c('cta_subtitle', 'Join FLEX today and never worry about gym laundry again. First drop could be tomorrow.')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/join" className="bg-white text-flex-navy px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors">{c('cta_button_primary', 'Get Started — From £5/drop')}</Link>
                <Link href="/pricing" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors">{c('cta_button_secondary', 'View Pricing')}</Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
