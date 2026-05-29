import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Business, DashboardMetrics, Alert, Lead } from "@/types";

interface AppState {
  business: Business | null;
  setBusiness: (business: Business | null) => void;

  metrics: DashboardMetrics | null;
  setMetrics: (metrics: DashboardMetrics | null) => void;

  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  markAlertRead: (id: string) => void;
  resolveAlert: (id: string) => void;

  recentLeads: Lead[];
  setRecentLeads: (leads: Lead[]) => void;

  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  isOnboarded: boolean;
  setIsOnboarded: (onboarded: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      business: null,
      setBusiness: (business) => set({ business }),

      metrics: null,
      setMetrics: (metrics) => set({ metrics }),

      alerts: [],
      setAlerts: (alerts) => set({ alerts }),
      markAlertRead: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, is_read: true } : a
          ),
        })),
      resolveAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, is_resolved: true } : a
          ),
        })),

      recentLeads: [],
      setRecentLeads: (leads) => set({ recentLeads: leads }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      isOnboarded: false,
      setIsOnboarded: (onboarded) => set({ isOnboarded: onboarded }),
    }),
    {
      name: "nova-pulse-store",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
);
