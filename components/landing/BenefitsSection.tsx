const BENEFITS = [
  {
    title:  "No More Notebooks or Spreadsheets",
    detail: "Everything is stored digitally, searchable, and backed up. Stop maintaining separate files for each customer or product.",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title:  "Know Exactly Who Owes You",
    detail: "Your dues list shows every unpaid and partially paid sale with customer name, amount, and how long it has been outstanding.",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title:  "Always Know Your Stock Levels",
    detail: "Product quantities update automatically with every sale. You get alerts for low-stock items before customers start asking for things you don't have.",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    title:  "Monitor Your Business Performance",
    detail: "View sales trends, top-selling products, and customer payment history from one place. Make business decisions based on real numbers.",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    title:  "Reduce Missed Follow-Ups",
    detail: "Set repayment dates and promise notes on due sales. When the date passes, the system flags it as overdue automatically — no manual reminders needed.",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    title:  "Add Staff Without Losing Control",
    detail: "Give your cashier or accountant access to record transactions without touching admin settings or customer credit limits. You stay in control.",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function BenefitsSection() {
  return (
    <section className="py-20 lg:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold text-primary-600 tracking-widest uppercase mb-3">
            Real Business Outcomes
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Replace confusion with clarity
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Nepal CRM doesn&apos;t just store data — it gives you the visibility to run your business confidently.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-4 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 bg-white">
              <div className={`flex-shrink-0 w-11 h-11 ${b.iconBg} rounded-xl flex items-center justify-center ${b.iconColor}`}>
                {b.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1.5 leading-snug">{b.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{b.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
