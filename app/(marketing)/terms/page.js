import { COMPANY } from '@/lib/constants';

export const metadata = {
  title: 'Terms of Service - FLEX',
  description: 'FLEX terms of service. Terms and conditions for using our gym laundry service.',
};

export default function TermsPage() {
  return (
    <section className="section bg-white">
      <div className="container-page max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Agreement to Terms</h2>
          <p className="text-gray-600 mb-4">
            By using FLEX services, you agree to these terms. FLEX is operated by {COMPANY.legalName}.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Service Description</h2>
          <p className="text-gray-600 mb-4">
            FLEX provides gym clothes laundry services through partner gym locations. We collect, clean, and return your gym wear within 48 hours.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Subscriptions & Payments</h2>
          <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
            <li>Subscriptions renew automatically each month</li>
            <li>You can cancel anytime; service continues until period end</li>
            <li>Unused drops do not roll over to the next month</li>
            <li>Prices may change with 30 days notice</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Acceptable Items</h2>
          <p className="text-gray-600 mb-4">You may include: gym tops, shorts, leggings, sports bras, towels, socks, hoodies, and joggers.</p>
          <p className="text-gray-600 mb-4">You may not include: shoes, underwear, valuables, electronics, or non-gym clothing.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Liability</h2>
          <p className="text-gray-600 mb-4">
            While we take great care with your items, we are not liable for items over £50 in value unless declared in advance. We are not responsible for items left in pockets.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Lost or Damaged Items</h2>
          <p className="text-gray-600 mb-4">
            If items are lost or damaged, report within 7 days of collection. We'll investigate and provide appropriate compensation up to the item's depreciated value.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Pickup Timeline</h2>
          <p className="text-gray-600 mb-4">
            Items must be collected within 7 days of the ready notification. After 14 days, unclaimed items may be donated to charity.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Cancellation</h2>
          <p className="text-gray-600 mb-4">
            Cancel anytime via WhatsApp or your member portal. No cancellation fees apply. Active drops must be completed.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Service Availability</h2>
          <p className="text-gray-600 mb-4">
            Service is available only at partner gym locations. We may suspend service during partner location closures or unforeseen circumstances.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Changes to Terms</h2>
          <p className="text-gray-600 mb-4">
            We may update these terms with notice. Continued use after changes constitutes acceptance.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contact</h2>
          <p className="text-gray-600 mb-4">
            Questions about these terms? Contact us at {COMPANY.email} or WhatsApp {COMPANY.phone}.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Governing Law</h2>
          <p className="text-gray-600 mb-4">
            These terms are governed by the laws of England and Wales.
          </p>
        </div>
      </div>
    </section>
  );
}
