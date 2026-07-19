"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AuthGuard } from "@/providers/auth-provider";
import { useAuthStore, useIsAdministrator } from "@/stores/auth-store";
import { getAllUsers, updateUserRole, updateUserDisabled } from "@/lib/firebase/firestore";
import { SkeletonList } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Snack } from "@/stores/toast-store";
import { USER_ROLES, type UserRole } from "@/lib/constants";
import type { FirestoreUser } from "@/types";

function AdminUsersContent() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useIsAdministrator();
  const router = useRouter();

  const [users, setUsers] = useState<FirestoreUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [pendingRole, setPendingRole] = useState<{
    uid: string;
    name: string;
    role: UserRole;
  } | null>(null);
  const [pendingDisable, setPendingDisable] = useState<{
    uid: string;
    name: string;
    disabled: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      router.replace("/app");
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (!isAdmin) return;
    getAllUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== "all") {
      list = list.filter((u) => (u.role ?? "common") === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          (u.displayName ?? "").toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, search, roleFilter]);

  const confirmRoleChange = async () => {
    if (!pendingRole) return;
    try {
      await updateUserRole(pendingRole.uid, pendingRole.role);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === pendingRole.uid ? { ...u, role: pendingRole.role } : u
        )
      );
      Snack.ok("Role updated");
    } catch {
      Snack.error("Failed to update role");
    }
    setPendingRole(null);
  };

  const confirmDisable = async () => {
    if (!pendingDisable) return;
    try {
      await updateUserDisabled(pendingDisable.uid, pendingDisable.disabled);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === pendingDisable.uid
            ? { ...u, disabled: pendingDisable.disabled }
            : u
        )
      );
      Snack.ok(pendingDisable.disabled ? "User disabled" : "User enabled");
    } catch {
      Snack.error("Failed to update user");
    }
    setPendingDisable(null);
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/app?tab=account" className="text-brand">
          ? Back
        </Link>
        <h1 className="text-xl font-semibold">Admin - Users</h1>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-border px-4 py-2 text-sm"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as UserRole | "all")}
          className="rounded-lg border border-border px-4 py-2 text-sm"
        >
          <option value="all">All roles</option>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {loading && <SkeletonList />}

      {!loading && filtered.length === 0 && (
        <p className="py-12 text-center text-feed-muted">No match found</p>
      )}

      <div className="space-y-3">
        {filtered.map((u) => {
          const isSelf = u.uid === user?.uid;
          return (
            <div
              key={u.uid}
              className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center"
            >
              <Image
                src={u.photoURL ?? "/icons/user.svg"}
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-full bg-background object-cover"
                unoptimized
              />
              <div className="flex-1">
                <p className="font-medium">
                  {u.displayName ?? "-"}{" "}
                  {u.disabled && (
                    <span className="text-xs text-serial-red">(disabled)</span>
                  )}
                </p>
                <p className="text-sm text-feed-muted">{u.email}</p>
                <p className="text-xs text-feed-muted">
                  {u.providerData?.[0]?.providerId ?? "-"} -{" "}
                  {u.role ?? "common"}
                </p>
              </div>
              <div className="flex gap-2">
                <select
                  value={u.role ?? "common"}
                  disabled={isSelf}
                  onChange={(e) =>
                    setPendingRole({
                      uid: u.uid,
                      name: u.displayName ?? u.email ?? u.uid,
                      role: e.target.value as UserRole,
                    })
                  }
                  className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  {USER_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  disabled={isSelf}
                  onClick={() =>
                    setPendingDisable({
                      uid: u.uid,
                      name: u.displayName ?? u.email ?? u.uid,
                      disabled: !u.disabled,
                    })
                  }
                  className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-50"
                >
                  {u.disabled ? "Enable" : "Disable"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!pendingRole}
        title="Change user role"
        message={
          pendingRole
            ? `${pendingRole.name} ? ${pendingRole.role}`
            : ""
        }
        onConfirm={confirmRoleChange}
        onCancel={() => setPendingRole(null)}
      />

      <ConfirmDialog
        open={!!pendingDisable}
        title={pendingDisable?.disabled ? "Disable user" : "Enable user"}
        message={pendingDisable?.name ?? ""}
        onConfirm={confirmDisable}
        onCancel={() => setPendingDisable(null)}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AuthGuard requireAuth>
      <AdminUsersContent />
    </AuthGuard>
  );
}
