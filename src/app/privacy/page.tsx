import { PRIVACY_POLICY_TEXT } from "@/lib/constants";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - eVehicleSafe",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-8 inline-block text-sm text-brand hover:underline">
          ? Back to home
        </Link>
        <h1 className="mb-6 text-2xl font-bold">Privacy Policy</h1>
        <p className="leading-relaxed text-feed-body">{PRIVACY_POLICY_TEXT}</p>
      </div>
    </div>
  );
}
