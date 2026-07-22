/**
 * DataContext — provides live Supabase data to the entire app.
 * Wrap the app once; any component can call useData() to get
 * the current state without triggering a new fetch.
 */
import React, { createContext, useContext } from "react";
import { useSupabaseData, type AppData } from "@/lib/useSupabaseData";

const DataContext = createContext<AppData | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const data = useSupabaseData();
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
};

export function useData(): AppData {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
