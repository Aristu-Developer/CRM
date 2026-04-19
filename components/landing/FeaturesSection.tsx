import { ReactNode } from "react";

interface Feature {
  title:   string;
  detail:  string;
  value:   string;
  iconBg:  string;
  iconColor: string;
  icon:    ReactNode;
}

const FEATURES: Feature[] = [
  {
    title:     "Customer Management",
    detail:    "Store complete customer profiles — name, phone, address, business type, and purchase history. See every sale and outstanding balance at a glance.",
    value:     "Never lose track of a customer or their payment status again.",
    iconBg:    "bg-yellow-50",
    iconColor: "text-yellow-600",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title:     "Sales Tracking",
    detail:    "Create multi-item invoices in seconds. Apply discounts, set payment terms, and record the payment method. Inventory updates the moment a sale is saved.",
    value:     "Every sale is linked to a customer, tracked by date, and searchable instantly.",
    iconBg:    "bg-blue-50",
    iconColor: "text-blue-600",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    title:     "Due & Payment Tracking",
    detail:    "Record partial payments, set repayment dates, and write promise notes from customers. Overdue accounts are automatically flagged so nothing slips through.",
    value:     "Know exactly who owes you, how much, and since when.",
    iconBg:    "bg-red-50",
    iconColor: "text-red-500",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title:     "Inventory Management",
    detail:    "Track stock for every product in real time. Get low-stock alerts before you run out. Log manual adjustments, returns, and stock-ins with a reason and date.",
    value:     "Stop guessing your stock levels. The system updates itself on every sale.",
    iconBg:    "bg-indigo-50",
    iconColor: "text-indigo-600",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    title:     "Reports & Insights",
    detail:    "Sales reports, payment collection, customer analysis, and inventory summaries — filterable by today, this week, this month, or any custom range. Export to CSV in one click.",
    value:     "Make decisions based on numbers, not gut feeling.",
    iconBg:    "bg-green-50",
    iconColor: "text-green-600",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title:     "Staff Access Control",
    detail:    "Add your accountant, cashier, or manager as users. Admins have full access; staff can record sales and payments without touching sensitive business settings.",
    value:     "Run your team without sharing your admin password.",
    iconBg:    "bg-purple-50",
    iconColor: "text-purple-600",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold text-primary-600 tracking-widest uppercase mb-3">
            Everything You Need
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            One platform. Every business task.
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Nepal CRM covers the full cycle — from the first sale to the final payment — so nothing gets missed and nothing gets lost.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-default"
            >
              {/* Icon */}
              <div className={`inline-flex w-12 h-12 ${f.iconBg} rounded-xl items-center justify-center ${f.iconColor} mb-4`}>
                {f.icon}
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>

              {/* Detail */}
              <p className="text-sm text-gray-600 leading-relaxed mb-3">{f.detail}</p>

              {/* Value callout */}
              <p className="text-xs font-medium text-primary-700 bg-primary-50 rounded-lg px-3 py-2 leading-snug">
                {f.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
