import Link from "next/link";
import { AppLogo } from "@/components/ui/AppLogo";

const PRODUCT_LINKS = [
  { label: "Features",      href: "#features" },
  { label: "How It Works",  href: "#how-it-works" },
  { label: "Why Nepal CRM", href: "#why-nepal-crm" },
  { label: "Get Started",   href: "/register" },
];

const ACCOUNT_LINKS = [
  { label: "Create Account", href: "/register" },
  { label: "Sign In",        href: "/login" },
  { label: "Dashboard",      href: "/dashboard" },
];

export function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main footer */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 py-14 border-b border-gray-800">

          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <AppLogo href="/" variant="dark" className="mb-4" />
            <p className="text-sm leading-relaxed mb-5">
              A simple, modern CRM for Nepali small and medium businesses. Track customers, sales, dues, and inventory — without the mess.
            </p>
            <p className="text-xs text-gray-600">
              Built for shops, traders, and distributors across Nepal.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-5">Product</h4>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Account links */}
          <div>
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-5">Account</h4>
            <ul className="space-y-3">
              {ACCOUNT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact / Support */}
          <div>
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-5">Support</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-gray-500">Questions or feedback?</span>
              </li>
              <li>
                <a
                  href="mailto:support@nepalcrm.com"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  support@nepalcrm.com
                </a>
              </li>
              <li className="pt-1">
                <span className="inline-flex items-center gap-2 text-xs text-gray-600">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  All systems operational
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-6 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Nepal CRM. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Built for Nepali businesses · NPR · eSewa · Khalti · Fonepay
          </p>
        </div>
      </div>
    </footer>
  );
}
