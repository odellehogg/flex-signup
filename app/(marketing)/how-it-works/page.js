import Link from 'next/link';

export const metadata = {
  title: 'How It Works - FLEX Gym Laundry Service',
  description: 'Learn how FLEX gym clothes laundry works. Drop, clean, collect - all within 48 hours at your gym.',
};

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-white py-16 md:py-24">
        <div className="container-page text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How FLEX Works
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From sweaty to fresh in 4 simple steps. It's really that easy.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="section bg-white">
        <div className="container-page max-w-4xl">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
            <div className="md:w-1/2">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                1
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign Up & Choose a Plan</h2>
              <p className="text-gray-600 mb-4">
                Pick the plan that matches your workout routine. Work out 2-3 times a week? Essential is perfect. Daily gym-goer? Go Unlimited.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  One-Off: £5 for a single drop
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Essential: £35/month for 10 drops
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Unlimited: £48/month for up to 16 drops
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 bg-emerald-50 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">📱</div>
              <p className="text-gray-600">Takes less than 2 minutes</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8 mb-16">
            <div className="md:w-1/2">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                2
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Drop Off After Your Workout</h2>
              <p className="text-gray-600 mb-4">
                Finished your workout? Grab a FLEX bag from reception, fill it with your sweaty kit, and leave it at the drop-off point.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Tops, shorts, leggings, sports bras
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Towels and socks
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Note your bag number for tracking
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 bg-emerald-50 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🎒</div>
              <p className="text-gray-600">Drop before 6pm for next-day collection</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
            <div className="md:w-1/2">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                3
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">We Collect & Clean</h2>
              <p className="text-gray-600 mb-4">
                We collect bags from your gym daily and take them to our laundry partner. Your activewear is washed with specialized care.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Cold water wash to preserve elasticity
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Activewear-safe detergent
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Low heat drying to protect fabrics
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 bg-emerald-50 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🧼</div>
              <p className="text-gray-600">Specialized activewear cleaning</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-1/2">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                4
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Pick Up Fresh Clothes</h2>
              <p className="text-gray-600 mb-4">
                We return your clean clothes to your gym within 48 hours. You'll get a WhatsApp message when they're ready.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  WhatsApp notification when ready
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Collect from gym reception
                </li>
                <li className="flex items-center">
                  <span className="text-emerald-500 mr-2">✓</span>
                  Just ask for your FLEX bag
                </li>
              </ul>
            </div>
            <div className="md:w-1/2 bg-emerald-50 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-gray-600">Ready within 48 hours</p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp Tracking */}
      <section className="section bg-gray-50">
        <div className="container-page max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Track Everything via WhatsApp
            </h2>
            <p className="text-xl text-gray-600">
              No app to download. Just message us on WhatsApp.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="font-semibold text-lg mb-3">What you can do:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Start a new drop</li>
                <li>• Track your bag status</li>
                <li>• Check remaining drops</li>
                <li>• Manage your subscription</li>
                <li>• Report any issues</li>
              </ul>
            </div>
            <div className="card">
              <h3 className="font-semibold text-lg mb-3">We'll message you:</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• When we receive your bag</li>
                <li>• When your clothes are ready</li>
                <li>• Reminders if you haven't dropped in a while</li>
                <li>• Before your subscription renews</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What to Include */}
      <section className="section bg-white">
        <div className="container-page max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Can I Include?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card bg-emerald-50 border-2 border-emerald-200">
              <h3 className="font-semibold text-lg text-emerald-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">✓</span> Yes, include:
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Gym tops & tank tops</li>
                <li>• Shorts & leggings</li>
                <li>• Sports bras</li>
                <li>• Gym towels</li>
                <li>• Socks</li>
                <li>• Hoodies & joggers</li>
                <li>• Compression wear</li>
              </ul>
            </div>
            <div className="card bg-red-50 border-2 border-red-200">
              <h3 className="font-semibold text-lg text-red-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">✗</span> Please don't include:
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Shoes or trainers</li>
                <li>• Underwear</li>
                <li>• Valuables or electronics</li>
                <li>• Non-gym clothing</li>
                <li>• Heavily soiled items</li>
                <li>• Delicates requiring special care</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-emerald-600">
        <div className="container-page text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Try It?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Start with a One-Off drop for just £5.
          </p>
          <Link href="/join" className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold py-3 px-8 rounded-lg text-lg transition-colors duration-200">
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
