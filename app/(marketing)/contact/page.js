import { COMPANY } from '@/lib/constants';

export const metadata = {
  title: 'Contact Us - FLEX Gym Laundry Service',
  description: 'Get in touch with FLEX. Contact us via WhatsApp or email.',
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-white py-16 md:py-24">
        <div className="container-page text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get In Touch
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We'd love to hear from you. Reach out anytime.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="section bg-white">
        <div className="container-page max-w-4xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* WhatsApp */}
            <div className="card text-center">
              <div className="text-5xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">WhatsApp</h2>
              <p className="text-gray-600 mb-4">
                Fastest way to reach us. We typically respond within minutes.
              </p>
              <a 
                href={`https://wa.me/${COMPANY.phone.replace('+', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-block"
              >
                Message Us
              </a>
              <p className="text-sm text-gray-500 mt-3">
                {COMPANY.phone}
              </p>
            </div>

            {/* Email */}
            <div className="card text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email</h2>
              <p className="text-gray-600 mb-4">
                For detailed inquiries or partnership discussions.
              </p>
              <a 
                href={`mailto:${COMPANY.email}`}
                className="btn-primary inline-block"
              >
                Send Email
              </a>
              <p className="text-sm text-gray-500 mt-3">
                {COMPANY.email}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Support Hours
            </h3>
            <p className="text-gray-600">
              Monday - Friday: 9am - 6pm<br />
              Saturday: 10am - 4pm<br />
              Sunday: Closed
            </p>
          </div>
        </div>
      </section>

      {/* Common Topics */}
      <section className="section bg-gray-50">
        <div className="container-page max-w-4xl">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            How Can We Help?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-semibold mb-2">New Customer Questions</h3>
              <p className="text-gray-600 text-sm">
                Questions about how FLEX works, pricing, or getting started.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Existing Member Support</h3>
              <p className="text-gray-600 text-sm">
                Track orders, manage subscription, or report an issue.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Gym Partnerships</h3>
              <p className="text-gray-600 text-sm">
                Interested in bringing FLEX to your gym? Let's talk.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg">
              <h3 className="font-semibold mb-2">Press & Media</h3>
              <p className="text-gray-600 text-sm">
                Media inquiries and press requests.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="section bg-white">
        <div className="container-page text-center max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Company Information
          </h2>
          <p className="text-gray-600">
            <strong>{COMPANY.legalName}</strong><br />
            Trading as "{COMPANY.name}"<br /><br />
            {COMPANY.address.line1}<br />
            {COMPANY.address.country}
          </p>
        </div>
      </section>
    </>
  );
}
