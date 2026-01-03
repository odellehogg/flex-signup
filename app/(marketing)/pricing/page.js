import Link from 'next/link';
import { PLANS } from '@/lib/plans';

export const metadata = {
  title: 'Pricing - FLEX Gym Laundry Service',
  description: 'Simple, transparent pricing for gym clothes laundry. From £5 per drop. No hidden fees, cancel anytime.',
};

export default function PricingPage() {
  const plans = Object.values(PLANS);
  
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-white py-16 md:py-24">
        <div className="container-page text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your workout routine. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section bg-white -mt-8">
        <div className="container-page">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`card relative ${plan.isPopular ? 'border-2 border-emerald-500 shadow-xl' : ''}`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
                  <div className="text-4xl font-bold text-emerald-600">
                    £{plan.price}
                    {plan.isSubscription && (
                      <span className="text-lg font-normal text-gray-500">/month</span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="w-5 h-5 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link 
                  href={`/join?plan=${plan.id}`}
                  className={`block text-center py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                    plan.isPopular 
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {plan.isSubscription ? 'Subscribe Now' : 'Try Once'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="section bg-gray-50">
        <div className="container-page">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Compare Plans
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4">Feature</th>
                  <th className="text-center py-4 px-4">One-Off</th>
                  <th className="text-center py-4 px-4 bg-emerald-50">Essential</th>
                  <th className="text-center py-4 px-4">Unlimited</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium">Monthly price</td>
                  <td className="text-center py-4 px-4">£5 (one-time)</td>
                  <td className="text-center py-4 px-4 bg-emerald-50">£35</td>
                  <td className="text-center py-4 px-4">£48</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium">Drops included</td>
                  <td className="text-center py-4 px-4">1</td>
                  <td className="text-center py-4 px-4 bg-emerald-50">10</td>
                  <td className="text-center py-4 px-4">Up to 16</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium">Price per drop</td>
                  <td className="text-center py-4 px-4">£5.00</td>
                  <td className="text-center py-4 px-4 bg-emerald-50">£3.50</td>
                  <td className="text-center py-4 px-4">£3.00</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium">48-hour turnaround</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4 bg-emerald-50">✓</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium">WhatsApp tracking</td>
                  <td className="text-center py-4 px-4">✓</td>
                  <td className="text-center py-4 px-4 bg-emerald-50">✓</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-4 font-medium">Priority support</td>
                  <td className="text-center py-4 px-4">-</td>
                  <td className="text-center py-4 px-4 bg-emerald-50">-</td>
                  <td className="text-center py-4 px-4">✓</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-medium">Commitment</td>
                  <td className="text-center py-4 px-4">None</td>
                  <td className="text-center py-4 px-4 bg-emerald-50">Cancel anytime</td>
                  <td className="text-center py-4 px-4">Cancel anytime</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="section bg-white">
        <div className="container-page max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Common Questions
          </h2>
          
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                What can I include in a drop?
              </h3>
              <p className="text-gray-600">
                Gym tops, shorts, leggings, sports bras, towels, and socks. Basically anything you'd wear to the gym except shoes. Each bag can hold about one full outfit plus a towel.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                What if I don't use all my drops?
              </h3>
              <p className="text-gray-600">
                Unused drops don't roll over to the next month. We recommend choosing a plan that matches your typical workout frequency.
              </p>
            </div>
            <div className="border-b border-gray-200 pb-6">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                Can I change plans?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade, downgrade, or cancel your subscription anytime from your member portal. Changes take effect at your next billing date.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <Link href="/faq" className="btn-outline">
              View All FAQs
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
            Try with a One-Off drop, no commitment required.
          </p>
          <Link href="/join" className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold py-3 px-8 rounded-lg text-lg transition-colors duration-200">
            Start Now
          </Link>
        </div>
      </section>
    </>
  );
}
