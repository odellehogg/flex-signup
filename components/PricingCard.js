'use client'

import Link from 'next/link'

export default function PricingCard({ plan, isPopular = false }) {
  const features = plan.features || []

  return (
    <div className={`relative p-7 md:p-10 rounded-[28px] ${isPopular ? 'bg-flex-black text-white' : 'bg-white shadow-sm'}`}>
      {isPopular && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white text-flex-black text-[0.55rem] font-bold tracking-wider uppercase px-4 py-1 rounded-full shadow-md">
          Recommended
        </div>
      )}

      <div className="mb-4">
        <div className={`text-[0.6rem] font-semibold tracking-wider uppercase mb-2 ${isPopular ? 'text-gray-400' : 'text-flex-muted'}`}>
          {plan.name}
        </div>
        <div className="font-display text-[2.6rem] md:text-[3.2rem] font-black leading-none">
          £{plan.pricePerDrop ?? plan.price}
          <span className="font-display text-sm font-semibold opacity-70">/drop</span>
        </div>
        {plan.billingNote ? (
          <div className={`text-[0.62rem] mt-2 px-3 py-1 rounded-full inline-block ${isPopular ? 'text-gray-500 bg-white/10' : 'text-flex-muted bg-flex-bg'}`}>
            {plan.billingNote}
            {plan.addonNote && ` · ${plan.addonNote.replace('Add-on: ', '')}`}
          </div>
        ) : (
          <p className={`text-[0.72rem] mt-1 ${isPopular ? 'text-gray-500' : 'text-flex-muted'}`}>{plan.description}</p>
        )}
      </div>

      <ul className="space-y-1.5 mb-6">
        {features.map((feature, index) => (
          <li key={index} className={`flex items-start gap-1.5 text-[0.82rem] ${isPopular ? 'text-gray-300' : 'text-flex-text'}`}>
            <span className="mt-0.5">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={`/join?plan=${plan.id || plan.slug}`}
        className={`block text-center py-3 px-6 font-semibold transition-all rounded-full ${
          isPopular
            ? 'bg-white text-flex-black hover:bg-gray-100 border-2 border-white'
            : 'bg-flex-black text-white hover:bg-gray-800 border-2 border-flex-black'
        }`}
      >
        {plan.isSubscription ? 'Subscribe' : 'Try Once'} &rarr;
      </Link>
    </div>
  )
}
