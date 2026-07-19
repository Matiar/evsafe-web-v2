"use client";

import { useAppStore } from "@/stores/app-store";
import { BottomNav } from "@/components/shell/bottom-nav";
import { SideNav } from "@/components/shell/side-nav";
import { HomeTab } from "@/components/tabs/home-tab";
import { ProductTab } from "@/components/tabs/product-tab";
import { FavoriteTab } from "@/components/tabs/favorite-tab";
import { AccountTab } from "@/components/tabs/account-tab";

interface AppShellProps {
  deepLinkPostId?: string | null;
}

export function AppShell({ deepLinkPostId }: AppShellProps) {
  const activeTab = useAppStore((s) => s.activeTab);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <SideNav />
      <main className="flex flex-1 flex-col pb-24 md:pb-0">
        <div className="mx-auto w-full max-w-2xl flex-1 lg:max-w-3xl">
          {activeTab === "home" && <HomeTab deepLinkPostId={deepLinkPostId} />}
          {activeTab === "product" && <ProductTab />}
          {activeTab === "favorite" && <FavoriteTab />}
          {activeTab === "account" && <AccountTab />}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
