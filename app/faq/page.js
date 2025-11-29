'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

const defaultFaqs = [
  {
    category: 'Getting Started',
    questions: [
      { q: 'How do I sign up?', a: 'Click "Get Started" and choose your plan. After payment, you\'ll receive a welcome message on WhatsApp with your bag number and instructions.' },
      { q: 'Which gyms do you work with?', a: 'We\'re currently partnered with gyms in East London. Check our locations page or ask your gym if they\'d like to partner with us.' },
      { q: 'Do I need to download an app?', a: 'No app needed! Everything happens via WhatsApp. You\'ll get notifications when your clothes are collected, being cleaned, and ready for pickup.' },
    ],
  },
  {
    category: 'Using the Service',
    questions: [
      { q: 'What can I put in my FLEX bag?', a: 'Up to 5 items of activewear: t-shirts, shorts, leggings, sports bras, socks, hoodies, and other workout clothes. No shoes (but you can add our Shoe Refresh service), no towels.' },
      { q: 'How long until I get my clothes back?', a: '48 hours from drop-off. Drop off by 6pm and we\'ll collect the same evening. Your clothes will be back at your gym within 48 hours.' },
      { q: 'How do I know when my clothes are ready?', a: 'We\'ll send you a WhatsApp message as soon as your bag is back at the gym. You can also message us anytime to check status.' },
    ],
  },
  {
    category: 'Billing & Plans',
    questions: [
      { q: 'What counts as one "drop"?', a: 'One drop = one FLEX bag containing up to 5 items. If you work out and drop off clothes, that\'s one drop, regardless of whether you put 2 items or 5 items.' },
      { q: 'Do unused drops roll over?', a: 'No, drops don\'t roll over to the next month. We recommend choosing the plan that matches your typical workout frequency.' },
      { q: 'Can I change or cancel my plan?', a: 'Yes! Message us on WhatsApp to upgrade, downgrade, pause, or cancel. No contracts, no fees.' },
    ],
  },
  {
    category: 'Care & Quality',
    questions: [
      { q: 'How do you clean my clothes?', a: 'We use specialist activewear detergents that remove odours and bacteria without damaging performance fabrics. Low-temperature wash and air drying.' },
      { q: 'What if something gets damaged?', a: 'We\'re fully insured. If anything is damaged during cleaning, contact us via WhatsApp and we\'ll arrange compensation.' },
    ],
  },
]

export default function FAQPage() {
  const [openItems, setOpenItems] = useState({})
  const [faqs, setFaqs] = useState(defaultFaqs)
  const [content, setContent] = useState({})

  useEffect(() => {
    // Fetch CMS content
    async function fetchContent() {
      try {
        const res = await fetch('/api/content?page=faq')
        if (res.ok) {
          const data = await res.json()
          setContent(data)
          // If FAQs are in CMS, use them
          if (data.faqs) {
            try {
              setFaqs(JSON.parse(data.faqs))
            } catch (e) {
              console.error('Error parsing FAQ JSON')
            }
          }
        }
      } catch (error) {
        console.error('Error fetching FAQ content')
      }
    }
    fetchContent()
  }, [])

  const c = (key, fallback) => content[key] || fallback

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      <Header />
      <main>
        <section className="bg-warm-white py-16">
          <div className="container-width text-center">
            <h1 className="heading-1 mb-4">{c('hero_title', 'Frequently Asked Questions')}</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{c('hero_subtitle', 'Everything you need to know about FLEX')}</p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container-width">
            <div className="max-w-3xl mx-auto">
              {faqs.map((category, categoryIndex) => (
                <div key={category.category} className="mb-12">
                  <h2 className="text-2xl font-bold text-flex-navy mb-6">{category.category}</h2>
                  <div className="space-y-4">
                    {category.questions.map((item, questionIndex) => {
                      const key = `${categoryIndex}-${questionIndex}`
                      const isOpen = openItems[key]
                      return (
                        <div key={questionIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                          <button onClick={() => toggleItem(categoryIndex, questionIndex)} className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <span className="font-semibold text-flex-navy pr-4">{item.q}</span>
                            <svg className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {isOpen && <div className="px-6 pb-4"><p className="text-gray-600">{item.a}</p></div>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-warm-gray">
          <div className="container-width text-center">
            <h2 className="heading-2 mb-4">{c('cta_title', 'Still Have Questions?')}</h2>
            <p className="text-gray-600 mb-8">{c('cta_subtitle', 'We\'re here to help')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={c('whatsapp_link', 'https://wa.me/447366907286')} className="btn-primary inline-flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                <span>Message Us on WhatsApp</span>
              </a>
              <a href={c('email_link', 'mailto:hello@flexlaundry.co.uk')} className="btn-secondary">Email Us</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
