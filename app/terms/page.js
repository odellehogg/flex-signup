import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Terms of Service | FLEX',
}

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="py-16 bg-gray-50">
        <div className="container-width">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h1 className="text-3xl font-bold text-flex-navy mb-2">Terms of Service</h1>
            <p className="text-gray-500 mb-8">Last updated: December 2024</p>

            <div className="prose prose-gray max-w-none">
              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-600 mb-4">
                By using FLEX services, you agree to these Terms of Service. If you don't agree, 
                please don't use our service.
              </p>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">2. The Service</h2>
              <p className="text-gray-600 mb-4">
                FLEX provides a gym clothes laundry service. You drop off activewear at partner gyms, 
                we clean it, and return it within 48 hours.
              </p>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">3. Eligibility</h2>
              <p className="text-gray-600 mb-4">
                You must be at least 18 years old and have a valid UK mobile number to use FLEX.
              </p>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">4. Subscriptions & Payment</h2>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Subscriptions renew automatically each month</li>
                <li>Payment is processed via Stripe</li>
                <li>Unused drops do not roll over to the next month</li>
                <li>You can cancel anytime via WhatsApp or your account</li>
                <li>Cancellation takes effect at the end of your current billing period</li>
              </ul>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">5. Acceptable Items</h2>
              <p className="text-gray-600 mb-4">You may include:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Activewear: t-shirts, shorts, leggings, sports bras, socks, hoodies</li>
                <li>Up to 5 items per FLEX bag</li>
              </ul>
              <p className="text-gray-600 mb-4">You may NOT include:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Shoes (available as separate add-on service)</li>
                <li>Towels</li>
                <li>Regular non-activewear clothing</li>
                <li>Items with excessive damage</li>
                <li>Items with biohazard contamination</li>
              </ul>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">6. Drop-off & Pickup</h2>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Drop off bags at partner gym reception by 6pm for next-day collection</li>
                <li>Clothes are returned within 48 hours</li>
                <li>Collect from gym reception within 7 days</li>
                <li>Uncollected items after 7 days may be donated to charity</li>
              </ul>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">7. Liability & Insurance</h2>
              <p className="text-gray-600 mb-4">
                We carry Bailee's (Customer Goods) insurance. In the event of loss or damage:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Report within 24 hours of pickup</li>
                <li>Maximum compensation: £50 per item, £200 per bag</li>
                <li>We're not liable for items not suitable for machine washing</li>
                <li>We're not liable for items with pre-existing damage</li>
                <li>We're not liable for colour bleeding on items washed together by customer</li>
              </ul>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">8. Pausing & Cancellation</h2>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Pause subscription for 2 weeks or 1 month via WhatsApp</li>
                <li>Cancel anytime — no fees or penalties</li>
                <li>Continue using remaining drops until billing period ends</li>
                <li>No refunds for partial months</li>
              </ul>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">9. Code of Conduct</h2>
              <p className="text-gray-600 mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Submit items that don't belong to you</li>
                <li>Submit items with illegal substances</li>
                <li>Abuse or harass our staff or partners</li>
                <li>Use the service for commercial purposes without permission</li>
              </ul>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-600 mb-4">
                We may update these terms. We'll notify you of significant changes via email or 
                WhatsApp at least 14 days in advance.
              </p>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">11. Governing Law</h2>
              <p className="text-gray-600 mb-4">
                These terms are governed by English law. Disputes will be resolved in the courts 
                of England and Wales.
              </p>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">12. Contact</h2>
              <p className="text-gray-600 mb-4">
                <strong>FLEX Active Group Ltd</strong><br />
                Email: hello@flexlaundry.co.uk<br />
                WhatsApp: +44 7530 659971
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
