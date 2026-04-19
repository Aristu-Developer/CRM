import Link from "next/link";

interface AppLogoProps {
  /** Where the logo navigates to when clicked */
  href: string;
  /** Use "dark" on dark/coloured backgrounds so the wordmark is white */
  variant?: "light" | "dark";
  /** Optional extra classes on the Link wrapper */
  className?: string;
}

/**
 * Reusable inline logo (icon + wordmark).
 * Use href="/dashboard" in authenticated layouts, href="/" on public pages.
 */
export function AppLogo({ href, variant = "light", className = "" }: AppLogoProps) {
  const isDark = variant === "dark";
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${className}`}
      aria-label="Nepal CRM — go to home"
    >
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary-600 flex-shrink-0 group-hover:opacity-90 group-hover:scale-[1.04] transition-all duration-150">
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
      <span className={`font-bold text-base leading-none transition-colors duration-150 ${
        isDark
          ? "text-white group-hover:text-blue-200"
          : "text-gray-900 group-hover:text-primary-700"
      }`}>
        Nepal CRM
      </span>
    </Link>
  );
}
