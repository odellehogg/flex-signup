import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Privacy Policy | FLEX',
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="py-16 bg-gray-50">
        <div className="container-width">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h1 className="text-3xl font-bold text-flex-navy mb-2">Privacy Policy</h1>
            <p className="text-gray-500 mb-8">Last updated: December 2024</p>

            <div className="prose prose-gray max-w-none">
              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">1. Who We Are</h2>
              <p className="text-gray-600 mb-4">
                FLEX Active Group Ltd ("FLEX", "we", "us", "our") operates the gym clothes laundry 
                service at flexlaundry.co.uk. We are committed to protecting your privacy and handling 
                your personal data responsibly.
              </p>
              <p className="text-gray-600 mb-4">
                <strong>Company:</strong> FLEX Active Group Ltd<br />
                <strong>Contact:</strong> hello@flexlaundry.co.uk
              </p>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">2. Information We Collect</h2>
              <p className="text-gray-600 mb-4">We collect information you provide directly to us:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, phone number</li>
                <li><strong>Payment Information:</strong> Processed securely by Stripe (we don't store card details)</li>
                <li><strong>Service Data:</strong> Gym location, drop-off history, subscription preferences</li>
                <li><strong>Communications:</strong> WhatsApp messages, support enquiries</li>
              </ul>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Provide and manage our laundry service</li>
                <li>Send service notifications (drop-off confirmations, ready for pickup)</li>
                <li>Process payments</li>
                <li>Respond to your enquiries</li>
                <li>Improve our service</li>
                <li>Send marketing communications (with your consent)</li>
              </ul>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">4. Legal Basis for Processing</h2>
              <p className="text-gray-600 mb-4">We process your data based on:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li><strong>Contract:</strong> To provide our service to you</li>
                <li><strong>Legitimate Interest:</strong> To improve our service and communicate with you</li>
                <li><strong>Consent:</strong> For marketing communications</li>
                <li><strong>Legal Obligation:</strong> Where required by law</li>
              </ul>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">5. Data Sharing</h2>
              <p className="text-gray-600 mb-4">We share your data with:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li><strong>Partner Gyms:</strong> Your name and bag number for drop-off/pickup</li>
                <li><strong>Laundry Partners:</strong> Bag information only (no personal details)</li>
                <li><strong>Service Providers:</strong> Stripe (payments), Twilio (WhatsApp), Resend (email)</li>
              </ul>
              <p className="text-gray-600 mb-4">We do not sell your personal data to third parties.</p>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">6. Data Retention</h2>
              <p className="text-gray-600 mb-4">
                We retain your data for as long as you have an active account, plus 2 years after 
                cancellation for legal and accounting purposes. You can request deletion at any time.
              </p>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">7. Your Rights</h2>
              <p className="text-gray-600 mb-4">Under UK GDPR, you have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing</li>
                <li>Data portability</li>
                <li>Withdraw consent</li>
              </ul>
              <p className="text-gray-600 mb-4">
                To exercise these rights, contact us at hello@flexlaundry.co.uk
              </p>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">8. Cookies</h2>
              <p className="text-gray-600 mb-4">
                We use essential cookies to make our website work. We don't use tracking or 
                advertising cookies.
              </p>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">9. Security</h2>
              <p className="text-gray-600 mb-4">
                We implement appropriate security measures to protect your data, including encryption, 
                secure servers, and access controls.
              </p>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-600 mb-4">
                We may update this policy from time to time. We'll notify you of significant changes 
                via email or WhatsApp.
              </p>

              <h2 className="text-xl font-semibold text-flex-navy mt-8 mb-4">11. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                For any privacy-related questions, contact us at:<br />
                <strong>Email:</strong> hello@flexlaundry.co.uk<br />
                <strong>WhatsApp:</strong> +44 7530 659971
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
