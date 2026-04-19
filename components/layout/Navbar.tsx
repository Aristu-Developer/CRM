"use client";

import { signOut, useSession } from "next-auth/react";
import { useState } from "react";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="print:hidden fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-20">
      {/* Left: hamburger (mobile) + breadcrumb placeholder (desktop) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition -ml-1"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="hidden lg:block" />

      {/* Right: user info */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2.5 text-sm hover:bg-gray-50 px-3 py-1.5 rounded-lg transition"
        >
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-xs">
            {session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="text-left hidden sm:block">
            <p className="font-medium text-gray-900 leading-tight">{session?.user?.name}</p>
            <p className="text-xs text-gray-400 leading-tight capitalize">
              {session?.user?.role?.toLowerCase()}
            </p>
          </div>
          <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-900">{session?.user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
