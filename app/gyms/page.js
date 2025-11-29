import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { getPageSections, getPageContent, isSectionActive, getContent } from '@/lib/cms'

export const metadata = {
  title: 'Partner Gyms | FLEX',
  description: 'Find FLEX gym laundry drop-off points near you.',
}

async function getGyms() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/gyms`, { next: { revalidate: 300 } })
    if (res.ok) return await res.json()
  } catch (error) { console.error('Error fetching gyms:', error) }
  return [
    { name: 'East London Fitness', slug: 'east-london-fitness', address: '123 Hackney Road', postcode: 'E2 8ET', pickupHours: 'Mon-Fri 6am-10pm, Sat-Sun 8am-8pm' },
    { name: 'The Yard', slug: 'the-yard', address: '45 Mare Street', postcode: 'E8 4RG', pickupHours: 'Mon-Fri 6am-10pm, Sat-Sun 7am-9pm' },
  ]
}

export default async function GymsPage() {
  const [sections, content, gyms] = await Promise.all([
    getPageSections('gyms'),
    getPageContent('gyms'),
    getGyms(),
  ])

  const c = (key, fallback) => getContent(content, key, fallback)

  return (
    <>
      <Header />
      <main>
        {isSectionActive(sections, 'hero') && (
          <section className="bg-warm-white py-16">
            <div className="container-width text-center">
              <h1 className="heading-1 mb-4">{c('hero_title', 'Partner Gyms')}</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">{c('hero_subtitle', 'Drop off your sweaty gym clothes at any of our partner locations.')}</p>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'gyms-list') && (
          <section className="py-16 bg-white">
            <div className="container-width">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {gyms.map((gym) => (
                  <div key={gym.slug} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-flex-navy mb-1">{gym.name}</h3>
                        <p className="text-gray-500 text-sm">{gym.address}</p>
                        <p className="text-gray-500 text-sm">{gym.postcode}</p>
                      </div>
                      <div className="w-12 h-12 bg-flex-light rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-flex-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600"><span className="font-medium">Drop-off hours:</span> {gym.pickupHours}</p>
                    </div>
                    <Link href={`/join?gym=${gym.slug}`} className="mt-4 block text-center py-2 px-4 bg-flex-navy text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">Join at this gym</Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {isSectionActive(sections, 'not-listed') && (
          <section className="py-16 bg-warm-gray">
            <div className="container-width text-center">
              <h2 className="heading-2 mb-4">{c('not_listed_title', 'Don\'t See Your Gym?')}</h2>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto">{c('not_listed_subtitle', 'We\'re expanding quickly. Let us know where you work out and we\'ll try to partner with them.')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/join" className="btn-primary">{c('not_listed_cta', 'Request Your Gym')}</Link>
                <Link href="/partners" className="btn-secondary">{c('partner_cta', 'Gym Owner? Partner With Us')}</Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
