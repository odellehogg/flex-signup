import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { getPageContent, getContent } from '@/lib/cms'

export const metadata = {
  title: 'Welcome to FLEX!',
  description: 'Your subscription is confirmed. Here\'s what happens next.',
}

export default async function SuccessPage() {
  const content = await getPageContent('success')
  const c = (key, fallback) => getContent(content, key, fallback)

  const defaultSteps = [
    { step: 1, title: 'Check WhatsApp', description: 'You\'ll receive a welcome message with your bag number and instructions.' },
    { step: 2, title: 'Visit Your Gym', description: 'Ask at reception for your FLEX bag. It\'ll be waiting for you.' },
    { step: 3, title: 'Drop Off After Your Workout', description: 'Fill your bag with sweaty clothes (up to 5 items) and drop it in the FLEX bin.' },
    { step: 4, title: 'Pick Up Fresh', description: 'We\'ll WhatsApp you within 48 hours when your clothes are ready.' },
  ]

  return (
    <>
      <Header />
      <main>
        <section className="bg-flex-navy text-white py-20">
          <div className="container-width text-center">
            <div className="w-20 h-20 bg-flex-accent rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{c('hero_title', 'Welcome to FLEX!')}</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">{c('hero_subtitle', 'Your subscription is confirmed. You\'re about to make gym laundry the easiest part of your routine.')}</p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container-width">
            <h2 className="heading-2 text-center mb-12">{c('next_title', 'What Happens Next')}</h2>
            <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {defaultSteps.map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-flex-navy text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">{item.step}</div>
                  <h3 className="font-semibold text-flex-navy mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-warm-gray">
          <div className="container-width">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="heading-2 mb-4">{c('help_title', 'Need Help?')}</h2>
              <p className="text-gray-600 mb-8">{c('help_subtitle', 'We\'re just a message away. Reach out anytime on WhatsApp.')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://wa.me/447366907286?text=HELP" className="btn-primary inline-flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  <span>Already a Member? Get Help</span>
                </a>
                <Link href="/faq" className="btn-secondary">View FAQs</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
