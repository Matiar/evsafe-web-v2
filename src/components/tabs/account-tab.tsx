"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuthStore, useIsAdministrator } from "@/stores/auth-store";
import { updateUserProfile } from "@/lib/firebase/firestore";
import { uploadProfilePhoto } from "@/lib/firebase/storage";
import { logOut, deleteAccount } from "@/lib/firebase/auth";
import { Snack } from "@/stores/toast-store";
import { ThemeButton } from "@/components/ui/theme-button";
import { ThemeTextField } from "@/components/ui/theme-text-field";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { APP_VERSION, APP_BUILD } from "@/lib/constants";
import { FirebaseError } from "firebase/app";

export function AccountTab() {
  const user = useAuthStore((s) => s.user);
  const firestoreUser = useAuthStore((s) => s.firestoreUser);
  const isAdmin = useIsAdministrator();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [showLogout, setShowLogout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showReauth, setShowReauth] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (firestoreUser) {
      setName(firestoreUser.displayName ?? "");
      setEmail(firestoreUser.email ?? "");
      setPhone(firestoreUser.phoneNumber ?? "");
    }
  }, [firestoreUser]);

  const isEmailEditable = () => {
    if (!editing) return false;
    const providers = firestoreUser?.providerData?.map((p) => p.providerId) ?? [];
  const emailProviders = ["password", "google.com", "apple.com"];
    const hasEmailProvider = providers.some((p) => emailProviders.includes(p));
    return hasEmailProvider && !firestoreUser?.email;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (name !== user.displayName) {
        await updateProfile(auth.currentUser!, { displayName: name });
      }
      await updateUserProfile(user.uid, {
        displayName: name,
        phoneNumber: phone,
      });
      Snack.ok("Profile Updated");
      setEditing(false);
    } catch {
      Snack.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setSaving(true);
    try {
      const url = await uploadProfilePhoto(user.uid, file, setUploadPercent);
      await updateProfile(auth.currentUser!, { photoURL: url });
      await updateUserProfile(user.uid, { photoURL: url });
      Snack.ok("Profile Updated");
    } catch {
      Snack.error("Failed to upload photo");
    } finally {
      setSaving(false);
      setUploadPercent(0);
    }
  };

  const handleLogout = async () => {
    await logOut();
    window.location.href = "/login";
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      Snack.ok("Your account Has been deleted");
      window.location.href = "/login";
    } catch (err) {
      if (err instanceof FirebaseError && err.code === "auth/requires-recent-login") {
        setShowReauth(true);
      } else {
        Snack.error("Failed to delete account");
      }
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <div>
      <header className="flex items-center justify-between bg-white px-4 py-4 shadow-sm">
        <h1 className="text-[22px] font-semibold">User Profile</h1>
        <button
          onClick={() => (editing ? setEditing(false) : setEditing(true))}
          className="text-sm font-medium text-brand"
        >
          {editing ? "Cancel" : "?"}
        </button>
      </header>

      <div className="p-4">
        {/* Avatar */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            <Image
              src={firestoreUser?.photoURL ?? user?.photoURL ?? "/icons/user.svg"}
              alt="Profile"
              width={150}
              height={150}
              className="h-[150px] w-[150px] rounded-full bg-background object-cover"
              unoptimized
            />
            {editing && (
              <label className="absolute bottom-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-brand text-white">
                +
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
            )}
            {uploadPercent > 0 && uploadPercent < 100 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white">
                {uploadPercent}%
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-xl bg-white p-4 shadow-sm">
          <ThemeTextField
            label="Name"
            value={name}
            onChange={setName}
            readOnly={!editing}
          />
          <ThemeTextField
            label="Email"
            value={email}
            onChange={setEmail}
            readOnly={!isEmailEditable()}
          />
          <ThemeTextField
            label="Phone"
            value={phone}
            onChange={setPhone}
            readOnly={!editing}
          />

          {editing && (
            <ThemeButton onClick={handleSave} loading={saving}>
              SAVE
            </ThemeButton>
          )}

          {saving && (
            <p className="text-center text-sm text-feed-muted">Saving Profile...</p>
          )}
        </div>

        {isAdmin && (
          <Link
            href="/app/admin/users"
            className="mt-4 flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm md:hidden"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm text-white">
              A
            </span>
            <span className="font-medium">Admin Users</span>
          </Link>
        )}

        <button
          onClick={() => setShowLogout(true)}
          className="mt-4 flex w-full items-center gap-3 rounded-xl bg-white p-4 shadow-sm"
        >
          <Image src="/icons/logout.svg" alt="" width={20} height={20} />
          <span>Log Out</span>
        </button>

        <p className="mt-6 text-right text-xs text-feed-muted">
          App Version {APP_VERSION} ({APP_BUILD})
        </p>

        <button
          onClick={() => setShowDelete(true)}
          className="mt-4 w-full rounded-xl bg-white p-4 text-center font-medium text-serial-red shadow-sm"
        >
          Delete Account?
        </button>
      </div>

      <ConfirmDialog
        open={showLogout}
        title="Log out"
        message="Sure to Log out from app?"
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />

      <ConfirmDialog
        open={showDelete}
        title="Account Deletion"
        message="This action may permanently delete your account and all data Inside it. This cannot be undone"
        confirmLabel="I am Sure"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      <ConfirmDialog
        open={showReauth}
        title="Please Verify Your Identity"
        message='For your security, you need to log in again before you can delete your account. After logging in, please return to this screen and tap "Delete Account" again to complete the process.'
        confirmLabel="Log in Again"
        hideCancel
        onConfirm={handleLogout}
        onCancel={() => setShowReauth(false)}
      />

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
          <p className="font-medium">Deleting Profile...</p>
        </div>
      )}
    </div>
  );
}
