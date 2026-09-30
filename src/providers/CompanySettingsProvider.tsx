"use client";

import React, { createContext, useContext, useMemo } from "react";
import type { CompanySettings } from "@/actions/settings.actions";

interface CompanySettingsContextType {
  settings: CompanySettings | null;
}

const CompanySettingsContext = createContext<CompanySettingsContextType | undefined>(undefined);

export function CompanySettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings: CompanySettings;
}) {
  const contextValue = useMemo(() => ({ settings: initialSettings }), [initialSettings]);

  return (
    <CompanySettingsContext.Provider value={contextValue}>
      {children}
    </CompanySettingsContext.Provider>
  );
}

export function useCompanySettings() {
  const context = useContext(CompanySettingsContext);
  if (context === undefined) {
    throw new Error("useCompanySettings must be used within a CompanySettingsProvider");
  }
  return context;
}
