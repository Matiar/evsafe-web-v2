import { create } from "zustand";
import type { AppTab } from "@/lib/constants";

interface AppStore {
  activeTab: AppTab;
  scrollToPostId: string | null;
  setActiveTab: (tab: AppTab) => void;
  setScrollToPostId: (id: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeTab: "home",
  scrollToPostId: null,
  setActiveTab: (activeTab) => set({ activeTab }),
  setScrollToPostId: (scrollToPostId) => set({ scrollToPostId }),
}));
