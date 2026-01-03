'use client'

import Link from 'next/link'

export default function PricingCard({ plan, isPopular = false }) {
  const features = plan.features || []
  
  return (
    <div className={`relative card-hover ${isPopular ? 'border-2 border-flex-accent ring-2 ring-flex-accent ring-opacity-20' : 'border border-gray-200'}`}>
      {isPopular && (
        <div className="popular-badge">Most Popular</div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-flex-navy mb-2">{plan.name}</h3>
        <p className="text-gray-500 text-sm">{plan.description}</p>
      </div>
      
      <div className="text-center mb-6">
        <span className="text-4xl font-bold text-flex-navy">£{plan.price}</span>
        <span className="text-gray-500">/{plan.slug === 'single' ? 'drop' : 'month'}</span>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-2 text-flex-navy font-semibold">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span>{plan.drops} drop{plan.drops !== 1 ? 's' : ''} {plan.slug !== 'single' ? 'per month' : ''}</span>
        </div>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-flex-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-600 text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      
      <Link
        href={`/join?plan=${plan.slug}`}
        className={`block text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
          isPopular 
            ? 'bg-flex-accent text-white hover:bg-emerald-600' 
            : 'bg-flex-navy text-white hover:bg-gray-800'
        }`}
      >
        Get Started
      </Link>
    </div>
  )
}
