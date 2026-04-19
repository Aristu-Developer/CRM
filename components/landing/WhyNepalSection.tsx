const WHY_POINTS = [
  {
    title:  "Nepalese Rupee (NPR) Throughout",
    detail: "Every amount is shown in Rs. — no dollar signs, no conversion. Your numbers look exactly like they do in your ledger.",
  },
  {
    title:  "Local Payment Methods Built In",
    detail: "Record payments via Cash, Bank Transfer, eSewa, Khalti, and Fonepay. The system tracks the method on every transaction.",
  },
  {
    title:  "Designed for How Nepali Trade Works",
    detail: "Credit sales, bahi khaata, partial payments, promise dates — these are first-class features, not afterthoughts.",
  },
  {
    title:  "Simple Enough for Any Business Owner",
    detail: "No technical knowledge required. If you can use WhatsApp, you can use Nepal CRM. Set up in minutes, not days.",
  },
  {
    title:  "Works for All Types of Businesses",
    detail: "Hardware shops, pharmacies, wholesale distributors, retail stores, kiranas, service providers — the same tool works for all.",
  },
  {
    title:  "Access From Any Device",
    detail: "Use it on your phone at the shop, or on a laptop in the office. No installation needed — it runs in your browser.",
  },
];

const PAYMENT_METHODS = [
  { name: "Cash",          color: "bg-green-100 text-green-700" },
  { name: "Bank Transfer", color: "bg-blue-100  text-blue-700"  },
  { name: "eSewa",         color: "bg-emerald-100 text-emerald-700" },
  { name: "Khalti",        color: "bg-purple-100 text-purple-700" },
  { name: "Fonepay",       color: "bg-orange-100 text-orange-700" },
  { name: "Cheque",        color: "bg-gray-100   text-gray-700"  },
];

export function WhyNepalSection() {
  return (
    <section id="why-nepal-crm" className="py-20 lg:py-24 bg-gradient-to-br from-blue-50 to-indigo-50/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-start">

          {/* Left: text */}
          <div className="mb-12 lg:mb-0">
            <span className="inline-block text-xs font-semibold text-primary-600 tracking-widest uppercase mb-3">
              Built for Nepal
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-5">
              Designed Around How<br />Nepal Does Business
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-10">
              Most CRMs are built for Western markets. Nepal CRM is built from the ground up for the way Nepali businesses actually operate — credit, bahi khaata, local payments, and all.
            </p>

            <ul className="space-y-5">
              {WHY_POINTS.map((p) => (
                <li key={p.title} className="flex gap-4">
                  <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-primary-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{p.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: visual blocks */}
          <div className="space-y-6">

            {/* Payment methods card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Accepted Payment Methods
              </p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <span
                    key={m.name}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${m.color}`}
                  >
                    {m.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Business types card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Works Great For
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: "🔩", label: "Hardware Shops" },
                  { emoji: "💊", label: "Pharmacies" },
                  { emoji: "🏭", label: "Wholesalers & Distributors" },
                  { emoji: "🛒", label: "Retail Stores" },
                  { emoji: "🏪", label: "Kiranas & General Stores" },
                  { emoji: "🚛", label: "Traders & Suppliers" },
                ].map((b) => (
                  <div key={b.label} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50">
                    <span className="text-lg">{b.emoji}</span>
                    <span className="text-xs font-medium text-gray-700 leading-snug">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NPR callout */}
            <div className="bg-primary-600 rounded-2xl p-5 text-white">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold">
                  Rs.
                </div>
                <div>
                  <p className="font-bold text-base">NPR Currency Everywhere</p>
                  <p className="text-sm text-blue-100 mt-1 leading-relaxed">
                    All amounts display in Nepalese Rupees with proper formatting. No settings to change, no currency to configure.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
