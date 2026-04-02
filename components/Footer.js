import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-flex-black text-white pt-10 pb-5 md:pt-14 md:pb-7 rounded-t-[28px]">
      <div className="max-w-[1100px] mx-auto px-5 md:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-display text-xl font-extrabold">
              FLEX
            </Link>
            <p className="text-[0.72rem] text-flex-muted mt-1.5">
              Gym clothes laundry, sorted.
            </p>
            <div className="flex gap-3 mt-3">
              <a href="https://instagram.com/flexlaundry" className="text-flex-muted hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://twitter.com/flexlaundry" className="text-flex-muted hover:text-white transition-colors" aria-label="X / Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-[0.55rem] font-semibold tracking-wider uppercase text-flex-muted mb-2 md:mb-4">Product</h4>
            <div className="flex flex-col gap-0.5">
              <Link href="/how-it-works" className="text-[0.75rem] text-white hover:text-flex-muted transition-colors py-0.5">How It Works</Link>
              <Link href="/pricing" className="text-[0.75rem] text-white hover:text-flex-muted transition-colors py-0.5">Pricing</Link>
              <Link href="/faq" className="text-[0.75rem] text-white hover:text-flex-muted transition-colors py-0.5">FAQs</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[0.55rem] font-semibold tracking-wider uppercase text-flex-muted mb-2 md:mb-4">Company</h4>
            <div className="flex flex-col gap-0.5">
              <Link href="/contact" className="text-[0.75rem] text-white hover:text-flex-muted transition-colors py-0.5">Contact</Link>
              <Link href="/partners" className="text-[0.75rem] text-white hover:text-flex-muted transition-colors py-0.5">Partner With Us</Link>
            </div>
          </div>

          {/* Legal + Contact */}
          <div>
            <h4 className="text-[0.55rem] font-semibold tracking-wider uppercase text-flex-muted mb-2 md:mb-4">Legal</h4>
            <div className="flex flex-col gap-0.5">
              <Link href="/privacy" className="text-[0.75rem] text-white hover:text-flex-muted transition-colors py-0.5">Privacy Policy</Link>
              <Link href="/terms" className="text-[0.75rem] text-white hover:text-flex-muted transition-colors py-0.5">Terms of Service</Link>
            </div>
            <div className="mt-4">
              <h4 className="text-[0.55rem] font-semibold tracking-wider uppercase text-flex-muted mb-2">Contact</h4>
              <a href="mailto:hello@flexlaundry.co.uk" className="text-[0.75rem] text-white hover:text-flex-muted transition-colors block py-0.5">
                hello@flexlaundry.co.uk
              </a>
              <a href="https://wa.me/447366907286" className="text-[0.75rem] text-white hover:text-flex-muted transition-colors block py-0.5">
                WhatsApp &rarr;
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-6 md:mt-10 pt-3 md:pt-5 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-1 text-[0.55rem] text-flex-muted text-center md:text-left">
          <p>&copy; {new Date().getFullYear()} FLEX Active Group Ltd. All rights reserved.</p>
          <p>Company No. 12345678 &middot; Registered in England &amp; Wales</p>
        </div>
      </div>
    </footer>
  )
}
