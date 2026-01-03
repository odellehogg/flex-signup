import Link from 'next/link';

export const metadata = {
  title: 'Partner With FLEX - Gym Partnership Opportunities',
  description: 'Become a FLEX partner gym. Offer your members convenient laundry service with zero operational burden.',
};

export default function PartnersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-white py-16 md:py-24">
        <div className="container-page text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Partner With FLEX
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Add value for your members with zero operational burden.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="section bg-white">
        <div className="container-page">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Partner With Us?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="card text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-semibold text-xl mb-2">Zero Cost</h3>
              <p className="text-gray-600">
                No setup fees, no operational costs. We handle everything.
              </p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="font-semibold text-xl mb-2">Member Retention</h3>
              <p className="text-gray-600">
                Added convenience keeps members coming back.
              </p>
            </div>
            <div className="card text-center">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="font-semibold text-xl mb-2">Revenue Share</h3>
              <p className="text-gray-600">
                Earn commission on every member who signs up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-gray-50">
        <div className="container-page max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How Partnership Works
          </h2>
          
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">We Set Up</h3>
                <p className="text-gray-600">
                  We provide all materials: branded bags, signage, and staff training (10 mins).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Members Drop Off</h3>
                <p className="text-gray-600">
                  Members leave bags at reception. Your staff just needs to hold them for collection.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">We Handle The Rest</h3>
                <p className="text-gray-600">
                  We collect daily, clean, and return within 48 hours. Members pick up at reception.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">You Earn Commission</h3>
                <p className="text-gray-600">
                  Receive monthly commission payments based on active members at your location.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-emerald-600">
        <div className="container-page text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Interested in Partnering?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Let's discuss how FLEX can benefit your members.
          </p>
          <Link href="/contact" className="bg-white text-emerald-600 hover:bg-emerald-50 font-semibold py-3 px-8 rounded-lg text-lg transition-colors duration-200">
            Get In Touch
          </Link>
        </div>
      </section>
    </>
  );
}
