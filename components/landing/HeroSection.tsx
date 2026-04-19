import Link from "next/link";

interface HeroSectionProps {
  ctaHref: string;
}

export function HeroSection({ ctaHref }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white pt-16 pb-20 lg:pt-24 lg:pb-28">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-48 right-0 w-[640px] h-[640px] rounded-full bg-blue-100 opacity-50 blur-3xl" />
        <div className="absolute top-48 -left-32 w-80 h-80 rounded-full bg-indigo-100 opacity-40 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">

          {/* --- Text column --- */}
          <div className="text-center lg:text-left mb-14 lg:mb-0">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold tracking-wide mb-5">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
              Made for Nepali Businesses
            </span>

            <h1 className="text-4xl sm:text-5xl xl:text-[56px] font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-5">
              Run Your Business.<br />
              <span className="text-primary-600">Not Your Notebook.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
              Track customers, record sales, collect dues, and manage inventory — all in one place. Built for shops, traders, and SMEs across Nepal.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-8">
              <Link
                href={ctaHref}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-150 shadow-lg shadow-primary-200/70 hover:-translate-y-px"
              >
                Start for Free
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-150"
              >
                See How It Works
              </a>
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-x-5 gap-y-2">
              {["NPR currency built-in", "eSewa & Khalti support", "Free to use"].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-sm text-gray-500">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* --- Dashboard mockup column --- */}
          <div className="relative lg:pl-4">
            <HeroDashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroDashboardMockup() {
  return (
    <div className="relative mx-auto max-w-[520px] lg:max-w-none">
      {/* Glow effect */}
      <div className="absolute inset-8 bg-primary-400 rounded-3xl blur-3xl opacity-10 pointer-events-none" />

      <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-900/10 border border-gray-200 overflow-hidden ring-1 ring-gray-900/5">

        {/* Browser window chrome */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <div className="ml-3 flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-gray-200 text-[11px] text-gray-400 font-mono flex-1 max-w-[220px]">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            nepalcrm.com/dashboard
          </div>
        </div>

        {/* App header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary-600 rounded-md" />
            <span className="text-xs font-bold text-gray-900">Nepal CRM</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center text-[9px] font-bold text-primary-700">R</div>
            <span className="text-[11px] text-gray-500">Ram Sharma</span>
          </div>
        </div>

        <div className="p-3 sm:p-4 bg-gray-50/60 space-y-3">
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Revenue",   value: "Rs. 4,25,000", color: "text-blue-700",   bg: "bg-blue-50"   },
              { label: "Collected", value: "Rs. 3,82,500", color: "text-green-700",  bg: "bg-green-50"  },
              { label: "Due",       value: "Rs. 42,500",   color: "text-red-700",    bg: "bg-red-50"    },
              { label: "Sales",     value: "47 invoices",  color: "text-purple-700", bg: "bg-purple-50" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-2.5 border border-gray-100">
                <div className={`w-4 h-4 ${s.bg} rounded-md mb-1.5`} />
                <p className="text-[9px] text-gray-400 leading-none">{s.label}</p>
                <p className={`text-[11px] font-bold ${s.color} mt-1 leading-none`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-gray-700">Monthly Sales</span>
              <span className="text-[9px] text-gray-400">Last 6 months</span>
            </div>
            <div className="flex items-end gap-1 h-12">
              {[35, 52, 44, 68, 57, 82].map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-sm ${i === 5 ? "bg-primary-500" : "bg-primary-200"}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              {["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"].map((m) => (
                <span key={m} className="text-[9px] text-gray-400">{m}</span>
              ))}
            </div>
          </div>

          {/* Dues list */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
              <span className="text-[10px] font-semibold text-gray-700">Outstanding Dues</span>
              <span className="text-[9px] text-primary-600 font-medium">View all →</span>
            </div>
            {[
              { name: "Ram Sharma",    inv: "INV-00012", due: "Rs. 15,000", tag: "PARTIAL", tagStyle: "bg-yellow-50 text-yellow-700" },
              { name: "Sita Stores",   inv: "INV-00009", due: "Rs. 8,500",  tag: "UNPAID",  tagStyle: "bg-red-50 text-red-600"      },
              { name: "Krishna & Co.", inv: "INV-00007", due: "Rs. 19,000", tag: "OVERDUE", tagStyle: "bg-red-100 text-red-700"     },
            ].map((r) => (
              <div key={r.inv} className="flex items-center justify-between px-3 py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500 flex-shrink-0">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-800 leading-none">{r.name}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{r.inv}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-red-600">{r.due}</span>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${r.tagStyle}`}>{r.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
