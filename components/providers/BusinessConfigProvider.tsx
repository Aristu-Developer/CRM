"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { deriveConfig, DEFAULT_CONFIG, type BusinessConfig } from "@/lib/business-config";

const BusinessConfigContext = createContext<BusinessConfig>(DEFAULT_CONFIG);

export function BusinessConfigProvider({ children }: { children: ReactNode }) {
  const { status }          = useSession();
  const [config, setConfig] = useState<BusinessConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (status !== "authenticated") return;

    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setConfig(deriveConfig(data));
      })
      .catch(() => {/* keep default */});
  }, [status]);

  return (
    <BusinessConfigContext.Provider value={config}>
      {children}
    </BusinessConfigContext.Provider>
  );
}

export function useBusinessConfig(): BusinessConfig {
  return useContext(BusinessConfigContext);
}
