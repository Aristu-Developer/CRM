/** Full-width browser-frame dashboard showcase */
export function ProductPreview() {
  return (
    <section className="py-20 lg:py-24 bg-gray-50/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-12">
          <span className="inline-block text-xs font-semibold text-primary-600 tracking-widest uppercase mb-3">
            See It In Action
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Everything you need in one view
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Your dashboard shows the full picture — revenue, collections, dues, top products, and recent activity — the moment you log in.
          </p>
        </div>

        {/* Browser mockup */}
        <div className="relative mx-auto">
          <div className="absolute inset-6 bg-primary-300 rounded-3xl blur-3xl opacity-10 pointer-events-none" />

          <div className="relative bg-white rounded-2xl shadow-2xl shadow-gray-900/10 border border-gray-200 overflow-hidden ring-1 ring-gray-900/5">

            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-1.5 bg-gray-700 rounded-md px-4 py-1 text-xs text-gray-300 max-w-xs">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  app.nepalcrm.com/dashboard
                </div>
              </div>
            </div>

            {/* App shell */}
            <div className="flex min-h-[480px]">

              {/* Sidebar */}
              <div className="hidden sm:flex w-44 lg:w-52 flex-shrink-0 flex-col bg-white border-r border-gray-100 p-3">
                <div className="flex items-center gap-2 px-2 py-2 mb-4">
                  <div className="w-6 h-6 bg-primary-600 rounded-md flex-shrink-0" />
                  <span className="text-sm font-bold text-gray-900">Nepal CRM</span>
                </div>
                {[
                  { label: "Dashboard",  active: true  },
                  { label: "Customers",  active: false },
                  { label: "Products",   active: false },
                  { label: "Sales",      active: false },
                  { label: "Payments",   active: false },
                  { label: "Dues",       active: false },
                  { label: "Reports",    active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 text-xs font-medium ${
                      item.active
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${item.active ? "bg-primary-500" : "bg-gray-300"}`} />
                    {item.label}
                  </div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 bg-gray-50/60 p-4 overflow-hidden">

                {/* Page title */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Dashboard</h3>
                    <p className="text-xs text-gray-500">Overview of your business performance</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-[9px] font-bold text-primary-700">R</div>
                    <span className="text-xs text-gray-500 hidden lg:block">Ram Sharma</span>
                  </div>
                </div>

                {/* Stats grid 4+4 */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[
                    { label: "Total Revenue",  value: "Rs. 4,25,000", color: "text-blue-700",   bg: "bg-blue-50"   },
                    { label: "Collected",      value: "Rs. 3,82,500", color: "text-green-700",  bg: "bg-green-50"  },
                    { label: "Total Due",      value: "Rs. 42,500",   color: "text-red-700",    bg: "bg-red-50"    },
                    { label: "Total Sales",    value: "47",           color: "text-purple-700", bg: "bg-purple-50" },
                    { label: "Customers",      value: "23 active",    color: "text-yellow-700", bg: "bg-yellow-50" },
                    { label: "Products",       value: "18 items",     color: "text-indigo-700", bg: "bg-indigo-50" },
                    { label: "Low Stock",      value: "3 alerts",     color: "text-orange-700", bg: "bg-orange-50" },
                    { label: "Overdue",        value: "5 accounts",   color: "text-red-600",    bg: "bg-red-50"    },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl p-2 border border-gray-100">
                      <div className={`w-4 h-4 ${s.bg} rounded-md mb-1`} />
                      <p className="text-[8px] text-gray-400 leading-none truncate">{s.label}</p>
                      <p className={`text-[10px] font-bold ${s.color} mt-0.5 leading-none`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Bottom section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

                  {/* Recent Sales */}
                  <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
                      <span className="text-[11px] font-semibold text-gray-700">Recent Sales</span>
                      <span className="text-[9px] text-primary-600 font-medium">View all →</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {[
                        { name: "Ram Hardware Stores",  inv: "INV-00047", date: "16 Apr", amt: "Rs. 18,500",  status: "PAID",    sc: "bg-green-100 text-green-700" },
                        { name: "Sita General Shop",    inv: "INV-00046", date: "15 Apr", amt: "Rs. 12,000",  status: "PARTIAL", sc: "bg-yellow-100 text-yellow-700" },
                        { name: "Krishna & Co.",        inv: "INV-00045", date: "14 Apr", amt: "Rs. 25,000",  status: "UNPAID",  sc: "bg-red-50 text-red-600" },
                        { name: "Bishnu Traders",       inv: "INV-00044", date: "13 Apr", amt: "Rs. 9,500",   status: "PAID",    sc: "bg-green-100 text-green-700" },
                      ].map((s) => (
                        <div key={s.inv} className="flex items-center justify-between px-3 py-2">
                          <div>
                            <p className="text-[10px] font-medium text-gray-800">{s.name}</p>
                            <p className="text-[9px] text-gray-400">{s.inv} · {s.date}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold text-gray-800">{s.amt}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${s.sc}`}>{s.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Products */}
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-50">
                      <span className="text-[11px] font-semibold text-gray-700">Top Products</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {[
                        { rank: 1, name: "Cement 50kg",   qty: "120 bags", rev: "Rs. 84,000" },
                        { rank: 2, name: "Steel Rod 12mm", qty: "85 pcs",  rev: "Rs. 62,500" },
                        { rank: 3, name: "Binding Wire",   qty: "200 kg",  rev: "Rs. 36,000" },
                        { rank: 4, name: "Sand (Truck)",   qty: "15 trips",rev: "Rs. 30,000" },
                      ].map((p) => (
                        <div key={p.name} className="flex items-center gap-2 px-3 py-2">
                          <span className="text-[9px] font-bold text-gray-300 w-3">{p.rank}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium text-gray-800 truncate">{p.name}</p>
                            <p className="text-[9px] text-gray-400">{p.qty}</p>
                          </div>
                          <span className="text-[9px] font-semibold text-gray-700">{p.rev}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Highlight callouts */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {[
            { label: "8 stats at a glance",        desc: "Revenue, dues, stock, overdue — all on one screen." },
            { label: "Sales linked to customers",  desc: "Every invoice is tied to a customer record with full history." },
            { label: "Low stock alerts built in",  desc: "Products turn orange when they approach reorder level." },
            { label: "Reports for any period",     desc: "Filter sales and payments by today, week, month, or custom range." },
          ].map((c) => (
            <div key={c.label} className="flex gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-primary-100 flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{c.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
