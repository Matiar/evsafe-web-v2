import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  SHOP_URL,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  COMPANY_ADDRESS,
  COMPANY_NAME,
  TERMS_URL,
} from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://evehiclesafe.com"),
  title: "eVehicleSafe - EV Electrical Safety PPE & Product Verification",
  description:
    "Certified insulating gloves, EV fire blankets, and product authentication for Australian workplace health & safety compliance.",
  openGraph: {
    title: "eVehicleSafe - EV Electrical Safety",
    description:
      "Buy certified PPE, scan your product serial, verify authenticity, and track certification expiry.",
    images: ["/brand/header.png"],
  },
};

const STEPS = [
  {
    title: "Buy certified PPE",
    description: "Purchase AS/NZS certified insulating gloves, fire blankets, and safety equipment.",
  },
  {
    title: "Scan or enter serial",
    description: "Use the app to scan the QR code on your product or enter the serial manually.",
  },
  {
    title: "Verify authenticity",
    description: "Confirm your product is genuine and registered in our compliance database.",
  },
  {
    title: "Track expiry & compliance",
    description: "Monitor certification expiry dates for workplace audits and safety records.",
  },
];

const CATEGORIES = [
  {
    name: "Insulating Gloves (Class 0)",
    description: "AS/NZS certified electrical safety gloves for EV work.",
    href: `${SHOP_URL}`,
  },
  {
    name: "Glove Kits & Cotton Inners",
    description: "Complete glove kits with fingerless cotton inner gloves.",
    href: `${SHOP_URL}`,
  },
  {
    name: "EV Fire Blankets",
    description: "FIRE CLOAK blankets for lithium-ion battery fire containment.",
    href: `${SHOP_URL}`,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-[family-name:var(--font-nunito)]">
      {/* Hero */}
      <header className="evs-gradient text-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
          <Image
            src="/brand/logo-long-white.svg"
            alt="eVehicleSafe"
            width={180}
            height={40}
            className="h-10 w-auto"
            priority
          />
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/40 px-5 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              href="/login?mode=signup"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand"
            >
              Sign up
            </Link>
          </div>
        </nav>

        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">
            EV Electrical Safety, Verified
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/90 md:text-xl">
            Certified PPE for high-voltage EV work. Register your products, verify authenticity,
            and track certification expiry for WHS compliance.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-full bg-white px-8 py-4 text-base font-bold text-brand shadow-lg"
            >
              Open the app
            </Link>
            <a
              href={SHOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-white px-8 py-4 text-base font-bold hover:bg-white/10"
            >
              Shop products
            </a>
          </div>
        </div>
      </header>

      {/* How it works */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-text md:text-3xl">
            How it works
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full evs-gradient text-sm font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mb-2 font-bold text-text">{step.title}</h3>
                <p className="text-sm text-evs-grey">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product categories */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-10 text-center text-2xl font-bold text-text md:text-3xl">
            Product categories
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.name}
                href={cat.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border p-6 transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 font-bold text-text group-hover:text-[#578eca]">
                  {cat.name}
                </h3>
                <p className="text-sm text-evs-grey">{cat.description}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-6 text-2xl font-bold text-text md:text-3xl">Why it matters</h2>
          <p className="text-evs-grey leading-relaxed">
            Working on electric vehicles exposes technicians to high-voltage hazards and
            lithium-ion battery fire risks. eVehicleSafe products assist with electrical safety
            but do not eliminate all risk. Our certification tracking helps Australian businesses
            maintain workplace health &amp; safety compliance and audit-ready records.
          </p>
        </div>
      </section>

      {/* App promo */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold text-text md:text-3xl">
            Register &amp; verify on the go
          </h2>
          <p className="mb-8 text-evs-grey">
            Scan product serials, browse safety updates, and manage your registered equipment -
            on mobile or web.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-full evs-gradient px-10 py-4 text-base font-bold text-white shadow-lg"
          >
            Get started - it&apos;s free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <Image
              src="/brand/logo-long.svg"
              alt="eVehicleSafe"
              width={160}
              height={36}
              className="h-9 w-auto"
            />
            <div className="text-center text-sm text-evs-grey md:text-right">
              <p>{COMPANY_ADDRESS}</p>
              <p>
                <a href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`} className="hover:underline">
                  {CONTACT_PHONE}
                </a>
                {" - "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
                  {CONTACT_EMAIL}
                </a>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-evs-grey md:justify-start">
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <a href={TERMS_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
              Terms &amp; Conditions
            </a>
            <a
              href="https://linkedin.com/company/evehiclesafe"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              LinkedIn
            </a>
          </div>
          <p className="mt-6 text-center text-xs text-evs-grey md:text-left">
            - {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
