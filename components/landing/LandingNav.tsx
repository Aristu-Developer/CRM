"use client";

import { useState } from "react";
import Link from "next/link";
import { AppLogo } from "@/components/ui/AppLogo";

interface LandingNavProps {
  ctaHref: string;
}

const NAV_LINKS = [
  { label: "Features",      href: "#features" },
  { label: "How It Works",  href: "#how-it-works" },
  { label: "Why Nepal CRM", href: "#why-nepal-crm" },
];

export function LandingNav({ ctaHref }: LandingNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <AppLogo href="/" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href={ctaHref}
              className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-4 space-y-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
            >
              {l.label}
            </a>
          ))}
          <div className="border-t border-gray-100 pt-3 mt-1 space-y-2">
            <Link
              href="/login"
              className="block w-full text-center px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Sign In
            </Link>
            <Link
              href={ctaHref}
              className="block w-full text-center px-4 py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
