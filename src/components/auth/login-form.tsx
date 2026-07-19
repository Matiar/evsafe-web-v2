"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { ThemeButton } from "@/components/ui/theme-button";
import { ThemeTextField } from "@/components/ui/theme-text-field";
import { LoaderView } from "@/components/ui/loader-view";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  signInEmail,
  signUpEmail,
  resetPassword,
  signInGoogle,
  signInApple,
  isAppleSignInAvailable,
} from "@/lib/firebase/auth";
import { Snack } from "@/stores/toast-store";
import { humanizeFirebaseError, filterError } from "@/lib/utils";
import { PRIVACY_POLICY_TEXT } from "@/lib/constants";
import type { AuthMode } from "@/types";
import { FirebaseError } from "firebase/app";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as AuthMode) || "signin";
  const redirect = searchParams.get("redirect");

  const [mode, setMode] = useState<AuthMode>(
    initialMode === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [repeatError, setRepeatError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showApple] = useState(() => isAppleSignInAvailable());

  const headline =
    mode === "signin"
      ? "Please Log In"
      : mode === "signup"
        ? "Sign Up"
        : "Reset password";

  const clearErrors = () => {
    setEmailError("");
    setPasswordError("");
    setRepeatError("");
  };

  const navigateAfterLogin = useCallback(() => {
    const target = redirect ? decodeURIComponent(redirect) : "/app";
    router.replace(target);
  }, [redirect, router]);

  const handleEmailSignIn = async () => {
    clearErrors();
    if (!email) {
      setEmailError("Please insert email");
      return;
    }
    if (!password) {
      setPasswordError("Password field is empty");
      return;
    }

    setLoading(true);
    try {
      await signInEmail(email, password);
      navigateAfterLogin();
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/user-not-found":
            setEmailError("No user found for this email.");
            break;
          case "auth/wrong-password":
            setPasswordError("Wrong Password");
            break;
          case "auth/invalid-email":
            setEmailError("Invalid Email");
            break;
          case "auth/invalid-credential":
            setPasswordError("Invalid Credential");
            break;
          default:
            setPasswordError(humanizeFirebaseError(err.code));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    clearErrors();
    if (!email) {
      setEmailError("Please insert userId");
      return;
    }
    if (!password) {
      setPasswordError("Password field is empty");
      return;
    }
    if (!repeatPassword) {
      setRepeatError("Please repeat the password");
      return;
    }
    if (password !== repeatPassword) {
      setRepeatError("Password doesn't match");
      return;
    }

    setLoading(true);
    try {
      await signUpEmail(email, password);
      navigateAfterLogin();
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/weak-password":
            Snack.error("The password provided is too weak.");
            break;
          case "auth/email-already-in-use":
            Snack.error("The account already exists for that email.");
            break;
          case "auth/invalid-email":
            Snack.error("The given email is invalid");
            break;
          default:
            Snack.error(filterError(err.message));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    clearErrors();
    if (!email) {
      setEmailError("Please insert email");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      Snack.ok("Please follow Email to reset password");
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/user-not-found":
            setEmailError("No user found for this email.");
            break;
          case "auth/invalid-email":
            setEmailError("Invalid Email");
            break;
          case "auth/wrong-password":
            Snack.error(humanizeFirebaseError(err.code));
            break;
          default:
            Snack.error(filterError(err.message));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInGoogle();
      navigateAfterLogin();
    } catch {
      Snack.error("Google SignIn Failed. Try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleApple = async () => {
    setLoading(true);
    try {
      await signInApple();
      navigateAfterLogin();
    } catch {
      Snack.error("Apple SignIn Failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center bg-background px-4 py-10">
        <Image
          src="/brand/logo-long.svg"
          alt="eVehicleSafe"
          width={220}
          height={48}
          className="mb-8 h-12 w-auto"
          priority
        />

        <h1 className="mb-8 text-2xl font-bold tracking-wide text-text">{headline}</h1>

        <div className="w-full max-w-sm space-y-4">
          <ThemeTextField
            label="Email"
            value={email}
            onChange={setEmail}
            errorText={emailError}
            type="email"
          />

          {mode !== "reset" && (
            <ThemeTextField
              label="Password"
              value={password}
              onChange={setPassword}
              errorText={passwordError}
              type="password"
            />
          )}

          {mode === "signup" && (
            <ThemeTextField
              label="Repeat Password"
              value={repeatPassword}
              onChange={setRepeatPassword}
              errorText={repeatError}
              type="password"
            />
          )}

          {mode === "signin" && (
            <div className="text-right">
              <button
                onClick={() => {
                  clearErrors();
                  setMode("reset");
                }}
                className="text-sm font-medium text-brand"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {mode === "reset" && (
            <div className="text-right">
              <button
                onClick={() => {
                  clearErrors();
                  setMode("signin");
                }}
                className="text-sm font-medium text-brand"
              >
                or Sign In?
              </button>
            </div>
          )}

          {mode === "signin" && (
            <ThemeButton onClick={handleEmailSignIn} loading={loading}>
              LOGIN
            </ThemeButton>
          )}
          {mode === "signup" && (
            <ThemeButton onClick={handleSignUp} loading={loading}>
              SIGN UP
            </ThemeButton>
          )}
          {mode === "reset" && (
            <ThemeButton onClick={handleReset} loading={loading}>
              RESET
            </ThemeButton>
          )}

          <p className="py-4 text-center text-xs text-feed-muted">-- OR CONTINUE WITH --</p>

          <div className="flex justify-center gap-4">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"
              aria-label="Sign in with Google"
            >
              <Image src="/icons/google.svg" alt="" width={24} height={24} />
            </button>
            {showApple && (
              <button
                onClick={handleApple}
                disabled={loading}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm"
                aria-label="Sign in with Apple"
              >
                <Image src="/icons/apple.svg" alt="" width={24} height={24} />
              </button>
            )}
          </div>

          <p className="text-center text-xs text-feed-muted">
            By signing in, you agree to our{" "}
            <button
              onClick={() => setShowPrivacy(true)}
              className="font-medium text-brand"
            >
              Privacy Policy
            </button>
          </p>

          {mode === "signin" && (
            <p className="text-center text-sm text-feed-muted">
              Don&apos;t have an account?{" "}
              <button
                onClick={() => {
                  clearErrors();
                  setMode("signup");
                }}
                className="font-bold text-brand"
              >
                SIGN UP
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p className="text-center text-sm text-feed-muted">
              Already have account?{" "}
              <button
                onClick={() => {
                  clearErrors();
                  setMode("signin");
                }}
                className="font-bold text-brand"
              >
                LOGIN
              </button>
            </p>
          )}
        </div>

        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
            <LoaderView />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showPrivacy}
        title="Privacy Policy"
        message={PRIVACY_POLICY_TEXT}
        confirmLabel="CLOSE"
        hideCancel
        onConfirm={() => setShowPrivacy(false)}
        onCancel={() => setShowPrivacy(false)}
      />
    </>
  );
}
