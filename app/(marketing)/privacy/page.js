import { COMPANY } from '@/lib/constants';

export const metadata = {
  title: 'Privacy Policy - FLEX',
  description: 'FLEX privacy policy. How we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <section className="section bg-white">
      <div className="container-page max-w-3xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: January 2025</p>

        <div className="prose prose-gray max-w-none">
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p className="text-gray-600 mb-4">
            {COMPANY.legalName} (trading as "FLEX", "we", "us", or "our") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Information We Collect</h2>
          <p className="text-gray-600 mb-4">We collect information you provide directly:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
            <li>Name and contact details (email, phone number)</li>
            <li>Payment information (processed securely by Stripe)</li>
            <li>Gym location preferences</li>
            <li>Service usage and communication history</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-600 mb-4">We use your information to:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
            <li>Provide and improve our laundry service</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send service notifications via WhatsApp and email</li>
            <li>Respond to your inquiries and support requests</li>
            <li>Communicate about updates to our service</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Sharing</h2>
          <p className="text-gray-600 mb-4">
            We share your information only with service providers necessary to deliver our service: Stripe (payments), Twilio (WhatsApp messaging), and our laundry partners. We never sell your personal data.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Security</h2>
          <p className="text-gray-600 mb-4">
            We implement appropriate security measures to protect your information. Payment details are handled exclusively by Stripe and never stored on our servers.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights</h2>
          <p className="text-gray-600 mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt out of marketing communications</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies</h2>
          <p className="text-gray-600 mb-4">
            We use essential cookies for authentication and basic site functionality. We do not use third-party tracking cookies.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Us</h2>
          <p className="text-gray-600 mb-4">
            For privacy-related inquiries, contact us at {COMPANY.email} or via WhatsApp at {COMPANY.phone}.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to This Policy</h2>
          <p className="text-gray-600 mb-4">
            We may update this policy periodically. We'll notify you of significant changes via email or WhatsApp.
          </p>
        </div>
      </div>
    </section>
  );
}
