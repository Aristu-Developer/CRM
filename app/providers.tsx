"use client";

import { SessionProvider }         from "next-auth/react";
import { BusinessConfigProvider }  from "@/components/providers/BusinessConfigProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BusinessConfigProvider>
        {children}
      </BusinessConfigProvider>
    </SessionProvider>
  );
}
