export const metadata = {
  title: 'Privacy Policy — FLEX',
  description: 'FLEX privacy policy. How we collect, use, and protect your personal information.',
  openGraph: { title: 'Privacy Policy — FLEX', url: 'https://www.flexlaundry.co.uk/privacy' },
};

export default function PrivacyPage() {
  return (
    <section className="section-padding">
      <div className="container-narrow pt-16 md:pt-20">
        <span className="label-tag">Legal</span>
        <h1 className="heading-1 mt-3 mb-1">Privacy Policy</h1>
        <p className="text-flex-muted text-[0.72rem] mb-8">Last updated: 1 April 2026</p>

        <div className="space-y-6 text-[0.88rem] text-flex-text leading-relaxed">
          <div>
            <h2 className="heading-3 mb-2">1. Introduction</h2>
            <p>FLEX Active Group Ltd (trading as &ldquo;FLEX&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal data when you use the FLEX gym clothes laundry service, our website at flexlaundry.co.uk, and our WhatsApp-based communication platform.</p>
            <p className="mt-2">FLEX Active Group Ltd is the data controller for the purposes of applicable data protection legislation, including the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
            <p className="mt-2">Contact: hello@flexlaundry.co.uk | +44 7366 907286</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">2. Information We Collect</h2>
            <p className="mb-2">We collect the following categories of personal data:</p>
            <p className="font-semibold mt-3 mb-1">2.1 Information you provide directly</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Full name, email address, and mobile phone number (provided during registration)</li>
              <li>Gym location preference (selected during sign-up)</li>
              <li>Payment information (card details are processed and stored securely by Stripe; we do not store your full card number on our servers)</li>
              <li>Support ticket content, including descriptions of issues and any photographs submitted</li>
            </ul>
            <p className="font-semibold mt-3 mb-1">2.2 Information generated through your use of the service</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Drop and pickup records, including bag numbers, dates, times, and status updates</li>
              <li>Subscription plan details, billing history, and drop usage</li>
              <li>WhatsApp messages exchanged with our service (processed via Twilio)</li>
              <li>Login verification codes and authentication session data</li>
            </ul>
            <p className="font-semibold mt-3 mb-1">2.3 Automatically collected information</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Device type, browser type, and operating system when accessing our website</li>
              <li>IP address and approximate location data</li>
              <li>Pages viewed and interactions on our website</li>
            </ul>
          </div>

          <div>
            <h2 className="heading-3 mb-2">3. How We Use Your Information</h2>
            <p className="mb-2">We process your personal data for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Service delivery:</strong> To process your laundry drops, track bag status, manage pickups, and return your clean clothes to the correct gym location</li>
              <li><strong>Communication:</strong> To send you notifications via WhatsApp and email, including drop confirmations, ready-for-pickup alerts, subscription reminders, and low-drop warnings</li>
              <li><strong>Payment processing:</strong> To charge for services via Stripe, manage subscription billing, process refunds, and handle failed payment recovery</li>
              <li><strong>Customer support:</strong> To respond to your inquiries, manage support tickets, and resolve issues related to lost or damaged items</li>
              <li><strong>Account management:</strong> To authenticate your identity via verification codes, manage your subscription status, and maintain your member profile</li>
              <li><strong>Service improvement:</strong> To analyse usage patterns (in aggregate) and improve the quality and efficiency of our service</li>
              <li><strong>Legal compliance:</strong> To comply with our legal and regulatory obligations, including financial record-keeping requirements</li>
            </ul>
            <p className="mt-2">The legal bases for our processing are: performance of a contract (providing the service you signed up for), legitimate interests (improving our service, preventing fraud), consent (where applicable for marketing communications), and legal obligation (financial records, tax compliance).</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">4. Data Sharing</h2>
            <p className="mb-2">We share your personal data only with the following third-party service providers, each of whom is necessary to deliver the FLEX service:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Stripe</strong> (stripe.com) — Payment processing. Stripe processes and stores your payment card details securely. Stripe is PCI DSS Level 1 certified.</li>
              <li><strong>Twilio</strong> (twilio.com) — WhatsApp messaging. Twilio processes your phone number and message content to deliver WhatsApp notifications and enable conversational support.</li>
              <li><strong>Resend</strong> (resend.com) — Email delivery. Resend processes your email address and email content to send transactional emails (verification codes, receipts, support replies).</li>
              <li><strong>Airtable</strong> (airtable.com) — Operational database. Airtable stores your account information, drop records, and support tickets to enable service operations.</li>
              <li><strong>Vercel</strong> (vercel.com) — Website hosting. Vercel hosts our website and processes standard web server logs.</li>
            </ul>
            <p className="mt-2">We do not sell, rent, or trade your personal data to third parties for marketing purposes. We do not share your data with advertisers.</p>
            <p className="mt-2">We may disclose your information if required to do so by law, regulation, or legal process, or if we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">5. International Data Transfers</h2>
            <p>Some of our third-party service providers (Stripe, Twilio, Airtable, Vercel) process data in the United States. Where personal data is transferred outside the UK, we ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the Information Commissioner&apos;s Office (ICO), or reliance on the provider&apos;s certification under recognised frameworks.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">6. Data Retention</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Active accounts:</strong> We retain your personal data for as long as your FLEX account is active and you are using our service.</li>
              <li><strong>After cancellation:</strong> We retain your account data for 12 months following cancellation or account closure, in case you wish to reactivate your account or in the event of a dispute.</li>
              <li><strong>Financial records:</strong> Payment and transaction records are retained for 7 years as required by UK tax and accounting regulations (HMRC requirements).</li>
              <li><strong>Support tickets:</strong> Support correspondence is retained for 24 months after resolution.</li>
              <li><strong>Verification codes:</strong> Login verification codes are automatically deleted within 10 minutes of generation or upon successful use.</li>
            </ul>
            <p className="mt-2">You may request earlier deletion of your data at any time (see Section 7 below), subject to our legal retention obligations.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">7. Your Rights</h2>
            <p className="mb-2">Under the UK GDPR, you have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Right of access:</strong> You can request a copy of the personal data we hold about you.</li>
              <li><strong>Right to rectification:</strong> You can request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to erasure:</strong> You can request deletion of your data (subject to our legal retention obligations).</li>
              <li><strong>Right to restrict processing:</strong> You can request that we limit how we use your data in certain circumstances.</li>
              <li><strong>Right to data portability:</strong> You can request your data in a structured, machine-readable format.</li>
              <li><strong>Right to object:</strong> You can object to processing based on legitimate interests.</li>
              <li><strong>Right to withdraw consent:</strong> Where processing is based on consent, you can withdraw it at any time.</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, contact us at hello@flexlaundry.co.uk. We will respond within 30 days. If you are unsatisfied with our response, you have the right to lodge a complaint with the Information Commissioner&apos;s Office (ICO) at ico.org.uk.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">8. Data Security</h2>
            <p>We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, alteration, disclosure, or destruction. These measures include:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Encrypted data transmission (HTTPS/TLS) across all services</li>
              <li>Secure authentication using time-limited JWT tokens</li>
              <li>Payment data handled exclusively by PCI DSS-certified Stripe</li>
              <li>Access controls limiting employee access to personal data on a need-to-know basis</li>
              <li>Regular review of data processing practices and security measures</li>
            </ul>
            <p className="mt-2">While we take reasonable precautions, no method of electronic transmission or storage is 100% secure. We cannot guarantee absolute security of your data.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">9. Cookies</h2>
            <p>We use only essential cookies necessary for the operation of our service:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>flex_auth:</strong> An authentication cookie containing a JSON Web Token (JWT) that keeps you logged into the member portal. This cookie expires after 7 days. It is strictly necessary and cannot be disabled without preventing access to authenticated features.</li>
            </ul>
            <p className="mt-2">We do not use any analytics, advertising, or third-party tracking cookies. We do not participate in any advertising networks or retargeting programmes.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">10. Children&apos;s Privacy</h2>
            <p>FLEX is not intended for use by individuals under the age of 18. We do not knowingly collect personal data from children. If we become aware that we have collected data from a person under 18, we will delete it promptly.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices, service features, or legal requirements. We will notify you of significant changes via email or WhatsApp at least 14 days before they take effect. The &ldquo;last updated&rdquo; date at the top of this page indicates when this policy was most recently revised.</p>
          </div>

          <div>
            <h2 className="heading-3 mb-2">12. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
            <ul className="list-none mt-2 space-y-1">
              <li><strong>Email:</strong> hello@flexlaundry.co.uk</li>
              <li><strong>WhatsApp:</strong> +44 7366 907286</li>
              <li><strong>Post:</strong> FLEX Active Group Ltd, London, United Kingdom</li>
              <li><strong>Company Number:</strong> 12345678 (registered in England &amp; Wales)</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
