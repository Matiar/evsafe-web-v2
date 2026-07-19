"use client";

import { useRouter, usePathname } from "next/navigation";
import { APP_TABS, type AppTab } from "@/lib/constants";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore } from "@/stores/auth-store";
import { ThemeBadge } from "@/components/ui/theme-badge";
import { cn } from "@/lib/utils";
import Image from "next/image";

const TAB_ICONS: Record<AppTab, { idle: string; active: string }> = {
  home: { idle: "/icons/home.svg", active: "/icons/home-active.svg" },
  product: { idle: "/icons/product.svg", active: "/icons/product-active.svg" },
  favorite: { idle: "/icons/favorite.svg", active: "/icons/favorite-active.svg" },
  account: { idle: "/icons/account.svg", active: "/icons/account-active.svg" },
};

export function BottomNav() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const messageCount = useAuthStore((s) => s.messageCount);
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (tab: AppTab) => {
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  return (
    <nav className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 md:hidden">
      <div className="flex items-center justify-around rounded-[70px] bg-brand px-2 py-2 shadow-lg">
        {APP_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const icons = TAB_ICONS[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 rounded-full px-3 py-2 transition-all",
                isActive && "bg-white"
              )}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Image
                src={isActive ? icons.active : icons.idle}
                alt=""
                width={24}
                height={24}
                className={cn(!isActive && "brightness-0 invert")}
              />
              {isActive && (
                <span className="text-sm font-bold text-brand">{tab.label}</span>
              )}
              {tab.id === "account" && (
                <ThemeBadge count={messageCount} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
