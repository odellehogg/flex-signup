import Link from 'next/link';

export const metadata = {
  title: 'FLEX - Gym Clothes Laundry Service | Sweat Less, Live More',
  description: 'Professional gym clothes laundry with 48-hour turnaround. Drop at your gym, we clean and return. From £5 per drop.',
};

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-white py-20 md:py-32">
        <div className="container-page">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Sweat Less, <span className="text-emerald-600">Live More</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Drop your sweaty gym clothes at the gym. We collect, clean, and return within 48 hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/join" className="btn-primary text-lg">
                Get Started
              </Link>
              <Link href="/how-it-works" className="btn-secondary text-lg">
                How It Works
              </Link>
            </div>
            <p className="mt-6 text-gray-500">
              From just £5 per drop. No commitment required.
            </p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              The Gym Laundry Struggle Is Real
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Fitness enthusiasts face unique laundry challenges
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-semibold mb-2">Time Drain</h3>
              <p className="text-gray-600">
                Average person spends 7 hours per week on laundry. That's time you could spend working out.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-2">Environment Impact</h3>
              <p className="text-gray-600">
                A single laundry load uses around 15 gallons of water. Multiple small loads add up.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">👕</div>
              <h3 className="text-xl font-semibold mb-2">Clothes Damage</h3>
              <p className="text-gray-600">
                Up to 30% of gym clothes are ruined prematurely due to harsh detergents or incorrect washing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="section bg-emerald-50">
        <div className="container-page">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Introducing FLEX
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The laundry service designed for gym enthusiasts
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="text-3xl mb-3">🏋️</div>
              <h3 className="font-semibold mb-2">Convenient</h3>
              <p className="text-gray-600 text-sm">
                Drop off at your gym, pick up clean clothes at your next workout
              </p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-3">🌱</div>
              <h3 className="font-semibold mb-2">Eco-Friendly</h3>
              <p className="text-gray-600 text-sm">
                Batched washing uses less water and energy per item
              </p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-semibold mb-2">Cost Efficient</h3>
              <p className="text-gray-600 text-sm">
                Less wear on your expensive activewear means clothes last longer
              </p>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-3">✨</div>
              <h3 className="font-semibold mb-2">Specialized Care</h3>
              <p className="text-gray-600 text-sm">
                Activewear-optimized cleaning preserves performance features
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Preview */}
      <section className="section bg-white">
        <div className="container-page">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Sign Up</h3>
              <p className="text-gray-600 text-sm">
                Choose a plan that fits your workout routine
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Drop Off</h3>
              <p className="text-gray-600 text-sm">
                Leave your sweaty clothes in a FLEX bag at your gym
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">We Clean</h3>
              <p className="text-gray-600 text-sm">
                We collect and professionally clean your activewear
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Pick Up</h3>
              <p className="text-gray-600 text-sm">
                Collect fresh clothes at your gym within 48 hours
              </p>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <Link href="/how-it-works" className="btn-outline">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="section bg-gray-50">
        <div className="container-page">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              No hidden fees. Cancel anytime.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="card text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">One-Off</h3>
              <div className="text-3xl font-bold text-emerald-600 mb-4">£5</div>
              <p className="text-gray-600 mb-4">1 bag drop</p>
              <p className="text-sm text-gray-500">Perfect for trying us out</p>
            </div>
            <div className="card text-center border-2 border-emerald-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Essential</h3>
              <div className="text-3xl font-bold text-emerald-600 mb-4">£35<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <p className="text-gray-600 mb-4">10 drops per month</p>
              <p className="text-sm text-gray-500">£3.50 per drop</p>
            </div>
            <div className="card text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unlimited</h3>
              <div className="text-3xl font-bold text-emerald-600 mb-4">£48<span className="text-lg font-normal text-gray-500">/mo</span></div>
              <p className="text-gray-600 mb-4">Up to 16 drops</p>
              <p className="text-sm text-gray-500">Best for daily gym-goers</p>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <Link href="/pricing" className="btn-primary">
              View All Plans
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section bg-emerald-600">
        <div className="container-page text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Ditch the Laundry?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of gym enthusiasts who've reclaimed their time.
          </p>
          <Link href="/join" className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold py-3 px-8 rounded-lg text-lg transition-colors duration-200">
            Get Started Today
          </Link>
        </div>
      </section>
    </>
  );
}
