"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { APP_TABS, type AppTab } from "@/lib/constants";
import { useAppStore } from "@/stores/app-store";
import { useAuthStore, useIsAdministrator } from "@/stores/auth-store";
import { ThemeBadge } from "@/components/ui/theme-badge";
import { cn } from "@/lib/utils";

const TAB_ICONS: Record<AppTab, { idle: string; active: string }> = {
  home: { idle: "/icons/home.svg", active: "/icons/home-active.svg" },
  product: { idle: "/icons/product.svg", active: "/icons/product-active.svg" },
  favorite: { idle: "/icons/favorite.svg", active: "/icons/favorite-active.svg" },
  account: { idle: "/icons/account.svg", active: "/icons/account-active.svg" },
};

export function SideNav() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const messageCount = useAuthStore((s) => s.messageCount);
  const isAdmin = useIsAdministrator();
  const router = useRouter();
  const pathname = usePathname();

  const navigate = (tab: AppTab) => {
    setActiveTab(tab);
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-white md:flex">
      <div className="border-b border-border p-6">
        <Image
          src="/brand/logo-long.svg"
          alt="eVehicleSafe"
          width={160}
          height={36}
          className="h-9 w-auto"
        />
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {APP_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const icons = TAB_ICONS[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand text-white"
                  : "text-text hover:bg-background"
              )}
            >
              <Image
                src={isActive ? icons.active : icons.idle}
                alt=""
                width={22}
                height={22}
                className={cn(isActive && "brightness-0 invert")}
              />
              {tab.label}
              {tab.id === "account" && (
                <ThemeBadge
                  count={messageCount}
                  className={cn(isActive && "bg-white text-brand")}
                />
              )}
            </button>
          );
        })}

        {isAdmin && (
          <Link
            href="/app/admin/users"
            className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-text hover:bg-background"
          >
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded bg-brand text-xs text-white">
              A
            </span>
            Admin Users
          </Link>
        )}
      </nav>
    </aside>
  );
}
