import Link from 'next/link';

export const metadata = {
  title: 'FAQ - FLEX Gym Laundry Service',
  description: 'Frequently asked questions about FLEX gym clothes laundry service. Get answers about pricing, service, and more.',
};

const faqs = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How does FLEX work?',
        a: 'Simple! After signing up, drop your sweaty gym clothes in a FLEX bag at your gym. We collect them, wash them with activewear-safe products, and return them to your gym within 48 hours. You\'ll get a WhatsApp notification when they\'re ready.',
      },
      {
        q: 'Which gyms are you available at?',
        a: 'We\'re currently launching in select London gyms. During signup, you\'ll see which gyms in your area are available. Don\'t see your gym? Let us know and we\'ll work on adding them.',
      },
      {
        q: 'Do I need to download an app?',
        a: 'No app needed! Everything works through WhatsApp. You\'ll receive notifications, track your bags, and manage your subscription all via WhatsApp messages.',
      },
      {
        q: 'How do I sign up?',
        a: 'Just click "Get Started" and follow the steps. You\'ll choose your plan, select your gym, and enter your payment details. The whole process takes about 2 minutes.',
      },
    ],
  },
  {
    category: 'Pricing & Plans',
    questions: [
      {
        q: 'What plans do you offer?',
        a: 'We have three options: One-Off (£5 for a single drop), Essential (£35/month for 10 drops), and Unlimited (£48/month for up to 16 drops). The Essential plan is most popular for people who work out 2-3 times per week.',
      },
      {
        q: 'Can I try before committing?',
        a: 'Absolutely! Our One-Off option lets you try the service for just £5 with no subscription commitment.',
      },
      {
        q: 'What happens if I don\'t use all my drops?',
        a: 'Unused drops don\'t roll over to the next month. We recommend choosing a plan that matches your typical workout frequency.',
      },
      {
        q: 'Can I change or cancel my plan?',
        a: 'Yes! You can upgrade, downgrade, pause, or cancel your subscription anytime from your member portal or via WhatsApp. Changes take effect at your next billing date.',
      },
      {
        q: 'Are there any hidden fees?',
        a: 'None at all. The price you see is the price you pay. No setup fees, no cancellation fees.',
      },
    ],
  },
  {
    category: 'The Service',
    questions: [
      {
        q: 'What can I include in a drop?',
        a: 'Gym tops, shorts, leggings, sports bras, towels, socks, hoodies, and joggers. Basically anything you\'d wear to the gym except shoes and underwear.',
      },
      {
        q: 'How many items fit in a bag?',
        a: 'Each FLEX bag comfortably fits a typical gym outfit: top, bottoms, sports bra, socks, and a small towel. Think of it as one workout\'s worth of clothes.',
      },
      {
        q: 'How long does turnaround take?',
        a: '48 hours from drop-off to ready for pickup. Drop before 6pm, and your clothes will typically be ready by the same time two days later.',
      },
      {
        q: 'How do I know when my clothes are ready?',
        a: 'You\'ll receive a WhatsApp message as soon as your clothes are back at the gym and ready for pickup.',
      },
      {
        q: 'What if I can\'t pick up right away?',
        a: 'No problem! Your clothes will be held at the gym reception for up to 7 days. Just let us know if you need more time.',
      },
    ],
  },
  {
    category: 'Care & Quality',
    questions: [
      {
        q: 'How do you wash the clothes?',
        a: 'We use cold water and activewear-safe detergent to preserve elasticity and moisture-wicking properties. Low heat drying protects fabrics from damage.',
      },
      {
        q: 'Will my clothes shrink or get damaged?',
        a: 'Our process is specifically designed for activewear. Cold water and low heat prevent shrinking and damage that can occur with regular washing.',
      },
      {
        q: 'What if something goes missing or gets damaged?',
        a: 'It rarely happens, but if it does, contact us via WhatsApp. We\'ll investigate and make it right, whether that\'s a refund or replacement.',
      },
      {
        q: 'Are my clothes washed separately from others?',
        a: 'Your clothes stay in your numbered bag throughout the process. While they\'re washed in batched loads with other FLEX bags, they\'re never mixed with other customers\' items.',
      },
    ],
  },
  {
    category: 'Account & Support',
    questions: [
      {
        q: 'How do I track my bag?',
        a: 'Text your bag number to us on WhatsApp, or use the "Track order" option in the main menu. You\'ll see the current status of your drop.',
      },
      {
        q: 'How do I contact support?',
        a: 'Just send a WhatsApp message! You can also email hello@flexlaundry.co.uk. We typically respond within a few hours during business days.',
      },
      {
        q: 'Can I pause my subscription?',
        a: 'Yes! Going on holiday or taking a break from the gym? Pause your subscription for up to 3 months via WhatsApp or your member portal.',
      },
      {
        q: 'How do I cancel?',
        a: 'You can cancel anytime via WhatsApp or your member portal. Your subscription stays active until the end of your current billing period.',
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-white py-16 md:py-24">
        <div className="container-page text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Got questions? We've got answers.
          </p>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="section bg-white">
        <div className="container-page max-w-4xl">
          {faqs.map((section, idx) => (
            <div key={idx} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-emerald-500">
                {section.category}
              </h2>
              <div className="space-y-6">
                {section.questions.map((faq, faqIdx) => (
                  <div key={faqIdx} className="border-b border-gray-100 pb-6 last:border-0">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {faq.q}
                    </h3>
                    <p className="text-gray-600">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="section bg-gray-50">
        <div className="container-page text-center max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Still Have Questions?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            We're here to help. Reach out anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="https://wa.me/447366907286" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary"
            >
              WhatsApp Us
            </a>
            <Link href="/contact" className="btn-secondary">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-emerald-600">
        <div className="container-page text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Try FLEX with a One-Off drop, no commitment required.
          </p>
          <Link href="/join" className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold py-3 px-8 rounded-lg text-lg transition-colors duration-200">
            Start Now
          </Link>
        </div>
      </section>
    </>
  );
}
