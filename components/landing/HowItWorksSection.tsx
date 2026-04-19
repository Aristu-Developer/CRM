const STEPS = [
  {
    number: "01",
    title:  "Set Up Your Business",
    detail: "Register an account, add your business details, then create your product list and import your existing customers. Takes less than 10 minutes to get started.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    number: "02",
    title:  "Record Sales & Payments",
    detail: "Create invoices on the spot — choose a customer, add items, set the price. Record full or partial payment. The system calculates the due amount and updates stock automatically.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    number: "03",
    title:  "Track, Follow Up & Grow",
    detail: "View outstanding dues, monitor low stock, and run reports for any time period. Follow up on overdue payments before they become problems. Know your numbers at a glance.",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold text-primary-600 tracking-widest uppercase mb-3">
            Simple Process
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Up and running in 3 steps
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            No complex setup. No training required. You can start recording real sales on your first day.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line — desktop only */}
          <div className="hidden lg:block absolute top-14 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" aria-hidden />

          <div className="grid sm:grid-cols-3 gap-8 lg:gap-6">
            {STEPS.map((step, idx) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {/* Circle with number */}
                <div className={`relative z-10 w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-6 shadow-md ${
                  idx === 0 ? "bg-primary-600 text-white" :
                  idx === 1 ? "bg-primary-500 text-white" :
                              "bg-primary-400 text-white"
                }`}>
                  {step.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-primary-600 text-primary-700 text-xs font-extrabold flex items-center justify-center">
                    {idx + 1}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed max-w-xs mx-auto">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-note */}
        <p className="text-center text-sm text-gray-500 mt-12">
          Already have data in a spreadsheet?{" "}
          <span className="text-gray-700 font-medium">You can start fresh and migrate gradually — the system grows with you.</span>
        </p>
      </div>
    </section>
  );
}
