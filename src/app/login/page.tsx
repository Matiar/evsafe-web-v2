"use client";

import { Suspense } from "react";
import { AuthGuard } from "@/providers/auth-provider";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthGuard>
  );
}
