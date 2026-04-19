"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Navbar }  from "./Navbar";

/**
 * Client shell for all authenticated business routes.
 * Owns the mobile sidebar open/close state.
 * All module layouts render <AppShell>{children}</AppShell>.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close sidebar when the route changes (mobile nav tap)
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile backdrop — rendered behind the sidebar drawer */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar  onMenuClick={() => setSidebarOpen(true)} />

      <main className="lg:ml-64 pt-16 overflow-x-hidden">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
