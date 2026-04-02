import { COMPANY } from '@/lib/constants';

export const metadata = {
  title: 'Contact — FLEX Gym Laundry',
  description: 'Get in touch with FLEX. WhatsApp or email us.',
  openGraph: { title: 'Contact — FLEX', url: 'https://www.flexlaundry.co.uk/contact' },
};

export default function ContactPage() {
  return (
    <>
      <section className="section-padding pt-24 md:pt-32 bg-flex-bg">
        <div className="container-page text-center">
          <span className="label-tag">Contact</span>
          <h1 className="heading-1 mt-3">Get in touch.</h1>
          <p className="text-flex-text mt-2 text-lg">We&apos;re here to help. Reach us however&apos;s easiest.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-page max-w-[800px]">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-[20px] p-7 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="heading-3 mb-1">WhatsApp</h3>
              <p className="text-flex-text text-[0.82rem] mb-4">Fastest way to reach us. We typically respond within minutes.</p>
              <a href={`https://wa.me/${COMPANY.phone.replace('+', '')}`} className="btn-primary text-[0.75rem] px-5 py-2.5">Message Us &rarr;</a>
              <p className="text-[0.68rem] text-flex-muted mt-2">{COMPANY.phone}</p>
            </div>
            <div className="bg-white rounded-[20px] p-7 text-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="text-3xl mb-3">✉️</div>
              <h3 className="heading-3 mb-1">Email</h3>
              <p className="text-flex-text text-[0.82rem] mb-4">For detailed inquiries or partnership discussions.</p>
              <a href={`mailto:${COMPANY.email}`} className="btn-secondary text-[0.75rem] px-5 py-2.5">Send Email &rarr;</a>
              <p className="text-[0.68rem] text-flex-muted mt-2">{COMPANY.email}</p>
            </div>
          </div>

          <div className="text-center mt-10">
            <span className="label-tag">Support Hours</span>
            <div className="grid grid-cols-3 gap-2 max-w-[380px] mx-auto mt-4">
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <div className="font-semibold text-[0.7rem]">Mon-Fri</div>
                <div className="text-[0.72rem] text-flex-muted">9am-6pm</div>
              </div>
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <div className="font-semibold text-[0.7rem]">Saturday</div>
                <div className="text-[0.72rem] text-flex-muted">10am-4pm</div>
              </div>
              <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
                <div className="font-semibold text-[0.7rem]">Sunday</div>
                <div className="text-[0.72rem] text-flex-muted">Closed</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-10">
            <h2 className="heading-2">How can we help?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mt-5">
            {[
              { t: 'New Customer', d: 'How the service works, pricing, getting started.' },
              { t: 'Existing Member', d: 'Order tracking, subscription changes, reporting an issue.' },
              { t: 'Gym Partnership', d: 'Want FLEX at your gym? Let\'s talk.' },
              { t: 'Press & Media', d: 'Interviews, features, press kit requests.' },
            ].map((topic, i) => (
              <div key={i} className="bg-white rounded-[20px] p-5 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-[0.88rem] mb-0.5">{topic.t}</h3>
                <p className="text-flex-muted text-[0.72rem]">{topic.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-flex-bg">
        <div className="container-page text-center">
          <span className="label-tag">Company</span>
          <p className="font-medium text-[0.88rem] mt-2">FLEX Active Group Ltd</p>
          <p className="text-flex-muted text-[0.68rem]">London, United Kingdom &middot; Company No. 12345678</p>
        </div>
      </section>
    </>
  );
}
