import Link from "next/link";

interface CtaSectionProps {
  ctaHref: string;
}

export function CtaSection({ ctaHref }: CtaSectionProps) {
  return (
    <section className="py-20 lg:py-24 bg-gradient-to-br from-gray-900 via-blue-950 to-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Icon */}
        <div className="inline-flex w-14 h-14 bg-white/10 rounded-2xl items-center justify-center mb-6">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-5">
          Ready to Take Control<br />
          <span className="text-blue-300">of Your Business?</span>
        </h2>

        <p className="text-lg text-blue-100/80 leading-relaxed mb-10 max-w-xl mx-auto">
          Set up your account in minutes. Start recording sales, tracking dues, and managing inventory — all in one place, today.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={ctaHref}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold bg-white text-gray-900 rounded-xl hover:bg-blue-50 transition-all duration-150 shadow-lg hover:-translate-y-px"
          >
            Create Free Account
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-150"
          >
            Sign In
          </Link>
        </div>

        {/* Small reassurances */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8">
          {["No credit card needed", "Free to use", "Works on any device"].map((t) => (
            <div key={t} className="flex items-center gap-1.5 text-sm text-blue-200/70">
              <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
