// app/portal/layout.js
// Portal layout with navigation

export const metadata = {
  title: 'My Account | FLEX',
  description: 'Manage your FLEX gym laundry subscription',
}

export default function PortalLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-[#1e3a5f]">
            FLEX
          </a>
          <span className="text-sm text-gray-500">Member Portal</span>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>Need help? Message us on WhatsApp or email support@flexlaundry.co.uk</p>
          <p className="mt-2">© {new Date().getFullYear()} FLEX Active Group Limited</p>
        </div>
      </footer>
    </div>
  )
}
