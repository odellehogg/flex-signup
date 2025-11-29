import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getPageSections, getPageContent, isSectionActive, getContent } from '@/lib/cms'

export const metadata = {
  title: 'Contact Us | FLEX',
  description: 'Get in touch with FLEX. We\'re here to help with your gym laundry questions.',
}

export default async function ContactPage() {
  const [sections, content] = await Promise.all([
    getPageSections('contact'),
    getPageContent('contact'),
  ])

  const c = (key, fallback) => getContent(content, key, fallback)

  return (
    <>
      <Header />
      <main>
        {isSectionActive(sections, 'hero') && (
          <section className="bg-warm-white py-16">
            <div className="container-width text-center">
              <h1 className="heading-1 mb-4">{c('hero_title', 'Get in Touch')}</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">{c('hero_subtitle', 'We\'re here to help. Reach out and we\'ll respond as soon as we can.')}</p>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'contact-options') && (
          <section className="py-16 bg-white">
            <div className="container-width">
              <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center p-8 bg-gray-50 rounded-2xl">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-flex-navy mb-2">{c('whatsapp_title', 'WhatsApp')}</h3>
                  <p className="text-gray-600 text-sm mb-4">{c('whatsapp_description', 'Fastest way to reach us. Usually reply within minutes.')}</p>
                  <a href={c('whatsapp_link', 'https://wa.me/447366907286')} className="text-green-600 font-medium hover:underline">{c('whatsapp_number', '+44 7530 659971')}</a>
                </div>
                <div className="text-center p-8 bg-gray-50 rounded-2xl">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-flex-navy mb-2">{c('email_title', 'Email')}</h3>
                  <p className="text-gray-600 text-sm mb-4">{c('email_description', 'For detailed enquiries. We respond within 24 hours.')}</p>
                  <a href={c('email_link', 'mailto:hello@flexlaundry.co.uk')} className="text-blue-600 font-medium hover:underline">{c('email_address', 'hello@flexlaundry.co.uk')}</a>
                </div>
                <div className="text-center p-8 bg-gray-50 rounded-2xl">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-flex-navy mb-2">{c('partner_title', 'Gym Partnerships')}</h3>
                  <p className="text-gray-600 text-sm mb-4">{c('partner_description', 'Interested in bringing FLEX to your gym?')}</p>
                  <a href="/partners" className="text-purple-600 font-medium hover:underline">{c('partner_link_text', 'Partner with us →')}</a>
                </div>
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'faq-cta') && (
          <section className="py-16 bg-warm-gray">
            <div className="container-width text-center">
              <h2 className="heading-2 mb-4">{c('faq_title', 'Looking for Answers?')}</h2>
              <p className="text-gray-600 mb-8">{c('faq_subtitle', 'Check our FAQ for quick answers to common questions.')}</p>
              <a href="/faq" className="btn-primary">{c('faq_button', 'View FAQs')}</a>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
